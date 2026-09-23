import { expect, test } from "@playwright/test";
import { contrastRatio } from "./contrast";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test("Library showcase track links meet AA text contrast", async ({ page }) => {
  await page.goto("/library");
  const links = page.locator(".showcase-chips .chip-link");
  await expect(links.first()).toBeVisible();
  for (const link of await links.all()) {
    expect(await contrastRatio(link), `contrast of ${await link.textContent()}`).toBeGreaterThanOrEqual(4.5);
  }
});

test("the pre-game Start playing action meets AA text contrast", async ({ page }) => {
  await page.goto("/play/bs-s1-05?tier=easy&mode=casual");
  const start = page.getByRole("button", { name: "Start playing", exact: true });
  await expect(start).toBeVisible();
  expect(await contrastRatio(start)).toBeGreaterThanOrEqual(4.5);
});
