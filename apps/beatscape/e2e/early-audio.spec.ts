import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync('dist/catalog.json', 'utf8'));
const audioUrl: string = catalog.tracks.find((track: { track_id: string }) => track.track_id === 'bs-s1-01').audio;

type EarlyAudioProbe = {
  requests: Array<{ url: string; script: string | null; aborted: boolean }>;
  decodes: number;
};

async function probe(page: Page): Promise<EarlyAudioProbe> {
  return page.evaluate(() => (window as typeof window & { __earlyAudioProbe: EarlyAudioProbe }).__earlyAudioProbe);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bs_onboarded', 'true');
    const state: EarlyAudioProbe = { requests: [], decodes: 0 };
    (window as typeof window & { __earlyAudioProbe: EarlyAudioProbe }).__earlyAudioProbe = state;
    const fetchAudio = window.fetch;
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (/\/audio\.m4a(?:\?|$)/.test(url)) {
        const request = { url, script: document.currentScript?.id ?? null, aborted: false };
        state.requests.push(request);
        init?.signal?.addEventListener('abort', () => { request.aborted = true; }, { once: true });
      }
      return fetchAudio.call(this, input, init);
    };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function (...args) {
      state.decodes++;
      return decode.apply(this, args);
    };
  });
});

for (const route of ['/play/bs-s1-01', '/duo/bs-s1-01', '/beatscape/play/bs-s1-01', '/beatscape/duo/bs-s1-01']) {
  test(`HTML parser starts the selected version once and cache adopts it: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${route}?tier=easy&mode=casual`);
    await expect(page.locator(route.includes('/duo/') ? '.duo-start button' : '.overlay-tap .unlock-btn')).toBeEnabled();
    expect(await probe(page)).toEqual({ requests: [{ url: audioUrl, script: 'beatscape-early-audio', aborted: false }], decodes: 1 });
    expect(await page.evaluate(() => '__beatscapeEarlyAudio' in window)).toBe(false);
    expect(errors).toEqual([]);
  });
}

test('home and library do not fetch speculative audio', async ({ page }) => {
  for (const path of ['/', '/library']) {
    await page.goto(path);
    await expect(page.locator(path === '/' ? '.home-play-sound-btn' : '.track-card').first()).toBeVisible();
    expect(await probe(page)).toEqual({ requests: [], decodes: 0 });
    expect(await page.evaluate(() => '__beatscapeEarlyAudio' in window)).toBe(false);
  }
});

test('leaving while the adopted audio is downloading aborts it and clears the bootstrap', async ({ page }) => {
  let finishRequest!: () => void;
  const releaseRequest = new Promise<void>(resolve => { finishRequest = resolve; });
  await page.route('**/audio.m4a*', async route => {
    await releaseRequest;
    await route.fulfill({ status: 503, body: 'Cancelled test request' });
  });
  try {
    await page.goto('/play/bs-s1-01?tier=easy&mode=casual');
    await page.locator('.play-exit').click();
    await page.getByRole('dialog', { name: 'Leave the Scape?' }).getByRole('button', { name: 'Leave', exact: true }).click();
    await expect(page).toHaveURL(/\/track\/bs-s1-01/);
    await expect.poll(async () => (await probe(page)).requests[0]?.aborted).toBe(true);
    expect((await probe(page)).decodes).toBe(0);
    expect(await page.evaluate(() => '__beatscapeEarlyAudio' in window)).toBe(false);
  } finally {
    finishRequest();
    await page.unrouteAll({ behavior: 'wait' });
  }
});
