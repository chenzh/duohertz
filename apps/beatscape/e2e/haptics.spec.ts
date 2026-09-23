import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    const state = window as typeof window & { __vibrateCalls?: Array<number | number[]> };
    state.__vibrateCalls = [];
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: (pattern: number | number[]) => {
        state.__vibrateCalls?.push(pattern);
        return true;
      },
    });
  });
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({ json: {
    track_id: "bs-s1-01",
    tier: "easy",
    format: 1,
    bpm: 120,
    audio_offset_ms: 0,
    ar: 4,
    total_notes: 2,
    notes: [
      { id: "miss-now", type: "tap", lane: 0, t: 0.1 },
      { id: "keep-running", type: "tap", lane: 3, t: 8 },
    ],
  } }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("haptics remain independent from hitsounds on supported touchscreens", async ({ page }, info) => {
  await page.goto("/settings");
  const haptics = page.getByRole("checkbox", { name: "Haptics (touch & controller)", exact: true });
  await expect(haptics).toBeVisible();
  await expect(haptics).toBeChecked();
  if (info.project.name !== "mobile") {
    return;
  }

  const hitsound = page.getByRole("checkbox", { name: "Hitsound", exact: true });
  await haptics.uncheck();
  await expect(hitsound).toBeChecked();
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("bs_settings") ?? "null")?.haptics))
    .toBe(false);
  await page.screenshot({ path: info.outputPath("settings-haptics.png"), fullPage: true, animations: "disabled" });

  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.locator(".overlay-tap .unlock-btn").click();
  await page.waitForTimeout(3_700);
  expect(await page.evaluate(() => (
    window as typeof window & { __vibrateCalls?: Array<number | number[]> }
  ).__vibrateCalls)).toEqual([]);

  await page.evaluate(() => {
    const settings = JSON.parse(localStorage.getItem("bs_settings") ?? "{}");
    localStorage.setItem("bs_settings", JSON.stringify({ ...settings, haptics: true, hitsound: false }));
  });
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.locator(".overlay-tap .unlock-btn").click();
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __vibrateCalls?: Array<number | number[]> }
  ).__vibrateCalls?.length ?? 0), { timeout: 5_000 }).toBeGreaterThan(0);
});

test("assigned standard controllers receive distinct miss rumble and honor the setting", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "Controller rumble contract is covered in desktop Chromium.");
  await page.addInitScript(() => {
    const state = window as typeof window & {
      __gamepadRumbleCalls?: GamepadEffectParameters[];
    };
    state.__gamepadRumbleCalls = [];
    const gamepad = {
      id: "BeatScape Haptic QA Controller",
      index: 0,
      connected: true,
      mapping: "standard",
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
      timestamp: 0,
      vibrationActuator: {
        effects: ["dual-rumble"],
        playEffect: (_type: string, effect: GamepadEffectParameters) => {
          state.__gamepadRumbleCalls?.push(effect);
          return Promise.resolve("complete");
        },
      },
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [gamepad],
    });
  });

  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.locator(".overlay-tap .unlock-btn").click();
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __gamepadRumbleCalls?: GamepadEffectParameters[] }
  ).__gamepadRumbleCalls ?? []), { timeout: 5_000 }).toContainEqual(expect.objectContaining({
    duration: 90,
    strongMagnitude: 0.82,
    weakMagnitude: 0.2,
  }));

  await page.goto("/settings");
  await page.getByRole("checkbox", { name: "Haptics (touch & controller)", exact: true }).uncheck();
  await page.evaluate(() => {
    (window as typeof window & { __gamepadRumbleCalls?: GamepadEffectParameters[] }).__gamepadRumbleCalls = [];
  });
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.locator(".overlay-tap .unlock-btn").click();
  await page.waitForTimeout(3_700);
  expect(await page.evaluate(() => (
    window as typeof window & { __gamepadRumbleCalls?: GamepadEffectParameters[] }
  ).__gamepadRumbleCalls)).toEqual([]);
});
