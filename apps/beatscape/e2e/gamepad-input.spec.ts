import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __gamepadButtons?: Array<Set<number>>;
    __gamepadConnected?: boolean[];
    __gamepadTimestamps?: Array<number | undefined>;
    __gamepadHitSounds?: number;
    __gamepadSong?: {
      context: BaseAudioContext;
      when: number;
      offset: number;
    };
  }
}

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

    window.__gamepadButtons = [new Set<number>(), new Set<number>()];
    window.__gamepadConnected = [true, true];
    window.__gamepadTimestamps = [undefined, undefined];
    window.__gamepadHitSounds = 0;
    const gamepads = window.__gamepadButtons.map((pressedButtons, index) => ({
      id: `BeatScape QA Controller ${index + 1}`,
      index,
      get connected() { return window.__gamepadConnected![index]!; },
      mapping: "standard",
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, (_, button) => ({
        get pressed() { return pressedButtons.has(button); },
        get touched() { return pressedButtons.has(button); },
        get value() { return pressedButtons.has(button) ? 1 : 0; },
      })),
      get timestamp() { return window.__gamepadTimestamps![index] ?? performance.now(); },
    }));
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => gamepads,
    });

    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) {
        window.__gamepadSong = {
          context: this.context,
          when: args[0] ?? this.context.currentTime,
          offset: args[1] ?? 0,
        };
      } else if (this.buffer) {
        window.__gamepadHitSounds = (window.__gamepadHitSounds ?? 0) + 1;
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
      total_notes: 1,
      sections: [{ id: "gamepad", t0: 0, t1: 2 }],
      notes: [{ id: "gamepad-tap", type: "tap", lane: 0, t: 1 }],
    },
  }));
  await page.route("**/catalog/bs-s1-05/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-05",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 1,
      sections: [{ id: "home-gamepad", t0: 0, t1: 2 }],
      notes: [{ id: "home-gamepad-tap", type: "tap", lane: 1, t: 1 }],
    },
  }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function tapGamepadButtonAtSongTime(
  page: Page,
  gamepadIndex: number,
  button: number,
  seconds: number,
) {
  await page.evaluate(({ controller, input, target }) => new Promise<void>((resolve) => {
    const poll = () => {
      const song = window.__gamepadSong;
      if (!song || song.context.currentTime - song.when + song.offset < target) {
        requestAnimationFrame(poll);
        return;
      }
      window.__gamepadButtons![controller]!.add(input);
      setTimeout(() => {
        window.__gamepadButtons![controller]!.delete(input);
        resolve();
      }, 34);
    };
    poll();
  }), { controller: gamepadIndex, input: button, target: seconds });
}

async function setQueuedGamepadButtonAtSongTime(
  page: Page,
  gamepadIndex: number,
  button: number,
  seconds: number,
  pressed: boolean,
  queueMs = 32,
) {
  await page.evaluate(({ controller, input, target, nextPressed, delayMs }) => new Promise<void>((resolve) => {
    const poll = () => {
      const song = window.__gamepadSong;
      const songTime = song
        ? song.context.currentTime - song.when + song.offset
        : Number.NEGATIVE_INFINITY;
      if (!song || songTime < target) {
        requestAnimationFrame(poll);
        return;
      }

      // Model a hardware update received exactly on the note, followed by a
      // busy main thread that postpones BeatScape's next Gamepad poll. The
      // W3C Gamepad timestamp remains the physical update time while the
      // button snapshot stays pressed until the app observes it.
      window.__gamepadTimestamps![controller] = performance.now() - (songTime - target) * 1_000;
      if (nextPressed) window.__gamepadButtons![controller]!.add(input);
      else window.__gamepadButtons![controller]!.delete(input);
      const blockUntil = performance.now() + delayMs;
      while (performance.now() < blockUntil) {
        // Deliberately queue the app's requestAnimationFrame callback.
      }
      setTimeout(resolve, 34);
    };
    poll();
  }), {
    controller: gamepadIndex,
    input: button,
    target: seconds,
    nextPressed: pressed,
    delayMs: queueMs,
  });
}

async function tapQueuedGamepadButtonAtSongTime(
  page: Page,
  gamepadIndex: number,
  button: number,
  seconds: number,
  queueMs = 32,
) {
  await setQueuedGamepadButtonAtSongTime(page, gamepadIndex, button, seconds, true, queueMs);
  await page.evaluate(({ controller, input }) => new Promise<void>((resolve) => {
    window.__gamepadTimestamps![controller] = performance.now();
    window.__gamepadButtons![controller]!.delete(input);
    setTimeout(resolve, 34);
  }), { controller: gamepadIndex, input: button });
}

async function holdGamepadButtonAtSongTime(
  page: Page,
  gamepadIndex: number,
  button: number,
  seconds: number,
) {
  await page.evaluate(({ controller, input, target }) => new Promise<void>((resolve) => {
    const poll = () => {
      const song = window.__gamepadSong;
      if (!song || song.context.currentTime - song.when + song.offset < target) {
        requestAnimationFrame(poll);
        return;
      }
      window.__gamepadButtons![controller]!.add(input);
      resolve();
    };
    poll();
  }), { controller: gamepadIndex, input: button, target: seconds });
}

async function tapGamepadButton(page: Page, gamepadIndex: number, button: number) {
  await page.evaluate(({ controller, input }) => new Promise<void>((resolve) => {
    window.__gamepadButtons![controller]!.add(input);
    setTimeout(() => {
      window.__gamepadButtons![controller]!.delete(input);
      // Let the app's next rAF observe the release before a second tap; real
      // controller presses naturally have this gap between physical edges.
      setTimeout(resolve, 34);
    }, 34);
  }), { controller: gamepadIndex, input: button });
}

async function holdGamepadButton(page: Page, gamepadIndex: number, button: number) {
  await page.evaluate(({ controller, input }) => new Promise<void>((resolve) => {
    window.__gamepadButtons![controller]!.add(input);
    setTimeout(resolve, 34);
  }), { controller: gamepadIndex, input: button });
}

async function releaseGamepadButton(page: Page, gamepadIndex: number, button: number) {
  await page.evaluate(({ controller, input }) => new Promise<void>((resolve) => {
    window.__gamepadButtons![controller]!.delete(input);
    setTimeout(resolve, 34);
  }), { controller: gamepadIndex, input: button });
}

async function installTrustedAudioGate(page: Page) {
  await page.addInitScript(() => {
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = new Proxy(NativeAudioContext, {
      construct(target, args) {
        const context = Reflect.construct(target, args) as AudioContext;
        Object.defineProperty(context, "state", { configurable: true, value: "suspended" });
        return context;
      },
    });
    AudioContext.prototype.resume = function (this: AudioContext) {
      Object.defineProperty(this, "state", { configurable: true, value: "running" });
      this.dispatchEvent(new Event("statechange"));
      return Promise.resolve();
    };
  });
}

async function setGamepadConnected(page: Page, gamepadIndex: number, connected: boolean) {
  await page.evaluate(({ controller, nextConnected }) => {
    window.__gamepadConnected![controller] = nextConnected;
    window.dispatchEvent(new Event(nextConnected ? "gamepadconnected" : "gamepaddisconnected"));
  }, { controller: gamepadIndex, nextConnected: connected });
}

test("single player exposes controller readiness and scores the assigned standard D-pad", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  // Headless Chromium may begin with a running AudioContext even before a
  // gesture. Hold its exposed state at suspended so this test covers the real
  // direct-deep-link browser policy, then let the DOM Start gesture unlock it.
  await installTrustedAudioGate(page);
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");

  const controllerReady = page.getByRole("note", {
    name: "Controller ready. Use the D-pad or four face buttons.",
  });
  await expect(controllerReady).toBeVisible();
  await expect(controllerReady).toContainText("D-pad or face buttons");
  // Keep this scenario single-controller. With a spare pad connected, the
  // product correctly reassigns the slot and reports a replacement instead of
  // a full disconnect; Duo covers the two-controller path below.
  await setGamepadConnected(page, 1, false);
  const start = page.getByRole("button", { name: "Start playing", exact: true });
  const lockedControllerStart = page.getByRole("note", {
    name: "Controller start unavailable until browser audio is unlocked. Activate Start playing once.",
  });
  await expect(lockedControllerStart).toBeVisible();
  await expect(lockedControllerStart).toContainText(
    info.project.name === "mobile"
      ? "Tap Start once · Browser audio"
      : "Click Start once · Browser audio",
  );
  await tapGamepadButton(page, 0, 0);
  await expect(start).toBeVisible();
  if (info.project.name === "mobile") {
    const box = (await start.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(568);
  }
  await page.screenshot({ path: info.outputPath("single-gamepad-ready.png"), animations: "disabled" });
  await start.click();

  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await tapGamepadButton(page, 0, 9);
  const pause = page.getByRole("dialog", { name: "Scape paused", exact: true });
  await expect(pause).toContainText("Press Menu to resume");
  const pauseControllerHint = pause.getByRole("note", {
    name: "Controller dialog controls. Use the D-pad or left stick to move, bottom face to select, and right face to back.",
  });
  await expect(pauseControllerHint).toContainText("D-pad / stick · Move");
  const resume = pause.getByRole("button", { name: "Resume", exact: true });
  const restart = pause.getByRole("button", { name: "Restart track", exact: true });
  const leave = pause.getByRole("button", { name: "Leave track", exact: true });
  const noteSpeed = pause.getByRole("slider", { name: "Note speed", exact: true });
  const hitsounds = pause.getByRole("checkbox", { name: "Hitsounds", exact: true });
  const haptics = pause.getByRole("checkbox", { name: "Haptics", exact: true });
  const reduceMotion = pause.getByRole("checkbox", { name: "Reduce motion", exact: true });
  const thumbAssist = pause.getByRole("checkbox", { name: "Thumb chord assist", exact: true });
  await expect(resume).toBeFocused();
  if (info.project.name === "mobile") {
    const hintBox = (await pauseControllerHint.boundingBox())!;
    expect(hintBox.y).toBeGreaterThanOrEqual(0);
    expect(hintBox.y + hintBox.height).toBeLessThanOrEqual(568);
  }
  await page.screenshot({ path: info.outputPath("single-gamepad-pause-menu.png"), animations: "disabled" });

  if (info.project.name === "mobile") {
    const quickControls = pause.getByRole("button", { name: /Quick controls/ });
    const music = pause.getByRole("slider", { name: "Music volume", exact: true });
    await tapGamepadButton(page, 0, 12);
    await expect(quickControls).toBeFocused();
    await tapGamepadButton(page, 0, 0);
    await expect(quickControls).toHaveAttribute("aria-expanded", "true");
    await tapGamepadButton(page, 0, 13);
    await expect(music).toBeFocused();
    const musicBefore = Number(await music.inputValue());
    await tapGamepadButton(page, 0, 14);
    await expect(music).toHaveValue(String(musicBefore - 5));
    await tapGamepadButton(page, 0, 13);
    await tapGamepadButton(page, 0, 13);
    await tapGamepadButton(page, 0, 13);
    await expect(noteSpeed).toBeFocused();
    const speedBefore = Number(await noteSpeed.inputValue());
    await tapGamepadButton(page, 0, 15);
    await expect(noteSpeed).toHaveValue(String(speedBefore + 0.05));
    await tapGamepadButton(page, 0, 13);
    await expect(hitsounds).toBeFocused();
  } else {
    const dim = pause.getByRole("slider", { name: "Background dim", exact: true });
    await tapGamepadButton(page, 0, 12);
    await expect(reduceMotion).toBeFocused();
    await tapGamepadButton(page, 0, 12);
    await expect(haptics).toBeFocused();
    await tapGamepadButton(page, 0, 12);
    await expect(hitsounds).toBeFocused();
    await tapGamepadButton(page, 0, 12);
    await expect(noteSpeed).toBeFocused();
    const speedBefore = Number(await noteSpeed.inputValue());
    await tapGamepadButton(page, 0, 14);
    await expect(noteSpeed).toHaveValue(String(speedBefore - 0.05));
    await tapGamepadButton(page, 0, 12);
    await expect(dim).toBeFocused();
    const dimBefore = Number(await dim.inputValue());
    await tapGamepadButton(page, 0, 14);
    await expect(dim).toHaveValue(String(dimBefore - 5));
    await tapGamepadButton(page, 0, 13);
    await expect(noteSpeed).toBeFocused();
    await tapGamepadButton(page, 0, 13);
    await expect(hitsounds).toBeFocused();
  }
  const hitsoundsBefore = await hitsounds.isChecked();
  await tapGamepadButton(page, 0, 0);
  expect(await hitsounds.isChecked()).toBe(!hitsoundsBefore);
  await tapGamepadButton(page, 0, 13);
  await expect(haptics).toBeFocused();
  const hapticsBefore = await haptics.isChecked();
  await tapGamepadButton(page, 0, 0);
  expect(await haptics.isChecked()).toBe(!hapticsBefore);
  await tapGamepadButton(page, 0, 13);
  await expect(reduceMotion).toBeFocused();
  const reduceMotionBefore = await reduceMotion.isChecked();
  await tapGamepadButton(page, 0, 0);
  expect(await reduceMotion.isChecked()).toBe(!reduceMotionBefore);
  await tapGamepadButton(page, 0, 13);
  if (info.project.name === "mobile") {
    await expect(thumbAssist).toBeFocused();
    const thumbAssistBefore = await thumbAssist.isChecked();
    await tapGamepadButton(page, 0, 0);
    expect(await thumbAssist.isChecked()).toBe(!thumbAssistBefore);
    await tapGamepadButton(page, 0, 13);
  }
  await expect(resume).toBeFocused();
  await tapGamepadButton(page, 0, 13);
  await expect(restart).toBeFocused();
  await tapGamepadButton(page, 0, 13);
  await expect(leave).toBeFocused();

  // Keep the select button held through the modal handoff. The new dialog
  // must wait for a neutral controller instead of immediately confirming Leave.
  await holdGamepadButton(page, 0, 0);
  const controllerExit = page.getByRole("dialog", { name: "Leave the Scape?", exact: true });
  await expect(controllerExit).toBeVisible();
  await expect(controllerExit.getByRole("note", {
    name: "Controller dialog controls. Use the D-pad or left stick to move, bottom face to select, and right face to keep playing.",
  })).toContainText("Face right · Keep playing");
  await page.waitForTimeout(120);
  await expect(controllerExit).toBeVisible();
  await page.screenshot({ path: info.outputPath("single-gamepad-exit-dialog.png"), animations: "disabled" });
  await releaseGamepadButton(page, 0, 0);
  await tapGamepadButton(page, 0, 1);
  await expect(controllerExit).toBeHidden();
  await expect(pause).toBeVisible();
  await expect(resume).toBeFocused();
  await tapGamepadButton(page, 0, 9);
  await expect(pause).toBeHidden();

  // A disconnect can race with the page-owned exit confirmation. Closing that
  // confirmation must reveal the fair-play pause instead of silently resuming
  // a controller-less run behind it.
  await page.getByRole("button", { name: "Exit the Scape", exact: true }).click();
  const exitDialog = page.getByRole("dialog", { name: "Leave the Scape?", exact: true });
  await expect(exitDialog).toBeVisible();
  await setGamepadConnected(page, 0, false);
  await expect(exitDialog).toBeVisible();
  await exitDialog.getByRole("button", { name: /Keep playing/ }).click();
  await expect(pause).toBeVisible();
  await expect(pause.locator(".gamepad-interruption")).toContainText(
    "Controller disconnected. Keyboard and touch stay active.",
  );
  await page.screenshot({ path: info.outputPath("single-gamepad-disconnected.png"), animations: "disabled" });
  await setGamepadConnected(page, 0, true);
  await expect(pause.locator(".gamepad-interruption")).toContainText(
    "Controller reconnected. Resume when ready.",
  );
  await tapGamepadButton(page, 0, 9);
  await expect(pause).toBeHidden();

  // Standard D-pad left (button 14) shares lane 0 with face-left (button 2).
  await tapGamepadButtonAtSongTime(page, 0, 14, 0.98);

  await expect(page).toHaveURL(/\/results$/, { timeout: 10_000 });
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run.counts.miss).toBe(0);
  expect(run.score).toBeGreaterThan(0);
});

test("queued Gamepad polling judges from the hardware update timestamp", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await tapQueuedGamepadButtonAtSongTime(page, 0, 14, 1);

  await expect(page).toHaveURL(/\/results$/, { timeout: 10_000 });
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run.counts).toEqual({ perfect: 1, great: 0, good: 0, miss: 0 });
  expect(run.score).toBe(300);
});

test("queued Gamepad input wins its frame before automatic Miss", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await tapQueuedGamepadButtonAtSongTime(page, 0, 14, 1, 65);

  await expect(page).toHaveURL(/\/results$/, { timeout: 10_000 });
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run.counts).toEqual({ perfect: 1, great: 0, good: 0, miss: 0 });
  expect(run.score).toBe(300);
});

test("queued Gamepad polling preserves both Hold timing edges", async ({ page }) => {
  await page.route("**/catalog/bs-s1-02/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-02",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 2,
      sections: [{ id: "gamepad-hold", t0: 0, t1: 2.2 }],
      notes: [{ id: "gamepad-hold", type: "hold", lane: 0, t: 1, end: 1.6 }],
    },
  }));
  await page.goto("/play/bs-s1-02?tier=easy&mode=arcade");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await setQueuedGamepadButtonAtSongTime(page, 0, 14, 1, true, 85);
  await setQueuedGamepadButtonAtSongTime(page, 0, 14, 1.6, false, 85);

  await expect(page).toHaveURL(/\/results$/, { timeout: 10_000 });
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run.counts).toEqual({ perfect: 2, great: 0, good: 0, miss: 0 });
  expect(run.score).toBe(600);
});

test("Home playable demo keeps its controller promise through scoring and result actions", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");

  const demo = page.getByRole("region", { name: "Interactive demo. Progress is not saved." });
  await expect(demo.getByRole("note", {
    name: "Controller ready. Use the D-pad or four face buttons.",
  })).toBeVisible();
  await demo.getByRole("button", { name: "Try it here", exact: true }).click();
  await expect(demo.locator(".play-wrap-hero canvas")).toBeVisible();

  const before = await page.evaluate(() => window.__gamepadHitSounds ?? 0);
  // Hold the primary face button through the result transition. The result
  // must wait for a neutral controller state instead of treating this last hit
  // as an immediate full-run activation.
  await holdGamepadButtonAtSongTime(page, 0, 0, 0.98);
  await expect.poll(
    () => page.evaluate(() => window.__gamepadHitSounds ?? 0),
    { timeout: 5_000 },
  ).toBeGreaterThan(before);
  const result = demo.getByRole("region", { name: "Demo result" });
  await expect(result).toBeVisible({ timeout: 5_000 });
  await expect(result).toContainText(/\d+\.\d{2}% ACC · Grade (?:S|A|B|C|D)/);
  await expect(result).not.toContainText("No notes hit");

  const resultControls = result.getByRole("note", {
    name: "Controller result controls. Bottom face starts the full run. Right face retries the demo.",
  });
  await expect(resultControls).toBeVisible();
  await expect(resultControls).toContainText("Face down · Full run");
  await expect(resultControls).toContainText("Face right · Retry");
  await page.waitForTimeout(150);
  await expect(page).toHaveURL(/\/$/);
  await result.screenshot({
    path: info.outputPath("home-gamepad-result-controls.png"),
    animations: "disabled",
  });
  await page.evaluate(() => { window.__gamepadButtons![0]!.delete(0); });
  await page.waitForTimeout(50);

  // Result actions must keep the controller-only journey intact. Reset the
  // observed song before retry so the next timed input belongs to the new run.
  await page.evaluate(() => { window.__gamepadSong = undefined; });
  await tapGamepadButton(page, 0, 1);
  await expect(result).toHaveCount(0);
  await expect(demo.locator(".play-wrap-hero canvas")).toBeVisible();

  await tapGamepadButtonAtSongTime(page, 0, 13, 0.98);
  const retryResult = demo.getByRole("region", { name: "Demo result" });
  await expect(retryResult).toBeVisible({ timeout: 5_000 });
  await tapGamepadButton(page, 0, 0);
  await expect(page).toHaveURL(
    /\/play\/bs-s1-05\?tier=easy&mode=casual&shift=studio$/,
  );
  const formalStart = page.getByRole("button", { name: "Start playing", exact: true });
  await expect(formalStart).toBeVisible();
  const readyControllerStart = page.getByRole("note", {
    name: "Controller start ready. Press the bottom face button to start.",
  });
  await expect(readyControllerStart).toBeVisible();
  await expect(readyControllerStart).toContainText("Face down · Start");
  // The navigation press must not leak into the ready card. Only a fresh
  // release + press starts the formal run.
  await expect(formalStart).toBeVisible();
  await page.screenshot({
    path: info.outputPath("home-to-formal-gamepad-start.png"),
    animations: "disabled",
  });
  await tapGamepadButton(page, 0, 0);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
});

test("Duo assigns two controllers to distinct players without cross-scoring", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");

  const ready = page.locator(".duo-start");
  await expect(ready).toContainText(
    info.project.name === "mobile" ? "Top · Pad 1 · 4 lanes" : "P1 Pad 1 · D-pad / face",
  );
  await expect(ready).toContainText(
    info.project.name === "mobile" ? "Bottom · Pad 2 · 4 lanes" : "P2 Pad 2 · D-pad / face",
  );
  await page.screenshot({ path: info.outputPath("duo-gamepads-ready.png"), animations: "disabled" });
  await ready.getByRole("button", { name: "Start", exact: true }).click();

  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);
  await tapGamepadButton(page, 1, 9);
  const pause = page.getByRole("dialog", { name: "Duo paused", exact: true });
  await expect(pause).toContainText("Press Menu to resume");
  await expect(pause.getByRole("note", {
    name: "Controller dialog controls. Use the D-pad or left stick to move, bottom face to select, and right face to back.",
  })).toBeVisible();
  const resume = pause.getByRole("button", { name: "Resume", exact: true });
  const restart = pause.getByRole("button", { name: "Restart duel", exact: true });
  const leave = pause.getByRole("button", { name: "Leave duel", exact: true });
  await expect(resume).toBeFocused();
  await page.screenshot({ path: info.outputPath("duo-gamepad-pause-menu.png"), animations: "disabled" });
  await tapGamepadButton(page, 1, 13);
  await expect(restart).toBeFocused();
  await tapGamepadButton(page, 1, 13);
  await expect(leave).toBeFocused();
  await holdGamepadButton(page, 1, 0);
  const controllerExit = page.getByRole("dialog", { name: "Leave the Scape?", exact: true });
  await expect(controllerExit).toBeVisible();
  await page.waitForTimeout(120);
  await expect(controllerExit).toBeVisible();
  await releaseGamepadButton(page, 1, 0);
  // Either seat may operate the shared pause and exit layers.
  await tapGamepadButton(page, 0, 1);
  await expect(controllerExit).toBeHidden();
  await expect(pause).toBeVisible();
  await tapGamepadButton(page, 0, 9);
  await expect(pause).toBeHidden();

  await setGamepadConnected(page, 1, false);
  await expect(pause).toBeVisible();
  await expect(pause.locator(".gamepad-interruption")).toContainText(
    "P2 controller disconnected. Keyboard and touch stay active.",
  );
  await page.screenshot({ path: info.outputPath("duo-gamepad-disconnected.png"), animations: "disabled" });
  await setGamepadConnected(page, 1, true);
  await expect(pause.locator(".gamepad-interruption")).toContainText(
    "P2 controller reconnected. Resume when ready.",
  );
  await tapGamepadButton(page, 1, 9);
  await expect(pause).toBeHidden();

  await tapGamepadButtonAtSongTime(page, 1, 14, 0.98);

  const results = page.getByRole("dialog", { name: "Duo results", exact: true });
  await expect(results).toBeVisible({ timeout: 10_000 });
  await expect(results.getByRole("note", {
    name: "Controller dialog controls. Use the D-pad or left stick to move, bottom face to select, and right face to exit.",
  })).toContainText("Face down · Select");
  const p1 = results.locator(".duo-scorecol").filter({ hasText: "P1" });
  const p2 = results.locator(".duo-scorecol").filter({ hasText: "P2" });
  await expect(p1.locator(".duo-scorecol-score")).toContainText("0");
  await expect(p1.locator(".duo-scorecol-meta").last()).toContainText("0/0/0/1");
  await expect(p2.locator(".duo-scorecol-score")).not.toContainText(/^SCORE\s*0$/);
  await expect(p2.locator(".duo-scorecol-meta").last()).toContainText(/(?:1\/0\/0\/0|0\/1\/0\/0|0\/0\/1\/0)/);
  await page.screenshot({ path: info.outputPath("duo-gamepad-result-actions.png"), animations: "disabled" });

  // Rematch is a controller action, but the selecting button remains held as
  // the new ready layer mounts. That layer must wait for neutral before Start.
  await page.waitForTimeout(50);
  await holdGamepadButton(page, 1, 0);
  const readyAgain = page.getByRole("dialog", { name: "Duel ready", exact: true });
  await expect(readyAgain).toBeVisible();
  await expect(readyAgain.getByRole("note", {
    name: "Duo controller start ready. Press the bottom face button to start or the right face button to return to the track.",
  })).toContainText("Face down · Start");
  await page.waitForTimeout(120);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("duo-gamepad-rematch-ready.png"), animations: "disabled" });
  await releaseGamepadButton(page, 1, 0);
  await tapGamepadButton(page, 0, 0);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);

  const rematchResults = page.getByRole("dialog", { name: "Duo results", exact: true });
  await expect(rematchResults).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(50);
  await tapGamepadButton(page, 0, 1);
  await expect(page).toHaveURL(/\/track\/bs-s1-01\?tier=easy&mode=casual$/);
});

test("Duo controllers cannot bypass the browser's first trusted audio gesture", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await installTrustedAudioGate(page);
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");

  const ready = page.getByRole("dialog", { name: "Duel ready", exact: true });
  const start = ready.getByRole("button", { name: "Start", exact: true });
  await expect(ready.getByRole("note", {
    name: "Duo controller start unavailable until browser audio is unlocked. Activate Start once.",
  })).toContainText(info.project.name === "mobile"
    ? "Tap Start once · Browser audio"
    : "Click Start once · Browser audio");

  await tapGamepadButton(page, 0, 0);
  await expect(start).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("duo-gamepad-audio-gate.png"), animations: "disabled" });

  await start.click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);
});
