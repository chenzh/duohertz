import { expect, test } from "@playwright/test";

test("a disconnected assigned controller freezes the run and keyboard can resume it", async ({ page }) => {
  await page.addInitScript(() => {
    const state = { originalConnected: true };
    (window as typeof window & { labReplacementGamepad: typeof state }).labReplacementGamepad = state;
    const pad = {
      index: 0,
      connected: true,
      mapping: "standard",
      timestamp: performance.now(),
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [state.originalConnected ? { ...pad, timestamp: performance.now() } : null],
    });
  });

  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Play track with sound" }).click();
  const time = page.locator(".dh-lab__readout span").first();
  await page.waitForFunction(() => Number.parseFloat(document.querySelector(".dh-lab__readout span")?.textContent ?? "0") >= 0.4);
  await page.evaluate(() => {
    (window as typeof window & { labReplacementGamepad: { originalConnected: boolean } }).labReplacementGamepad.originalConnected = false;
  });

  await expect(page.getByRole("status", { name: "" }).filter({ hasText: "Paused. Music and chart timing are frozen." })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Controller disconnected");
  const stoppedAt = await time.textContent();
  await page.waitForTimeout(350);
  expect(await time.textContent()).toBe(stoppedAt);

  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible({ timeout: 6_000 });
  await page.waitForFunction(() => Number.parseFloat(document.querySelector(".dh-lab__readout span")?.textContent ?? "0") >= 0.98);
  await page.keyboard.down("Space");
  await expect(page.locator(".dh-lab__readout")).toContainText(/PERFECT|GREAT|GOOD/);
  await page.keyboard.up("Space");
});

test("Duo freezes when Player 2 loses a controller and accepts a new Player 2 controller", async ({ page }) => {
  await page.addInitScript(() => {
    const state = { secondConnected: true, replacementConnected: false, replacementPressed: false };
    (window as typeof window & { labDuoReplacement: typeof state }).labDuoReplacement = state;
    const pad = (index: number, connected: boolean, pressed: boolean) => connected ? {
      index,
      connected: true,
      mapping: "standard",
      timestamp: performance.now(),
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, (_, button) => ({
        pressed: button === 0 && pressed,
        value: button === 0 && pressed ? 1 : 0,
      })),
    } : null;
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [pad(0, true, false), pad(1, state.secondConnected, false),
        pad(2, state.replacementConnected, state.replacementPressed)],
    });
  });

  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Duo · two players" }).click();
  await page.getByRole("button", { name: "Play track with sound" }).click();
  await page.waitForFunction(() => Number.parseFloat(document.querySelector(".dh-lab__readout span")?.textContent ?? "0") >= 0.4);
  await page.evaluate(() => {
    (window as typeof window & { labDuoReplacement: { secondConnected: boolean } }).labDuoReplacement.secondConnected = false;
  });
  await expect(page.getByRole("alert")).toContainText("Player 2 controller disconnected");
  await page.evaluate(() => {
    (window as typeof window & { labDuoReplacement: { replacementConnected: boolean } }).labDuoReplacement.replacementConnected = true;
  });
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible({ timeout: 6_000 });
  await page.waitForFunction(() => Number.parseFloat(document.querySelector(".dh-lab__readout span")?.textContent ?? "0") >= 1.48);
  await page.evaluate(() => {
    (window as typeof window & { labDuoReplacement: { replacementPressed: boolean } }).labDuoReplacement.replacementPressed = true;
  });
  await expect(page.locator(".dh-lab__readout")).toContainText(/P2 (PERFECT|GREAT|GOOD)/);
});
