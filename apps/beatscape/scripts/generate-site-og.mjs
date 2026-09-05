// Rasterize the existing code-native brand system; no new illustration or logo.
// Anton is SIL OFL: https://github.com/google/fonts/tree/main/ofl/anton
import { chromium } from '@playwright/test';
import { mkdtempSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const dir = mkdtempSync(join(tmpdir(), 'beatscape-og-'));
copyFileSync(fileURLToPath(new URL('./og-card.html', import.meta.url)), join(dir, 'card.html'));
execFileSync('curl', ['--fail', '--silent', '--show-error', '--location', '--max-time', '60', 'https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf', '-o', join(dir, 'Anton-Regular.ttf')]);
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(dir, 'card.html')).href);
  await page.evaluate(() => document.fonts.ready);
  if (!await page.evaluate(() => document.fonts.check('118px Anton'))) throw new Error('Anton did not load');
  await page.screenshot({ path: fileURLToPath(new URL('../public/og.png', import.meta.url)) });
} finally { await browser.close(); }
