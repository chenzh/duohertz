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
  const track = { track_id: 'bs-test-01', rights: 'owned', theme: 'beatscape', duration_sec: 10,
    audio: '/catalog/bs-test-01/audio.m4a', cover: '/catalog/bs-test-01/cover.svg', charts: {} };
  const dir = join(root, 'catalog/bs-test-01');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'audio.m4a'), Buffer.from([0,0,0,16,102,116,121,112,77,52,65,32]));
  writeFileSync(join(dir, 'cover.svg'), '<svg/>');
  for (const tier of ['easy', 'standard', 'hard']) {
    track.charts[tier] = `/catalog/bs-test-01/${tier}.json`;
    writeFileSync(join(dir, `${tier}.json`), JSON.stringify({ track_id: track.track_id, tier, format: 1, bpm: 120, audio_offset_ms: 0, total_notes: 1, notes: [{ id: 'n1', type: 'tap', lane: 0, t: 1 }] }));
  }
  writeFileSync(join(root, 'catalog.json'), JSON.stringify({ tracks: [track] }));
  writeFileSync(join(root, 'index.html'), '<!doctype html><html><head><meta property="og:image"><meta name="twitter:card"><script id="beatscape-early-audio"></script><link rel="preload" as="fetch" href="/catalog.json" crossorigin="anonymous"></head><body></body></html>');
  for (const name of ['_headers', '_redirects', 'robots.txt', 'sitemap.xml']) writeFileSync(join(root, name), 'fixture');
  copyFileSync(new URL('../public/og.png', import.meta.url), join(root, 'og.png'));
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
test('an incorrect judgment-object count fails validation', (t) => {
  const { root, dir } = fixture(t);
  const file = join(dir, 'easy.json');
  const chart = JSON.parse(readFileSync(file));
  chart.total_notes = 99;
  writeFileSync(file, JSON.stringify(chart));
  assert.throws(() => validateCatalog(root), /Note count mismatch/);
});
test('duplicate tracks fail validation', (t) => {
  const { root, track } = fixture(t);
  writeFileSync(join(root, 'catalog.json'), JSON.stringify({ tracks: [track, track] }));
  assert.throws(() => validateCatalog(root), /Duplicate track/);
});
test('preparation excludes stream masters and versions changed game assets', (t) => {
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, 'stream.m4a'), 'private master');
  writeFileSync(join(dir, 'og.png'), 'untracked local-only card');
  const first = prepareRelease(root);
  const oldAudio = JSON.parse(readFileSync(join(root, 'catalog.json'))).tracks[0].audio;
  writeFileSync(join(dir, 'audio.m4a'), Buffer.from([0,0,0,16,102,116,121,112,77,52,65,32,1]));
  const second = prepareRelease(root);
  const newAudio = JSON.parse(readFileSync(join(root, 'catalog.json'))).tracks[0].audio;
  assert.notEqual(oldAudio, newAudio);
  assert.notEqual(first.artifactSha256, second.artifactSha256);
  assert(!Object.keys(second.files).some((file) => file.endsWith('stream.m4a')));
  assert(!Object.keys(second.files).some((file) => file.startsWith('catalog/') && file.endsWith('og.png')));
});
test('tampering with a prepared artifact invalidates its release identity', (t) => {
  const { root, dir } = fixture(t);
  prepareRelease(root);
  writeFileSync(join(dir, 'cover.svg'), '<svg>changed</svg>');
  assert.throws(() => verifyRelease(root), /Release modified/);
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

test('prepared head starts one exact versioned request before the app, and preparation is idempotent', async (t) => {
  const { root } = fixture(t);
  const first = prepareRelease(root);
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const audio = JSON.parse(readFileSync(join(root, 'catalog.json'))).tracks[0].audio;
  assert.match(audio, /\?v=[a-f0-9]{16}$/);
  const second = prepareRelease(root);
  assert.equal(first.artifactSha256, second.artifactSha256);
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
