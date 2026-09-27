import { expect, test } from "@playwright/test";

test("Duo assigns two controllers to separate players and keeps results independent", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const pressed = [new Set<number>(), new Set<number>()];
    (window as typeof window & { labDuoButtons: Set<number>[] }).labDuoButtons = pressed;
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => pressed.map((buttons, index) => ({
        index,
        connected: true,
        mapping: "standard",
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, (_, button) => ({
          pressed: buttons.has(button),
          value: buttons.has(button) ? 1 : 0,
        })),
      })),
    });
  });

  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Duo · two players" }).click();
  await expect(page.getByRole("button", { name: "1 key · Easy" })).toBeDisabled();
  await page.getByRole("button", { name: "2 keys · Hard" }).click();
  await page.getByRole("button", { name: "Play track with sound" }).click();

  async function hit(atSeconds: number, players: number[]) {
    await page.waitForFunction((target) => {
      const elapsed = document.querySelector(".dh-lab__readout span")?.textContent ?? "0";
      return parseFloat(elapsed) >= target;
    }, atSeconds - 0.03);
    await page.evaluate((indexes) => {
      const pressed = (window as typeof window & { labDuoButtons: Set<number>[] }).labDuoButtons;
      indexes.forEach((index) => pressed[index].add(0));
    }, players);
    await page.waitForTimeout(70);
    await page.evaluate((indexes) => {
      const pressed = (window as typeof window & { labDuoButtons: Set<number>[] }).labDuoButtons;
      indexes.forEach((index) => pressed[index].delete(0));
    }, players);
  }

  await hit(1, [0]);
  await hit(2, [0, 1]);
  await expect(page.getByRole("region", { name: "Player 1 result" })).toContainText("2/8 notes");
  await expect(page.getByRole("region", { name: "Player 1 result" })).toContainText("100% accuracy");
  await expect(page.getByRole("region", { name: "Player 2 result" })).toContainText("2/8 notes");
  await expect(page.getByRole("region", { name: "Player 2 result" })).not.toContainText("100% accuracy");
  await expect(page.getByText("Track complete. Your result is below.")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("region", { name: "Player 1 result" })).toContainText("8/8 notes");
  await expect(page.getByRole("region", { name: "Player 2 result" })).toContainText("8/8 notes");
  await expect(page.getByRole("region", { name: "Player 1 result" })).not.toContainText("0% accuracy");
  await expect(page.getByRole("region", { name: "Player 2 result" })).not.toContainText("0% accuracy");
  const finalResult = page.getByRole("region", { name: "Your frequency" });
  await expect(finalResult.getByRole("region", { name: "Player 1 final result" })).toBeVisible();
  await expect(finalResult.getByRole("region", { name: "Player 2 final result" })).toBeVisible();
  await finalResult.getByRole("button", { name: "Play again" }).click();
  await expect(finalResult).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(page).toHaveURL(/\/beatscape\/lab\/duohertz$/);
  expect(errors).toEqual([]);
});

test("Duo touch pads keep player ownership on a narrow screen", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/beatscape/lab/duohertz");
    await page.getByRole("button", { name: "Duo · two players" }).click();
    await page.getByRole("button", { name: "2 keys · Hard" }).click();
    await page.getByRole("button", { name: "Play track with sound" }).click();
    const firstPad = page.getByRole("button", { name: "Player 1 beat" });
    const secondPad = page.getByRole("button", { name: "Player 2 beat" });
    await expect(firstPad).toBeEnabled();
    await firstPad.scrollIntoViewIfNeeded();

    async function tapAt(atSeconds: number, pad: typeof firstPad) {
      await page.waitForFunction((target) => {
        const elapsed = document.querySelector(".dh-lab__readout span")?.textContent ?? "0";
        return parseFloat(elapsed) >= target;
      }, atSeconds - 0.05);
      await pad.tap();
    }

    await tapAt(1, firstPad);
    await tapAt(1.5, secondPad);
    await expect(page.getByRole("region", { name: "Player 1 result" })).toContainText("1/8 notes");
    await expect(page.getByRole("region", { name: "Player 2 result" })).toContainText("1/8 notes");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
