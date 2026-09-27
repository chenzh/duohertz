import { expect, test } from "@playwright/test";

async function waitForSongTime(page: import("@playwright/test").Page, seconds: number) {
  await page.waitForFunction((target) =>
    Number.parseFloat(document.querySelector(".dh-lab__readout span")?.textContent ?? "0") >= target,
  seconds);
}

test("a queued keyboard beat uses its original input timestamp", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Play track with sound" }).click();
  await waitForSongTime(page, 1.1);
  await page.evaluate(() => {
    const event = new KeyboardEvent("keydown", { code: "Space", bubbles: true, cancelable: true });
    Object.defineProperty(event, "timeStamp", { value: performance.now() - 110 });
    window.dispatchEvent(event);
  });
  await expect(page.locator(".dh-lab__readout")).toContainText("PERFECT");
});

test("a queued pointer beat uses its original input timestamp", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Play track with sound" }).click();
  const pad = page.getByRole("button", { name: "Tap or hold the beat" });
  await pad.scrollIntoViewIfNeeded();
  const box = await pad.boundingBox();
  if (!box) throw new Error("Missing beat pad");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.evaluate(() => {
    window.addEventListener("pointerdown", (event) => {
      Object.defineProperty(event, "timeStamp", { value: performance.now() - 110 });
    }, { capture: true, once: true });
  });
  await waitForSongTime(page, 1.1);
  await page.mouse.down();
  await expect(page.locator(".dh-lab__readout")).toContainText("PERFECT");
  await page.mouse.up();
});

test("a queued Hold release uses its original input timestamp", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Play track with sound" }).click();
  await waitForSongTime(page, 6.98);
  await page.keyboard.down("Space");
  await waitForSongTime(page, 7.6);
  await page.evaluate(() => {
    const event = new KeyboardEvent("keyup", { code: "Space", bubbles: true, cancelable: true });
    Object.defineProperty(event, "timeStamp", { value: performance.now() - 100 });
    window.dispatchEvent(event);
  });
  await expect(page.locator(".dh-lab__readout")).toContainText("PERFECT");
  await page.keyboard.up("Space");
});

test("a queued gamepad beat uses the controller's original input timestamp", async ({ page }) => {
  await page.addInitScript(() => {
    const state = { pressed: false, timestamp: 0 };
    (window as typeof window & { labTimedGamepad: typeof state }).labTimedGamepad = state;
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [{
        index: 0,
        connected: true,
        mapping: "standard",
        timestamp: state.timestamp,
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, (_, index) => ({
          pressed: index === 0 && state.pressed,
          value: index === 0 && state.pressed ? 1 : 0,
        })),
      }],
    });
  });
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Play track with sound" }).click();
  await waitForSongTime(page, 1.1);
  await page.evaluate(() => {
    const state = (window as typeof window & { labTimedGamepad: { pressed: boolean; timestamp: number } }).labTimedGamepad;
    state.pressed = true;
    state.timestamp = performance.now() - 110;
  });
  await expect(page.locator(".dh-lab__readout")).toContainText("PERFECT");
});
