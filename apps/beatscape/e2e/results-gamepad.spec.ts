import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __resultsGamepadButtons?: Set<number>;
    __resultsGamepadAxes?: number[];
  }
}

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

const baseRun = {
  v: 1,
  track_id: "bs-s1-01",
  title: "Neon Pulse",
  artist: "Pulse Atlas",
  tier: "easy",
  mode: "arcade",
  score: 82_400,
  accuracy: 82.4,
  maxCombo: 44,
  grade: "B",
  fc: false,
  ap: false,
  failed: false,
  counts: { perfect: 76, great: 20, good: 15, miss: 3 },
  totalNotes: 114,
  durationMs: 75_000,
  endedAt: "2026-09-14T02:00:00.000Z",
};

test.beforeEach(async ({ page }, info) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    // Simulate the final gameplay hit still being held when Results mounts.
    window.__resultsGamepadButtons = new Set([0]);
    window.__resultsGamepadAxes = [0, 0, 0, 0];
    const gamepad = {
      id: "BeatScape Results QA Controller",
      index: 0,
      connected: true,
      mapping: "standard",
      get axes() { return window.__resultsGamepadAxes!; },
      buttons: Array.from({ length: 17 }, (_, button) => ({
        get pressed() { return window.__resultsGamepadButtons!.has(button); },
        get touched() { return window.__resultsGamepadButtons!.has(button); },
        get value() { return window.__resultsGamepadButtons!.has(button) ? 1 : 0; },
      })),
      get timestamp() { return performance.now(); },
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [gamepad],
    });
  });
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

async function seedResult(page: Page, run: Record<string, unknown>) {
  await page.addInitScript((seededRun) => {
    sessionStorage.setItem("bs_last_run", JSON.stringify(seededRun));
  }, run);
}

async function releaseInitialHeldButton(page: Page) {
  await page.evaluate(() => { window.__resultsGamepadButtons!.delete(0); });
  await page.waitForTimeout(50);
}

async function tapGamepadButton(page: Page, button: number) {
  await page.evaluate((input) => { window.__resultsGamepadButtons!.add(input); }, button);
  await page.waitForTimeout(34);
  await page.evaluate((input) => { window.__resultsGamepadButtons!.delete(input); }, button);
  await page.waitForTimeout(34);
}

async function flickLeftStick(page: Page, x: number, y: number) {
  await page.evaluate(([nextX, nextY]) => {
    window.__resultsGamepadAxes = [nextX, nextY, 0, 0];
  }, [x, y]);
  await page.waitForTimeout(34);
  await page.evaluate(() => { window.__resultsGamepadAxes = [0, 0, 0, 0]; });
  await page.waitForTimeout(34);
}

async function releaseThenTapPrimary(page: Page) {
  await releaseInitialHeldButton(page);
  await tapGamepadButton(page, 0);
}

test("a held final hit cannot skip the personalized miss review", async ({ page }, info) => {
  await seedResult(page, {
    ...baseRun,
    missEvents: [
      { tMs: 8_000, lane: 0 },
      { tMs: 9_000, lane: 1 },
      { tMs: 30_000, lane: 3 },
    ],
    timing: { early: 20, late: 60, meanMs: 14 },
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/results");

  const shortcut = page.getByRole("note", {
    name: "Controller results controls. Use the D-pad or left stick to move, bottom face to select, and right face to return to Track. Default action is Review missed sections.",
  });
  await expect(shortcut).toBeVisible();
  await expect(shortcut).toContainText("D-pad / stick · Move");
  await expect(shortcut).toContainText("Face down · Select");
  await expect(shortcut).toContainText("Face right · Track");
  await expect(shortcut).toContainText("Default · Review missed sections");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const shortcutBox = await shortcut.boundingBox();
  expect(shortcutBox).not.toBeNull();
  expect(shortcutBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({
    path: info.outputPath("results-gamepad-shortcut.png"),
    fullPage: true,
    animations: "disabled",
  });

  const review = page.locator("#miss-review");
  await page.waitForTimeout(150);
  await expect(review).not.toHaveAttribute("open", "");

  await releaseInitialHeldButton(page);
  await flickLeftStick(page, 0, 0.85);
  await expect(page.getByRole("button", { name: "Review missed sections", exact: true })).toBeFocused();
  await expect(review).not.toHaveAttribute("open", "");
  await tapGamepadButton(page, 13);
  await expect(review.locator("summary")).toBeFocused();
  await expect(review).not.toHaveAttribute("open", "");
  await tapGamepadButton(page, 12);
  await expect(page.getByRole("button", { name: "Review missed sections", exact: true })).toBeFocused();
  await tapGamepadButton(page, 0);
  await expect(review).toHaveAttribute("open", "");
  await expect(review.locator("summary")).toBeFocused();
  await page.screenshot({
    path: info.outputPath("results-gamepad-review.png"),
    animations: "disabled",
  });
});

test("the result shortcut retries the exact shared challenge", async ({ page }) => {
  await seedResult(page, {
    ...baseRun,
    tier: "standard",
    score: 90_000,
    accuracy: 86.7,
    maxCombo: 58,
    grade: "A",
    challenge: { score: 82_400, accuracy: 82.4, grade: "B" },
  });
  await page.goto("/results");

  await expect(page.getByRole("note", {
    name: "Controller results controls. Use the D-pad or left stick to move, bottom face to select, and right face to return to Track. Default action is Retry challenge.",
  })).toContainText("Default · Retry challenge");
  await releaseThenTapPrimary(page);

  await expect(page).toHaveURL(/\/play\/bs-s1-01\?/);
  const landed = new URL(page.url());
  expect(landed.searchParams.toString()).toBe(
    "tier=standard&mode=arcade&challenge=1&target=82400&acc=82.4&grade=B",
  );
});

test("the result shortcut continues the First Shift circuit", async ({ page }) => {
  const endedAt = "2026-09-14T02:30:00.000Z";
  const run = {
    ...baseRun,
    track_id: "bs-s1-05",
    title: "Voltage Drop",
    artist: "Gridline",
    mode: "casual",
    score: 86_400,
    accuracy: 86.4,
    maxCombo: 41,
    counts: { perfect: 82, great: 20, good: 10, miss: 4 },
    totalNotes: 116,
    durationMs: 60_000,
    endedAt,
    shiftStep: "studio",
  };
  await page.addInitScript(({ seededRun, runId }) => {
    localStorage.setItem("bs_first_shift_v1", JSON.stringify({
      v: 1,
      completed: [{ id: "studio", runId }],
    }));
    sessionStorage.setItem("bs_last_run", JSON.stringify(seededRun));
  }, { seededRun: run, runId: `bs-s1-05:${endedAt}` });
  await page.goto("/results");

  await expect(page.getByRole("note", {
    name: "Controller results controls. Use the D-pad or left stick to move, bottom face to select, and right face to return to Track. Default action is Play Chrome Riff · 2/3.",
  })).toContainText("Default · Play Chrome Riff · 2/3");
  await releaseThenTapPrimary(page);
  await expect(page).toHaveURL(
    /\/play\/bs-s1-06\?tier=easy&mode=casual&shift=yard$/,
  );
});

test("D-pad reaches a secondary recovery action and bottom face selects it", async ({ page }) => {
  await page.goto("/results");

  await expect(page.getByRole("note", {
    name: "Controller results controls. Use the D-pad or left stick to move, bottom face to select, and right face to return to Home. Default action is Choose a track.",
  })).toContainText("Default · Choose a track");
  await releaseInitialHeldButton(page);
  await tapGamepadButton(page, 13);
  await expect(page.getByRole("link", { name: "Choose a track" })).toBeFocused();
  await tapGamepadButton(page, 13);
  await expect(page.getByRole("link", { name: "Back to Home" })).toBeFocused();
  await tapGamepadButton(page, 0);
  await expect(page).toHaveURL(/\/$/);
});

test("right face returns to the exact practice target while preserving Library discovery state", async ({ page }) => {
  await seedResult(page, {
    ...baseRun,
    mode: "practice",
    seekedFrom: 6,
    seekedUntil: 24,
  });
  const returnTo = "/library?genre=rock&sort=tempo-desc";
  await page.goto(`/results?returnTo=${encodeURIComponent(returnTo)}`);

  await releaseInitialHeldButton(page);
  await tapGamepadButton(page, 1);
  await expect(page).toHaveURL(/\/track\/bs-s1-01\?/);
  const landed = new URL(page.url());
  expect(landed.pathname).toBe("/track/bs-s1-01");
  expect(landed.searchParams.get("tier")).toBe("easy");
  expect(landed.searchParams.get("mode")).toBe("practice");
  expect(landed.searchParams.get("seek")).toBe("6");
  expect(landed.searchParams.get("until")).toBe("24");
  expect(landed.searchParams.get("returnTo")).toBe(returnTo);
});
