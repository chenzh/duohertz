import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync('dist/catalog.json', 'utf8'));
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on('pageerror', (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem('bs_onboarded', 'true'));
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test('production navigation and layouts', async ({ page }, info) => {
  for (const route of ['/', '/library', '/track/bs-s1-01', '/characters', '/radio', '/leaderboard', '/profile', '/settings', '/calibrate', '/privacy', '/terms']) {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main')).not.toHaveText('');
    await expect(page.locator('h1').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow: ${route}`).toBe(true);
  }
  await page.goto('/not-a-real-page');
  await expect(page.getByText('Page not found', { exact: false }).first()).toBeVisible();
  await page.goto('/');
  await expect(page.locator('.hero-split')).toBeVisible();
  await page.screenshot({ path: info.outputPath('home.png'), animations: 'disabled' });
});

test('catalog, preview audio, and full-track destination', async ({ page }) => {
  await page.goto('/library');
  await expect(page.locator('.track-card')).toHaveCount(catalog.tracks.length);
  await page.getByRole('textbox').fill('Neon Pulse');
  await expect(page.locator('.track-card')).toHaveCount(1);
  await page.locator('.track-card').click();
  await expect(page.getByRole('heading', { name: 'Neon Pulse', exact: true })).toBeVisible();
  await expect(page.locator('.stream-cta-btn')).toHaveAttribute('href', 'https://scapemusic.pages.dev/#/track/bs-s1-01');
  const audio = page.locator('audio').first();
  await audio.evaluate((node: HTMLAudioElement) => { node.load(); });
  await expect.poll(() => audio.evaluate((node: HTMLAudioElement) => node.readyState)).toBeGreaterThan(0);
});

test('home preview stays light and Play + Sound starts real audio on one click', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(new URL(request.url()).pathname));
  await page.goto('/');
  const play = page.locator('.home-play-sound-btn');
  await expect(play).toBeEnabled();
  expect(requests.filter(path => path.endsWith('/catalog.json'))).toHaveLength(1);
  expect(requests.some(path => /chart.*\.json$|\.m4a$/.test(path))).toBe(false);
  await play.click();
  const hero = page.locator('.home-hero-play');
  await expect(hero.locator('canvas.play-canvas')).toBeVisible();
  await expect(hero.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  expect(requests.some(path => path.endsWith('/audio.m4a'))).toBe(true);
  await hero.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(hero.getByRole('button', { name: /resume/i })).toBeVisible();
});

test('note speed uses the slider and persists through refresh', async ({ page }) => {
  await page.goto('/settings');
  const slider = page.getByRole('slider', { name: 'Note speed', exact: true });
  await slider.focus();
  for (let i = 0; i < 10; i++) await slider.press('ArrowRight');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await page.reload();
  await expect(slider).toHaveValue('1.5');
  const bias = await page.evaluate(() => JSON.parse(localStorage.getItem('bs_settings')!).scrollBias);
  expect(bias).toBeCloseTo(1 / 1.5 - 1);
});

test('real M4A decode, start, keyboard/pointer input, pause, resume, and exit', async ({ page }, info) => {
  await page.goto('/play/bs-s1-01?tier=easy&mode=casual');
  await page.locator('.overlay-tap button').click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.waitForTimeout(4200);
  if (info.project.name === 'mobile') {
    const canvas = page.locator('canvas').first();
    const box = (await canvas.boundingBox())!;
    for (let i = 0; i < 8; i++) await page.touchscreen.tap(box.x + box.width * (0.125 + (i % 4) * 0.25), box.y + box.height * 0.82);
  } else {
    for (let i = 0; i < 12; i++) await page.keyboard.press(['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'][i % 4]);
  }
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: /resume/i })).toBeVisible();
  await page.getByRole('button', { name: /resume/i }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.locator('.play-exit').click();
  await page.getByRole('dialog', { name: 'Leave the Scape?' }).getByRole('button', { name: 'Leave', exact: true }).click();
  await expect(page).toHaveURL(/\/track\/bs-s1-01/);
});

test('R really restarts loaded audio repeatedly after the initial loading state', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as typeof window & { __musicStarts: number };
    state.__musicStarts = 0;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) state.__musicStarts++;
      return start.apply(this, args);
    };
  });
  await page.goto('/play/bs-s1-01?tier=easy&mode=casual');
  await page.locator('.overlay-tap button').click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  const starts = () => page.evaluate(() => (window as typeof window & { __musicStarts: number }).__musicStarts);
  await expect.poll(starts).toBe(1);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('KeyR');
    await expect.poll(starts).toBe(i + 2);
  }
});

test('audio failure offers a working retry', async ({ page }) => {
  await page.route('**/audio.m4a*', (route) => route.fulfill({ status: 503, body: 'Temporarily unavailable' }));
  await page.goto('/play/bs-s1-01?tier=easy&mode=casual');
  await expect(page.getByText('Signal lost', { exact: true })).toBeVisible();
  await page.unroute('**/audio.m4a*');
  await page.getByRole('button', { name: 'Retry loading' }).click();
  await expect(page.locator('.overlay-tap button')).toBeVisible();
});

test('bad local saves recover without a results crash', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    sessionStorage.setItem('bs_last_run', '{}');
    localStorage.setItem('bs_last_run_local', '{"v":1}');
  });
  await page.goto('/results');
  await expect(page.getByText('No recent run on this device.')).toBeVisible();
});

test('Duo starts and pauses both players together', async ({ page }, info) => {
  await page.goto('/duo/bs-s1-01?tier=easy&mode=casual');
  await expect(page.locator('.duo-start button')).toBeEnabled();
  await page.locator('.duo-start button').click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: 'Pause', exact: true }).first().click();
  await expect(page.getByRole('button', { name: /resume/i })).toHaveCount(2);
  await page.getByRole('button', { name: /resume/i }).last().click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveCount(2);
  if (info.project.name === 'desktop') {
    const p1 = page.locator('.play-hud').filter({ has: page.locator('[data-player="P1"]') });
    const p2 = page.locator('.play-hud').filter({ has: page.locator('[data-player="P2"]') });
    const hitCounts = '.hud-judge:not(.hud-judge-miss) .hud-judge-count';
    // GOOD is a real hit worth zero points. Check judgments for input isolation.
    await expect.poll(async () => {
      for (const key of ['a', 's', 'w', 'd']) await page.keyboard.press(key);
      return (await p2.locator(hitCounts).allTextContents()).reduce((sum, value) => sum + Number(value), 0);
    }, { timeout: 12000, intervals: [20] }).toBeGreaterThan(0);
    await expect(p1.locator(hitCounts)).toHaveText(['0', '0', '0']);
    await expect(p1.locator('.hud-track-score > span').last()).toHaveText('0');
  }
});

test('complete a real chart and export the results poster', async ({ page }, info) => {
  test.setTimeout(95000);
  await page.goto('/play/bs-s1-05?tier=easy&mode=casual');
  await page.locator('.overlay-tap button').click();
  await expect(page).toHaveURL(/\/results$/, { timeout: 80000 });
  await expect(page.getByRole('heading', { name: 'Voltage Drop' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem('bs_last_run')!));
  expect(saved.totalNotes).toBeGreaterThan(0);
  expect(saved.counts.miss).toBe(saved.totalNotes);
  expect(saved.accuracy).toBe(0);
  await expect(page.getByText('NEW RECORD', { exact: true })).toHaveCount(0);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /poster/i }).click();
  expect((await download).suggestedFilename()).toMatch(/beatscape-bs-s1-05-D\.png/);
  await page.screenshot({ path: info.outputPath('results.png'), fullPage: true, animations: 'disabled' });
});
