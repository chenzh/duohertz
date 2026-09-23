import { expect, test, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

declare global {
  interface Window {
    __installPromptProbe: {
      promptCalls: number;
      prevented: boolean;
    };
  }
}

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    sessionStorage.setItem("bs_last_run", JSON.stringify({
      v: 1,
      track_id: "bs-s1-01",
      title: "Neon Pulse",
      artist: "Pulse Atlas",
      tier: "easy",
      mode: "casual",
      score: 8200,
      accuracy: 92.5,
      maxCombo: 12,
      grade: "A",
      fc: false,
      ap: false,
      failed: false,
      counts: { perfect: 9, great: 2, good: 1, miss: 0 },
      totalNotes: 12,
      missEvents: [],
      durationMs: 60_000,
      endedAt: "2026-09-16T00:00:00.000Z",
    }));
  });
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function offerInstall(
  page: Page,
  outcome: "accepted" | "dismissed" = "accepted",
  promptFailure = false,
) {
  await page.evaluate(({ choice, fail }) => {
    const probe = { promptCalls: 0, prevented: false };
    window.__installPromptProbe = probe;
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.defineProperties(event, {
      prompt: {
        value: async () => {
          probe.promptCalls++;
          if (fail) throw new DOMException("Install unavailable", "NotAllowedError");
        },
      },
      userChoice: {
        value: Promise.resolve({ outcome: choice, platform: "web" }),
      },
    });
    window.dispatchEvent(event);
    probe.prevented = event.defaultPrevented;
  }, { choice: outcome, fail: promptFailure });
}

test("an installable browser offers BeatScape after a completed run", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");

  await expect(page.getByRole("region", { name: "Install BeatScape" })).toHaveCount(0);
  await offerInstall(page);
  await expect(page.getByRole("region", { name: "Install BeatScape" })).toHaveCount(0);
  await page.evaluate(() => {
    window.history.pushState({}, "", "/results");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page).toHaveURL(/\/results$/);

  const install = page.getByRole("region", { name: "Install BeatScape" });
  await expect(install).toBeVisible();
  await expect(install).toContainText("Open faster. Play without browser chrome.");
  await expect(install).toContainText("Tracks you already opened stay available offline.");
  const action = install.getByRole("button", { name: "Install app", exact: true });
  expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => window.__installPromptProbe.prevented)).toBe(true);
  await install.scrollIntoViewIfNeeded();
  if (info.project.name === "mobile") {
    const [actionBox, navBox] = await Promise.all([
      action.boundingBox(),
      page.locator(".mobile-tabbar").boundingBox(),
    ]);
    expect(actionBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(navBox!.y - 8);
  }
  await page.screenshot({ path: info.outputPath("results-install-offer.png"), animations: "disabled" });

  await action.click();
  await expect.poll(() => page.evaluate(() => window.__installPromptProbe.promptCalls)).toBe(1);
  await expect(install).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem("bs_analytics") ?? "[]") as Array<{ event?: string; props?: { outcome?: string } }>
  ).some((entry) => entry.event === "pwa_install_prompt" && entry.props?.outcome === "accepted"))).toBe(true);
});

test("browser installation outside the card removes the offer", async ({ page }) => {
  await page.goto("/results");
  await offerInstall(page);
  const install = page.getByRole("region", { name: "Install BeatScape" });
  await expect(install).toBeVisible();

  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(install).toHaveCount(0);
});

test("a dismissed native prompt is not offered twice", async ({ page }) => {
  await page.goto("/results");
  await offerInstall(page, "dismissed");
  const install = page.getByRole("region", { name: "Install BeatScape" });
  await install.getByRole("button", { name: "Install app", exact: true }).click();

  await expect.poll(() => page.evaluate(() => window.__installPromptProbe.promptCalls)).toBe(1);
  await expect(install).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem("bs_analytics") ?? "[]") as Array<{ event?: string; props?: { outcome?: string } }>
  ).some((entry) => entry.event === "pwa_install_prompt" && entry.props?.outcome === "dismissed"))).toBe(true);
});

test("a rejected native prompt fails quietly and clears the stale offer", async ({ page }) => {
  await page.goto("/results");
  await offerInstall(page, "accepted", true);
  const install = page.getByRole("region", { name: "Install BeatScape" });
  await install.getByRole("button", { name: "Install app", exact: true }).click();

  await expect.poll(() => page.evaluate(() => window.__installPromptProbe.promptCalls)).toBe(1);
  await expect(install).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem("bs_analytics") ?? "[]") as Array<{ event?: string; props?: { outcome?: string } }>
  ).some((entry) => entry.event === "pwa_install_prompt" && entry.props?.outcome === "failed"))).toBe(true);
});

test("a failed run keeps recovery ahead of installation", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const run = JSON.parse(sessionStorage.getItem("bs_last_run")!);
    run.failed = true;
    run.mode = "arcade";
    sessionStorage.setItem("bs_last_run", JSON.stringify(run));
  });
  await offerInstall(page);
  await page.evaluate(() => {
    window.history.pushState({}, "", "/results");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await expect(page.getByRole("region", { name: "Install BeatScape" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Try Casual", exact: true })).toBeVisible();
});

test("an already installed standalone app never repeats the offer", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      const result = nativeMatchMedia(query);
      if (query !== "(display-mode: standalone)") return result;
      return new Proxy(result, {
        get(target, property) {
          if (property === "matches") return true;
          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    };
  });
  await page.goto("/results");
  await offerInstall(page);

  await expect(page.getByRole("region", { name: "Install BeatScape" })).toHaveCount(0);
  expect(await page.evaluate(() => window.__installPromptProbe.prevented)).toBe(true);
});
