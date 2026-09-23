import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { prepareRelease, validateCatalog, verifyRelease } from './release.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'beatscape-release-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const track = { track_id: 'bs-test-01', title: 'Test Signal', artist: 'Fixture Unit', genre: 'EDM', bpm: 120,
    rights: 'owned', theme: 'beatscape', duration_sec: 10, district: 'Test Grid',
    audio: '/catalog/bs-test-01/audio.m4a', cover: '/catalog/bs-test-01/cover.svg', og: '/catalog/bs-test-01/og.png', charts: {},
    seo: { title: 'Test Signal — BeatScape AI Original', description: 'A 120 BPM browser rhythm game test track.' } };
  const dir = join(root, 'catalog/bs-test-01');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'audio.m4a'), Buffer.from([0,0,0,16,102,116,121,112,77,52,65,32]));
  writeFileSync(join(dir, 'cover.svg'), '<svg/>');
  for (const tier of ['easy', 'standard', 'hard']) {
    track.charts[tier] = `/catalog/bs-test-01/${tier}.json`;
    writeFileSync(join(dir, `${tier}.json`), JSON.stringify({ track_id: track.track_id, tier, format: 1, bpm: 120, audio_offset_ms: 0, total_notes: 1, notes: [{ id: 'n1', type: 'tap', lane: 0, t: 1 }] }));
  }
  writeFileSync(join(root, 'catalog.json'), JSON.stringify({ tracks: [track] }));
  writeFileSync(join(root, 'index.html'), [
    '<!doctype html><html><head>',
    '<title>BeatScape — Feel the Beat, Own the Scape</title>',
    '<meta name="description" content="BeatScape fixture" />',
    '<link rel="canonical" href="https://beatscape.pages.dev/" />',
    '<meta property="og:type" content="website" />',
    '<meta property="og:title" content="BeatScape" />',
    '<meta property="og:description" content="BeatScape fixture" />',
    '<meta property="og:url" content="https://beatscape.pages.dev/" />',
    '<meta property="og:image" content="https://beatscape.pages.dev/og.png" />',
    '<meta property="og:image:alt" content="BeatScape" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="twitter:title" content="BeatScape" />',
    '<meta name="twitter:description" content="BeatScape fixture" />',
    '<meta name="twitter:image" content="https://beatscape.pages.dev/og.png" />',
    '<link rel="manifest" href="/manifest.webmanifest">',
    '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">',
    '<script id="beatscape-early-audio"></script>',
    '<script id="beatscape-early-route"></script>',
    '<link rel="preload" as="fetch" href="/catalog.json" crossorigin="anonymous">',
    '</head><body><div id="root"></div><script type="module" src="/assets/index-fixture.js"></script></body></html>',
  ].join(''));
  const assets = join(root, 'assets');
  mkdirSync(assets, { recursive: true });
  writeFileSync(join(assets, 'index-fixture.js'), 'export {};');
  for (const name of ['Track', 'Duo', 'Characters', 'Radio', 'FirstShift', 'Calibration', 'Settings', 'Leaderboard', 'Profile', 'Legal', 'NotFound']) {
    writeFileSync(join(assets, `${name}-fixture.js`), 'export {};');
  }
  for (const name of ['_headers', '_redirects', 'robots.txt', 'sitemap.xml']) writeFileSync(join(root, name), 'fixture');
  writeFileSync(join(root, '_redirects'), '# beatscape-track-routes:start\n# beatscape-track-routes:end\n/* /index.html 200\n');
  copyFileSync(new URL('../public/og.png', import.meta.url), join(root, 'og.png'));
  copyFileSync(new URL('../public/og.png', import.meta.url), join(dir, 'og.png'));
  copyFileSync(new URL('../public/sw.js', import.meta.url), join(root, 'sw.js'));
  copyFileSync(new URL('../public/manifest.webmanifest', import.meta.url), join(root, 'manifest.webmanifest'));
  const icons = join(root, 'icons');
  mkdirSync(icons, { recursive: true });
  for (const name of ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) {
    copyFileSync(new URL(`../public/icons/${name}`, import.meta.url), join(icons, name));
  }
  return { root, dir, track };
}

test('missing chart fails before deployment', (t) => {
  const { root, dir } = fixture(t);
  rmSync(join(dir, 'hard.json'));
  assert.throws(() => validateCatalog(root), /Missing asset/);
});
test('HTML returned under an audio filename fails validation', (t) => {
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, 'audio.m4a'), '<html>SPA fallback</html>');
  assert.throws(() => validateCatalog(root), /Invalid M4A/);
});
test('a missing or incorrectly sized track social card fails validation', (t) => {
  const { root, dir } = fixture(t);
  rmSync(join(dir, 'og.png'));
  assert.throws(() => validateCatalog(root), /Missing asset/);
  copyFileSync(new URL('../public/icons/icon-512.png', import.meta.url), join(dir, 'og.png'));
  assert.throws(() => validateCatalog(root), /Track OG bs-test-01 must be a 1200x630 PNG/);
});
test('an incorrect judgment-object count fails validation', (t) => {
  const { root, dir } = fixture(t);
  const file = join(dir, 'easy.json');
  const chart = JSON.parse(readFileSync(file));
  chart.total_notes = 99;
  writeFileSync(file, JSON.stringify(chart));
  assert.throws(() => validateCatalog(root), /Note count mismatch/);
});
test('overlapping same-lane press windows fail validation', (t) => {
  const { root, dir } = fixture(t);
  const file = join(dir, 'hard.json');
  const chart = JSON.parse(readFileSync(file));
  chart.notes = [
    { id: 'slide', type: 'slide', lane: 0, to: 1, t: 1, end: 1.35 },
    { id: 'chord', type: 'chord', lanes: [1, 3], t: 1.362 },
  ];
  chart.total_notes = 3;
  writeFileSync(file, JSON.stringify(chart));
  assert.throws(() => validateCatalog(root), /Ambiguous same-lane presses \(<100ms\)/);
});
test('a press inside an occupied Hold lane fails validation', (t) => {
  const { root, dir } = fixture(t);
  const file = join(dir, 'hard.json');
  const chart = JSON.parse(readFileSync(file));
  chart.notes = [
    { id: 'hold', type: 'hold', lane: 1, t: 1, end: 1.5 },
    { id: 'tap', type: 'tap', lane: 1, t: 1.2 },
  ];
  chart.total_notes = 3;
  writeFileSync(file, JSON.stringify(chart));
  assert.throws(() => validateCatalog(root), /Press during occupied Hold lane/);
});
test('duplicate tracks fail validation', (t) => {
  const { root, track } = fixture(t);
  writeFileSync(join(root, 'catalog.json'), JSON.stringify({ tracks: [track, track] }));
  assert.throws(() => validateCatalog(root), /Duplicate track/);
});
test('preparation excludes stream masters and versions changed public assets', (t) => {
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, 'stream.m4a'), 'private master');
  const first = prepareRelease(root);
  const oldShellVersion = readFileSync(join(root, 'sw.js'), 'utf8').match(/const SHELL_VERSION = "([a-f0-9]{16})";/)?.[1];
  assert(oldShellVersion);
  const oldAudio = JSON.parse(readFileSync(join(root, 'catalog.json'))).tracks[0].audio;
  const oldOg = JSON.parse(readFileSync(join(root, 'catalog.json'))).tracks[0].og;
  assert.match(oldOg, /^\/catalog\/bs-test-01\/og\.png\?v=[a-f0-9]{16}$/);
  writeFileSync(join(dir, 'audio.m4a'), Buffer.from([0,0,0,16,102,116,121,112,77,52,65,32,1]));
  const second = prepareRelease(root);
  const newWorker = readFileSync(join(root, 'sw.js'), 'utf8');
  const newShellVersion = newWorker.match(/const SHELL_VERSION = "([a-f0-9]{16})";/)?.[1];
  const newAudio = JSON.parse(readFileSync(join(root, 'catalog.json'))).tracks[0].audio;
  assert.notEqual(oldAudio, newAudio);
  assert.notEqual(first.artifactSha256, second.artifactSha256);
  assert.notEqual(oldShellVersion, newShellVersion);
  assert(!newWorker.includes('skipWaiting('));
  assert(!Object.keys(second.files).some((file) => file.endsWith('stream.m4a')));
  assert.equal(typeof second.files['catalog/bs-test-01/og.png'], 'string');
});
test('tampering with a prepared artifact invalidates its release identity', (t) => {
  const { root, dir } = fixture(t);
  prepareRelease(root);
  writeFileSync(join(dir, 'cover.svg'), '<svg>changed</svg>');
  assert.throws(() => verifyRelease(root), /Release modified/);
});
test('a release without an install icon is rejected', (t) => {
  const { root } = fixture(t);
  rmSync(join(root, 'icons/icon-512.png'));
  assert.throws(() => prepareRelease(root), /Missing hosting file/);
});

test('a release without one exact Track route chunk is rejected', (t) => {
  const { root } = fixture(t);
  rmSync(join(root, 'assets/Track-fixture.js'));
  assert.throws(() => prepareRelease(root), /Expected exactly one Track route chunk, found 0/);
});

test('preparation emits crawlable track cards, sitemap entries and exact route rewrites', (t) => {
  const { root } = fixture(t);
  const release = prepareRelease(root);
  const route = 'track/bs-test-01/index.html';
  const html = readFileSync(join(root, route), 'utf8');
  assert.match(html, /<title>Test Signal — BeatScape AI Original<\/title>/);
  assert.match(html, /name="description" content="A 120 BPM browser rhythm game test track\. Choose a chart and play solo or Duo in your browser\."/);
  assert.match(html, /rel="canonical" href="https:\/\/beatscape\.pages\.dev\/track\/bs-test-01"/);
  assert.match(html, /property="og:title" content="Test Signal — BeatScape AI Original"/);
  assert.match(html, /property="og:url" content="https:\/\/beatscape\.pages\.dev\/track\/bs-test-01"/);
  assert.match(html, /property="og:image" content="https:\/\/beatscape\.pages\.dev\/catalog\/bs-test-01\/og\.png\?v=[a-f0-9]{16}"/);
  assert.match(html, /name="twitter:title" content="Test Signal — BeatScape AI Original"/);
  assert.match(html, /name="twitter:image" content="https:\/\/beatscape\.pages\.dev\/catalog\/bs-test-01\/og\.png\?v=[a-f0-9]{16}"/);
  assert.match(html, /"@type":"MusicRecording"/);
  assert.match(html, /<script id="beatscape-early-audio"><\/script>/);
  assert.match(html, /<link rel="modulepreload" crossorigin href="\/assets\/Track-fixture\.js" data-beatscape-route-preload="track" \/>/);
  assert(!html.includes('__beatscapeEarlyAudio'));
  assert.equal(typeof release.files[route], 'string');

  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /<loc>https:\/\/beatscape\.pages\.dev\/track\/bs-test-01<\/loc>/);
  const redirects = readFileSync(join(root, '_redirects'), 'utf8');
  for (const source of ['/track/bs-test-01', '/track/bs-test-01/', '/beatscape/track/bs-test-01', '/beatscape/track/bs-test-01/']) {
    assert.match(redirects, new RegExp(`^${source.replaceAll('/', '\\/')} /track/bs-test-01/index\\.html 200$`, 'm'));
  }
  assert(redirects.indexOf('/track/bs-test-01 ') < redirects.indexOf('/* /index.html 200'));
});

function runBootstrap(html, pathname, fetchAudio = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })) {
  const listeners = new Map();
  const timers = new Map();
  const calls = [];
  const window = {
    location: { pathname },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); },
    setTimeout: (fn) => { timers.set(1, fn); return 1; },
    clearTimeout: (id) => timers.delete(id),
  };
  const script = html.match(/<script id="beatscape-early-audio">([\s\S]*?)<\/script>/)[1];
  runInNewContext(script, { window, AbortController, fetch: (...args) => { calls.push(args); return fetchAudio(...args); } });
  return { window, calls, listeners, timers };
}

function runRouteBootstrap(html, pathname, existing = null) {
  const appended = [];
  const document = {
    head: { append: (node) => appended.push(node) },
    createElement: (tagName) => ({
      tagName,
      setAttribute(name, value) { this[name] = value; },
    }),
    querySelector: () => existing,
  };
  const script = html.match(/<script id="beatscape-early-route">([\s\S]*?)<\/script>/)[1];
  runInNewContext(script, { window: { location: { pathname } }, document });
  return { appended, existing };
}

test('prepared head preloads the exact direct lazy route without spending bytes on eager routes', (t) => {
  const { root } = fixture(t);
  prepareRelease(root);
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  for (const [pathname, key, file] of [
    ['/track/bs-test-01/', 'track', 'Track'],
    ['/duo/bs-test-01', 'duo', 'Duo'],
    ['/beatscape/settings/', 'settings', 'Settings'],
    ['/characters', 'characters', 'Characters'],
    ['/privacy', 'legal', 'Legal'],
    ['/missing', 'notFound', 'NotFound'],
  ]) {
    const { appended } = runRouteBootstrap(html, pathname);
    assert.equal(appended.length, 1, pathname);
    assert.equal(appended[0].rel, 'modulepreload');
    assert.equal(appended[0].crossOrigin, 'anonymous');
    assert.equal(appended[0].href, `/assets/${file}-fixture.js`);
    assert.equal(appended[0]['data-beatscape-route-preload'], key);
  }
  for (const pathname of ['/', '/beatscape/', '/library', '/play/bs-test-01', '/results']) {
    assert.equal(runRouteBootstrap(html, pathname).appended.length, 0, pathname);
  }
});

test('prepared head starts one exact versioned request before the app, and preparation is idempotent', async (t) => {
  const { root } = fixture(t);
  const first = prepareRelease(root);
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const audio = JSON.parse(readFileSync(join(root, 'catalog.json'))).tracks[0].audio;
  assert.match(audio, /\?v=[a-f0-9]{16}$/);
  const second = prepareRelease(root);
  assert.equal(first.artifactSha256, second.artifactSha256);
  assert.match(readFileSync(join(root, 'sw.js'), 'utf8'), /const SHELL_VERSION = "[a-f0-9]{16}";/);
  assert.equal(readFileSync(join(root, 'index.html'), 'utf8'), html);

  for (const route of ['/play/bs-test-01', '/duo/bs-test-01/', '/beatscape/play/bs-test-01', '/beatscape/duo/bs-test-01', '/play/bs%2Dtest%2D01']) {
    const { window, calls, listeners, timers } = runBootstrap(html, route);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], audio);
    const lease = window.__beatscapeEarlyAudio.take(audio);
    assert.equal(lease.controller.signal, calls[0][1].signal);
    assert.equal((await lease.promise).byteLength, 8);
    assert.equal(window.__beatscapeEarlyAudio, undefined);
    assert.equal(listeners.size, 0);
    assert.equal(timers.size, 0);
  }
});

test('home, library, unknown tracks and malformed IDs never download speculative audio', (t) => {
  const { root } = fixture(t);
  prepareRelease(root);
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  for (const path of ['/', '/beatscape/', '/library', '/track/bs-test-01', '/play/unknown', '/play/__proto__', '/play/%ZZ', '/play/bs-test-01/results']) {
    const { calls, window, timers, listeners } = runBootstrap(html, path);
    assert.equal(calls.length, 0, path);
    assert.equal(window.__beatscapeEarlyAudio, undefined);
    assert.equal(timers.size + listeners.size, 0);
  }
});

test('mismatched versions, leaving the route, unload and timeout discard the initial request', (t) => {
  const { root } = fixture(t);
  prepareRelease(root);
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  for (const reason of ['version', 'route', 'popstate', 'pagehide', 'timeout']) {
    const state = runBootstrap(html, '/play/bs-test-01', () => new Promise(() => {}));
    if (reason === 'version') assert.equal(state.window.__beatscapeEarlyAudio.take('/catalog/bs-test-01/audio.m4a?v=new'), null);
    if (reason === 'route' || reason === 'popstate') {
      state.window.location.pathname = '/library';
      if (reason === 'route') state.window.__beatscapeEarlyAudio.discardIfStale();
      else state.listeners.get('popstate')();
    }
    if (reason === 'pagehide') state.listeners.get('pagehide')();
    if (reason === 'timeout') state.timers.get(1)();
    assert.equal(state.calls[0][1].signal.aborted, true, reason);
    assert.equal(state.window.__beatscapeEarlyAudio, undefined);
    assert.equal(state.listeners.size + state.timers.size, 0);
  }
});

test('speculative errors are handled and discarded before normal loading retries', async (t) => {
  const { root } = fixture(t);
  prepareRelease(root);
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  for (const fetchAudio of [async () => { throw new Error('offline'); }, async () => ({ ok: false, status: 503 }), async () => ({ ok: true, arrayBuffer: async () => { throw new Error('body interrupted'); } })]) {
    const state = runBootstrap(html, '/play/bs-test-01', fetchAudio);
    await state.window.__beatscapeEarlyAudio.promise.catch(() => {});
    assert.equal(state.window.__beatscapeEarlyAudio, undefined);
    assert.equal(state.calls[0][1].signal.aborted, true);
    assert.equal(state.listeners.size + state.timers.size, 0);
  }
});

test('the release requires its early audio head slot and catalog preload', (t) => {
  const { root } = fixture(t);
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  writeFileSync(join(root, 'index.html'), html.replace('<script id="beatscape-early-audio"></script>', ''));
  assert.throws(() => prepareRelease(root), /head audio bootstrap/);
  writeFileSync(join(root, 'index.html'), html.replace('href="/catalog.json"', 'href="https://example.com/catalog.json"'));
  assert.throws(() => prepareRelease(root), /catalog preload\/base/);
});
