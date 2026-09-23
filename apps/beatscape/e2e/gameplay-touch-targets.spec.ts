import { expect, test, type Locator } from "@playwright/test";

test.use({ viewport: { width: 320, height: 568 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

type TargetSize = {
  label: string;
  width: number;
  height: number;
};

async function targetSize(target: Locator, label: string): Promise<TargetSize> {
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  return { label, width: box!.width, height: box!.height };
}

function expectCriticalTargets(sizes: TargetSize[]) {
  expect(sizes.filter(({ width, height }) => width < 44 || height < 44)).toEqual([]);
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
  test(`single-player keeps the entire touch highway on-screen at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/play/bs-s1-01?tier=easy&mode=casual");

    const start = page.getByRole("button", { name: "Start playing", exact: true });
    await expect(start).toBeVisible();
    const startBox = await start.boundingBox();
    expect(startBox).not.toBeNull();
    expect(startBox!.y).toBeGreaterThanOrEqual(0);
    expect(startBox!.y + startBox!.height).toBeLessThanOrEqual(viewport.height);
    if (viewport.width === 320) {
      const noSound = page.locator(".unlock-nosound summary");
      await noSound.scrollIntoViewIfNeeded();
      await noSound.click();
      const settings = page.locator(".unlock-nosound a");
      await settings.scrollIntoViewIfNeeded();
      const settingsBox = await settings.boundingBox();
      expect(settingsBox).not.toBeNull();
      expect(settingsBox!.y).toBeGreaterThanOrEqual(0);
      expect(settingsBox!.y + settingsBox!.height).toBeLessThanOrEqual(viewport.height);
      expect(await page.evaluate(() => scrollY)).toBe(0);
    }
    await start.click();

    const canvas = page.locator("canvas.play-canvas");
    await expect(canvas).toBeVisible();
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.height).toBeGreaterThanOrEqual(300);
    expect(canvasBox!.y).toBeGreaterThanOrEqual(0);
    expect(canvasBox!.y + canvasBox!.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(() => ({ scrollY, scrollHeight: document.documentElement.scrollHeight })))
      .toEqual({ scrollY: 0, scrollHeight: viewport.height });

    await page.getByRole("button", { name: "Pause", exact: true }).click();
    const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
    const resume = pauseDialog.getByRole("button", { name: "Resume", exact: true });
    await resume.scrollIntoViewIfNeeded();
    const resumeBox = await resume.boundingBox();
    expect(resumeBox).not.toBeNull();
    expect(resumeBox!.y).toBeGreaterThanOrEqual(0);
    expect(resumeBox!.y + resumeBox!.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });
}

test("single-player exit and pause keep 44px critical targets", async ({ page }, info) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");

  const exit = page.getByRole("button", { name: "Exit the Scape", exact: true });
  await expect(exit.locator(".play-exit-visual svg")).toBeVisible();
  const sizes = [await targetSize(exit, "single exit")];
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  const pause = page.getByRole("button", { name: "Pause", exact: true });
  await expect(pause.locator(".pause-btn-visual svg")).toBeVisible();
  sizes.push(await targetSize(pause, "single pause"));
  await pause.click();
  const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  sizes.push(
    await targetSize(pauseDialog.getByRole("button", { name: "Resume", exact: true }), "single resume"),
    await targetSize(pauseDialog.getByRole("button", { name: "Restart track", exact: true }), "single restart"),
    await targetSize(pauseDialog.getByRole("button", { name: "Leave track", exact: true }), "single leave"),
  );

  await page.screenshot({ path: info.outputPath("single-pause-320.png"), animations: "disabled" });
  expectCriticalTargets(sizes);
});

test("Duo keeps both complete 44px-control fields inside a 320px portrait viewport", async ({ page }, info) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");

  const exit = page.getByRole("button", { name: "Exit the Scape", exact: true });
  await expect(exit.locator(".play-exit-visual svg")).toBeVisible();
  const sizes = [await targetSize(exit, "Duo exit")];
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const pauseButtons = page.getByRole("button", { name: "Pause", exact: true });
  await expect(pauseButtons).toHaveCount(2);
  await expect(pauseButtons.nth(0).locator(".pause-btn-visual svg")).toBeVisible();
  await expect(pauseButtons.nth(1).locator(".pause-btn-visual svg")).toBeVisible();
  sizes.push(await targetSize(pauseButtons.nth(0), "Duo left pause"));
  sizes.push(await targetSize(pauseButtons.nth(1), "Duo right pause"));

  const canvases = page.locator("canvas.play-canvas");
  await expect(canvases).toHaveCount(2);
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  for (const index of [0, 1]) {
    const box = await canvases.nth(index).boundingBox();
    expect(box, `Duo field ${index + 1} canvas box`).not.toBeNull();
    expect(box!.y, `Duo field ${index + 1} canvas top`).toBeGreaterThanOrEqual(0);
    expect(box!.height, `Duo field ${index + 1} lane travel`).toBeGreaterThanOrEqual(180);
    expect(
      box!.y + box!.height,
      `Duo field ${index + 1} canvas bottom`,
    ).toBeLessThanOrEqual(viewport!.height);
  }
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(viewport!.height);

  await page.screenshot({ path: info.outputPath("duo-320.png"), animations: "disabled" });
  expectCriticalTargets(sizes);
});
