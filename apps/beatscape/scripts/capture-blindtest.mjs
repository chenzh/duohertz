// Capture the verified candidate for the existing human blind-test protocol.
import { chromium, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyRelease } from './release.mjs';

const base = process.argv[2] ?? 'http://127.0.0.1:4178';
const output = resolve(process.argv[3] ?? '../../data/beatscape-release/2026-09-05/blindtest');
const release = verifyRelease();
// The preview server must serve the artifact whose identity is in the packet.
const served = await fetch(new URL('/release.json', base)).then(r => r.json());
if (served.artifactSha256 !== release.artifactSha256) throw new Error('Preview artifact mismatch');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });
const frames = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('bs_onboarded', 'true'));
  async function capture(file, route) {
    // Font CSS itself is loaded asynchronously; fonts.ready can resolve before
    // that stylesheet has registered Anton. Wait for the actual face instead.
    await expect.poll(() => page.evaluate(() =>
      [...document.fonts].some(font => font.family.replace(/["']/g, '') === 'Anton' && font.status === 'loaded')
    ), { timeout: 20000, message: 'Display font must load before capturing the design' }).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(output, file), animations: 'disabled' });
    frames.push({ file, route, sha256: createHash('sha256').update(readFileSync(resolve(output, file))).digest('hex') });
  }
  await page.goto(base);
  await expect(page.locator('.hero-split')).toBeVisible();
  await expect(page.locator('.home-hero-play-meta')).toBeVisible();
  await capture('01.png', '/');
  await page.goto(new URL('/library', base).href);
  await expect(page.locator('.track-card')).toHaveCount(release.trackCount);
  await capture('02.png', '/library');
  await page.goto(new URL('/characters', base).href);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect.poll(() => page.locator('main img').evaluateAll(images => images.length > 0 && images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
  await capture('05.png', '/characters');
  await page.goto(new URL('/play/bs-s1-05?tier=easy&mode=casual', base).href);
  await page.locator('.overlay-tap button').click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  // Capture the actual playing field, then let the real chart reach its result.
  await page.waitForTimeout(4500);
  await capture('03.png', '/play/bs-s1-05?tier=easy&mode=casual');
  await expect(page).toHaveURL(/\/results$/, { timeout: 80000 });
  await expect(page.getByRole('heading', { name: 'Voltage Drop' })).toBeVisible();
  await capture('04.png', '/results');
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  await browser.close();
}
frames.sort((a, b) => a.file.localeCompare(b.file));
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify({
  artifactSha256: release.artifactSha256, capturedAt: new Date().toISOString(),
  viewport: { width: 1280, height: 900 }, frames, humanVerdict: 'pending',
}, null, 2) + '\n');
// Only numbered screenshots are shown to observers; no reference-work hints.
writeFileSync(resolve(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Images</title><style>body{margin:0;background:#141414;color:white;font:16px system-ui}figure{margin:20px auto;max-width:1280px}img{display:block;width:100%;height:auto}figcaption{padding:8px}</style>${frames.map((frame, i) => `<figure><img src="${frame.file}" alt="Image ${i + 1}"><figcaption>${i + 1} / ${frames.length}</figcaption></figure>`).join('')}</html>`);
console.log(`Captured ${frames.length} candidate screens at ${output}. Human verdict remains pending.`);
