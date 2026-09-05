import { expect, test, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';

const DEMO_URL = 'http://127.0.0.1:4181/demo/';
const sampleWav = readFileSync(new URL('../public/samples/bgm-demo.wav', import.meta.url));
const showcase = JSON.parse(readFileSync(new URL('../public/showcase/showcase.json', import.meta.url), 'utf8'));

function job(id: string, status: 'queued' | 'completed' | 'failed' = 'completed') {
  return {
    job_id: id,
    status,
    mode: 'game_bgm',
    engine: 'Stable Audio 3',
    duration_sec: 5,
    latency_ms: 1200,
    error: status === 'failed' ? { code: 'TEST_FAILURE', message: 'Old task failed' } : null,
  };
}

async function mockGateway(page: Page, offline = false) {
  await page.route('**/demo/meta', route => route.fulfill({ json: { data: {
    version: '0.3.0', demo_url: DEMO_URL,
    compliance: { ace: 'ACE-Step 1.5', sa3: 'Stable Audio 3' },
  } } }));
  await page.route('**/demo/api/**', route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/demo/api/v1/health/inference') {
      return route.fulfill(offline
        ? { status: 503, json: { error: { message: 'Gateway unavailable' } } }
        : { json: { data: { gateway: 'ok', workers: { ace: { status: 'ok' }, sa3: { status: 'ok' } } } } });
    }
    return route.fulfill({ status: 404, json: { error: { message: 'No real API is used by this test' } } });
  });
  await page.route('**/demo/api/v1/jobs/*/audio', route => route.fulfill({
    contentType: 'audio/wav', body: sampleWav,
  }));
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('demo_onboarding_done', '1');
    localStorage.setItem('demo_locale', 'zh');
  });
});

test('Demo disables generation when the Gateway is unavailable', async ({ page }) => {
  let submissions = 0;
  page.on('request', request => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/demo/api/v1/jobs') submissions++;
  });
  await mockGateway(page, true);
  await page.goto(`${DEMO_URL}?playground=1`);
  await page.getByRole('button', { name: '高级模式', exact: true }).click();
  await expect(page.locator('.offline-banner')).toBeVisible();
  await expect(page.getByTestId('generate-btn')).toBeDisabled();
  await expect(page.locator('.sample-list audio')).toHaveCount(2);
  expect(submissions).toBe(0);
});

test('Demo Hero and showcase cards play real audio and pause each other', async ({ page }) => {
  await mockGateway(page);
  await page.goto(DEMO_URL);
  const hero = page.locator('.hero-preview audio');
  const cards = page.locator('.showcase-card');
  await expect(cards).toHaveCount(showcase.items.filter((item: { compare?: string }) => !item.compare).length);
  await hero.evaluate(async (audio: HTMLAudioElement) => { await audio.play(); });
  await expect.poll(() => hero.evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0);

  await cards.nth(0).getByRole('button').click();
  const firstAudio = cards.nth(0).locator('audio');
  await expect.poll(() => firstAudio.evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0);
  await expect(hero).toHaveJSProperty('paused', true);
  await expect(cards.nth(0).getByRole('button')).toHaveAttribute('aria-pressed', 'true');

  await cards.nth(1).getByRole('button').click();
  const secondAudio = cards.nth(1).locator('audio');
  await expect.poll(() => secondAudio.evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0);
  await expect(firstAudio).toHaveJSProperty('paused', true);
  await expect(cards.nth(0).getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  await cards.nth(1).getByRole('button').click();
  await expect(secondAudio).toHaveJSProperty('paused', true);
  await expect(page.locator('.showcase-card button audio')).toHaveCount(0);
});

test('Demo showcase failure is visible and retry restores the gallery and Hero', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let unavailable = true;
  await mockGateway(page);
  await page.route('**/demo/showcase/showcase.json', route => route.fulfill(unavailable
    ? { status: 503, body: 'Temporarily unavailable' }
    : { json: showcase }));
  await page.goto(DEMO_URL);
  const gallery = page.getByTestId('showcase-section');
  const hero = page.getByTestId('hero-preview');
  await expect(gallery.getByRole('alert')).toContainText('加载失败');
  await expect(hero.getByRole('alert')).toContainText('加载失败');

  unavailable = false;
  await gallery.getByRole('button', { name: '重试' }).click();
  await expect(gallery.locator('.showcase-card')).toHaveCount(showcase.items.filter((item: { compare?: string }) => !item.compare).length);
  await expect(gallery.getByRole('alert')).toHaveCount(0);
  await hero.getByRole('button', { name: '重试' }).click();
  await expect(hero.locator('audio')).toBeVisible();
  await expect(hero.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('completed deep links decode real waveforms and never time out or keep polling', async ({ page }) => {
  await page.clock.install();
  await mockGateway(page);
  let polls = 0;
  await page.route('**/demo/api/v1/jobs/completed-job', route => {
    polls++;
    return route.fulfill({ json: { data: job('completed-job') } });
  });
  await page.goto(`${DEMO_URL}?playground=1&job=completed-job`);
  await expect(page.getByTestId('demo-audio')).toHaveAttribute('src', '/demo/api/v1/jobs/completed-job/audio');
  await expect(page.locator('.wave-canvas')).toHaveAttribute('data-real-waveform', '1');
  await expect(page.locator('.status-text')).toHaveText('completed');
  const completedPolls = polls;
  await page.clock.fastForward(11 * 60_000);
  await expect(page.locator('.status-text')).toHaveText('completed');
  await expect(page.getByRole('button', { name: '刷新任务状态' })).toHaveCount(0);
  expect(polls).toBe(completedPolls);
});

test('a delayed task response cannot replace the task selected afterward', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('demo_tasks_v2', JSON.stringify(['task-a', 'task-b'].map(job_id => ({
      job_id, mode: 'game_bgm', status: 'queued', created_at: '2026-09-05T00:00:00.000Z',
    }))));
  });
  await mockGateway(page);
  const delayed: Route[] = [];
  await page.route('**/demo/api/v1/jobs/task-a', route => { delayed.push(route); });
  await page.route('**/demo/api/v1/jobs/task-b', route => route.fulfill({ json: { data: job('task-b') } }));
  await page.goto(`${DEMO_URL}?playground=1`);
  const works = page.getByTestId('work-grid-card');
  await expect(works).toHaveCount(2);
  await works.nth(0).click();
  await expect.poll(() => delayed.length).toBeGreaterThan(0);
  await works.nth(1).click();
  await expect(page.locator('.status-text')).toHaveText('completed');
  await expect(page.getByTestId('demo-audio')).toHaveAttribute('src', '/demo/api/v1/jobs/task-b/audio');

  const oldResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/demo/api/v1/jobs/task-a');
  await Promise.all(delayed.map(route => route.fulfill({ json: { data: job('task-a', 'failed') } })));
  await (await oldResponse).finished();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(works.nth(1)).toHaveClass(/active/);
  await expect(page.locator('.status-text')).toHaveText('completed');
  await expect(page.getByTestId('demo-audio')).toHaveAttribute('src', '/demo/api/v1/jobs/task-b/audio');
  await expect(page.locator('.output-card').getByRole('alert')).toHaveCount(0);
});

test('a timed-out task can refresh and complete without retaining the timeout', async ({ page }) => {
  await page.clock.install();
  await mockGateway(page);
  let completed = false;
  let polls = 0;
  await page.route('**/demo/api/v1/jobs/slow-job', route => {
    polls++;
    return route.fulfill({ json: { data: job('slow-job', completed ? 'completed' : 'queued') } });
  });
  await page.goto(`${DEMO_URL}?playground=1&job=slow-job`);
  await expect(page.getByTestId('generate-btn')).toHaveCount(0);
  await expect.poll(() => polls).toBeGreaterThan(0);
  await expect(page.locator('.status-text')).toContainText('已等待');
  await page.clock.fastForward(11 * 60_000);
  await expect(page.locator('.status-text')).toContainText('生成时间较长');

  completed = true;
  await page.getByRole('button', { name: '刷新任务状态' }).click();
  await expect(page.locator('.status-text')).toHaveText('completed');
  await expect(page.locator('.wave-canvas')).toHaveAttribute('data-real-waveform', '1');
  await expect(page.getByRole('button', { name: '刷新任务状态' })).toHaveCount(0);
  const completedPolls = polls;
  await page.clock.fastForward(11 * 60_000);
  await expect(page.locator('.status-text')).toHaveText('completed');
  expect(polls).toBe(completedPolls);
});
