import { expect, test, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

type AudioResumeProbe = {
  attempts: number;
  release: null | (() => void);
  context: AudioContext | null;
};

type ProbeWindow = typeof window & { __startProbe: AudioResumeProbe };

declare global {
  interface Window {
    __duoAudioContext?: AudioContext;
    __duoShortAudioStarts?: number;
    __restoreDuoAudioResume?: () => void;
  }
}

async function installAudioResumeProbe(page: Page) {
  await page.addInitScript(() => {
    const probe: AudioResumeProbe = { attempts: 0, release: null, context: null };
    Object.assign(window, { __startProbe: probe });
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = new Proxy(NativeAudioContext, {
      construct(target, args) {
        const context = Reflect.construct(target, args) as AudioContext;
        probe.context = context;
        return context;
      },
    });
    AudioContext.prototype.resume = function (this: AudioContext) {
      probe.attempts++;
      if (probe.attempts === 1) {
        return Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
      }
      return new Promise<void>((resolve) => {
        probe.release = () => {
          // Parent unlock has completed; mirror the browser's state transition
          // so gated PlayFields observe the same running context.
          Object.defineProperty(this, "state", { configurable: true, value: "running" });
          resolve();
        };
      });
    };
  });
}

async function suspendAudioProbe(page: Page) {
  await page.evaluate(async () => {
    await (window as ProbeWindow).__startProbe.context?.suspend();
  });
}

async function releaseAudioProbe(page: Page) {
  await page.evaluate(() => (window as ProbeWindow).__startProbe.release?.());
}

async function audioResumeAttempts(page: Page) {
  return page.evaluate(() => (window as ProbeWindow).__startProbe.attempts);
}

async function installDelayedFullscreenProbe(page: Page) {
  await page.addInitScript(() => {
    const probe = { exits: 0, releaseFirst: null as null | (() => void) };
    Object.assign(window, { __fullscreenRaceProbe: probe });
    let requests = 0;
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value() {
        requests++;
        if (requests === 1) {
          return new Promise<void>((resolve) => { probe.releaseFirst = resolve; });
        }
        return Promise.reject(new DOMException("Later request denied", "NotAllowedError"));
      },
    });
    Object.defineProperty(Document.prototype, "exitFullscreen", {
      configurable: true,
      value() {
        probe.exits++;
        return Promise.resolve();
      },
    });
  });
}

async function expectFullscreenExitSettled(page: Page) {
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    window.__duoShortAudioStarts = 0;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) window.__duoAudioContext = this.context as AudioContext;
      if (
        this.context instanceof AudioContext
        && this.buffer
        && this.buffer.duration < 1
      ) window.__duoShortAudioStarts!++;
      return start.apply(this, args);
    };
  });
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("single-player has one explicit keyboard-reachable start target", async ({ page }, info) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");

  const overlay = page.locator(".overlay-tap");
  const start = page.getByRole("button", { name: "Start playing", exact: true });
  await expect(start).toBeEnabled();
  expect((await start.boundingBox())!.height).toBeGreaterThanOrEqual(52);

  await overlay.dispatchEvent("click");
  await expect(start).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("single-ready.png"), animations: "disabled" });

  let reachedStart = false;
  for (let press = 0; press < 20; press++) {
    await page.keyboard.press("Tab");
    reachedStart = await start.evaluate((button) => document.activeElement === button);
    if (reachedStart) break;
  }
  expect(reachedStart).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
});

test("single-player start recovers from audio denial and ignores a fast double activation", async ({ page }, info) => {
  await installAudioResumeProbe(page);
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");

  const start = page.getByRole("button", { name: "Start playing", exact: true });
  await expect(start).toBeEnabled();
  await suspendAudioProbe(page);
  await start.click();
  await expect(page.getByRole("alert")).toContainText("Audio could not start");
  await expect(start).toBeEnabled();
  await expectFullscreenExitSettled(page);
  await page.screenshot({ path: info.outputPath("single-audio-denied.png"), animations: "disabled" });

  await start.evaluate((button) => {
    button.click();
    button.click();
  });
  await expect(page.getByRole("button", { name: "Starting…", exact: true })).toBeDisabled();
  expect(await audioResumeAttempts(page)).toBe(2);
  await releaseAudioProbe(page);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();

  const starts = await page.evaluate(() => {
    const events = JSON.parse(localStorage.getItem("bs_analytics") ?? "[]") as Array<{ event?: string }>;
    return events.filter((entry) => entry.event === "play_start").length;
  });
  expect(starts).toBe(1);
});

test("single-player sound check reports audio denial and suppresses a fast double activation", async ({ page }) => {
  await installAudioResumeProbe(page);
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");

  const soundCheck = page.getByRole("button", { name: "Sound check", exact: true });
  await expect(soundCheck).toBeEnabled();
  await suspendAudioProbe(page);
  await soundCheck.click();
  await expect(page.getByRole("alert")).toContainText("Sound check could not start");
  await expect(soundCheck).toBeEnabled();
  expect(await audioResumeAttempts(page)).toBe(1);

  // React cannot commit disabled=true between two same-turn DOM activations;
  // the synchronous guard must still issue only one recovery attempt.
  await soundCheck.evaluate((button) => {
    button.click();
    button.click();
  });
  await expect(page.getByRole("button", { name: "Checking…", exact: true })).toBeDisabled();
  expect(await audioResumeAttempts(page)).toBe(2);

  await releaseAudioProbe(page);
  await expect(page.getByRole("button", { name: "Sound check ✓", exact: true })).toBeEnabled();
  expect(await audioResumeAttempts(page)).toBe(2);
});

test("Duo has one large keyboard-reachable start target", async ({ page, browserName }, info) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");

  const overlay = page.locator(".duo-start");
  const start = page.getByRole("button", { name: "Start", exact: true });
  await expect(start).toBeEnabled();

  const box = (await start.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(220);
  expect(box.height).toBeGreaterThanOrEqual(52);

  // The backdrop is intentionally inert: an imprecise tap must not launch a run.
  await overlay.dispatchEvent("click");
  await expect(start).toBeVisible();
  if (info.project.name === "mobile") {
    await expect(overlay.locator(".duo-seat-axis-stacked")).toHaveText(["Top", "Bottom"]);
    await expect(overlay.locator(".duo-seat-axis-wide").first()).toBeHidden();
    await expect(overlay.locator(".duo-seat-hint")).toContainText("P1 Tap 4 lanes");
    await expect(overlay.locator(".duo-seat-hint")).toContainText("P2 Tap 4 lanes");
  } else {
    await expect(overlay.locator(".duo-seat-axis-wide")).toHaveText(["Left", "Right"]);
    await expect(overlay.locator(".duo-seat-axis-stacked").first()).toBeHidden();
    await expect(overlay.locator(".duo-seat-hint")).toContainText("P2 A · S · W · D");
    await expect(overlay.locator(".duo-seat-hint")).toContainText("P1 ← · ↓ · ↑ · →");
  }
  await page.screenshot({ path: info.outputPath("duo-ready.png"), animations: "disabled" });

  if (info.project.name === "mobile") {
    const portraitViewport = page.viewportSize();
    expect(portraitViewport).not.toBeNull();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(overlay.locator(".duo-seat-axis-wide")).toHaveText(["Left", "Right"]);
    await expect(overlay.locator(".duo-seat-axis-stacked").first()).toBeHidden();
    await page.screenshot({ path: info.outputPath("duo-ready-landscape.png"), animations: "disabled" });
    await page.setViewportSize(portraitViewport!);
    await page.setViewportSize({ width: 320, height: 568 });
  }

  if (browserName === "webkit" && info.project.name === "mobile") {
    // The simulated iPhone does not advance focus with synthetic Tab. Exercise
    // touch activation here; desktop and Chromium mobile still check Tab/Enter.
    await start.click();
  } else {
    let reachedStart = false;
    for (let press = 0; press < 20; press++) {
      await page.keyboard.press("Tab");
      reachedStart = await start.evaluate((button) => document.activeElement === button);
      if (reachedStart) break;
    }
    expect(reachedStart).toBe(true);
    await page.keyboard.press("Enter");
  }
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);
  await expect(page.locator(".duo-stage .hud-player")).toHaveText(
    info.project.name === "mobile" ? ["P1", "P2"] : ["P2", "P1"],
  );
  if (info.project.name === "mobile") {
    for (const field of await page.locator(".play-wrap-duo").all()) {
      const scoreCard = (await field.locator(".hud-chip").boundingBox())!;
      const signal = (await field.locator(".hud-signal").boundingBox())!;
      const pause = (await field.getByRole("button", { name: "Pause", exact: true }).boundingBox())!;
      expect(scoreCard.x + scoreCard.width + 4).toBeLessThanOrEqual(signal.x);
      expect(signal.x + signal.width + 4).toBeLessThanOrEqual(pause.x);
    }
  }
});

test("Duo emits one shared count-in cue per beat", async ({ page }) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start", exact: true }).click();

  // Short AudioBuffer sources are SFX; the two long music sources are excluded.
  // Wait for all three opening beats, then ensure the mirrored playfields did
  // not each emit their own copy of the same shared 3/2/1 cue.
  await expect.poll(() => page.evaluate(() => window.__duoShortAudioStarts ?? 0), {
    timeout: 4_000,
  }).toBeGreaterThanOrEqual(3);
  expect(await page.evaluate(() => window.__duoShortAudioStarts ?? 0)).toBe(3);
});

test("Duo start recovers from audio denial and suppresses a fast double activation", async ({ page }, info) => {
  await installAudioResumeProbe(page);
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");

  const start = page.getByRole("button", { name: "Start", exact: true });
  await expect(start).toBeEnabled();
  await suspendAudioProbe(page);
  await start.click();
  await expect(page.getByRole("alert")).toContainText("Audio could not start");
  await expect(start).toBeEnabled();
  await expectFullscreenExitSettled(page);
  await page.screenshot({ path: info.outputPath("duo-audio-denied.png"), animations: "disabled" });

  // Two same-turn DOM activations reproduce the gap before React can commit
  // disabled=true; the synchronous ref guard must let only one resume through.
  await start.evaluate((button) => {
    button.click();
    button.click();
  });
  const starting = page.getByRole("button", { name: "Starting…", exact: true });
  await expect(starting).toBeDisabled();
  expect(await audioResumeAttempts(page)).toBe(2);

  await releaseAudioProbe(page);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);

  const starts = await page.evaluate(() => {
    const events = JSON.parse(localStorage.getItem("bs_analytics") ?? "[]") as Array<{ event?: string }>;
    return events.filter((entry) => entry.event === "duo_start").length;
  });
  expect(starts).toBe(1);
});

test("Duo pause uses one shared dialog with a synchronized restart", async ({ page }, info) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start", exact: true }).click();

  const pauseButtons = page.getByRole("button", { name: "Pause", exact: true });
  await expect(pauseButtons).toHaveCount(2);
  await pauseButtons.first().click();

  const pauseDialog = page.getByRole("dialog", { name: "Duo paused", exact: true });
  await expect(pauseDialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Resume", exact: true })).toHaveCount(1);
  const resume = pauseDialog.getByRole("button", { name: "Resume", exact: true });
  const restart = pauseDialog.getByRole("button", { name: "Restart duel", exact: true });
  const leave = pauseDialog.getByRole("button", { name: "Leave duel", exact: true });
  const music = pauseDialog.getByRole("slider", { name: "Music volume", exact: true });
  const sfx = pauseDialog.getByRole("slider", { name: "SFX volume", exact: true });
  const dim = pauseDialog.getByRole("slider", { name: "Background dim", exact: true });
  const noteSpeed = pauseDialog.getByRole("slider", { name: "Note speed", exact: true });
  const hitsounds = pauseDialog.getByRole("checkbox", { name: "Hitsounds", exact: true });
  const haptics = pauseDialog.getByRole("checkbox", { name: "Haptics", exact: true });
  const reduceMotion = pauseDialog.getByRole("checkbox", { name: "Reduce motion", exact: true });
  const thumbAssist = pauseDialog.getByRole("checkbox", { name: "Thumb chord assist", exact: true });
  await expect(restart).toBeVisible();
  await expect(leave).toBeVisible();
  await expect(resume).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  if (info.project.name === "mobile") {
    await expect(thumbAssist).toBeFocused();
    await page.keyboard.press("Shift+Tab");
  }
  await expect(reduceMotion).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(haptics).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(hitsounds).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(haptics).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(reduceMotion).toBeFocused();
  await page.keyboard.press("Tab");
  if (info.project.name === "mobile") {
    await expect(thumbAssist).toBeFocused();
    await page.keyboard.press("Tab");
  }
  await expect(resume).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(restart).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(leave).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(music).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(sfx).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dim).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(noteSpeed).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(hitsounds).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(haptics).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(reduceMotion).toBeFocused();
  await page.keyboard.press("Tab");
  if (info.project.name === "mobile") {
    await expect(thumbAssist).toBeFocused();
    await page.keyboard.press("Tab");
  }
  await expect(resume).toBeFocused();

  await leave.click();
  const exitDialog = page.getByRole("dialog", { name: "Leave the Scape?", exact: true });
  await expect(exitDialog).toBeVisible();
  await exitDialog.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect(pauseDialog).toBeVisible();
  await expect(resume).toBeFocused();
  await page.screenshot({ path: info.outputPath("duo-paused.png"), animations: "disabled" });

  await page.keyboard.press("Escape");
  await expect(pauseDialog).toHaveCount(0);
  await expect(pauseButtons).toHaveCount(2);

  await pauseButtons.last().click();
  await expect(pauseDialog).toBeVisible();
  await pauseDialog.getByRole("button", { name: "Restart duel", exact: true }).click();
  const start = page.getByRole("button", { name: "Start", exact: true });
  await expect(start).toBeVisible();
  await expect(start).toBeFocused();
  await expect(pauseButtons).toHaveCount(0);

  await start.click();
  await expect(pauseButtons).toHaveCount(2);
});

test("window blur freezes both Duo fields behind one shared resume", async ({ page }) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);

  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  const pauseDialog = page.getByRole("dialog", { name: "Duo paused", exact: true });
  await expect(pauseDialog).toHaveCount(1);
  await expect(pauseDialog.getByRole("button", { name: "Resume", exact: true })).toBeFocused();

  await pauseDialog.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(pauseDialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);
});

test("Duo retries a denied system-audio resume before releasing both fields", async ({ page }) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__duoAudioContext?.state)).toBe("running");

  await page.evaluate(async () => {
    const context = window.__duoAudioContext!;
    await context.suspend();
    const resume = context.resume.bind(context);
    window.__restoreDuoAudioResume = () => { context.resume = resume; };
    context.resume = () => Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
  });

  const pauseDialog = page.getByRole("dialog", { name: "Duo paused", exact: true });
  await expect(pauseDialog).toHaveCount(1);
  await pauseDialog.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(pauseDialog.getByRole("alert")).toContainText("Audio could not resume");
  await expect(pauseDialog.getByRole("button", { name: "Resume", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => window.__duoAudioContext?.state)).toBe("suspended");

  await page.evaluate(() => window.__restoreDuoAudioResume?.());
  await pauseDialog.getByRole("button", { name: "Resume", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__duoAudioContext?.state)).toBe("running");
  await expect(pauseDialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);
});

for (const scenario of [
  { label: "single-player", route: "/play/bs-s1-01?tier=easy&mode=casual", start: "Start playing", pauses: 1 },
  { label: "Duo", route: "/duo/bs-s1-01?tier=easy&mode=casual", start: "Start", pauses: 2 },
] as const) {
  test(`${scenario.label} retry is not interrupted by a stale fullscreen rollback`, async ({ page }) => {
    await installAudioResumeProbe(page);
    await installDelayedFullscreenProbe(page);
    await page.goto(scenario.route);

    const start = page.getByRole("button", { name: scenario.start, exact: true });
    await expect(start).toBeEnabled();
    await suspendAudioProbe(page);
    await start.click();
    await expect(page.getByRole("alert")).toContainText("Audio could not start");

    await start.click();
    await expect(page.getByRole("button", { name: "Starting…", exact: true })).toBeDisabled();
    await page.evaluate(() => (
      window as typeof window & { __fullscreenRaceProbe: { releaseFirst: null | (() => void) } }
    ).__fullscreenRaceProbe.releaseFirst?.());
    await expect.poll(() => page.evaluate(() => (
      window as typeof window & { __fullscreenRaceProbe: { exits: number } }
    ).__fullscreenRaceProbe.exits)).toBe(0);

    await releaseAudioProbe(page);
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(scenario.pauses);
  });
}
