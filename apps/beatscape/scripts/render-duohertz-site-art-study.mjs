/** Render the duohertz site-art study with the local Playwright Chromium only. */
import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(app, 'candidates', 'duohertz', 'site-art-study');
const fonts = join(app, 'src', 'assets', 'fonts');
const palette = {
  ink: '#111421', paper: '#fff9ef', coral: '#f34d65', aqua: '#67eee0', yellow: '#ffda75',
};

const markBody = `
  <rect width="512" height="512" fill="${palette.ink}"/>
  <path d="M0 0h181L0 181z" fill="${palette.coral}"/>
  <path d="M512 512H332l180-180z" fill="${palette.aqua}"/>
  <circle cx="256" cy="256" r="178" fill="none" stroke="${palette.paper}" stroke-width="18"/>
  <path d="M69 261h102l52-109 66 213 52-109h102" fill="none" stroke="${palette.ink}" stroke-width="53" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M69 261h102l52-109 66 213 52-109h102" fill="none" stroke="${palette.aqua}" stroke-width="31" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="101" cy="261" r="20" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="7"/>
  <circle cx="411" cy="256" r="20" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="7"/>
`;
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="duohertz two-point frequency mark">${markBody}</svg>`;

function ogSvg(fontCss) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="duohertz site sharing graphic study">
  <defs>
    <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.2" fill="${palette.paper}" opacity=".28"/></pattern>
    <clipPath id="right"><path d="M632 0h568v630H590z"/></clipPath>
  </defs>
  <style>${fontCss}
    .sora{font-family:'Sora',Arial,sans-serif;font-weight:800}
    .anton{font-family:'Anton',Impact,sans-serif}
    .mono{font-family:'PlexMono',monospace;font-weight:700;letter-spacing:.12em}
  </style>
  <rect width="1200" height="630" fill="${palette.ink}"/>
  <path d="M895-120 1220-40 755 740 575 630z" fill="${palette.coral}"/>
  <path d="M1000-80 1190-25 820 685 700 646z" fill="${palette.paper}"/>
  <g clip-path="url(#right)">
    <path d="M702 0h298L672 630H454z" fill="url(#dots)" opacity=".55"/>
    <circle cx="959" cy="302" r="252" fill="${palette.ink}" stroke="${palette.aqua}" stroke-width="8"/>
    <circle cx="959" cy="302" r="190" fill="none" stroke="${palette.aqua}" stroke-width="5" opacity=".8"/>
    <circle cx="959" cy="302" r="127" fill="none" stroke="${palette.aqua}" stroke-width="4" opacity=".65"/>
    <path d="M650 312h124l51-110 66 212 50-109h260" fill="none" stroke="${palette.ink}" stroke-width="43" stroke-linejoin="round"/>
    <path d="M650 312h124l51-110 66 212 50-109h260" fill="none" stroke="${palette.paper}" stroke-width="19" stroke-linejoin="round"/>
    <g transform="translate(750 75) rotate(-12 90 90)"><rect x="7" y="7" width="142" height="142" fill="${palette.ink}"/><rect width="142" height="142" fill="${palette.aqua}" stroke="${palette.ink}" stroke-width="8"/><text class="anton" x="70" y="112" text-anchor="middle" font-size="99" fill="${palette.ink}">01</text></g>
    <g transform="translate(1005 405) rotate(12 85 85)"><rect x="8" y="8" width="142" height="142" fill="${palette.ink}"/><rect width="142" height="142" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="8"/><text class="anton" x="70" y="112" text-anchor="middle" font-size="99" fill="${palette.ink}">02</text></g>
    <path d="M690 525 796 484 760 560z" fill="${palette.yellow}"/><path d="M1090 115 1170 91 1131 165z" fill="${palette.yellow}"/>
  </g>
  <path d="M0 508h655l-54 122H0z" fill="${palette.paper}"/>
  <text class="mono" x="69" y="65" font-size="19" fill="${palette.aqua}">ELECTRONIC RHYTHM / 01 + 02</text>
  <text class="sora" x="68" y="245" font-size="88" letter-spacing="-4" fill="${palette.paper}">duo<tspan fill="${palette.aqua}">hertz</tspan></text>
  <rect x="70" y="271" width="466" height="8" fill="${palette.coral}"/>
  <text class="sora" x="70" y="355" font-size="38" fill="${palette.paper}">Music for you.</text>
  <text class="sora" x="70" y="408" font-size="38" fill="${palette.paper}">Be your true hertz.</text>
  <text class="mono" x="68" y="459" font-size="17" fill="${palette.aqua}">ONE KEY TO START · TWO KEYS TO GROW</text>
  <text class="mono" x="68" y="560" font-size="19" fill="${palette.ink}">INTERNAL VISUAL STUDY · NOT RELEASED</text>
  <text class="mono" x="68" y="591" font-size="16" fill="${palette.ink}">真我赫兹 · 音你、真我赫兹</text>
  </svg>`;
}

async function screenshotSvg(browser, svg, width, height, target) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(`<html><head><style>html,body{margin:0;background:transparent}</style></head><body>${svg}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('svg').screenshot({ path: target });
  await page.close();
}

async function main() {
  await mkdir(out, { recursive: true });
  const fontCss = (await Promise.all([
    ['Sora', 'sora-latin.woff2'], ['Anton', 'anton-latin.woff2'],
    ['PlexMono', 'ibm-plex-mono-700-latin.woff2'],
  ].map(async ([name, filename]) => `@font-face{font-family:'${name}';src:url(data:font/woff2;base64,${(await readFile(join(fonts, filename))).toString('base64')}) format('woff2');font-weight:${name === 'Anton' ? 400 : name === 'Sora' ? 800 : 700};}`))).join('\n');
  const share = ogSvg(fontCss);
  await writeFile(join(out, 'mark-study.svg'), markSvg);
  await writeFile(join(out, 'og-study.svg'), share);
  const browser = await chromium.launch();
  try {
    for (const [name, size] of [['icon-192-study.png', 192], ['icon-512-study.png', 512],
                                ['apple-touch-180-study.png', 180]]) {
      const sized = markSvg.replace('width="512" height="512"', `width="${size}" height="${size}"`);
      await screenshotSvg(browser, sized, size, size, join(out, name));
    }
    await screenshotSvg(browser, share, 1200, 630, join(out, 'og-1200x630-study.png'));
    for (const width of [390, 1280]) {
      const board = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
      await board.goto(pathToFileURL(join(out, 'index.html')).href);
      const overflow = await board.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (overflow) throw new Error(`Site-art study board overflows at ${width}px`);
      await board.screenshot({ path: join(out, `board-${width}-study.png`), fullPage: true });
      await board.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`Rendered local duohertz site-art study: ${out}`);
}

await main();
