import { expect, test } from "@playwright/test";

test("Hold cue shows its tail until the release beat", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Play track with sound" }).click();
  const hold = page.locator(".dh-lab__note--hold");

  async function at(seconds: number) {
    await page.waitForFunction((target) => {
      const readout = document.querySelector(".dh-lab__readout span")?.textContent ?? "0";
      return Number.parseFloat(readout) >= target;
    }, seconds - 0.03);
  }

  await at(6.8);
  await expect(hold).toBeVisible();
  const approaching = await hold.boundingBox();
  expect(approaching?.height).toBeGreaterThan(45);

  await at(7.2);
  await expect(hold).toBeVisible();
  const sustaining = await hold.boundingBox();
  expect(sustaining?.y).toBeGreaterThan(approaching!.y);
  expect(sustaining?.height).toBeGreaterThan(25);
});
