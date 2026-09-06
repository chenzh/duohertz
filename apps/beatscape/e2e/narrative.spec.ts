import { test, expect, type Page } from '@playwright/test';

const scenes = [
  { song: 'Voltage Drop', node: 'Studio return', next: 'One borrowed speaker' },
  { song: 'Chrome Riff', node: 'Yard speaker', next: 'Room on the roof' },
  { song: 'Skyline Hook', node: 'Rooftop relay', next: '' },
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
  await expect.poll(() => page.evaluate(() => [...document.fonts].some((font) => font.family.replace(/["']/g, '') === 'Anton' && font.status === 'loaded')), { timeout: 20000 }).toBe(true);
  await page.screenshot({ path: info.outputPath('first-shift.png'), fullPage: true, animations: 'disabled' });
  for (const route of ['/shift', '/characters', '/radio']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow ${route}`).toBe(true);
  }
  await page.goto('/characters');
  for (const name of ['JUNO', 'ATLAS', 'TORQUE']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(page.locator('.crew-card')).toHaveCount(3);
  await expect(page.locator('main')).not.toContainText('Visual identity');
  await expect(page.locator('main')).not.toContainText('Motif');
  await page.screenshot({ path: info.outputPath('characters.png'), fullPage: true, animations: 'disabled' });
  await page.goto('/radio');
  await expect(page.getByRole('link', { name: /first shift/i })).toBeVisible();
});

test('all three real songs carry the opening story through results, reload, next scene and the finale', async ({ page }, info) => {
  test.setTimeout(330000);
  await page.goto('/shift');
  for (const [index, scene] of scenes.entries()) {
    await page.getByRole('link', { name: `Play ${scene.song}`, exact: true }).click();
    await page.locator('.overlay-tap button').click();
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
    expect(await page.locator('.results-hero-card').evaluate((hero) => hero.nextElementSibling?.classList.contains('shift-result'))).toBe(true);
    await expect(page.locator('.shift-result .shift-circuit li.restored')).toHaveCount(index + 1);
    const completed = await page.evaluate(() => JSON.parse(localStorage.getItem('bs_first_shift_v1')!).completed);
    expect(completed).toHaveLength(index + 1);
    await page.reload();
    await expect(page.getByRole('heading', { name: `${scene.node} restored`, exact: true })).toBeVisible();
    await expect(page.locator('.shift-result .shift-circuit li.restored')).toHaveCount(index + 1);
    if (index === 0) await page.screenshot({ path: info.outputPath('first-reply.png'), fullPage: true, animations: 'disabled' });
    await page.locator('.shift-result .btn.primary').click();
    if (scene.next) await expect(page.getByRole('heading', { name: scene.next, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('heading', { name: 'Welcome to the crew.', exact: true })).toBeVisible();
  await expect(page.locator('.shift-journal details')).toHaveCount(3);
  await page.locator('.shift-journal summary').first().click();
  await expect(page.locator('.shift-journal details').first().getByText('The studio meter is moving again.', { exact: false })).toBeVisible();
  await page.screenshot({ path: info.outputPath('shift-complete.png'), fullPage: true, animations: 'disabled' });
  await page.goto('/');
  await expect(page.locator('.shift-home-card').getByRole('heading', { name: 'Four chairs. One crew.' })).toBeVisible();
});

test('a new visitor can take the call straight from the welcome dialog', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('bs_onboarded'));
  await page.goto('/');
  const welcome = page.getByRole('dialog');
  await expect(welcome).toBeVisible();
  await welcome.getByRole('link', { name: 'Take the call · Story', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A voice on the line', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('bs_onboarded'))).toBe('true');
});

test('leaving a set and visiting results cannot restore a connection; bad saves recover', async ({ page }) => {
  await page.goto('/shift');
  await page.getByRole('link', { name: 'Play Voltage Drop', exact: true }).click();
  await page.locator('.overlay-tap button').click();
  await page.locator('.play-exit').click();
  await page.getByRole('dialog', { name: 'Leave the Scape?' }).getByRole('button', { name: 'Leave', exact: true }).click();
  await expect(page).toHaveURL(/\/track\/bs-s1-05/);
  await page.goto('/shift');
  await expect(page.locator('.shift-circuit li.restored')).toHaveCount(0);
  await page.goto('/results');
  await expect(page.getByText('No recent run on this device.')).toBeVisible();
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
    await page.locator('.overlay-tap button').click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 16000 });
    await expect(page.locator('.shift-result')).toContainText(reply!);
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
  await page.locator('.overlay-tap button').click();
  await expect.poll(async () => {
    for (const key of ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight']) await page.keyboard.press(key);
    return (await page.locator('.hud-judge:not(.hud-judge-miss) .hud-judge-count').allTextContents()).reduce((sum, t) => sum + Number(t), 0);
  }, { timeout: 9000, intervals: [20] }).toBeGreaterThan(0);
  await expect(page).toHaveURL(/\/results$/, { timeout: 12000 });
  await expect(page.getByRole('heading', { name: 'Studio return restored', exact: true })).toBeVisible();
  await expect(page.locator('.shift-result')).toContainText('Progress lasts for this visit.');
  await page.locator('.shift-result .btn.primary').click();
  await expect(page.getByRole('heading', { name: 'One borrowed speaker', exact: true })).toBeVisible();
});
