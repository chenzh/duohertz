import { expect, test, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("legacy speed settings normalize into one honest control", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_settings", JSON.stringify({
    scrollBias: 2,
    casualSpeed: 0.75,
  })));

  await page.goto("/settings");
  await expect(page.getByRole("slider", { name: "Note speed", exact: true })).toHaveValue("0.5");
  await expect(page.locator("label.field").filter({ hasText: "Note speed · 0.50×" })).toBeVisible();
  await expect(page.getByText("Casual visual speed", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("Track quick-adjust saves one speed for every mode and previews it before play", async ({ page }, info) => {
  await page.goto("/track/bs-s1-05");

  const stepper = page.locator(".run-speed-stepper");
  const output = stepper.locator("output");
  const decrease = page.getByRole("button", { name: "Decrease note speed", exact: true });
  const increase = page.getByRole("button", { name: "Increase note speed", exact: true });
  await expect(output).toContainText("1.00×");

  for (const control of [decrease, increase]) {
    const box = (await control.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  await increase.click();
  await expect(output).toContainText("1.25×");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("bs_settings")!));
  expect(saved.scrollBias).toBeCloseTo(-0.2);
  expect(saved.casualSpeed).toBeUndefined();

  const modeControl = page.locator(".run-control").filter({ hasText: /^Mode/ });
  await modeControl.getByRole("radio", { name: "Casual", exact: true }).click();
  await expect(output).toContainText("1.25×");
  await modeControl.getByRole("radio", { name: "Arcade", exact: true }).click();
  await expect(output).toContainText("1.25×");

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("track-note-speed.png"), fullPage: true, animations: "disabled" });

  // Track owns a fixed contextual Play action on mobile and the inline CTA on
  // desktop; the accessible name identifies the one visible action in either
  // layout without coupling this test to its container.
  await page.getByRole("link", { name: "Play Easy · Arcade", exact: true }).click();
  const overlay = page.locator(".overlay-tap");
  const speedReadout = overlay.getByRole("group", {
    name: "Note speed · visual only · saves for all modes",
  });
  await expect(speedReadout).toBeVisible();
  await expect(speedReadout).toContainText("Note speed");
  await expect(speedReadout).toContainText("1.25×");
  await expect(speedReadout).toContainText("Visual");
  await expect(speedReadout).toContainText("saves");
  const card = (await overlay.locator(".overlay-card").boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(card.y).toBeGreaterThanOrEqual(0);
  expect(card.y + card.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("play-note-speed.png"), animations: "disabled" });
});

test("a direct run can set note speed before the first note", async ({ page }, info) => {
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  await page.goto("/play/bs-s1-05?tier=easy&mode=arcade");

  const overlay = page.locator(".overlay-tap");
  const speed = overlay.getByRole("group", { name: "Note speed · visual only · saves for all modes" });
  const decrease = speed.getByRole("button", { name: "Decrease note speed", exact: true });
  const increase = speed.getByRole("button", { name: "Increase note speed", exact: true });
  const output = speed.locator("output");

  await expect(speed).toBeVisible();
  await expect(output).toContainText("1.00×");
  for (const control of [decrease, increase]) {
    const box = (await control.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  await increase.click();
  await expect(output).toContainText("1.25×");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("bs_settings")!));
  expect(saved.scrollBias).toBeCloseTo(-0.2);
  await expect(overlay.locator(".unlock-btn")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("ready-note-speed.png"), animations: "disabled" });

  await overlay.locator(".unlock-btn").click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(speed).toHaveCount(0);
});
