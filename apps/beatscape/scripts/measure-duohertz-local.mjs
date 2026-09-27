/** Local-only duohertz diagnostic: candidate-sized synthetic catalog, not release evidence. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync } from 'node:zlib';
import { chromium } from '@playwright/test';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(app, '../..');
const dist = join(app, 'dist-duohertz');
const candidates = join(app, 'candidates', 'duohertz');
const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const repeats = Number(option('--repeats', '3'));
const fullRun = args.includes('--full-run');
const fullRunInput = args.includes('--full-run-input');
const inputMemory = args.includes('--input-memory');
const output = resolve(option('--output', join(root, 'data', 'duohertz-performance-local',
  new Date().toISOString().replaceAll(':', '-'))));
assert(Number.isInteger(repeats) && repeats >= 1 && repeats <= 10, 'Expected 1–10 repeats');
assert(Number(fullRun) + Number(fullRunInput) + Number(inputMemory) <= 1,
  'Choose one of --full-run, --full-run-input or --input-memory');
assert(existsSync(join(dist, 'index.html')), 'Build the local duohertz preview first');

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const genres = ['Melodic House', 'Synthwave', 'Future Bass', 'Drum & Bass', 'Trance'];
const trackDirs = readdirSync(candidates).filter(name => /^dh-\d{3}-[a-z0-9-]+$/.test(name)).sort();
assert.equal(trackDirs.length, 105, 'Expected 105 candidate tracks');
const tracks = trackDirs.map(name => {
  const folder = join(candidates, name);
  const manifestBytes = readFileSync(join(folder, 'manifest.json'));
  const manifest = JSON.parse(manifestBytes);
  const id = manifest.track_id;
  assert.equal(id, name);
  assert(genres.includes(manifest.subgenre));
  const prefix = `/catalog/${id}/`;
  const thumb = join(candidates, 'thumbnails', `${id}.webp`);
  assert(existsSync(thumb), `Missing candidate thumbnail: ${id}`);
  return {
    track_id: id, title: manifest.title, artist: manifest.artist,
    genre: manifest.subgenre, bpm: manifest.bpm,
    duration_sec: manifest.duration_sec, stream_duration_sec: manifest.stream_duration_sec,
    theme: 'duohertz', chart_format: 2, rights: 'signed_catalog_candidate',
    audio: `${prefix}audio.m4a`, stream_audio: `${prefix}stream.m4a`,
    preview: `${prefix}preview_48s.m4a`, cover: `${prefix}cover-art.png`,
    cover_thumb: `${prefix}cover-thumb.webp`, cover_thumb_sha256: sha(readFileSync(thumb)),
    og: `${prefix}og.png`, manifest_sha256: sha(manifestBytes),
    charts: Object.fromEntries(['easy', 'standard', 'hard'].map(tier => [tier, `${prefix}${tier}.json`])),
  };
});
for (const genre of genres) assert.equal(tracks.filter(track => track.genre === genre).length, 21);
const fixture = Buffer.from(JSON.stringify({
  version: 2, brand: 'duohertz', site_and_deployment_approval: true,
  source_observations_sha256: 'a'.repeat(64), source_catalog_signoff_sha256: 'a'.repeat(64), tracks,
}));
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.m4a': 'audio/mp4', '.woff2': 'font/woff2',
};
const payloadCache = new Map();
const requests = [];
const profiles = [
  { name: 'desktop', viewport: { width: 1280, height: 900 }, scale: 1, mobile: false,
    cpuRate: 1, downMbps: 25, upMbps: 5, latencyMs: 40 },
  { name: 'mobile-emulated', viewport: { width: 412, height: 915 }, scale: 2, mobile: true,
    cpuRate: 4, downMbps: 10, upMbps: 2, latencyMs: 100 },
];

function artifactHash(folder) {
  const fingerprint = createHash('sha256');
  function walk(current) {
    for (const item of readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(current, item.name);
      if (item.isDirectory()) walk(path);
      else {
        assert(item.isFile(), `Unexpected build entry: ${path}`);
        fingerprint.update(relative(folder, path) + '\0' + sha(readFileSync(path)) + '\n');
      }
    }
  }
  walk(folder);
  return fingerprint.digest('hex');
}

function fileFor(pathname) {
  if (pathname === '/duohertz-v2/catalog.json') return { bytes: fixture, type: '.json' };
  const match = /^\/catalog\/(dh-\d{3}-[a-z0-9-]+)\/(cover-thumb\.webp|cover-art\.png|audio\.m4a|easy\.json|standard\.json|hard\.json)$/.exec(pathname);
  if (match) {
    if (!trackDirs.includes(match[1])) return null;
    const file = match[2] === 'cover-thumb.webp'
      ? join(candidates, 'thumbnails', `${match[1]}.webp`)
      : join(candidates, match[1], match[2]);
    return { file, type: extname(file) };
  }
  const target = resolve(dist, '.' + pathname);
  if (target !== dist && !target.startsWith(dist + sep)) return null;
  if (!existsSync(target) && extname(pathname)) return null;
  const file = existsSync(target) && extname(target) ? target : join(dist, 'index.html');
  if (!existsSync(file)) return null;
  return { file, type: extname(file) };
}

function encodedPayload(source) {
  const key = source.file ?? 'fixture';
  if (payloadCache.has(key)) return payloadCache.get(key);
  const raw = source.bytes ?? readFileSync(source.file);
  const compress = ['.html', '.js', '.css', '.json'].includes(source.type);
  const payload = { bytes: compress ? brotliCompressSync(raw) : raw, compress };
  payloadCache.set(key, payload);
  return payload;
}

// Keep the first browser sample from paying one-off synchronous Brotli work.
encodedPayload({ bytes: fixture, type: '.json' });
function warmText(folder) {
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, item.name);
    if (item.isDirectory()) warmText(path);
    else if (['.html', '.js', '.css', '.json'].includes(extname(path))) {
      encodedPayload({ file: path, type: extname(path) });
    }
  }
}
warmText(dist);

const server = createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const source = fileFor(pathname);
    if (!source) { response.writeHead(404).end(); return; }
    const { bytes, compress } = encodedPayload(source);
    response.setHeader('Content-Type', mime[source.type] ?? 'application/octet-stream');
    response.setHeader('Content-Length', bytes.length);
    response.setHeader('Cache-Control', pathname.startsWith('/assets/')
      ? 'public, max-age=31536000, immutable' : 'no-store');
    if (compress) response.setHeader('Content-Encoding', 'br');
    requests.push({ pathname, bytes: bytes.length });
    response.writeHead(200).end(bytes);
  } catch (error) { response.writeHead(500).end(String(error)); }
});
await new Promise((done, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', done); });
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const report = {
  schema: 1, generatedAt: new Date().toISOString(), artifactSha256: artifactHash(dist),
  fixtureSha256: sha(fixture), fixture: 'synthetic approved catalog made from 105 unreviewed local candidates',
  environment: { browser: await browser.version(), host: '127.0.0.1', origin: 'local Brotli static server',
    network: 'CDP throughput/latency emulation; not a public CDN',
    deviceCoverage: 'desktop and mobile emulation only; no physical-device acceptance' },
  metricDefinitions: {
    readyMs: 'Navigation to loaded home cards or visible one-key start control, including local fonts.',
    audioStartMs: 'Start-button click to visible playing state; scheduled audible playback starts later.',
    transferBytes: 'Encoded HTTP response bodies through the observation, including first-track audio after click.',
    fullRunFrames: 'Independent requestAnimationFrame samples while first track plays to its completion status; no note input.',
    fullRunInputFrames: 'Independent requestAnimationFrame samples during first-track full run with Playwright Space key events about every 250 ms; scripted load only, not accurate play.',
    inputMemory: 'Same-page Chromium heap and DOM counters after two forced GCs, 120 Playwright Space key events per run, and a 1-second settle; diagnostic, not a leak proof.',
  },
  verdict: 'diagnostic only; no duohertz release performance budget or human approval',
  profiles, repeats, observations: [],
};
mkdirSync(output, { recursive: true });
const save = () => writeFileSync(join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
save();

async function sample(profile, scenario, iteration) {
  const context = await browser.newContext({ viewport: profile.viewport, deviceScaleFactor: profile.scale,
    isMobile: profile.mobile, hasTouch: profile.mobile, serviceWorkers: 'block' });
  const page = await context.newPage();
  const external = [];
  await page.route(/^https?:\/\//, route => {
    if (!route.request().url().startsWith(base + '/')) {
      external.push(route.request().url());
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
  await page.addInitScript(() => {
    window.__duohertzPerf = { lcpMs: null, longTasks: [] };
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) window.__duohertzPerf.lcpMs = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) window.__duohertzPerf.longTasks.push(entry.duration);
    }).observe({ type: 'longtask', buffered: true });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: profile.latencyMs,
    downloadThroughput: profile.downMbps * 1_000_000 / 8,
    uploadThroughput: profile.upMbps * 1_000_000 / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuRate });
  const requestStart = requests.length;
  try {
    const path = scenario === 'home' ? '/' : `/play/${tracks[0].track_id}`;
    await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    if (scenario === 'home') {
      await page.getByRole('heading', { name: 'duohertz', exact: true }).waitFor();
      await page.waitForFunction(() => {
        const images = [...document.querySelectorAll('.dh-hub__track img')];
        return images.length === 5 && images.every(image => image.complete && image.naturalWidth > 0);
      });
    } else {
      await page.getByRole('button', { name: 'Start one-key beat' }).waitFor();
    }
    await page.evaluate(() => document.fonts.ready);
    const readyMs = await page.evaluate(() => performance.now());
    let audioStartMs = null;
    if (scenario !== 'home') {
      const button = page.getByRole('button', { name: 'Start one-key beat' });
      await button.evaluate(element => element.addEventListener('click', () => {
        window.__duohertzPerf.clickAtMs = performance.now();
      }, { once: true, capture: true }));
      await button.click();
      await page.getByRole('button', { name: 'Pause' }).waitFor({ timeout: 15000 });
      audioStartMs = await page.evaluate(() => performance.now() - window.__duohertzPerf.clickAtMs);
    }
    let fullRunFrames = null;
    let scriptedInputs = null;
    if (scenario === 'full-run' || scenario === 'full-run-input') {
      await page.evaluate(() => {
        const perf = window.__duohertzPerf;
        perf.frames = [];
        perf.recordFrames = true;
        perf.longTasks.length = 0;
        let prior = null;
        const record = time => {
          if (!perf.recordFrames) return;
          if (prior !== null) perf.frames.push(time - prior);
          prior = time;
          requestAnimationFrame(record);
        };
        requestAnimationFrame(record);
      });
      if (scenario === 'full-run-input') {
        scriptedInputs = 0;
        await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
        const completed = page.getByRole('status').filter({ hasText: 'Track complete.' });
        while (await completed.count() === 0) {
          await page.keyboard.press('Space');
          scriptedInputs++;
          await page.waitForTimeout(250);
          assert(scriptedInputs < 440, 'Input run did not reach completion in time');
        }
      }
      await page.getByRole('status').filter({ hasText: 'Track complete.' }).waitFor({ timeout: 110000 });
      fullRunFrames = await page.evaluate(() => {
        const perf = window.__duohertzPerf;
        perf.recordFrames = false;
        return perf.frames;
      });
      assert(fullRunFrames.length > 1000, 'Full run did not collect enough animation frames');
      if (scenario === 'full-run-input') {
        assert(scriptedInputs >= 200, 'Full run sent too few inputs');
      }
    }
    await page.waitForTimeout(200);
    const metrics = await page.evaluate(() => ({
      fcpMs: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime ?? null,
      lcpMs: window.__duohertzPerf.lcpMs,
      longTasks: window.__duohertzPerf.longTasks,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    }));
    const traffic = requests.slice(requestStart);
    const sortedFrames = fullRunFrames?.toSorted((a, b) => a - b);
    const frameMetrics = sortedFrames && {
      count: sortedFrames.length,
      medianMs: sortedFrames[Math.floor(sortedFrames.length * 0.5)],
      p95Ms: sortedFrames[Math.floor(sortedFrames.length * 0.95)],
      p99Ms: sortedFrames[Math.floor(sortedFrames.length * 0.99)],
      maxMs: sortedFrames.at(-1),
      over33Ms: sortedFrames.filter(value => value > 33).length,
      over50Ms: sortedFrames.filter(value => value > 50).length,
    };
    const result = { profile: profile.name, scenario, iteration, readyMs, audioStartMs,
      ...(scenario === 'full-run-input' ? { scriptedInputs } : {}),
      ...(frameMetrics ? { frameMetrics } : {}),
      ...metrics, requestCount: traffic.length, transferBytes: traffic.reduce((sum, item) => sum + item.bytes, 0),
      largestTransfers: traffic.toSorted((a, b) => b.bytes - a.bytes).slice(0, 6),
      catalogBytes: traffic.filter(item => item.pathname === '/duohertz-v2/catalog.json')
        .reduce((sum, item) => sum + item.bytes, 0),
      audioRequestsBeforeInteraction: scenario === 'home' ? traffic.filter(item => item.pathname.endsWith('.m4a')).length : null,
      externalRequests: external, errors: [] };
    assert.equal(result.horizontalOverflow, false, `${profile.name} ${scenario} horizontal overflow`);
    assert.equal(external.length, 0, 'Unexpected external request');
    if (scenario === 'home') assert.equal(result.audioRequestsBeforeInteraction, 0, 'Home prefetched audio');
    if (scenario === 'full-run' || scenario === 'full-run-input') {
      assert.equal(traffic.filter(item => item.pathname.endsWith('/cover-art.png')).length, 0,
        'A small result card loaded full-size artwork');
    }
    return result;
  } finally { await context.close(); }
}

async function sampleInputMemory() {
  const context = await browser.newContext({ viewport: profiles[0].viewport,
    deviceScaleFactor: profiles[0].scale, serviceWorkers: 'block' });
  const page = await context.newPage();
  const external = [];
  const errors = [];
  await page.route(/^https?:\/\//, route => {
    if (!route.request().url().startsWith(base + '/')) {
      external.push(route.request().url());
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
  page.on('pageerror', error => errors.push(String(error)));
  const cdp = await context.newCDPSession(page);
  const point = async label => {
    await cdp.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(150);
    await cdp.send('HeapProfiler.collectGarbage');
    return { label, heap: await cdp.send('Runtime.getHeapUsage'),
      dom: await cdp.send('Memory.getDOMCounters'),
      activePulses: await page.locator('.dh-lab__pulse').count() };
  };
  try {
    await page.goto(`${base}/play/${tracks[0].track_id}`, { waitUntil: 'domcontentloaded' });
    const start = page.getByRole('button', { name: 'Start one-key beat' });
    await start.waitFor();
    await page.evaluate(() => {
      window.__duohertzInputPulses = 0;
      new MutationObserver(records => {
        for (const record of records) for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          window.__duohertzInputPulses += Number(node.matches('.dh-lab__pulse'))
            + node.querySelectorAll('.dh-lab__pulse').length;
        }
      }).observe(document.body, { subtree: true, childList: true });
    });
    const points = [];
    const runCount = 10;
    for (let run = 1; run <= runCount; run++) {
      await (run === 1 ? start : page.getByRole('button', { name: 'Start one-key beat' })).click();
      await page.getByRole('button', { name: 'Pause' }).waitFor({ timeout: 15000 });
      await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
      if (run === 1) {
        await page.waitForTimeout(1000);
        points.push(await point('playing-warmup'));
      }
      const pulsesBefore = await page.evaluate(() => window.__duohertzInputPulses);
      for (let hit = 0; hit < 120; hit++) await page.keyboard.press('Space');
      await page.waitForTimeout(1000);
      const inputPulses = await page.evaluate(() => window.__duohertzInputPulses) - pulsesBefore;
      assert(inputPulses >= 120, `Run ${run} did not render every input pulse: ${inputPulses}`);
      assert.equal(await page.getByRole('button', { name: 'Pause' }).count(), 1,
        `Run ${run} ended before the input sample completed`);
      points.push({ ...await point(`run-${run}-after-120-inputs`), inputPulses });
      await page.getByRole('button', { name: 'Stop' }).click();
      await page.getByRole('button', { name: 'Start one-key beat' }).waitFor();
      await page.waitForTimeout(250);
      points.push(await point(`run-${run}-stopped`));
    }
    assert.equal(external.length, 0, 'Unexpected external request');
    assert.deepEqual(errors, [], 'Browser runtime error');
    assert(points.every(item => item.activePulses === 0), 'Pulse DOM did not settle');
    return { profile: 'desktop', scenario: 'input-memory', trackId: tracks[0].track_id,
      runCount, inputsPerRun: 120, points, externalRequests: external, errors };
  } finally { await context.close(); }
}

try {
  if (inputMemory) {
    try {
      const result = await sampleInputMemory();
      report.observations.push(result);
      console.log(`desktop input-memory: ${result.runCount} runs × ${result.inputsPerRun} keys`);
    } catch (error) {
      report.observations.push({ profile: 'desktop', scenario: 'input-memory', error: String(error) });
      throw error;
    } finally { save(); }
  } else for (const profile of profiles) {
    for (const scenario of (fullRun || fullRunInput
      ? ['home', 'play', fullRunInput ? 'full-run-input' : 'full-run'] : ['home', 'play'])) {
      for (let iteration = 1; iteration <= (scenario.startsWith('full-run') ? 1 : repeats); iteration++) {
        try {
          const result = await sample(profile, scenario, iteration);
          report.observations.push(result);
          console.log(`${profile.name} ${scenario} #${iteration}: ready ${result.readyMs.toFixed(0)} ms` +
            (result.audioStartMs === null ? '' : `, playing-state ${result.audioStartMs.toFixed(0)} ms`) +
            `, ${Math.round(result.transferBytes / 1024)} KiB`);
        } catch (error) {
          report.observations.push({ profile: profile.name, scenario, iteration, error: String(error) });
          throw error;
        } finally { save(); }
      }
    }
  }
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
  save();
}
console.log(`Local diagnostic report: ${join(output, 'results.json')}`);
