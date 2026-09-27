import { expect, test } from "@playwright/test";

test("focused controls keep Space while the rhythm game is playing", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Play track with sound" }).click();

  const feedback = page.getByRole("checkbox", { name: "Play beat feedback" });
  await feedback.focus();
  await feedback.press("Space");
  await expect(feedback).not.toBeChecked();

  const pause = page.getByRole("button", { name: "Pause", exact: true });
  await pause.focus();
  await pause.press("Space");
  await expect(page.getByRole("status").filter({ hasText: "Paused. Music and chart timing are frozen." })).toBeVisible();
});

test("Space still plays the one-key sketch after starting from its button", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Play track with sound" }).click();
  await page.waitForFunction(() => {
    const readout = document.querySelector(".dh-lab__readout span")?.textContent ?? "0";
    return Number.parseFloat(readout) >= 0.96;
  });
  await page.keyboard.down("Space");
  await page.keyboard.up("Space");
  await expect(page.locator(".dh-lab__readout")).toContainText("1/7 notes");
});
