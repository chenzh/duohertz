import { expect, test } from "@playwright/test";

test("front and side character concepts load at desktop and narrow widths", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/beatscape/lab/duohertz");
    await expect(page.getByRole("heading", { name: "duohertz", level: 1 })).toBeVisible();
    await expect(page.getByText("真我赫兹 · 音你、真我赫兹")).toBeVisible();
    await expect(page.getByText("Tap the beat. See the sound.")).toBeVisible();
    const cards = page.locator(".dh-lab__character");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(2)).toContainText("ZORYMELA");
    await cards.first().scrollIntoViewIfNeeded();

    for (const [view, altPrefix] of [["Front", "RHYVORI"], ["Side", "Side view of RHYVORI"]] as const) {
      await page.getByRole("group", { name: "Character concept view" }).getByRole("button", { name: view }).click();
      await expect(cards.first().getByRole("img")).toHaveAttribute("alt", new RegExp(`^${altPrefix}`));
      await expect.poll(async () => cards.locator("img").evaluateAll((images) =>
        images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth === 1024),
      )).toBe(true);
    }

    await cards.first().getByText("Read RHYVORI's story").click();
    await expect(cards.first().getByText("The child tapped back.", { exact: false })).toBeVisible();
    await expect(cards.first().getByText("Curious · decisive · warm · sometimes rushes the beat")).toBeVisible();

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  expect(errors).toEqual([]);
});
