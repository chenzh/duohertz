import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("First Shift hands its chosen song download to Play without fetching it twice", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    const originalFetch = window.fetch.bind(window);
    const probe = { requests: 0, streaming: false, release: () => {} };
    (window as typeof window & { __intentProbe?: typeof probe }).__intentProbe = probe;
    window.fetch = async (...args) => {
      if (!String(args[0]).includes("/catalog/bs-s1-05/audio.m4a")) return originalFetch(...args);
      probe.requests++;
      const response = await originalFetch(...args);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const first = Math.floor(bytes.byteLength / 4);
      let release!: () => void;
      const gate = new Promise<void>((resolve) => { release = resolve; });
      probe.release = release;
      const body = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(bytes.slice(0, first));
          probe.streaming = true;
          await gate;
          controller.enqueue(bytes.slice(first));
          controller.close();
        },
      });
      return new Response(body, { headers: { "Content-Length": String(bytes.byteLength) } });
    };
  });

  try {
    await page.goto("/shift");
    await expect(page.getByRole("heading", { name: "Your first shift" })).toBeVisible();
    await page.waitForFunction(() => (window as typeof window & { __intentProbe?: { streaming: boolean } }).__intentProbe?.streaming, null, { timeout: 10000 });
    await page.getByRole("link", { name: "Play Voltage Drop" }).click();
    const progress = page.getByRole("progressbar", { name: "Song download" });
    await expect(progress).toBeVisible();
    await expect.poll(async () => Number(await progress.getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(24);
    expect(await page.evaluate(() => (window as typeof window & { __intentProbe?: { requests: number } }).__intentProbe?.requests)).toBe(1);
    await page.evaluate(() => (window as typeof window & { __intentProbe?: { release(): void } }).__intentProbe?.release());
    await expect(page.getByRole("button", { name: "Start playing", exact: true })).toBeEnabled();
    expect(await page.evaluate(() => (window as typeof window & { __intentProbe?: { requests: number } }).__intentProbe?.requests)).toBe(1);
  } finally {
    await page.evaluate(() => (window as typeof window & { __intentProbe?: { release(): void } }).__intentProbe?.release()).catch(() => {});
  }
});

test("leaving First Shift without playing aborts the optional song download", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    const originalFetch = window.fetch.bind(window);
    window.fetch = (...args) => {
      if (!String(args[0]).includes("/catalog/bs-s1-05/audio.m4a")) return originalFetch(...args);
      (window as typeof window & { __intentSignal?: AbortSignal }).__intentSignal = args[1]?.signal ?? undefined;
      return new Promise<Response>(() => {});
    };
  });
  await page.goto("/shift");
  await page.waitForFunction(() => Boolean((window as typeof window & { __intentSignal?: AbortSignal }).__intentSignal), null, { timeout: 10000 });
  await page.getByRole("link", { name: "Library", exact: true }).first().click();
  await expect(page).toHaveURL(/\/library$/);
  expect(await page.evaluate(() => (window as typeof window & { __intentSignal?: AbortSignal }).__intentSignal?.aborted)).toBe(true);
});
