import { expect, test, type Locator, type Page } from "@playwright/test";

declare global {
  interface Window {
    __inputSong?: {
      context: BaseAudioContext;
      when: number;
      offset: number;
    };
    __restoreInputAudioResume?: () => void;
  }
}

// The chart is deterministic and page-routed; PWA behavior is covered by its
// own real-worker suite.
test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(Element.prototype, "webkitRequestFullscreen", {
      configurable: true,
      value: undefined,
    });
    // Synthetic pointer events do not create native capture state. The game
    // still exercises its real React pointer path; only browser capture is a
    // no-op for this deterministic stream.
    Object.defineProperty(Element.prototype, "setPointerCapture", {
      configurable: true,
      value: () => {},
    });

    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) {
        window.__inputSong = {
          context: this.context,
          when: args[0] ?? this.context.currentTime,
          offset: args[1] ?? 0,
        };
      }
      return start.apply(this, args);
    };
  });
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 2,
      sections: [{ id: "hold", t0: 0, t1: 3 }],
      notes: [{ id: "hold-1", t: 1, end: 2, lane: 0, type: "hold" }],
    },
  }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function waitForSongTime(page: Page, seconds: number) {
  await page.waitForFunction((target) => {
    const song = window.__inputSong;
    return !!song && song.context.currentTime - song.when + song.offset >= target;
  }, seconds);
}

async function dispatchTouchPointer(
  canvas: Locator,
  type: "pointerdown" | "pointermove" | "pointerup",
  pointerId: number,
  lanePosition = 0.125,
) {
  const box = (await canvas.boundingBox())!;
  await canvas.dispatchEvent(type, {
    bubbles: true,
    clientX: box.x + box.width * lanePosition,
    clientY: box.y + box.height * 0.82,
    pointerId,
    pointerType: "touch",
    isPrimary: pointerId === 11,
    buttons: type === "pointerdown" ? 1 : 0,
  });
}

test("a physical key beats a conflicting legacy glyph on AZERTY", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_keys", JSON.stringify(["q", "KeyA", "KeyS", "KeyD"]));
  });
  await page.unroute("**/catalog/bs-s1-01/easy.json*");
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 1,
      sections: [{ id: "physical-key", t0: 0, t1: 3 }],
      notes: [{ id: "lane-1", t: 1, lane: 1, type: "tap" }],
    },
  }));

  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await page.evaluate(() => new Promise<void>((resolve) => {
    const pressAtNote = () => {
      const song = window.__inputSong;
      if (!song || song.context.currentTime - song.when + song.offset < 1) {
        requestAnimationFrame(pressAtNote);
        return;
      }
      window.dispatchEvent(new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        code: "KeyA",
        key: "q",
      }));
      resolve();
    };
    pressAtNote();
  }));

  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({
    score: 300,
    accuracy: 100,
    counts: { perfect: 1, great: 0, good: 0, miss: 0 },
    totalNotes: 1,
  });
});

test("a Hold remains owned until the last same-lane touch lifts", async ({ page }) => {
  const libraryHref = "/library?q=neon+pulse&genre=Electronic";
  const returnParam = encodeURIComponent(libraryHref);
  await page.goto(`/play/bs-s1-01?tier=easy&mode=casual&returnTo=${returnParam}`);
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();

  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchTouchPointer(canvas, "pointerdown", 11);
  await waitForSongTime(page, 1.05);
  await dispatchTouchPointer(canvas, "pointerdown", 22);

  // One owner leaves early, but the second finger still physically owns the
  // same lane. A fair input state must keep the Hold alive.
  await waitForSongTime(page, 1.25);
  await dispatchTouchPointer(canvas, "pointerup", 11);
  await waitForSongTime(page, 1.7);
  await expect(page).toHaveURL(/\/play\/bs-s1-01/);

  await waitForSongTime(page, 2);
  await dispatchTouchPointer(canvas, "pointerup", 22);
  await expect(page).toHaveURL(new RegExp(`/results\\?returnTo=${returnParam}$`));
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run.totalNotes).toBe(2);
  expect(run.counts.miss).toBe(0);
  await expect(page.getByRole("region", { name: "Night streak update" }))
    .toContainText("Night 1 secured");
  await expect(page.getByRole("link", { name: "Replay", exact: true })).toHaveAttribute(
    "href",
    `/play/bs-s1-01?tier=easy&mode=casual&returnTo=${returnParam}`,
  );
  await expect(page.getByRole("link", { name: "Change setup", exact: true })).toHaveAttribute(
    "href",
    `/track/bs-s1-01?tier=easy&mode=casual&returnTo=${returnParam}`,
  );
  await expect(page.getByRole("link", { name: "Browse Library", exact: true }))
    .toHaveAttribute("href", libraryHref);
});

test("a captured touch keeps its Hold while drifting through the outer guard", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchTouchPointer(canvas, "pointerdown", 11);
  await waitForSongTime(page, 1.25);
  await dispatchTouchPointer(canvas, "pointermove", 11, 0.01);

  // The 5% guard should reject accidental touches that begin at the bezel, but
  // a thumb already holding the outer lane must survive normal edge drift.
  await waitForSongTime(page, 1.7);
  await expect(page).toHaveURL(/\/play\/bs-s1-01/);

  await waitForSongTime(page, 2);
  await dispatchTouchPointer(canvas, "pointerup", 11, 0.01);
  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run.totalNotes).toBe(2);
  expect(run.counts.miss).toBe(0);
});

test("a small boundary wobble does not release a touch-owned Hold", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  const box = (await canvas.boundingBox())!;
  const justInsideNextLane = 0.25 + 3 / box.width;
  await waitForSongTime(page, 0.99);
  await dispatchTouchPointer(canvas, "pointerdown", 11);
  await waitForSongTime(page, 1.2);
  await dispatchTouchPointer(canvas, "pointermove", 11, justInsideNextLane);
  await waitForSongTime(page, 1.3);
  await dispatchTouchPointer(canvas, "pointermove", 11);
  await waitForSongTime(page, 2.01);
  await dispatchTouchPointer(canvas, "pointerup", 11);

  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run.totalNotes).toBe(2);
  expect(run.counts.miss).toBe(0);
});

test("pausing clears a lost input source before the safe resume", async ({ page }) => {
  await page.unroute("**/catalog/bs-s1-01/easy.json*");
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 1,
      sections: [{ id: "input", t0: 0, t1: 3 }],
      notes: [{ id: "tap-1", t: 2, lane: 0, type: "tap" }],
    },
  }));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.5);
  await dispatchTouchPointer(canvas, "pointerdown", 11);
  await waitForSongTime(page, 0.6);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  // Deliberately omit pointerup: OS interruptions can lose the final event.
  await page.getByRole("button", { name: "Resume", exact: true }).click();

  await waitForSongTime(page, 1.99);
  await dispatchTouchPointer(canvas, "pointerdown", 22);
  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run.totalNotes).toBe(1);
  expect(run.counts.miss).toBe(0);
});

test("window blur freezes play and an interrupted Hold can re-arm before GO", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchTouchPointer(canvas, "pointerdown", 11);
  await waitForSongTime(page, 1.2);

  // Desktop app switching and OS overlays can blur a visible page and swallow
  // the final pointerup. The game must freeze and discard that physical owner.
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  await expect(pauseDialog).toBeVisible();
  await pauseDialog.getByRole("button", { name: "Resume", exact: true }).click();

  // Re-grab the landed Hold during the 3-second safe countdown. Fresh notes
  // remain inert here; only this unresolved tail is eligible.
  await dispatchTouchPointer(canvas, "pointerdown", 22);
  await waitForSongTime(page, 2);
  await dispatchTouchPointer(canvas, "pointerup", 22);

  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run.totalNotes).toBe(2);
  expect(run.counts.miss).toBe(0);
});

test("system audio suspension stays paused until a successful gesture retry", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await waitForSongTime(page, 0.45);

  await page.evaluate(async () => {
    const context = window.__inputSong!.context as AudioContext;
    await context.suspend();
    const resume = context.resume.bind(context);
    window.__restoreInputAudioResume = () => { context.resume = resume; };
    context.resume = () => Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
  });

  const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  await expect(pauseDialog).toBeVisible();
  await pauseDialog.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(pauseDialog.getByRole("alert")).toContainText("Audio could not resume");
  await expect(pauseDialog.getByRole("button", { name: "Resume", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => window.__inputSong!.context.state)).toBe("suspended");

  await page.evaluate(() => window.__restoreInputAudioResume?.());
  await pauseDialog.getByRole("button", { name: "Resume", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__inputSong!.context.state)).toBe("running");
  await expect(pauseDialog).toHaveCount(0);

  // The system interruption froze the chart rather than consuming time. The
  // same deterministic Hold is still playable after the safe count-in.
  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchTouchPointer(canvas, "pointerdown", 31);
  await waitForSongTime(page, 2);
  await dispatchTouchPointer(canvas, "pointerup", 31);
  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run.counts.miss).toBe(0);
});

test("restart stays transactional when system audio recovery is denied", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await waitForSongTime(page, 0.45);

  await page.evaluate(async () => {
    const context = window.__inputSong!.context as AudioContext;
    await context.suspend();
    const resume = context.resume.bind(context);
    window.__restoreInputAudioResume = () => { context.resume = resume; };
    context.resume = () => Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
  });

  const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  const restart = pauseDialog.getByRole("button", { name: "Restart track", exact: true });
  await expect(pauseDialog).toBeVisible();
  await restart.click();

  // A denied AudioContext.resume must not discard the current session or
  // release the player into a silent, stopped run. Keep the modal actionable.
  await expect(pauseDialog.getByRole("alert")).toContainText("Audio could not restart");
  await expect(pauseDialog).toBeVisible();
  await expect(restart).toBeEnabled();
  expect(await page.evaluate(() => window.__inputSong!.context.state)).toBe("suspended");

  await page.evaluate(() => window.__restoreInputAudioResume?.());
  await restart.click();
  await expect.poll(() => page.evaluate(() => window.__inputSong!.context.state)).toBe("running");
  await expect(pauseDialog).toHaveCount(0);

  // The successful retry creates a genuinely fresh playable session.
  const canvas = page.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchTouchPointer(canvas, "pointerdown", 41);
  await waitForSongTime(page, 2);
  await dispatchTouchPointer(canvas, "pointerup", 41);
  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run.counts.miss).toBe(0);
});
