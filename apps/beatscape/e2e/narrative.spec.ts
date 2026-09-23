import { test, expect, type Page } from '@playwright/test';

// These cases replace production charts with deterministic fixtures. A service
// worker can satisfy later navigations from Cache Storage before Playwright's
// route sees them, silently turning a 4s fixture back into a 60s real chart.
test.use({ serviceWorkers: 'block' });

const scenes = [
  { song: 'Voltage Drop', node: 'Studio return', next: 'One borrowed speaker', nextTrack: 'bs-s1-06' },
  { song: 'Chrome Riff', node: 'Yard speaker', next: 'Room on the roof', nextTrack: 'bs-s2-02' },
  { song: 'Skyline Hook', node: 'Rooftop relay', next: '', nextTrack: '' },
];
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on('pageerror', (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem('bs_onboarded', 'true'));
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test('story entry, character identities, readable dialogue and narrow layouts', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.shift-home-card').getByRole('link', { name: 'Take the call', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your first shift', exact: true })).toBeVisible();
  await expect(page.getByText('You hold the rhythm', { exact: false })).toBeVisible();
  const signalPath = page.getByRole('img', {
    name: 'Signal path: Studio return · no signal becomes Studio return · live',
  });
  await expect(signalPath).toBeVisible();
  const [pathBox, fromBox, arrowBox, toBox] = await Promise.all([
    signalPath.boundingBox(),
    signalPath.locator('.shift-link-from').boundingBox(),
    signalPath.locator('.shift-link-arrow').boundingBox(),
    signalPath.locator('.shift-link-to').boundingBox(),
  ]);
  expect(pathBox).not.toBeNull();
  expect(fromBox).not.toBeNull();
  expect(arrowBox).not.toBeNull();
  expect(toBox).not.toBeNull();
  expect(fromBox!.height).toBeGreaterThanOrEqual(44);
  expect(toBox!.height).toBeGreaterThanOrEqual(44);
  expect(fromBox!.x + fromBox!.width).toBeLessThanOrEqual(arrowBox!.x + 1);
  expect(arrowBox!.x + arrowBox!.width).toBeLessThanOrEqual(toBox!.x + 1);
  expect(toBox!.x + toBox!.width).toBeLessThanOrEqual(pathBox!.x + pathBox!.width + 1);
  await expect.poll(() => page.evaluate(() => [...document.fonts].some((font) => font.family.replace(/["']/g, '') === 'Anton' && font.status === 'loaded')), { timeout: 20000 }).toBe(true);
  await page.screenshot({ path: info.outputPath('first-shift.png'), fullPage: true, animations: 'disabled' });
  for (const route of ['/shift', '/characters', '/radio']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow ${route}`).toBe(true);
  }
  await page.goto('/characters');
  await expect(page.locator('.crew-card')).toHaveCount(3);
  if (info.project.name === 'mobile') {
    await expect(page.locator('.crew-card:visible')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'JUNO', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ATLAS', exact: true })).toBeHidden();
  } else {
    for (const name of ['JUNO', 'ATLAS', 'TORQUE']) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    }
  }
  await expect(page.locator('main')).not.toContainText('Visual identity');
  await expect(page.locator('main')).not.toContainText('Motif');
  await page.screenshot({ path: info.outputPath('characters.png'), fullPage: true, animations: 'disabled' });
  await page.goto('/radio');
  await expect(page.getByRole('link', { name: /first shift/i })).toBeVisible();
  await page.screenshot({ path: info.outputPath('radio.png'), fullPage: true, animations: 'disabled' });
});

test('First Shift opening cue follows touch and an attached physical keyboard', async ({ page }, info) => {
  await page.goto('/shift');
  const instruction = page.locator('.shift-play-card h3 + p');
  await expect(instruction).toContainText(info.project.name === 'mobile'
    ? 'Tap a lane as notes reach the line'
    : 'Press a lane key as notes reach the line');
  if (info.project.name === 'mobile') {
    await page.keyboard.press('a');
    await expect(instruction).toContainText('Press a lane key as notes reach the line');
  }
});

test('First Shift opening cue names a connected standard controller', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [{
      id: 'BeatScape QA Controller', index: 0, connected: true, mapping: 'standard',
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
      timestamp: performance.now(),
    }] });
  });
  await page.goto('/shift');
  await expect(page.locator('.shift-play-card h3 + p'))
    .toContainText('Press a lane button as notes reach the line');
});

test('all three real songs carry the opening story through results, reload, next scene and the finale', async ({ page }, info) => {
  test.setTimeout(330000);
  await page.goto('/shift');
  for (const [index, scene] of scenes.entries()) {
    await page.getByRole('link', { name: `Play ${scene.song}`, exact: true }).click();
    await page.locator('.overlay-tap .unlock-btn').click();
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    await expect.poll(async () => {
      for (let lane = 0; lane < 4; lane++) {
        if (info.project.name === 'mobile') {
          const box = (await page.locator('canvas').first().boundingBox())!;
          await page.touchscreen.tap(box.x + box.width * (0.125 + lane * 0.25), box.y + box.height * 0.82);
        } else {
          await page.keyboard.press(['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'][lane]!);
        }
      }
      return (await page.locator('.hud-judge:not(.hud-judge-miss) .hud-judge-count').allTextContents()).reduce((sum, text) => sum + Number(text), 0);
    }, { timeout: 20000, intervals: [20] }).toBeGreaterThan(0);
    await expect(page).toHaveURL(/\/results$/, { timeout: 115000 });
    await expect(page.getByRole('heading', { name: `${scene.node} restored`, exact: true })).toBeVisible();
    const resultOrder = await page.evaluate(() => {
      const hero = document.querySelector('.results-hero-card');
      const stats = document.querySelector('.results-stats');
      const story = document.querySelector('.shift-result');
      return Boolean(
        hero && stats && story &&
        (hero.compareDocumentPosition(stats) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        (stats.compareDocumentPosition(story) & Node.DOCUMENT_POSITION_FOLLOWING)
      );
    });
    expect(resultOrder).toBe(true);
    await expect(page.locator('.shift-result .shift-circuit li.restored')).toHaveCount(index + 1);
    const completed = await page.evaluate(() => JSON.parse(localStorage.getItem('bs_first_shift_v1')!).completed);
    expect(completed).toHaveLength(index + 1);
    await page.reload();
    await expect(page.getByRole('heading', { name: `${scene.node} restored`, exact: true })).toBeVisible();
    await expect(page.locator('.shift-result .shift-circuit li.restored')).toHaveCount(index + 1);
    if (index === 0) await page.screenshot({ path: info.outputPath('first-reply.png'), fullPage: true, animations: 'disabled' });
    // 结算页的主按钮直指下一首确定的歌，不再先把人送回目录页。
    const nextHref = await page.locator('.shift-result .btn.primary').getAttribute('href');
    await page.locator('.shift-result .btn.primary').click();
    if (scene.next) {
      expect(nextHref).toContain(`/play/${scene.nextTrack}`);
      await expect(page.getByRole('button', { name: 'Start playing', exact: true })).toBeVisible();
      await page.goto('/shift');
      await expect(page.getByRole('heading', { name: scene.next, exact: true })).toBeVisible();
    }
  }
  await expect(page.getByRole('heading', { name: 'Welcome to the crew.', exact: true })).toBeVisible();
  await expect(page.locator('.shift-journal details')).toHaveCount(3);
  await page.locator('.shift-journal summary').first().click();
  await expect(page.locator('.shift-journal details').first().getByText('The studio meter is moving again.', { exact: false })).toBeVisible();
  await page.screenshot({ path: info.outputPath('shift-complete.png'), fullPage: true, animations: 'disabled' });
  await page.goto('/');
  await expect(page.locator('.shift-home-card').getByRole('heading', { name: 'Four chairs. One crew.' })).toBeVisible();
});

test('a new visitor starts the first track straight from the home page, without reading the world first', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('bs_onboarded'));
  await page.goto('/');
  // 首页主入口就是第一首确定的歌，不要求先理解 First Shift 或进剧情页。
  const cta = page.locator('.hero-play');
  await expect(cta).toHaveText('Start first run');
  await expect(page.locator('.hero-entry-meta')).toContainText('Voltage Drop');
  await expect(page.locator('.shift-home-card')).toBeVisible();
  await cta.click();
  await expect(page).toHaveURL(/\/play\/bs-s1-05/);
  await expect(page.getByRole('button', { name: 'Start playing', exact: true })).toBeVisible();
  await expect(page.locator('.overlay-tap .overlay-kicker')).toHaveText('First Shift · Studio return');
  // 开始之前能确认操作方式与声音状态，校准仍可跳过。
  await expect(page.getByRole('button', { name: 'Sound check', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Adjust timing', exact: true })).toBeVisible();
  await expect(page.locator('.unlock-nosound summary')).toHaveText('No sound?');
});

test('leaving a set and visiting results cannot restore a connection; bad saves recover', async ({ page }) => {
  await page.goto('/shift');
  await page.getByRole('link', { name: 'Play Voltage Drop', exact: true }).click();
  await page.locator('.overlay-tap .unlock-btn').click();
  await page.locator('.play-exit').click();
  await page.getByRole('dialog', { name: 'Leave the Scape?' }).getByRole('button', { name: 'Leave', exact: true }).click();
  await expect(page).toHaveURL(/\/track\/bs-s1-05/);
  await page.goto('/shift');
  await expect(page.locator('.shift-circuit li.restored')).toHaveCount(0);
  await page.goto('/results');
  await expect(page.getByRole('heading', { name: 'No result yet', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Choose a track', exact: true })).toHaveAttribute('href', '/library');
  await page.evaluate(() => localStorage.setItem('bs_first_shift_v1', '{"v":1,"completed":[null]}'));
  await page.goto('/shift');
  await expect(page.getByRole('heading', { name: 'A voice on the line', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText("couldn't read all of your saved shift");
});

// Short chart fixtures isolate finish/storage branches. The three-song test
// above uses the actual production charts and audio without interception.
async function shortStudioChart(page: Page) {
  await page.route('**/catalog/bs-s1-05/easy.json*', (route) => route.fulfill({ json: {
    track_id: 'bs-s1-05', tier: 'easy', format: 1, bpm: 120, audio_offset_ms: 0, ar: 4,
    total_notes: 24, notes: Array.from({ length: 24 }, (_, i) => ({ id: `n${i}`, t: .6 + i * .12, lane: i % 4, type: 'tap' })),
  } }));
}

test('failed, listening-only and practice sets get honest replies without story progress', async ({ page }) => {
  test.setTimeout(55000);
  await shortStudioChart(page);
  for (const [mode, reply] of [['arcade', 'Rough take.'], ['casual', 'Just listening?'], ['practice', "That's what rehearsal is for."]]) {
    await page.goto(`/play/bs-s1-05?tier=easy&mode=${mode}&shift=studio`);
    await page.locator('.overlay-tap .unlock-btn').click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 16000 });
    await expect(page.locator('.shift-result')).toContainText(reply!);
    await expect(page.locator('.result-coach')).toHaveCount(0);
    await expect(page.locator('.shift-result .btn.primary')).toHaveCount(1);
    await expect(page.locator('.results-share-panel')).toHaveCount(0);
    await expect(page.locator('.results-actions')).toHaveCount(0);
    await expect(page.locator('.shift-result')).not.toContainText('Studio return restored');
    expect(await page.evaluate(() => localStorage.getItem('bs_first_shift_v1'))).toBeNull();
  }
});

test('blocked storage keeps the current result and next scene for this visit, with a clear notice', async ({ page }) => {
  await shortStudioChart(page);
  await page.addInitScript(() => {
    for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(window, name, { get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
  });
  await page.goto('/shift');
  await page.getByRole('link', { name: 'Play Voltage Drop', exact: true }).click();
  await page.locator('.overlay-tap .unlock-btn').click();
  await expect.poll(async () => {
    for (const key of ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight']) await page.keyboard.press(key);
    return (await page.locator('.hud-judge:not(.hud-judge-miss) .hud-judge-count').allTextContents()).reduce((sum, t) => sum + Number(t), 0);
  }, { timeout: 9000, intervals: [20] }).toBeGreaterThan(0);
  await expect(page).toHaveURL(/\/results$/, { timeout: 12000 });
  await expect(page.getByRole('heading', { name: 'Studio return restored', exact: true })).toBeVisible();
  await expect(page.locator('.shift-result')).toContainText('Progress lasts for this visit.');
  await page.locator('.shift-result .btn.primary').click();
  await expect(page).toHaveURL(/\/play\/bs-s1-06/);
  await expect(page.getByRole('button', { name: 'Start playing', exact: true })).toBeVisible();
});
