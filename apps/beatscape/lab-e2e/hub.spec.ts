import { readFileSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const stagedRoot = new URL("../candidates/duohertz/", import.meta.url);
const staged = readdirSync(stagedRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^dh-\d{3}-/.test(entry.name))
  .map((entry) => JSON.parse(readFileSync(new URL(`${entry.name}/manifest.json`, stagedRoot), "utf8")) as { subgenre: string });

test("duohertz keeps BeatScape's home-to-library hierarchy and opens a selected chart", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/beatscape/lab/duohertz/home");
  await expect(page.getByRole("heading", { name: /Feel the beat/ })).toBeVisible();
  await expect(page).toHaveTitle(/duohertz/);
  await expect(page.getByRole("link", { name: "Browse all tracks" })).toHaveAttribute("href", /\/lab\/duohertz\/library$/);
  await expect(page.locator(".dh-hub__catalog--featured .dh-hub__track")).toHaveCount(3);
  await expect(page.locator(".dh-hub__radio-banner")).toBeVisible();
  await expect(page.locator(".dh-hub__people-art img")).toHaveCount(3);
  await expect(page.locator(".dh-hub__track")).toHaveCount(9);
  await page.getByRole("button", { name: "01 Pulse" }).click();
  await expect(page.locator(".dh-home-hero__visual > p")).toContainText("Pulse wave");
  await page.getByRole("navigation", { name: "Primary" }).first().getByRole("link", { name: "Library" }).click();
  await expect(page).toHaveURL(/\/beatscape\/lab\/duohertz\/library$/);
  await expect(page.getByRole("heading", { name: "Choose your beat" })).toBeVisible();
  await expect(page.locator(".dh-hub__track")).toHaveCount(24);
  const firstCover = page.locator(".dh-hub__track img").first();
  await expect(firstCover).toHaveAttribute("src", /thumbnails.*\.webp/);
  await expect.poll(() => firstCover.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(240);
  await page.getByRole("searchbox", { name: "Find a beat" }).fill("cobalt");
  await expect(page.locator(".dh-hub__track")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "Find a beat" }).fill("");
  await page.getByRole("button", { name: "Synthwave" }).click();
  await expect(page.locator(".dh-hub__result-count")).toContainText(`${staged.filter((candidate) => candidate.subgenre === "Synthwave").length} matches`);
  await page.getByRole("searchbox", { name: "Find a beat" }).fill("cobalt");
  await page.getByRole("link", { name: "Try Cobalt Switchback in the rhythm game" }).click();
  await expect(page).toHaveURL(/\/beatscape\/lab\/duohertz\?track=dh-012-cobalt-switchback$/);
  await expect(page.getByRole("button", { name: "Cobalt Switchback · 64s candidate" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".dh-lab__candidate-art img")).toHaveJSProperty("complete", true);
  await expect(page.locator(".dh-lab__candidate-art img")).toHaveAttribute("src", /cover-art\.png/);
  await expect(page.locator(".mobile-tabbar .tab-play")).toHaveAttribute("aria-current", "page");
  expect(errors).toEqual([]);
});

test("duohertz home keeps its actions and first music card usable at 320px", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto("/beatscape/lab/duohertz/home");
    await expect(page.getByRole("link", { name: "Start with one key" })).toBeVisible();
    const card = page.locator(".dh-hub__track").first();
    await card.scrollIntoViewIfNeeded();
    const action = card.getByRole("link", { name: /Try .* in the rhythm game/ });
    await expect(action).toBeVisible();
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewport);
    await expect(page.locator(".dh-hub__people-art img")).toHaveCount(3);
    const box = await action.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await page.getByRole("navigation", { name: "Primary" }).last().getByRole("link", { name: "Station" }).click();
    await expect(page).toHaveURL(/\/beatscape\/lab\/duohertz\/radio$/);
  } finally {
    await context.close();
  }
});
