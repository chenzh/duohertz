import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test("320px Duo header keeps the song and setup readable while loading", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Compact Duo header is mobile-only");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/duo/bs-s1-05?tier=easy&mode=casual");
  const header = page.locator(".duo-meta");
  await expect(header).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const title = header.locator(":scope > strong");
  const setup = header.locator(".play-meta-tier");
  await expect(title).toHaveText("Voltage Drop");
  const clipsText = async (locator: typeof title) => locator.evaluate((element) =>
    element.scrollWidth > element.clientWidth + 1);
  expect(await clipsText(title)).toBe(false);
  expect(await clipsText(setup)).toBe(false);
  await expect(setup.locator(".play-meta-tier-compact")).toHaveText("easy · casual");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("Duo teaches both seats while one shared song loads, then arms Start", async ({ page }, info) => {
  let releaseAudio!: () => void;
  const heldAudio = new Promise<void>((resolve) => { releaseAudio = resolve; });
  await page.route("**/audio.m4a*", async (route) => {
    await heldAudio;
    await route.continue();
  });

  try {
    if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/duo/bs-s1-05?tier=easy&mode=casual");

    const loading = page.getByRole("dialog", { name: "Preparing duel" });
    await expect(loading).toBeVisible();
    await expect(loading).toBeFocused();
    await expect(loading.getByRole("button", { name: "Loading song…" })).toBeDisabled();
    await expect(loading.locator(".duo-seat-hint")).toContainText("P1");
    await expect(loading.locator(".duo-seat-hint")).toContainText("P2");
    await expect(page.locator(".play-wrap-duo .overlay")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(0);
    if (info.project.name === "mobile") {
      const box = await loading.getByRole("button", { name: "Loading song…" }).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.y + box!.height).toBeLessThanOrEqual(552);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    }
    await page.screenshot({ path: info.outputPath("duo-loading-guide.png"), animations: "disabled" });

    releaseAudio();
    const ready = page.getByRole("dialog", { name: "Duel ready" });
    const start = ready.getByRole("button", { name: "Start", exact: true });
    await expect(start).toBeEnabled();
    await expect.poll(() => start.evaluate((button) => document.activeElement === button)).toBe(true);
    await expect(loading).toHaveCount(0);
  } finally {
    releaseAudio();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("leaving the Duo loading card preserves the selected setup", async ({ page }) => {
  let releaseAudio!: () => void;
  const heldAudio = new Promise<void>((resolve) => { releaseAudio = resolve; });
  await page.route("**/audio.m4a*", async (route) => {
    await heldAudio;
    await route.continue();
  });

  try {
    await page.goto("/duo/bs-s1-05?tier=hard&mode=arcade");
    await page.getByRole("dialog", { name: "Preparing duel" })
      .getByRole("button", { name: "Back to track" }).click();
    await expect(page).toHaveURL(/\/track\/bs-s1-05\?/);
    const params = new URL(page.url()).searchParams;
    expect(params.get("tier")).toBe("hard");
    expect(params.get("mode")).toBe("arcade");
    expect(await page.evaluate(() => sessionStorage.getItem("bs_last_run"))).toBeNull();
  } finally {
    releaseAudio();
    await page.unrouteAll({ behavior: "wait" });
  }
});
