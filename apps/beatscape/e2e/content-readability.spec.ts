import { expect, test } from "@playwright/test";
import { contrastRatio } from "./contrast";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test("mobile crew tabs retain readable text for every selected district", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/characters");
  const tabs = page.getByRole("tablist", { name: "Choose a crew member" }).getByRole("tab");
  await expect(tabs).toHaveCount(3);
  for (const tab of await tabs.all()) {
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    expect(await contrastRatio(tab.locator("strong"))).toBeGreaterThanOrEqual(4.5);
    expect(await contrastRatio(tab.locator("span"))).toBeGreaterThanOrEqual(4.5);
  }
});

test("radio signal and upcoming previews remain accessible", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-13T04:00:00.000Z") });
  await page.goto("/radio");
  await expect(page.getByRole("img", { name: /Signal strength \d of 5/ })).toBeVisible();

  const activeChannelNumber = page.locator(".radio-channel.active .radio-channel-num");
  await expect(activeChannelNumber).toBeVisible();
  expect(await contrastRatio(activeChannelNumber)).toBeGreaterThanOrEqual(4.5);

  const upcoming = page.locator(".radio-episode.upcoming");
  expect(await upcoming.count()).toBeGreaterThan(0);
  await expect(upcoming.first()).toHaveCSS("opacity", "1");
  expect(await contrastRatio(upcoming.first().locator(".radio-ep-num"))).toBeGreaterThanOrEqual(4.5);
  expect(await contrastRatio(upcoming.first().locator(".radio-teaser"))).toBeGreaterThanOrEqual(4.5);
});

test("locked achievements stay legible and the active rank stays distinct", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/profile");

  const locked = page.locator(".achievement-card:not(.unlocked)");
  await expect(locked.first()).toBeVisible();
  await expect(locked.first()).toHaveCSS("opacity", "1");
  expect(await contrastRatio(locked.first().locator(".achievement-status"))).toBeGreaterThanOrEqual(4.5);
  expect(await contrastRatio(locked.first().locator(".achievement-condition"))).toBeGreaterThanOrEqual(4.5);

  const currentRank = page.locator(".rank-card.rank-current strong");
  await expect(currentRank).toBeVisible();
  expect(await contrastRatio(currentRank)).toBeGreaterThanOrEqual(4.5);
});
