import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
  writeFileSync(join(root, 'index.html'), '<meta property="og:image"><meta name="twitter:card">');
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
