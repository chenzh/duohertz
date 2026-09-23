import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test.afterEach(async ({ page, context }) => {
  await context.setOffline(false);
  expect(errors.get(page)).toEqual([]);
});

async function waitForWorker(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
    });
  });
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

async function goOffline(context: BrowserContext): Promise<void> {
  await context.setOffline(true);
}

async function cachedShellPaths(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const shellName = (await caches.keys()).find((name) => name.startsWith("beatscape-shell-"));
    if (!shellName) return [];
    return (await (await caches.open(shellName)).keys())
      .map((request) => new URL(request.url).pathname);
  });
}

async function cachedShellScripts(page: Page): Promise<string[]> {
  return (await cachedShellPaths(page)).filter((path) => path.endsWith(".js"));
}

test("production exposes an installable, scoped PWA shell", async ({ page }) => {
  await page.goto("/");
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBe("/manifest.webmanifest");

  const manifest = await page.evaluate(async (href) => {
    const response = await fetch(href!);
    return response.json() as Promise<{
      id: string;
      start_url: string;
      scope: string;
      display: string;
      icons: Array<{ src: string; sizes: string; purpose: string }>;
    }>;
  }, manifestHref);
  expect(manifest).toMatchObject({ id: ".", start_url: ".", scope: ".", display: "standalone" });
  expect(manifest.icons.some((icon) => icon.sizes === "192x192")).toBe(true);
  expect(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable")).toBe(true);

  await waitForWorker(page);
  const workerState = await page.evaluate(async () => {
    const worker = await (await fetch("/sw.js", { cache: "no-store" })).text();
    return {
      scope: (await navigator.serviceWorker.ready).scope,
      caches: await caches.keys(),
      shellVersion: worker.match(/const SHELL_VERSION = "([a-f0-9]{16})";/)?.[1] ?? "",
      skipsWaiting: worker.includes("skipWaiting("),
    };
  });
  expect(new URL(workerState.scope).pathname).toBe("/");
  expect(workerState.shellVersion).toMatch(/^[a-f0-9]{16}$/);
  expect(workerState.caches).toContain(`beatscape-shell-${workerState.shellVersion}`);
  expect(workerState.skipsWaiting).toBe(false);
});

test("home installs only initial code and caches gameplay code after consent", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".home-play-sound-btn")).toBeVisible();
  await waitForWorker(page);

  const initialScripts = await cachedShellScripts(page);
  expect(initialScripts).toHaveLength(1);
  expect(initialScripts[0]).toMatch(/\/assets\/index-[^/]+\.js$/);
  expect(initialScripts.some((path) => /\/PlayField-[^/]+\.js$/.test(path))).toBe(false);
  expect((await cachedShellPaths(page)).some((path) => /\/catalog\/[^/]+\/og\.png$/.test(path))).toBe(false);

  await page.locator(".home-play-sound-btn").click();
  await expect(page.locator(".play-wrap-hero canvas.play-canvas")).toBeVisible();
  await expect.poll(async () => (
    (await cachedShellScripts(page)).some((path) => /\/PlayField-[^/]+\.js$/.test(path))
  )).toBe(true);
});

test("a worker update waits instead of replacing an active game client", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await waitForWorker(page);
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  const activeScript = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? "");

  // A distinct script URL forces the browser's real update lifecycle while
  // serving the same verified worker body. It must install into waiting, not
  // claim the page that is currently running a chart.
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js?update-probe=1", {
      scope: "/",
      updateViaCache: "none",
    });
  });
  await expect.poll(() => page.evaluate(async () => (
    (await navigator.serviceWorker.getRegistration("/"))?.waiting?.scriptURL ?? ""
  ))).toContain("update-probe=1");
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? "")).toBe(activeScript);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
});

for (const run of [
  { label: "single-player", route: "/play/bs-s1-01?tier=easy&mode=casual", start: "Start playing" },
  { label: "Duo", route: "/duo/bs-s1-01?tier=easy&mode=casual", start: "Start" },
] as const) {
  test(`a connection change never shifts an immersive ${run.label} playfield`, async ({ page, context }) => {
    await page.goto(run.route);
    const start = page.getByRole("button", { name: run.start, exact: true });
    await expect(start).toBeVisible();
    await start.click();
    await expect(page.getByRole("button", { name: "Pause", exact: true }).first()).toBeVisible();
    // Mobile Start requests fullscreen asynchronously. Its fallback button is
    // part of the meta row, so measure only after that intentional transition
    // settles; otherwise the test attributes the 33px row collapse to offline.
    await expect(page.getByRole("button", { name: "Fullscreen", exact: true })).toHaveCount(0);

    const fields = page.locator(".play-wrap");
    const before = await fields.evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }));
    expect(before.length).toBe(run.label === "Duo" ? 2 : 1);
    await context.setOffline(true);
    await expect(page.getByText("Offline mode", { exact: true })).toBeHidden();
    const after = await fields.evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }));
    expect(after).toHaveLength(before.length);
    after.forEach((box, index) => {
      expect(Math.abs(box.x - before[index]!.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(box.y - before[index]!.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(box.width - before[index]!.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(box.height - before[index]!.height)).toBeLessThanOrEqual(1);
    });
  });
}

test("an opened track reloads and starts offline with bounded audio cache", async ({ page, context }, info) => {
  const route = "/play/bs-s1-01?tier=easy&mode=casual";
  await page.goto(route);
  await expect(page.getByRole("button", { name: "Start playing", exact: true })).toBeVisible();
  await waitForWorker(page);

  // Reload once under active service-worker control so this track's chart,
  // cover and full audio enter the on-demand caches.
  await page.reload();
  await expect(page.getByRole("button", { name: "Start playing", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(async () => (
    await (await caches.open("beatscape-audio-v1")).keys()
  ).length)).toBe(1);
  const cachedFontCount = await page.evaluate(async () => {
    const shellName = (await caches.keys()).find((name) => name.startsWith("beatscape-shell-"));
    if (!shellName) return 0;
    return (await (await caches.open(shellName)).keys())
      .filter((request) => new URL(request.url).pathname.endsWith(".woff2"))
      .length;
  });
  expect(cachedFontCount).toBe(12);

  await goOffline(context);
  const range = await page.evaluate(async () => {
    const [audio] = await (await caches.open("beatscape-audio-v1")).keys();
    const response = await fetch(audio!.url, { headers: { Range: "bytes=0-31" } });
    return {
      status: response.status,
      length: (await response.arrayBuffer()).byteLength,
      contentRange: response.headers.get("content-range"),
    };
  });
  expect(range).toEqual({ status: 206, length: 32, contentRange: expect.stringMatching(/^bytes 0-31\//) });

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Offline mode", { exact: true })).toBeVisible();
  const offlineFonts = await page.evaluate(async () => {
    const samples = [
      ["400 32px Anton", "BEATSCAPE Žółć"],
      ["800 32px Sora", "RESONANCE Žółć"],
      ["400 18px 'IBM Plex Sans'", "First shift Žółć"],
      ["700 16px 'IBM Plex Mono'", "COMBO Žółć"],
    ] as const;
    return Promise.all(samples.map(async ([font, text]) => {
      try {
        return {
          font,
          count: (await document.fonts.load(font, text)).length,
          ready: document.fonts.check(font, text),
          error: "",
        };
      } catch (error) {
        return { font, count: 0, ready: false, error: String(error) };
      }
    }));
  });
  expect(offlineFonts.filter(({ error }) => error)).toEqual([]);
  expect(offlineFonts.every(({ count, ready }) => count > 0 && ready)).toBe(true);
  const start = page.getByRole("button", { name: "Start playing", exact: true });
  await expect(start).toBeVisible();
  await start.click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("offline-track.png"), animations: "disabled" });
});
