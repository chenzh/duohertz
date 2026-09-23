import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("a transient lazy-route failure can recover without losing the destination", async ({ page }, info) => {
  let unavailable = true;
  await page.route("**/assets/Characters-*.js", async (route) => {
    if (unavailable) await route.fulfill({ status: 503, body: "Temporarily unavailable" });
    else await route.continue();
  });

  await page.goto("/characters");

  const fallback = page.getByRole("alert");
  await expect(fallback.getByText("The Late Static", { exact: true })).toBeVisible();
  await expect(fallback.getByRole("heading", { name: "Signal lost", exact: true })).toBeVisible();
  await expect(fallback).toContainText("Your scores are safe");
  await expect(fallback.locator(".error-detail")).toHaveCount(0);
  await expect(fallback).not.toContainText("Failed to fetch dynamically imported module");
  await expect(page).toHaveURL(/\/characters$/);
  const reload = fallback.getByRole("button", { name: "Reload page", exact: true });
  expect((await reload.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const home = fallback.getByRole("link", { name: "Back to home", exact: true });
  expect((await home.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(home).toHaveAttribute("href", "/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({
    path: info.outputPath("fatal-route-recovery.png"),
    fullPage: true,
    animations: "disabled",
  });

  unavailable = false;
  await reload.click();
  await expect(page.getByRole("heading", { name: "NIGHTSHIFT", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/characters$/);
});

test("a slow lazy route exposes safe exits while it keeps connecting", async ({ page }, info) => {
  await page.route("**/assets/Characters-*.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 4_500));
    await route.continue();
  });

  await page.goto("/characters");

  const fallback = page.getByRole("status");
  await expect(fallback.getByRole("heading", { name: "Still connecting", exact: true })).toBeVisible({
    timeout: 4_000,
  });
  await expect(fallback).toContainText("taking longer than expected");
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator(".site-main").getByRole("status")).toBeVisible();
  await expect(page.locator(info.project.name === "mobile" ? ".mobile-tabbar" : ".site-nav")).toBeVisible();
  await expect(page).toHaveURL(/\/characters$/);
  const reload = fallback.getByRole("button", { name: "Reload page", exact: true });
  const home = fallback.getByRole("link", { name: "Back to home", exact: true });
  expect((await reload.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect((await home.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(home).toHaveAttribute("href", "/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({
    path: info.outputPath("slow-route-recovery.png"),
    fullPage: true,
    animations: "disabled",
  });

  await expect(page.getByRole("heading", { name: "NIGHTSHIFT", exact: true })).toBeVisible({ timeout: 4_000 });
  await expect(page).toHaveURL(/\/characters$/);
});
