import { expect, test, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

type CalibrationAudioProbe = {
  attempts: number;
  rejectNext: boolean;
  release: null | (() => void);
  suspend: null | (() => void);
};

declare global {
  interface Window {
    __calibrationAudioProbe: CalibrationAudioProbe;
    __calibrationGamepadButtons?: Set<number>;
  }
}

async function installCalibrationGamepad(page: Page, heldButtons: number[] = []) {
  await page.addInitScript((initialButtons) => {
    const pressed = new Set(initialButtons);
    window.__calibrationGamepadButtons = pressed;
    const gamepad = {
      id: "Calibration Standard Gamepad",
      index: 0,
      connected: true,
      mapping: "standard",
      timestamp: 0,
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, (_, index) => ({
        get pressed() { return pressed.has(index); },
        get touched() { return pressed.has(index); },
        get value() { return pressed.has(index) ? 1 : 0; },
      })),
      vibrationActuator: null,
      hapticActuators: [],
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [gamepad],
    });
  }, heldButtons);
}

async function setCalibrationGamepadButton(page: Page, button: number, pressed: boolean) {
  await page.evaluate(({ input, down }) => {
    if (down) window.__calibrationGamepadButtons?.add(input);
    else window.__calibrationGamepadButtons?.delete(input);
  }, { input: button, down: pressed });
}

async function tapCalibrationGamepadButton(page: Page, button: number) {
  await setCalibrationGamepadButton(page, button, true);
  await page.waitForTimeout(32);
  await setCalibrationGamepadButton(page, button, false);
}

async function installCalibrationAudioProbe(
  page: Page,
  options: { rejectFirst: boolean; holdSuccess: boolean } = { rejectFirst: true, holdSuccess: true },
) {
  await page.addInitScript(({ rejectFirst, holdSuccess }) => {
    const probe: CalibrationAudioProbe = {
      attempts: 0,
      rejectNext: rejectFirst,
      release: null,
      suspend: null,
    };
    const pending: Array<() => void> = [];
    window.__calibrationAudioProbe = probe;
    const NativeAudioContext = window.AudioContext;
    const nativeResume = NativeAudioContext.prototype.resume;
    window.AudioContext = new Proxy(NativeAudioContext, {
      construct(target, args) {
        const context = Reflect.construct(target, args) as AudioContext;
        Object.defineProperty(context, "state", { configurable: true, value: "suspended" });
        probe.suspend = () => {
          Object.defineProperty(context, "state", { configurable: true, value: "suspended" });
        };
        return context;
      },
    });
    AudioContext.prototype.resume = function (this: AudioContext) {
      probe.attempts++;
      if (probe.rejectNext) {
        probe.rejectNext = false;
        return Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
      }
      if (!holdSuccess) {
        return nativeResume.call(this).then(() => {
          Object.defineProperty(this, "state", { configurable: true, value: "running" });
        });
      }
      return new Promise<void>((resolve) => {
        pending.push(resolve);
        probe.release = () => {
          Object.defineProperty(this, "state", { configurable: true, value: "running" });
          pending.splice(0).forEach((finish) => finish());
        };
      });
    };
  }, options);
}

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_offset_ms", "37");
  });
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("calibration start recovers from audio denial without admitting a double activation", async ({ page }) => {
  await installCalibrationAudioProbe(page);
  await page.goto("/calibrate?return=%2Fsettings");

  const start = page.getByRole("button", { name: "Start 8-pulse test", exact: true });
  await start.click();
  await expect(page.getByRole("alert")).toContainText("Audio could not start");
  await expect(start).toBeEnabled();
  expect(await page.evaluate(() => window.__calibrationAudioProbe.attempts)).toBe(1);

  // React cannot commit disabled=true between two same-turn DOM clicks. The
  // calibration flow must synchronously own one permission attempt.
  await start.evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page.getByRole("button", { name: "Starting…", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => window.__calibrationAudioProbe.attempts)).toBe(2);

  await page.evaluate(() => window.__calibrationAudioProbe.release?.());
  await expect(page.locator(".calib-run")).toBeVisible();
  expect(await page.evaluate(() => window.__calibrationAudioProbe.attempts)).toBe(2);
});

test("calibration keeps the result and exposes retry denial", async ({ page }) => {
  await installCalibrationAudioProbe(page, { rejectFirst: false, holdSuccess: false });
  await page.goto("/calibrate?return=%2Fsettings");
  await page.getByRole("button", { name: "Start 8-pulse test", exact: true }).click();

  for (let pulse = 0; pulse < 8; pulse++) {
    const active = page.locator(".calib-lane.flash");
    await expect(active).toHaveCount(1, { timeout: 1_500 });
    await page.keyboard.press("ArrowLeft");
    await expect(active).toHaveCount(0);
  }

  const result = page.locator(".calib-done-steady");
  await expect(result).toBeVisible();
  await page.evaluate(() => {
    window.__calibrationAudioProbe.rejectNext = true;
    window.__calibrationAudioProbe.suspend?.();
  });
  const retry = result.getByRole("button", { name: "Try again", exact: true });
  await retry.click();

  await expect(result).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Audio could not start");
  await expect(retry).toBeEnabled();
  expect(await page.evaluate(() => window.__calibrationAudioProbe.attempts)).toBe(2);
});

test("scheduled calibration works with the primary input for each viewport", async ({ page }, info) => {
  await page.goto("/settings");
  await page.getByRole("link", { name: "Recalibrate timing", exact: true }).click();
  await expect(page).toHaveURL(/\/calibrate\?return=%2Fsettings$/);
  await expect(page.getByText("Current +37 ms", { exact: true })).toBeVisible();
  await expect(page.getByText("same speakers or headphones", { exact: false })).toBeVisible();

  const start = page.getByRole("button", { name: "Start 8-pulse test", exact: true });
  expect((await start.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await start.click();

  const lanes = page.locator(".calib-lane");
  await expect(lanes).toHaveCount(4);
  for (let lane = 0; lane < 4; lane++) {
    const box = (await lanes.nth(lane).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  for (let pulse = 0; pulse < 8; pulse++) {
    const active = page.locator(".calib-lane.flash");
    await expect(active).toHaveCount(1, { timeout: 1_500 });
    if (info.project.name === "mobile") {
      await active.dispatchEvent("pointerdown", {
        pointerId: pulse + 1,
        pointerType: "touch",
        isPrimary: true,
        button: 0,
      });
    } else {
      await page.keyboard.press("ArrowLeft");
    }
    await expect(page.locator(".calib-progress")).toContainText(`${pulse + 1} of 8 pulses recorded`);
    await expect(active).toHaveCount(0);
  }

  const result = page.locator(".calib-done-steady");
  await expect(result).toBeVisible();
  await expect(result).toBeFocused();
  await expect(result).toHaveAccessibleName("Calibration result");
  await expect(result.getByText("Late input detected", { exact: true })).toBeVisible();
  await expect(result.getByText(/Applying this offset compensates \d+ ms of late input\./)).toBeVisible();
  await expect(result.getByText("Consistent run", { exact: false })).toBeVisible();
  const suggested = await result.locator(".calib-offset").textContent();
  expect(suggested).toMatch(/^[+]?(?:0|[1-9]\d*) ms$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("calibration-result.png"), fullPage: true, animations: "disabled" });

  await result.getByRole("button", { name: "Save & return to Settings", exact: true }).click();
  await expect(page).toHaveURL(/\/settings$/);
  const stored = await page.evaluate(() => Number(localStorage.getItem("bs_offset_ms")));
  expect(Number.isFinite(stored)).toBe(true);
  expect(Math.abs(stored)).toBeLessThanOrEqual(200);
});

test("calibration measures fresh standard controller edges without leaking a held button", async ({ page }, info) => {
  // Bottom face is already held before the route mounts. Calibration must not
  // turn that carried state into a timing sample after the test starts.
  await installCalibrationGamepad(page, [0]);
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  await page.goto("/calibrate?return=%2Fsettings");

  const controller = page.getByRole("note", {
    name: "Controller ready for timing calibration. Click or tap Start once for browser audio, then use the D-pad or four face buttons.",
  });
  await expect(controller).toBeVisible();
  const start = page.getByRole("button", { name: "Start 8-pulse test", exact: true });
  if (info.project.name === "mobile") {
    const [startBox, navBox] = await Promise.all([
      start.boundingBox(),
      page.locator(".mobile-tabbar").boundingBox(),
    ]);
    expect(startBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(startBox!.y + startBox!.height, "controller calibration Start clears fixed navigation")
      .toBeLessThanOrEqual(navBox!.y - 8);
  }
  await page.screenshot({
    path: info.outputPath("calibration-gamepad-ready.png"),
    fullPage: true,
    animations: "disabled",
  });
  await start.click();

  const active = page.locator(".calib-lane.flash");
  await expect(active).toHaveCount(1, { timeout: 1_500 });
  await expect(page.locator(".calib-status-row")).toContainText("0 taps captured");
  if (info.project.name === "mobile") {
    await expect(page.locator(".mobile-tabbar")).toBeHidden();
    const laneBoxes = await page.locator(".calib-lane").evaluateAll((lanes) => lanes.map((lane) => {
      const rect = lane.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    }));
    for (const box of laneBoxes) {
      expect(box.top, "short-screen calibration lane begins inside the viewport").toBeGreaterThanOrEqual(8);
      expect(box.bottom, "short-screen calibration lane clears the viewport bottom").toBeLessThanOrEqual(560);
    }
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
  }
  await page.screenshot({
    path: info.outputPath("calibration-gamepad-live.png"),
    animations: "disabled",
  });
  await setCalibrationGamepadButton(page, 0, false);
  await expect(active).toHaveCount(0);

  // Mix D-pad and face-diamond buttons to prove both standard lane surfaces
  // use the actual controller timing path.
  const buttons = [14, 13, 12, 15, 2, 3, 0];
  for (let pulse = 0; pulse < buttons.length; pulse++) {
    await expect(active).toHaveCount(1, { timeout: 1_500 });
    if (pulse === buttons.length - 1) {
      // Keep the final sample held through the result transition. The result
      // action layer must wait for neutral instead of immediately saving.
      await setCalibrationGamepadButton(page, buttons[pulse]!, true);
    } else {
      await tapCalibrationGamepadButton(page, buttons[pulse]!);
    }
    await expect(page.locator(".calib-progress")).toContainText(`${pulse + 1} of 8 pulses recorded`);
    await expect(active).toHaveCount(0);
  }

  await expect(page.locator(".calib-done-steady")).toBeVisible();
  const resultController = page.getByRole("note", {
    name: "Controller result actions. Face down saves and returns to Settings. Face right tries calibration again.",
  });
  await expect(resultController).toBeVisible();
  await page.waitForTimeout(120);
  await expect(page).toHaveURL(/\/calibrate\?return=%2Fsettings$/);
  if (info.project.name === "mobile") {
    await expect(page.locator(".mobile-tabbar")).toBeHidden();
    const primary = page.getByRole("button", { name: "Save & return to Settings", exact: true });
    const [hintBox, primaryBox] = await Promise.all([
      resultController.boundingBox(),
      primary.boundingBox(),
    ]);
    expect(hintBox).not.toBeNull();
    expect(primaryBox).not.toBeNull();
    expect(hintBox!.y + hintBox!.height, "controller result hint clears the short viewport")
      .toBeLessThanOrEqual(560);
    expect(primaryBox!.y + primaryBox!.height, "calibration save action clears the short viewport")
      .toBeLessThanOrEqual(560);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({
    path: info.outputPath("calibration-gamepad-result.png"),
    fullPage: true,
    animations: "disabled",
  });
  await setCalibrationGamepadButton(page, 0, false);
  await page.waitForTimeout(40);
  await tapCalibrationGamepadButton(page, 0);
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.locator("body")).not.toHaveClass(/calibration-(?:running|complete)/);
  if (info.project.name === "mobile") {
    await expect(page.locator(".mobile-tabbar")).toBeVisible();
  }
});

test("right face keeps the current offset after an insufficient controller pass", async ({ page }, info) => {
  await installCalibrationGamepad(page);
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  await page.goto("/calibrate?return=%2Fsettings");
  await page.getByRole("button", { name: "Start 8-pulse test", exact: true }).click();

  const result = page.locator(".calib-done-not-enough");
  await expect(result).toBeVisible({ timeout: 7_000 });
  await expect(result).toBeFocused();
  await expect(result).toHaveAccessibleName("Calibration result");
  await expect(page.getByRole("note", {
    name: "Controller result actions. Face down tries calibration again. Face right keeps the current offset.",
  })).toBeVisible();
  await tapCalibrationGamepadButton(page, 1);

  await expect(page).toHaveURL(/\/settings$/);
  expect(await page.evaluate(() => localStorage.getItem("bs_offset_ms"))).toBe("37");
});

test("adjust timing preserves the selected run and keeping the offset never clears it", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=hard&mode=arcade");
  await page.getByRole("link", { name: "Adjust timing", exact: true }).click();
  await expect(page).toHaveURL(/return=%2Fplay%2Fbs-s1-01%3Ftier%3Dhard%26mode%3Darcade/);
  await page.getByRole("button", { name: "Keep current offset · +37 ms", exact: true }).click();
  await expect(page).toHaveURL(/\/play\/bs-s1-01\?tier=hard&mode=arcade$/);
  expect(await page.evaluate(() => localStorage.getItem("bs_offset_ms"))).toBe("37");
  await expect(page.getByRole("button", { name: "Start playing", exact: true })).toBeVisible();
});
