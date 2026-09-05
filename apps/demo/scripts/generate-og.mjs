// Render the existing brand and typography without downloading external assets.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const logo = readFileSync(new URL('../public/brand/logo.svg', import.meta.url), 'utf8');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<html><head><style>*{box-sizing:border-box}body{margin:0;background:#111b20;color:#f1f4f1;font-family:Arial,sans-serif;padding:65px 75px;width:1200px;height:630px}.brand{display:flex;gap:18px;align-items:center;font-size:30px;font-weight:bold}.brand svg{width:52px;height:52px}h1{font-size:92px;letter-spacing:-4px;line-height:1.08;margin:56px 0 30px}p{color:#b5f17b;font-size:24px;letter-spacing:4px}.line{border-top:1px solid #42544e;margin-top:46px;padding-top:24px;color:#b9c8c5;font-size:21px;letter-spacing:1px}</style></head><body><div class="brand">${logo}<span>MusicSaas</span></div><h1>Create. Play.<br>Keep listening.</h1><p>MUSIC & INTERACTIVE EXPERIENCES</p><div class="line">Music API &nbsp; / &nbsp; BeatScape &nbsp; / &nbsp; Scape Music</div></body></html>`);
  await page.screenshot({ path: new URL('../public/brand/og.png', import.meta.url).pathname });
} finally { await browser.close(); }
