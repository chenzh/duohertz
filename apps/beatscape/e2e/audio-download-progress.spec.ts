import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      if (!String(args[0]).includes("/audio.m4a")) return originalFetch(...args);
      const response = await originalFetch(...args);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const first = Math.floor(bytes.byteLength / 4);
      let resume!: () => void;
      const gate = new Promise<void>((resolve) => { resume = resolve; });
      (window as typeof window & { __releaseSong?: () => void }).__releaseSong = resume;
      const body = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(bytes.slice(0, first));
          await gate;
          controller.enqueue(bytes.slice(first));
          controller.close();
        },
      });
      return new Response(body, {
        headers: location.search.includes("noLength=1")
          ? { "Content-Type": "audio/mp4" }
          : { "Content-Length": String(bytes.byteLength), "Content-Type": "audio/mp4" },
      });
    };
  });
});

for (const route of ["play", "duo"] as const) {
  test(`${route} shows truthful parser-download percentage before enabling Start`, async ({ page }, info) => {
    try {
      if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
      await page.goto(`/${route}/bs-s1-05?tier=easy&mode=casual`);
      const progress = page.getByRole("progressbar", { name: "Song download" });
      await expect(progress).toHaveAttribute("aria-valuenow", "25");
      await expect(progress).toBeVisible();
      await expect(page.getByRole("button", { name: "Loading song…", exact: true })).toBeDisabled();
      if (info.project.name === "mobile") {
        const box = await progress.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(320);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
        await page.screenshot({ path: info.outputPath(`${route}-download-25.png`), animations: "disabled" });
      }
      await page.evaluate(() => (window as typeof window & { __releaseSong?: () => void }).__releaseSong?.());
      await expect(progress).toHaveCount(0);
      await expect(page.getByRole("button", { name: route === "play" ? "Start playing" : "Start", exact: true })).toBeEnabled();
    } finally {
      await page.evaluate(() => (window as typeof window & { __releaseSong?: () => void }).__releaseSong?.()).catch(() => {});
    }
  });
}

test("unknown download size stays indeterminate instead of inventing a percentage", async ({ page }) => {
  try {
    await page.goto("/play/bs-s1-05?tier=easy&mode=casual&noLength=1");
    const progress = page.getByRole("progressbar", { name: "Song download" });
    await expect(progress).toBeVisible();
    await expect(progress).not.toHaveAttribute("aria-valuenow", /.+/);
    await expect(page.getByText("Downloading song…", { exact: true })).toBeVisible();
    await page.evaluate(() => (window as typeof window & { __releaseSong?: () => void }).__releaseSong?.());
    await expect(page.getByRole("button", { name: "Start playing", exact: true })).toBeEnabled();
  } finally {
    await page.evaluate(() => (window as typeof window & { __releaseSong?: () => void }).__releaseSong?.()).catch(() => {});
  }
});
