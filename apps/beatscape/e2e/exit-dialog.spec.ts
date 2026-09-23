import { test, expect, type Page } from '@playwright/test';

type AudioProbe = {
  starts: number;
  active: number;
  offsets: number[];
  delays: number[];
  stoppedOffsets: number[];
};
declare global {
  interface Window {
    __exitAudioProbe: AudioProbe;
    __exitLiveSfxStarts: number;
    __exitAudioContext: AudioContext;
    __exitResumeHold: { pending: number; resumed: boolean; release: () => Promise<void> };
  }
}

const errors = new WeakMap<Page, string[]>();
const nativeDialogs = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  nativeDialogs.set(page, []);
  page.on('pageerror', error => errors.get(page)!.push(error.message));
  page.on('dialog', async dialog => {
    nativeDialogs.get(page)!.push(dialog.message());
    await dialog.dismiss();
  });
  await page.addInitScript(() => {
    localStorage.setItem('bs_onboarded', 'true');
    // Observe real production Web Audio nodes without replacing audio, charts,
    // clocks, or game state. Both Duo sources count, including its silent side.
    const probe: AudioProbe = window.__exitAudioProbe = {
      starts: 0,
      active: 0,
      offsets: [],
      delays: [],
      stoppedOffsets: [],
    };
    window.__exitLiveSfxStarts = 0;
    const active = new Map<AudioBufferSourceNode, { when: number; offset: number }>();
    const originalStart = AudioBufferSourceNode.prototype.start;
    const originalStop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.start = function (...args) {
      const result = originalStart.apply(this, args);
      // Keep live hit/key SFX separate from music and asynchronous offline
      // voice rendering so a synchronous key dispatch can prove input landed.
      if (this.context instanceof AudioContext && this.buffer && this.buffer.duration < 1) {
        window.__exitLiveSfxStarts++;
      }
      if (this.buffer && this.buffer.duration > 1) {
        window.__exitAudioContext = this.context as AudioContext;
        const offset = args[1] ?? 0;
        const when = args[0] || this.context.currentTime;
        active.set(this, { when, offset });
        probe.starts++;
        probe.offsets.push(offset);
        probe.delays.push(Math.max(0, when - this.context.currentTime));
        probe.active = active.size;
        this.addEventListener('ended', () => {
          active.delete(this);
          probe.active = active.size;
        }, { once: true });
      }
      return result;
    };
    AudioBufferSourceNode.prototype.stop = function (...args) {
      const source = active.get(this);
      const result = originalStop.apply(this, args);
      if (source) {
        probe.stoppedOffsets.push(Math.max(0, this.context.currentTime - source.when + source.offset));
        active.delete(this);
        probe.active = active.size;
      }
      return result;
    };
  });
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
  expect(nativeDialogs.get(page), 'exit never opens a browser confirm/alert').toEqual([]);
});

const modes = [
  { route: 'play', fields: 1, start: '.overlay-tap .unlock-btn' },
  { route: 'duo', fields: 2, start: '.duo-start button' },
] as const;
const dialogFor = (page: Page) => page.getByRole('dialog', { name: 'Leave the Scape?' });
const audio = (page: Page) => page.evaluate(() => window.__exitAudioProbe);
const judgments = (page: Page) => page.locator('.hud-judge-count').allTextContents();

async function openExit(page: Page) {
  await page.getByRole('button', { name: 'Exit the Scape', exact: true }).click();
  const dialog = dialogFor(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Keep playing', exact: true })).toBeFocused();
  expect(await dialog.evaluate(node => node instanceof HTMLDialogElement && node.matches(':modal'))).toBe(true);
  await expect.poll(async () => (await audio(page)).active).toBe(0);
  // The HUD samples judgments at 20 Hz; settle that display before comparing it.
  await page.waitForTimeout(150);
  return dialog;
}

async function openPausedExit(page: Page, route: "play" | "duo") {
  await page.getByRole("button", { name: route === "play" ? "Leave track" : "Leave duel", exact: true }).click();
  const dialog = dialogFor(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Keep playing", exact: true })).toBeFocused();
  expect(await dialog.evaluate(node => node instanceof HTMLDialogElement && node.matches(":modal"))).toBe(true);
  await expect.poll(async () => (await audio(page)).active).toBe(0);
  return dialog;
}

async function expectNoSavedRun(page: Page) {
  expect(await page.evaluate(() => ({
    sessionRun: sessionStorage.getItem('bs_last_run'),
    localRun: localStorage.getItem('bs_last_run_local'),
    history: localStorage.getItem('bs_runs'),
    story: localStorage.getItem('bs_first_shift_v1'),
  }))).toEqual({ sessionRun: null, localRun: null, history: null, story: null });
}

for (const mode of modes) {
  test(`${mode.route}: themed exit freezes real audio and judgment, restores play, and cleans up fullscreen when available`, async ({ page }, info) => {
    await page.goto(`/${mode.route}/bs-s1-01?tier=easy&mode=casual`);
    await page.locator(mode.start).click();
    await expect.poll(async () => (await audio(page)).active).toBe(mode.fields);
    // Get beyond the actual countdown and into real notes, so a frozen HUD
    // proves judgment has stopped instead of merely observing an empty chart.
    await expect.poll(async () => (await page.locator('.hud-judge-miss .hud-judge-count').allTextContents()).every(value => Number(value) > 0)).toBe(true);
    const dialog = await openExit(page);
    const frozenAudio = await audio(page);
    const frozenJudgments = await judgments(page);
    const keep = dialog.getByRole('button', { name: 'Keep playing', exact: true });
    const leave = dialog.getByRole('button', { name: 'Leave', exact: true });

    await page.keyboard.press('Shift+Tab');
    await expect(leave).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(keep).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(leave).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(keep).toBeFocused();
    for (const key of ['KeyR', 'KeyP', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight', 'KeyA', 'KeyS', 'KeyW', 'KeyD']) {
      await page.keyboard.press(key);
    }
    // A real pointer attempt at the old exit control hits the modal backdrop,
    // so it cannot activate the game underneath or accidentally confirm leave.
    const exitBox = (await page.locator('.play-exit').boundingBox())!;
    await page.mouse.click(exitBox.x + exitBox.width / 2, exitBox.y + exitBox.height / 2);
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(900);
    expect(await audio(page)).toEqual(frozenAudio);
    expect(await judgments(page)).toEqual(frozenJudgments);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const dialogBox = (await dialog.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(dialogBox.x).toBeGreaterThanOrEqual(0);
    expect(dialogBox.y).toBeGreaterThanOrEqual(0);
    expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(viewport.height + 1);
    await page.screenshot({ path: info.outputPath(`${mode.route}-exit-dialog.png`), animations: 'disabled' });

    await keep.click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Exit the Scape', exact: true })).toBeFocused();
    await expect.poll(async () => (await audio(page)).active).toBe(mode.fields);
    const resumed = await audio(page);
    expect(resumed.starts).toBe(frozenAudio.starts + mode.fields);
    const stoppedOffsets = frozenAudio.stoppedOffsets.slice(-mode.fields);
    for (const [index, offset] of resumed.offsets.slice(-mode.fields).entries()) {
      expect(offset).toBeGreaterThan(0);
      expect(Math.abs(offset - stoppedOffsets[index]!)).toBeLessThan(0.1);
    }
    for (const delay of resumed.delays.slice(-mode.fields)) {
      expect(delay).toBeGreaterThan(2.8);
      expect(delay).toBeLessThan(3.2);
    }
    await page.waitForTimeout(1_200);
    expect(await judgments(page)).toEqual(frozenJudgments);
    await page.screenshot({ path: info.outputPath(`${mode.route}-resume-countdown.png`), animations: 'disabled' });
    await expect.poll(judgments.bind(null, page)).not.toEqual(frozenJudgments);

    await openExit(page);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect.poll(async () => (await audio(page)).active).toBe(mode.fields);

    // Fullscreen is a real browser document state. Re-enter after Escape, which
    // may also dismiss fullscreen in Chromium, to verify confirm's cleanup.
    const canFullscreen = await page.evaluate(() => typeof document.documentElement.requestFullscreen === 'function');
    if (canFullscreen) {
      await page.evaluate(async () => {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      });
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    }
    await openExit(page);
    await leave.click();
    await expect(page).toHaveURL(/\/track\/bs-s1-01\?tier=easy&mode=casual$/);
    await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
    await expect.poll(async () => (await audio(page)).active).toBe(0);
    await expectNoSavedRun(page);
  });

  test(`${mode.route}: canceling exit preserves a prior manual pause`, async ({ page }) => {
    const resumeCount = mode.route === 'duo' ? 1 : mode.fields;
    await page.goto(`/${mode.route}/bs-s1-01?tier=easy&mode=casual`);
    await page.locator(mode.start).click();
    await expect.poll(async () => (await audio(page)).active).toBe(mode.fields);
    await page.getByRole('button', { name: 'Pause', exact: true }).first().click();
    await expect(page.getByRole('button', { name: /resume/i })).toHaveCount(resumeCount);
    await expect.poll(async () => (await audio(page)).active).toBe(0);
    const pausedAudio = await audio(page);
    await openPausedExit(page, mode.route);
    await dialogFor(page).getByRole('button', { name: 'Keep playing', exact: true }).click();
    await expect(dialogFor(page)).not.toBeVisible();
    await expect(page.getByRole('button', { name: /resume/i })).toHaveCount(resumeCount);
    expect(await audio(page)).toEqual(pausedAudio);
    await openPausedExit(page, mode.route);
    await page.keyboard.press('Escape');
    await expect(dialogFor(page)).not.toBeVisible();
    await expect(page.getByRole('button', { name: /resume/i })).toHaveCount(resumeCount);
    expect(await audio(page)).toEqual(pausedAudio);
    await page.getByRole('button', { name: /resume/i }).last().click();
    await expect.poll(async () => (await audio(page)).active).toBe(mode.fields);
    for (const delay of (await audio(page)).delays.slice(-mode.fields)) {
      expect(delay).toBeGreaterThan(2.8);
      expect(delay).toBeLessThan(3.2);
    }
  });

  test(`${mode.route}: releasing held lane keys inside exit does not swallow the next press`, async ({ page }) => {
    await page.goto(`/${mode.route}/bs-s1-01?tier=easy&mode=casual`);
    await page.locator(mode.start).click();
    await expect.poll(async () => (await audio(page)).active).toBe(mode.fields);
    await expect.poll(async () => (await page.locator('.hud-judge-miss .hud-judge-count').allTextContents()).every(value => Number(value) > 0)).toBe(true);
    const laneKeys = mode.fields === 2
      ? [{ key: 'ArrowLeft', code: 'ArrowLeft' }, { key: 'a', code: 'KeyA' }]
      : [{ key: 'ArrowLeft', code: 'ArrowLeft' }];
    for (const lane of laneKeys) await page.keyboard.down(lane.key);
    await openExit(page);
    for (const lane of laneKeys) await page.keyboard.up(lane.key);
    await dialogFor(page).getByRole('button', { name: 'Keep playing', exact: true }).click();
    await expect(dialogFor(page)).not.toBeVisible();
    await expect.poll(async () => (await audio(page)).active).toBe(mode.fields);
    // Inputs are intentionally inert until GO; wait for the AudioContext
    // deadline before proving modal key releases did not leave a lane stuck.
    await page.waitForTimeout(3_100);
    const newPressSounds = await page.evaluate(keys => keys.map(({ key, code }) => {
      // No rAF/countdown/judgment callbacks can interleave this synchronous
      // observation. Every accepted press produces either a hit or key tick.
      const before = window.__exitLiveSfxStarts;
      window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
      const emitted = window.__exitLiveSfxStarts - before;
      window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
      return emitted;
    }), laneKeys);
    for (const [index, emitted] of newPressSounds.entries()) {
      expect(emitted, `${laneKeys[index]!.code} reaches its player's field after modal key release`).toBeGreaterThan(0);
    }
  });

  test(`${mode.route}: exit before starting returns immediately without inventing unsaved progress`, async ({ page }) => {
    await page.goto(`/${mode.route}/bs-s1-01?tier=easy&mode=casual`);
    await expect(page.locator(mode.start)).toBeEnabled();
    await page.getByRole('button', { name: 'Exit the Scape', exact: true }).click();
    await expect(page).toHaveURL(/\/track\/bs-s1-01\?tier=easy&mode=casual$/);
    await expect(dialogFor(page)).toHaveCount(0);
    expect((await audio(page)).starts).toBe(0);
    await expectNoSavedRun(page);
  });

  test(`${mode.route}: Keep playing re-unlocks audio interrupted behind the exit panel`, async ({ page }) => {
    await page.goto(`/${mode.route}/bs-s1-01?tier=easy&mode=casual`);
    await page.locator(mode.start).click();
    await expect.poll(async () => (await audio(page)).active).toBe(mode.fields);

    const dialog = await openExit(page);
    await expect.poll(async () => (await audio(page)).active).toBe(0);
    await page.evaluate(async () => { await window.__exitAudioContext.suspend(); });
    expect(await page.evaluate(() => window.__exitAudioContext.state)).toBe("suspended");

    await dialog.getByRole("button", { name: "Keep playing", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.__exitAudioContext.state)).toBe("running");
    await expect.poll(async () => (await audio(page)).active).toBe(mode.fields);
  });
}

test('play: a delayed audio unlock from R stays paused inside exit and resumes after cancel', async ({ page }) => {
  await page.goto('/play/bs-s1-01?tier=easy&mode=casual');
  await page.locator('.overlay-tap .unlock-btn').click();
  await expect.poll(async () => (await audio(page)).active).toBe(1);
  await page.evaluate(async () => {
    const context = window.__exitAudioContext;
    await context.suspend();
    const originalResume = context.resume.bind(context);
    const hold: Window['__exitResumeHold'] = window.__exitResumeHold = {
      pending: 0,
      resumed: false,
      release: async () => { throw new Error('R has not requested audio resume'); },
    };
    // The context is genuinely suspended; only its resume completion is gated
    // so opening the modal can deterministically win this otherwise rare race.
    context.resume = () => {
      hold.pending++;
      return new Promise<void>((resolve, reject) => {
        hold.release = async () => {
          context.resume = originalResume;
          try {
            await originalResume();
            hold.resumed = true;
            resolve();
          } catch (error) {
            reject(error);
            throw error;
          }
        };
      });
    };
  });
  // Dispatch at the listener's window target to deterministically model an R
  // keydown that was already routed before the interruption's pause modal
  // committed focus. A normal key pressed after the modal owns interaction is
  // intentionally contained by that modal.
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'r',
    code: 'KeyR',
    bubbles: true,
    cancelable: true,
  })));
  await expect.poll(() => page.evaluate(() => window.__exitResumeHold.pending)).toBe(1);
  const dialog = await openPausedExit(page, 'play');
  const frozenJudgments = await judgments(page);
  await page.evaluate(() => window.__exitResumeHold.release());
  expect(await page.evaluate(() => window.__exitResumeHold.resumed && window.__exitAudioContext.state === 'running')).toBe(true);
  // Let the pending unlock's promise chain and multiple render frames settle.
  await page.waitForTimeout(350);
  expect((await audio(page)).active).toBe(0);
  expect(await judgments(page)).toEqual(frozenJudgments);
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Keep playing', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(async () => (await audio(page)).active).toBe(1);
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect.poll(async () => (await page.locator('.hud-judge-miss .hud-judge-count').allTextContents()).some(value => Number(value) > 0)).toBe(true);
});
