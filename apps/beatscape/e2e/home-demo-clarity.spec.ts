import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test("compact Home demo keeps its title and action free of the decorative broadcast ribbon", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const demo = page.locator(".home-hero-demo");
  await expect(demo).toBeVisible();
  await expect(demo.locator(".home-hero-onair")).toBeHidden();
  await expect(demo.locator(".overlay-kicker")).toHaveText("Try the beat");
  await expect(demo.getByRole("button", { name: "Try it here", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 568 });
  await expect(demo.locator(".home-hero-onair")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("reduced-motion Home demo shows a static four-lane note pattern even after resize", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = page.locator(".home-hero-demo .hero-gameplay-canvas");
  const tintedPixels = () => canvas.evaluate((node: HTMLCanvasElement) => {
    const height = Math.floor(node.height * 0.7);
    if (!node.width || !height) return 0;
    const data = node.getContext("2d")!.getImageData(0, 0, node.width, height).data;
    let count = 0;
    for (let index = 0; index < data.length; index += 16) {
      const red = data[index]!;
      const green = data[index + 1]!;
      const blue = data[index + 2]!;
      if (Math.max(red, green, blue) > 100 && Math.max(red, green, blue) - Math.min(red, green, blue) > 30) {
        count += 1;
      }
    }
    return count;
  });
  await expect.poll(tintedPixels).toBeGreaterThan(20);
  await page.setViewportSize({ width: 320, height: 568 });
  await expect.poll(tintedPixels).toBeGreaterThan(20);
});
