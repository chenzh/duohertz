// Production-artifact lab measurements. No device sign-off or deployment.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { chromium } from '@playwright/test';
import { verifyRelease } from './release.mjs';
import { installPerformanceProbe } from './performance-probe.mjs';
import { assertGameCoverage, assertLoadCoverage, assertMemoryCoverage } from './performance-coverage.mjs';

const app = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(app, 'dist');
const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const output = resolve(option('--output', resolve(app, '../../data/beatscape-performance', new Date().toISOString().replaceAll(':', '-'))));
const suite = option('--suite', 'all');
const profileFilter = option('--profile', 'all');
const repeats = Number(option('--repeats', '3'));
const cycles = Number(option('--cycles', '8'));
const gameRepeats = Number(option('--game-repeats', '1'));
const gameScenarios = option('--scenarios', 'hard-fx-off,hard-fx-max,duo-fx-max').split(',');
assert(['all', 'load', 'game', 'memory'].includes(suite), 'Invalid --suite');
assert(Number.isInteger(repeats) && repeats > 0 && Number.isInteger(cycles) && cycles > 0);
assert(Number.isInteger(gameRepeats) && gameRepeats > 0, 'Invalid --game-repeats');
assert(gameScenarios.length && new Set(gameScenarios).size === gameScenarios.length &&
  gameScenarios.every(s => ['hard-fx-off', 'hard-fx-max', 'duo-fx-max'].includes(s)), 'Invalid --scenarios');
const release = verifyRelease();
const catalog = JSON.parse(readFileSync(resolve(dist, 'catalog.json')));
const tracks = catalog.tracks.map(track => ({ ...track,
  hard: JSON.parse(readFileSync(resolve(dist, track.charts.hard.split('?')[0].slice(1)))) }));
const densest = tracks.toSorted((a, b) => b.hard.total_notes / b.duration_sec - a.hard.total_notes / a.duration_sec)[0];
const track = tracks.find(t => t.track_id === option('--track', densest.track_id));
assert(track, 'Unknown --track');
const profiles = [
  { name: 'desktop', viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1,
    cpuSlowdown: 1, downloadMbps: 25, uploadMbps: 5, latencyMs: 40, isMobile: false, hasTouch: false },
  { name: 'mobile-emulated', viewport: { width: 412, height: 915 }, deviceScaleFactor: 2,
    cpuSlowdown: 4, downloadMbps: 10, uploadMbps: 2, latencyMs: 100, isMobile: true, hasTouch: true },
].filter(profile => profileFilter === 'all' || profile.name === profileFilter);
assert(profiles.length, 'Unknown --profile');
mkdirSync(output, { recursive: true });

// Match the artifact's Pages cache headers, with Brotli for text and ETag
// revalidation. This models a local static origin, not global CDN latency.
const rules = [];
for (const line of readFileSync(resolve(dist, '_headers'), 'utf8').split('\n')) {
  if (line.startsWith('/')) rules.push({ glob: line.trim(), headers: {} });
  else if (/^\s+\S.*:/.test(line) && rules.length) {
    const at = line.indexOf(':');
    rules.at(-1).headers[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
}
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.m4a': 'audio/mp4', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const encoded = new Map();
// Warm origin text before browser timing; browser contexts remain cold.
// The first repeat must not uniquely pay synchronous Brotli setup cost.
function prepareText(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) prepareText(path);
    else if (/\.(html|js|css|json|svg|txt)$/.test(path)) {
      const raw = readFileSync(path);
      encoded.set(`${path}:true`, { bytes: brotliCompressSync(raw),
        etag: '"' + createHash('sha256').update(raw).digest('hex').slice(0, 20) + '"' });
    }
  }
}
prepareText(dist);
const server = createServer((request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let path = resolve(dist, '.' + pathname);
    if (!path.startsWith(dist + sep) && path !== dist) { response.writeHead(403).end(); return; }
    if (!existsSync(path) || !statSync(path).isFile()) {
      if (extname(pathname)) { response.writeHead(404).end(); return; }
      path = resolve(dist, 'index.html'); pathname = '/index.html';
    }
    const compress = /\.(html|js|css|json|svg|txt)$/.test(path) && request.headers['accept-encoding']?.includes('br');
    const key = `${path}:${Boolean(compress)}`;
    if (!encoded.has(key)) {
      const raw = readFileSync(path);
      encoded.set(key, { bytes: compress ? brotliCompressSync(raw) : raw,
        etag: '"' + createHash('sha256').update(raw).digest('hex').slice(0, 20) + '"' });
    }
    const { bytes, etag } = encoded.get(key);
    response.setHeader('Content-Type', mime[extname(path)] ?? 'application/octet-stream');
    response.setHeader('ETag', etag);
    response.setHeader('Vary', 'Accept-Encoding');
    for (const rule of rules) {
      const pattern = '^' + rule.glob.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$';
      if (new RegExp(pattern).test(pathname)) for (const [key, value] of Object.entries(rule.headers)) response.setHeader(key, value);
    }
    if (request.headers['if-none-match'] === etag) { response.writeHead(304).end(); return; }
    if (compress) response.setHeader('Content-Encoding', 'br');
    response.setHeader('Content-Length', bytes.length);
    response.writeHead(200).end(bytes);
  } catch (error) { response.writeHead(500).end(String(error)); }
});
await new Promise((done, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', done); });
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome', headless: true });
const result = {
  schema: 1, startedAt: new Date().toISOString(), artifactSha256: release.artifactSha256,
  sourceCommit: release.sourceCommit, sourceDirty: release.sourceDirty,
  measurementSourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: app, encoding: 'utf8' }).trim(),
  harnessSha256: createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).update(readFileSync(new URL('./performance-probe.mjs', import.meta.url))).digest('hex'),
  environment: { platform: os.platform(), arch: os.arch(), osRelease: os.release(), cpu: os.cpus()[0]?.model,
    logicalCores: os.cpus().length, ramBytes: os.totalmem(), browser: await browser.version(), node: process.version,
    headless: true, origin: 'loopback static production artifact; Brotli text + artifact _headers + ETag; no CDN',
    network: 'CDP throughput/latency simulation; external font requests use actual network plus emulation',
    deviceCoverage: 'automated browser layouts only; physical-device acceptance cancelled by BS-D001' },
  config: { suite, repeats, cycles, gameRepeats, gameScenarios, profiles, track: { id: track.track_id, duration: track.duration_sec,
    hardNotes: track.hard.total_notes, notesPerSecond: track.hard.total_notes / track.duration_sec } },
  observations: [],
};
const save = () => writeFileSync(resolve(output, 'results.json'), JSON.stringify(result, null, 2) + '\n');
const record = row => {
  result.observations.push(row); save();
  try {
    row.coverage = row.kind === 'game' ? assertGameCoverage(row, result.config.track)
      : row.kind === 'load' ? assertLoadCoverage(row) : assertMemoryCoverage(row, { cycles });
  } catch (error) {
    row.coverage = { covered: false, error: error.message }; save(); throw error;
  }
  save();
  console.log(`[${row.profile}] ${row.kind} ${row.scenario ?? ''} ${row.iteration ?? ''}: ${JSON.stringify(row.summary ?? {})}`);
};

async function session(profile, fancyFx = true, onboarded = true, measureReady = false) {
  const context = await browser.newContext({ viewport: profile.viewport, deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: profile.isMobile, hasTouch: profile.hasTouch, reducedMotion: 'no-preference' });
  await context.addInitScript(({ fancyFx, onboarded }) => {
    if (onboarded) localStorage.setItem('bs_onboarded', 'true');
    localStorage.setItem('bs_settings', JSON.stringify({ fancyFx, hitsound: true, musicVolume: .7, sfxVolume: .55, scrollBias: 0 }));
    localStorage.setItem('bs_offset_ms', '0');
  }, { fancyFx, onboarded });
  await context.addInitScript(installPerformanceProbe);
  if (measureReady) await context.addInitScript(() => {
    window.__bsReadyMarks = {};
    const selectors = ['.home-play-sound-btn', '.overlay-tap button', '.duo-start button'];
    const observer = new MutationObserver(() => {
      for (const selector of selectors) {
        if (window.__bsReadyMarks[selector] !== undefined) continue;
        const element = document.querySelector(selector);
        if (element?.getClientRects().length) window.__bsReadyMarks[selector] = performance.now();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [], failedRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', req => failedRequests.push({ url: req.url(), failure: req.failure()?.errorText }));
  page.on('dialog', dialog => dialog.accept());
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: profile.latencyMs,
    downloadThroughput: profile.downloadMbps * 1e6 / 8, uploadThroughput: profile.uploadMbps * 1e6 / 8, connectionType: 'cellular4g' });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuSlowdown });
  return { context, page, cdp, errors, failedRequests };
}
const snapshot = page => page.evaluate(() => window.__bsPerf.snapshot());
async function navigationTiming(page, selector) {
  await page.locator(selector).first().waitFor({ state: 'visible' });
  // Mutation time avoids Playwright's increasing polling interval inflating
  // readiness by hundreds of milliseconds, especially on slow profiles.
  return page.evaluate(selector => {
    const mark = window.__bsReadyMarks[selector];
    if (!Number.isFinite(mark)) throw new Error(`Missing readiness marker: ${selector}`);
    return mark;
  }, selector);
}
async function spa(page, path) {
  await page.evaluate(path => { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')); }, path);
}
async function memoryPoint(page, cdp, label) {
  // No full navigation: the same SPA/JS realm survives all cycles.
  // Discard probe sample arrays before GC so the observer's own history cannot
  // be mistaken for application growth. Resource weak references are retained.
  await page.evaluate(() => window.__bsPerf.reset());
  await cdp.send('HeapProfiler.collectGarbage');
  await page.waitForTimeout(150);
  await cdp.send('HeapProfiler.collectGarbage');
  return { label, gc: { completedCollections: 2 }, heap: await cdp.send('Runtime.getHeapUsage'), dom: await cdp.send('Memory.getDOMCounters'), probe: await snapshot(page) };
}
async function loadSuite(profile) {
  for (let i = 0; i < repeats; i++) {
    for (const scenario of ['home-first-visit', 'song-cold', 'duo-cold']) {
      const run = await session(profile, true, scenario !== 'home-first-visit', true);
      const { page } = run;
      try {
        const route = scenario === 'home-first-visit' ? '/' : `/${scenario === 'duo-cold' ? 'duo' : 'play'}/${track.track_id}?tier=hard&mode=casual`;
        await page.goto(base + route, { waitUntil: 'domcontentloaded' });
        const readyMs = await navigationTiming(page, scenario === 'home-first-visit' ? '.home-play-sound-btn' : scenario === 'duo-cold' ? '.duo-start button' : '.overlay-tap button');
        await page.waitForTimeout(2000);
        const probe = await snapshot(page);
        const navigation = await page.evaluate(() => ({ navigation: performance.getEntriesByType('navigation').map(e => e.toJSON()),
          resources: performance.getEntriesByType('resource').map(e => e.toJSON()), fontsStatus: document.fonts.status,
          fonts: [...document.fonts].map(f => ({ family: f.family, status: f.status })) }));
        record({ kind: 'load', scenario, profile: profile.name, iteration: i + 1, summary: { readyMs }, probe, ...navigation,
          errors: run.errors, failedRequests: run.failedRequests });
      } finally { await run.context.close(); }
    }
  }
}
async function gameSuite(profile) {
  for (let iteration = 1; iteration <= gameRepeats; iteration++) for (const scenario of gameScenarios) {
    const duo = scenario.startsWith('duo');
    const run = await session(profile, scenario !== 'hard-fx-off');
    const { page } = run;
    try {
      await page.goto(`${base}/${duo ? 'duo' : 'play'}/${track.track_id}?tier=hard&mode=casual`, { waitUntil: 'domcontentloaded' });
      // 改版后 overlay 有 Start playing + Sound check 两个按钮，必须指名主按钮（同 e2e 约定）。
      const start = page.locator(duo ? '.duo-start button' : '.overlay-tap .unlock-btn');
      await start.waitFor({ state: 'visible' });
      const loading = await snapshot(page);
      await page.evaluate(({ chart, duo }) => window.__bsPerf.autoplay(chart, { duo, offsetMs: 0 }), { chart: track.hard, duo });
      await start.click();
      await page.waitForFunction(() => window.__bsPerf.musicTimeMs() >= 0 && window.__bsPerf.musicTimeMs() !== null);
      await page.evaluate(() => window.__bsPerf.reset());
      console.log(`[${profile.name}] playing ${scenario} ${iteration}/${gameRepeats}: ${track.track_id}, ${track.duration_sec}s, ${track.hard.total_notes} real judgments`);
      if (duo) await page.locator('.duo-result').waitFor({ state: 'visible', timeout: (track.duration_sec + 25) * 1000 });
      else await page.waitForURL(/\/results$/, { timeout: (track.duration_sec + 25) * 1000 });
      const probe = await snapshot(page);
      const outcomes = await page.evaluate(() => ({ lastRun: JSON.parse(sessionStorage.getItem('bs_last_run') ?? 'null'),
        duoResults: document.querySelector('.duo-result')?.textContent ?? null,
        duoPlayers: [...document.querySelectorAll('.duo-scorecol')].map(column => ({
          player: column.querySelector('.duo-scorecol-who')?.textContent,
          counts: column.querySelectorAll('.duo-scorecol-meta')[1]?.textContent.trim().split('/').map(Number),
        })) }));
      await page.screenshot({ path: resolve(output, `${profile.name}-${scenario}-${iteration}-result.png`) });
      record({ kind: 'game', scenario, profile: profile.name, iteration, summary: { duration: track.duration_sec }, loading, probe, outcomes,
        errors: run.errors, failedRequests: run.failedRequests });
    } finally { await run.context.close(); }
  }
}
async function memorySuite(profile) {
  const run = await session(profile);
  const { page, cdp } = run;
  try {
    await page.goto(base + '/library', { waitUntil: 'domcontentloaded' });
    await page.locator('.track-card').first().waitFor();
    const points = [await memoryPoint(page, cdp, 'library-initial')];
    await spa(page, `/play/${track.track_id}?tier=hard&mode=casual`);
    await page.locator('.overlay-tap .unlock-btn').click();
    await page.waitForTimeout(4500);
    points.push(await memoryPoint(page, cdp, 'playing-warmup'));
    for (let i = 0; i < cycles; i++) {
      await page.keyboard.press('r');
      await page.waitForTimeout(4500);
      points.push(await memoryPoint(page, cdp, `restart-${i + 1}`));
      console.log(`[${profile.name}] memory restart ${i + 1}/${cycles}`);
    }
    await spa(page, '/library');
    await page.locator('.track-card').first().waitFor();
    await page.waitForTimeout(500);
    points.push(await memoryPoint(page, cdp, 'after-restarts-exit'));
    const alternates = tracks.filter(t => t.track_id !== track.track_id).slice(0, cycles);
    for (let i = 0; i < cycles; i++) {
      const next = alternates[i % alternates.length];
      const at = await page.evaluate(() => performance.now());
      await spa(page, `/duo/${next.track_id}?tier=hard&mode=casual`);
      await page.locator('.duo-start button').waitFor({ state: 'visible' });
      const readyMs = await page.evaluate(at => performance.now() - at, at);
      await page.locator('.duo-start button').click();
      await page.waitForTimeout(4500);
      await spa(page, '/library');
      await page.locator('.track-card').first().waitFor();
      await page.waitForTimeout(500);
      points.push({ ...await memoryPoint(page, cdp, `song-exit-${i + 1}`), track: next.track_id, readyMs });
      console.log(`[${profile.name}] memory song switch ${i + 1}/${cycles}`);
    }
    // Leaving while a real fetch/decode is pending must not leave a live source.
    for (let i = 0; i < 3; i++) {
      await spa(page, `/play/${tracks.at(-1 - i).track_id}?tier=hard&mode=casual`);
      await page.waitForTimeout(300);
      await spa(page, '/library');
      await page.locator('.track-card').first().waitFor();
    }
    await page.waitForTimeout(6000);
    points.push(await memoryPoint(page, cdp, 'after-interrupted-loads'));
    record({ kind: 'memory', profile: profile.name, summary: { restarts: cycles, songSwitches: cycles }, points,
      errors: run.errors, failedRequests: run.failedRequests });
  } finally { await run.context.close(); }
}
try {
  save();
  for (const profile of profiles) {
    if (suite === 'all' || suite === 'load') await loadSuite(profile);
    if (suite === 'all' || suite === 'game') await gameSuite(profile);
    if (suite === 'all' || suite === 'memory') await memorySuite(profile);
  }
  result.completedAt = new Date().toISOString();
  result.status = 'measured';
  save();
  console.log(`Performance evidence saved: ${output}`);
} catch (error) {
  result.status = 'incomplete'; result.error = error.stack; save(); throw error;
} finally { await browser.close(); await new Promise(done => server.close(done)); }
