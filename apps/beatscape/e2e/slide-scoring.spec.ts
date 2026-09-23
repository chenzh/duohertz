import { expect, test, type Locator, type Page } from "@playwright/test";

declare global {
  interface Window {
    __slideSong?: {
      context: BaseAudioContext;
      when: number;
      offset: number;
    };
    __slideTrailStrokes?: Array<{
      at: number;
      dash: number[];
      lineWidth: number;
    }>;
    __slideVibrations?: Array<number | number[]>;
    __slideFeedbackTexts?: string[];
  }
}

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    window.__slideVibrations = [];
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: (pattern: number | number[]) => {
        window.__slideVibrations!.push(pattern);
        return true;
      },
    });
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(Element.prototype, "webkitRequestFullscreen", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(Element.prototype, "setPointerCapture", {
      configurable: true,
      value: () => {},
    });

    const fillText = CanvasRenderingContext2D.prototype.fillText;
    window.__slideFeedbackTexts = [];
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fillText", {
      configurable: true,
      writable: true,
      value: function (this: CanvasRenderingContext2D, value: string, ...args: Parameters<CanvasRenderingContext2D["fillText"]> extends [string, ...infer Rest] ? Rest : never) {
        const text = String(value);
        if (text === "REACH TARGET" || text === "HOLD TO END") {
          window.__slideFeedbackTexts!.push(text);
        }
        return Reflect.apply(fillText, this, [value, ...args]);
      },
    });

    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) {
        window.__slideSong = {
          context: this.context,
          when: args[0] ?? this.context.currentTime,
          offset: args[1] ?? 0,
        };
      }
      return start.apply(this, args);
    };

    const paths = new WeakMap<CanvasRenderingContext2D, {
      from?: { x: number; y: number };
      to?: { x: number; y: number };
    }>();
    const beginPath = CanvasRenderingContext2D.prototype.beginPath;
    const moveTo = CanvasRenderingContext2D.prototype.moveTo;
    const lineTo = CanvasRenderingContext2D.prototype.lineTo;
    const stroke = CanvasRenderingContext2D.prototype.stroke;
    window.__slideTrailStrokes = [];
    CanvasRenderingContext2D.prototype.beginPath = function (...args) {
      paths.set(this, {});
      return beginPath.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.moveTo = function (x, y) {
      const path = paths.get(this) ?? {};
      path.from = { x, y };
      paths.set(this, path);
      return moveTo.call(this, x, y);
    };
    CanvasRenderingContext2D.prototype.lineTo = function (x, y) {
      const path = paths.get(this) ?? {};
      path.to = { x, y };
      paths.set(this, path);
      return lineTo.call(this, x, y);
    };
    CanvasRenderingContext2D.prototype.stroke = function (...args) {
      const path = paths.get(this);
      const width = this.canvas.clientWidth;
      if (
        this.canvas.classList.contains("play-canvas")
        && path?.from
        && path.to
        && Math.abs(path.from.x - width * 0.125) < 2
        && Math.abs(path.to.x - width * 0.375) < 2
      ) {
        window.__slideTrailStrokes!.push({
          at: performance.now(),
          dash: this.getLineDash(),
          lineWidth: this.lineWidth,
        });
        if (window.__slideTrailStrokes!.length > 1_000) {
          window.__slideTrailStrokes!.splice(0, 500);
        }
      }
      return stroke.apply(this, args);
    };
  });
  await page.route("**/catalog/bs-s2-01/standard.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s2-01",
      tier: "standard",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 1,
      sections: [{ id: "slide", t0: 0, t1: 3 }],
      notes: [{ id: "slide-1", type: "slide", lane: 0, to: 1, t: 1, end: 1.5 }],
    },
  }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function waitForSongTime(page: Page, seconds: number) {
  await page.waitForFunction((target) => {
    const song = window.__slideSong;
    return !!song && song.context.currentTime - song.when + song.offset >= target;
  }, seconds);
}

async function dispatchSwipePoint(
  canvas: Locator,
  type: "pointerdown" | "pointermove" | "pointerup",
  lanePosition: number,
) {
  const box = (await canvas.boundingBox())!;
  await canvas.dispatchEvent(type, {
    bubbles: true,
    clientX: box.x + box.width * lanePosition,
    clientY: box.y + box.height * 0.82,
    pointerId: 31,
    pointerType: "touch",
    isPrimary: true,
    buttons: type === "pointerup" ? 0 : 1,
  });
}

async function keepSlideFeedbackOnField(page: Page) {
  await page.route("**/catalog/bs-s2-01/standard.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s2-01",
      tier: "standard",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 2,
      sections: [{ id: "slide-feedback", t0: 0, t1: 6 }],
      notes: [
        { id: "slide-1", type: "slide", lane: 0, to: 1, t: 1, end: 1.5 },
        { id: "finish", type: "tap", lane: 3, t: 4 },
      ],
    },
  }));
}

test("a Slide that never reaches its target says what to correct", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await keepSlideFeedbackOnField(page);
  await page.goto("/play/bs-s2-01?tier=standard&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchSwipePoint(canvas, "pointerdown", 0.125);

  await expect.poll(() => page.evaluate(() => window.__slideFeedbackTexts ?? []))
    .toContain("REACH TARGET");
  expect(await page.evaluate(() => window.__slideFeedbackTexts ?? [])).not.toContain("HOLD TO END");
});

test("a Slide released from its target early says to hold through the endpoint", async ({ page }) => {
  await keepSlideFeedbackOnField(page);
  await page.goto("/play/bs-s2-01?tier=standard&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchSwipePoint(canvas, "pointerdown", 0.125);
  await waitForSongTime(page, 1.12);
  await dispatchSwipePoint(canvas, "pointermove", 0.375);
  await waitForSongTime(page, 1.3);
  await dispatchSwipePoint(canvas, "pointerup", 0.375);

  await expect.poll(() => page.evaluate(() => window.__slideFeedbackTexts ?? []))
    .toContain("HOLD TO END");
  expect(await page.evaluate(() => window.__slideFeedbackTexts ?? [])).not.toContain("REACH TARGET");
});

test("a real swipe produces one Slide judgment, score and combo", async ({ page }) => {
  await page.goto("/play/bs-s2-01?tier=standard&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchSwipePoint(canvas, "pointerdown", 0.125);
  await waitForSongTime(page, 1.5);
  await dispatchSwipePoint(canvas, "pointermove", 0.375);

  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({
    score: 300,
    accuracy: 100,
    maxCombo: 1,
    counts: { perfect: 1, great: 0, good: 0, miss: 0 },
    totalNotes: 1,
  });
  expect(Object.values(run.counts).reduce((sum: number, count) => sum + Number(count), 0)).toBe(1);
  await expect(page.locator(".results-stats")).toContainText("100%");
});

test("an early swipe held on the target completes at the Slide endpoint", async ({ page }) => {
  await page.goto("/play/bs-s2-01?tier=standard&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchSwipePoint(canvas, "pointerdown", 0.125);
  await waitForSongTime(page, 1.12);
  await dispatchSwipePoint(canvas, "pointermove", 0.375);

  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({
    score: 300,
    accuracy: 100,
    maxCombo: 1,
    counts: { perfect: 1, great: 0, good: 0, miss: 0 },
    totalNotes: 1,
  });
});

test("an early-held target visibly locks the Slide trail with touch confirmation", async ({ page }, info) => {
  await page.goto("/play/bs-s2-01?tier=standard&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchSwipePoint(canvas, "pointerdown", 0.125);
  await waitForSongTime(page, 1.12);
  await page.evaluate(() => { window.__slideTrailStrokes = []; });
  await dispatchSwipePoint(canvas, "pointermove", 0.375);
  await page.waitForTimeout(50);

  const lockedStrokes = await page.evaluate(() => window.__slideTrailStrokes ?? []);
  await canvas.screenshot({
    path: info.outputPath("slide-target-locked.png"),
    animations: "disabled",
  });
  expect(lockedStrokes.some((stroke) => stroke.dash.length === 0 && stroke.lineWidth >= 4)).toBe(true);
  const vibrations = await page.evaluate(() => window.__slideVibrations ?? []);
  expect(vibrations).toEqual(info.project.name === "mobile" ? [6] : []);
});

test("Slide target touch confirmation obeys the Haptics setting", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_settings", JSON.stringify({ haptics: false }));
  });
  await page.goto("/play/bs-s2-01?tier=standard&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchSwipePoint(canvas, "pointerdown", 0.125);
  await waitForSongTime(page, 1.12);
  await dispatchSwipePoint(canvas, "pointermove", 0.375);
  await page.waitForTimeout(50);

  expect(await page.evaluate(() => window.__slideVibrations ?? [])).toEqual([]);
});

test("an interrupted early swipe can re-grab its target during the resume countdown", async ({ page }) => {
  await page.goto("/play/bs-s2-01?tier=standard&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchSwipePoint(canvas, "pointerdown", 0.125);
  await waitForSongTime(page, 1.3);
  await dispatchSwipePoint(canvas, "pointermove", 0.375);

  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  await expect(pauseDialog).toBeVisible();
  await pauseDialog.getByRole("button", { name: "Resume", exact: true }).click();
  await page.evaluate(() => { window.__slideVibrations = []; });
  await dispatchSwipePoint(canvas, "pointerdown", 0.375);
  expect(await page.evaluate(() => window.__slideVibrations ?? []))
    .toEqual(test.info().project.name === "mobile" ? [6] : []);

  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({
    score: 300,
    accuracy: 100,
    maxCombo: 1,
    counts: { perfect: 1, great: 0, good: 0, miss: 0 },
    totalNotes: 1,
  });
});

test("Duo scores the same Slide once for each independent player", async ({ page }) => {
  await page.goto("/duo/bs-s2-01?tier=standard&mode=casual");
  await page.locator(".duo-start .unlock-btn").click();

  await waitForSongTime(page, 0.99);
  await page.keyboard.down("ArrowLeft");
  await page.keyboard.down("a");
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.up("a");

  await waitForSongTime(page, 1.5);
  await page.keyboard.down("ArrowDown");
  await page.keyboard.down("s");

  const result = page.getByRole("dialog", { name: "Duo results" });
  await expect(result).toBeVisible();
  const players = result.locator(".duo-scorecol");
  await expect(players).toHaveCount(2);
  await expect(players.locator(".duo-scorecol-stats > span"))
    .toHaveText(["ACC 100.00%", "MAX x1", "ACC 100.00%", "MAX x1"]);
  await expect(players.locator(".duo-scorecol-judgments > strong"))
    .toHaveText(["1/0/0/0", "1/0/0/0"]);
  await expect(players.locator(".duo-scorecol-score")).toHaveText(["SCORE300", "SCORE300"]);
});
