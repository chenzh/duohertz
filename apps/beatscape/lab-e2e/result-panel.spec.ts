import { expect, test } from "@playwright/test";

test("a completed one-key sketch has a readable result and a path back to music", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/beatscape/lab/duohertz");
    await page.getByRole("button", { name: "Play track with sound" }).click();
    const heading = page.getByRole("heading", { name: "Your frequency" });
    await expect(heading).toBeFocused({ timeout: 12_000 });
    const result = page.getByRole("region", { name: "Your frequency" });
    await expect(result).toContainText("0%", { timeout: 12_000 });
    await expect(result).toContainText("8-second sketch · easy · solo");
    await expect(result).toContainText("no public score or ranking is saved");
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewport);
    const replay = result.getByRole("button", { name: "Play again" });
    expect((await replay.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await result.getByRole("link", { name: "Choose another beat" }).click();
    await expect(page).toHaveURL(/\/beatscape\/lab\/duohertz\/home$/);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
