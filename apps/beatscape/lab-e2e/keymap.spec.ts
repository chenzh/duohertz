import { expect, test } from "@playwright/test";

async function nearBeat(page: import("@playwright/test").Page, seconds: number) {
  await page.waitForFunction((target) =>
    Number.parseFloat(document.querySelector(".dh-lab__readout span")?.textContent ?? "0") >= target,
  seconds - 0.04);
}

test("a saved one-key remap changes the pad legend and scores a real sketch beat", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  await page.locator(".dh-lab__keymap summary").click();
  await page.getByRole("button", { name: "One key: Space" }).click();
  await page.keyboard.press("k");
  await expect(page.locator(".dh-lab__keymap").getByRole("status")).toHaveText("Keyboard controls saved on this device.");
  await expect(page.getByRole("button", { name: "Tap or hold the beat" })).toContainText("K");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("duohertz_keymap_v1") ?? "null").one)).toBe("KeyK");

  await page.getByRole("button", { name: "Play track with sound" }).click();
  await nearBeat(page, 1);
  await page.keyboard.press("k");
  await expect(page.locator(".dh-lab__readout")).toContainText("1/7 notes");
  await page.getByRole("button", { name: "Stop" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Tap or hold the beat" })).toContainText("K");
});

test("two-key remap rejects duplicates, Escape cancels, and browser shortcuts remain free", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  await page.locator(".dh-lab__keymap summary").click();
  await page.getByRole("button", { name: "Left beat: F" }).click();
  await page.keyboard.press("a");
  await page.getByRole("button", { name: "Right beat: J" }).click();
  const captureShortcutPrevented = await page.evaluate(() => {
    const shortcut = new KeyboardEvent("keydown", { code: "KeyF", ctrlKey: true, bubbles: true, cancelable: true });
    document.dispatchEvent(shortcut);
    return shortcut.defaultPrevented;
  });
  expect(captureShortcutPrevented).toBe(false);
  await page.keyboard.press("a");
  await expect(page.locator(".dh-lab__keymap").getByRole("status")).toHaveText("Left and right need different keys.");
  await page.keyboard.press("Escape");
  await expect(page.locator(".dh-lab__keymap").getByRole("status")).toHaveText("Key change canceled.");
  await page.getByRole("button", { name: "Right beat: J" }).click();
  await page.keyboard.press("l");
  await page.getByRole("button", { name: "2 keys · Standard" }).click();
  await expect(page.getByRole("button", { name: "Left beat", exact: true })).toContainText("A");
  await expect(page.getByRole("button", { name: "Right beat", exact: true })).toContainText("L");

  await page.getByRole("button", { name: "Play track with sound" }).click();
  const shortcutPrevented = await page.evaluate(() => {
    const shortcut = new KeyboardEvent("keydown", { code: "KeyA", ctrlKey: true, bubbles: true, cancelable: true });
    document.dispatchEvent(shortcut);
    return shortcut.defaultPrevented;
  });
  expect(shortcutPrevented).toBe(false);
  await nearBeat(page, 1);
  await page.keyboard.press("a");
  await nearBeat(page, 1.5);
  await page.keyboard.press("l");
  await expect(page.locator(".dh-lab__readout")).toContainText("2/14 notes");
  await page.getByRole("button", { name: "Stop" }).click();
  await page.getByRole("button", { name: "Restore defaults" }).click();
  await expect(page.getByRole("button", { name: "Left beat: F" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Right beat: J" })).toBeVisible();
});
