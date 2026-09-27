import { expect, test } from "@playwright/test";

test("standard controller plays both keys and a chord without triggering site navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const pressed = new Set<number>();
    (window as typeof window & { labGamepadButtons: Set<number> }).labGamepadButtons = pressed;
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [{
        index: 0,
        connected: true,
        mapping: "standard",
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, (_, index) => ({
          pressed: pressed.has(index),
          value: pressed.has(index) ? 1 : 0,
        })),
      }],
    });
  });

  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "2 keys · Hard" }).click();
  await page.getByRole("button", { name: "Play track with sound" }).click();

  async function hit(atSeconds: number, buttons: number[]) {
    await page.waitForFunction((target) => {
      const elapsed = document.querySelector(".dh-lab__readout span")?.textContent ?? "0";
      return parseFloat(elapsed) >= target;
    }, atSeconds - 0.03);
    await page.evaluate((indices) => {
      const pressed = (window as typeof window & { labGamepadButtons: Set<number> }).labGamepadButtons;
      indices.forEach((index) => pressed.add(index));
    }, buttons);
    await page.waitForTimeout(70);
    await page.evaluate((indices) => {
      const pressed = (window as typeof window & { labGamepadButtons: Set<number> }).labGamepadButtons;
      indices.forEach((index) => pressed.delete(index));
    }, buttons);
  }

  await hit(1, [0]);
  await hit(1.5, [1]);
  await hit(2, [0, 1]);
  await expect(page).toHaveURL(/\/beatscape\/lab\/duohertz$/);
  await expect(page.locator(".dh-lab__readout")).toContainText("4/16 notes");
  await expect(page.locator(".dh-lab__readout")).toContainText("100% accuracy");
  expect(errors).toEqual([]);
});
