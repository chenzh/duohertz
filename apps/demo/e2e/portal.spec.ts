import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

test('public portal navigation, languages, no backend, no overflow', async ({ page }, info) => {
  const errors: string[] = [], bad: string[] = [], requests: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', req => requests.push(req.url()));
  page.on('response', res => { if (res.status() >= 400) bad.push(res.url()); });
  await page.goto('/?job=ignored&present=1&playground=1');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('从创作走到体验');
  await expect(page.locator('form, textarea, input')).toHaveCount(0);
  await page.getByRole('link', { name: '探索产品' }).click();
  await expect(page).toHaveURL(/#products$/);
  await expect(page.getByRole('link', { name: '体验 BeatScape' })).toHaveAttribute('href', 'https://beatscape.pages.dev/');
  await expect(page.getByRole('link', { name: '打开 Scape Music' })).toHaveAttribute('href', 'https://scapemusic.pages.dev/');
  await page.getByRole('link', { name: /阅读 API 文档/ }).first().click();
  await expect(page).toHaveURL(/#api-docs$/);
  await expect(page.getByRole('heading', { name: 'API 集成速查' })).toBeInViewport();
  await page.getByRole('combobox').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('From creation');
  for (const locale of ['en', 'zh']) {
    await page.getByRole('combobox').selectOption(locale);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => scrollTo(0, 0));
    const dir = resolve('../../data/portal-release/screenshots'); mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: resolve(dir, `${info.project.name}-${locale}.png`), fullPage: true });
  }
  expect(requests.filter(url => /\/demo\/api|\/demo\/meta|\/v1\//.test(url))).toEqual([]);
  expect(errors).toEqual([]); expect(bad).toEqual([]);
});

test('both technical samples actually play, pause each other and download', async ({ page }) => {
  await page.goto('/');
  await page.locator('.portal-samples summary').click();
  const audio = page.locator('.portal-sample audio');
  for (let index = 0; index < 2; index++) {
    await audio.nth(index).evaluate(async (el: HTMLAudioElement) => { await el.play(); });
    await expect.poll(() => audio.nth(index).evaluate((el: HTMLAudioElement) => el.currentTime)).toBeGreaterThan(0);
    expect(await audio.nth(index).evaluate((el: HTMLAudioElement) => el.duration)).toBe(5);
    if (index) expect(await audio.first().evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
    const download = page.waitForEvent('download');
    await page.getByRole('link', { name: '下载 WAV' }).nth(index).click();
    expect((await download).suggestedFilename()).toBe(index ? 'vocal-demo.wav' : 'bgm-demo.wav');
  }
});

test('blocked storage and corrupted locale do not blank the portal', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('combobox').selectOption('en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('From creation');
});

test('audio failure has feedback and a retry that recovers', async ({ page }) => {
  await page.route('**/samples/bgm-demo.wav', route => route.fulfill({ status: 404, body: '' }));
  await page.goto('/'); await page.locator('.portal-samples summary').click();
  await page.locator('audio').first().evaluate((el: HTMLAudioElement) => { el.load(); });
  await expect(page.getByRole('alert')).toContainText('音频暂时无法播放');
  await page.unroute('**/samples/bgm-demo.wav');
  await page.getByRole('button', { name: '重试' }).click();
  await page.locator('audio').first().evaluate(async (el: HTMLAudioElement) => { await el.play(); });
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('package serves security headers, real 404 and byte ranges', async ({ request, page }) => {
  const response = await request.get('/');
  expect(response.headers()['content-security-policy']).toContain("connect-src 'none'");
  const html = await response.text();
  const asset = /src="([^"]+\.js)"/.exec(html)![1];
  expect((await request.get(asset)).headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  expect(response.headers()['cache-control']).toBe('public, max-age=0, must-revalidate');
  const missing = await request.get('/missing-page'); expect(missing.status()).toBe(404);
  await page.goto('/missing-page'); await expect(page.getByRole('link', { name: /返回|Back/ }).first()).toHaveAttribute('href', '/');
  const range = await request.get('/samples/bgm-demo.wav', { headers: { Range: 'bytes=0-43' } });
  expect(range.status()).toBe(206); expect((await range.body()).length).toBe(44);
  expect((await request.get('/demo/api/v1/jobs')).status()).toBe(404);
  expect((await request.post('/demo/api/v1/jobs', { data: {} })).status()).toBe(405);
});
