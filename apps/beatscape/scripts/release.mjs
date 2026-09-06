import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startEarlyAudio } from './early-audio.mjs';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(app, 'dist');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const earlyAudioTag = /<script id="beatscape-early-audio">[\s\S]*?<\/script>/g;

function earlyAudioScript(html, catalog) {
  const tags = [...html.matchAll(earlyAudioTag)];
  assert(tags.length === 1 && tags[0].index < html.indexOf('</head>'), 'Missing/invalid head audio bootstrap');
  const base = html.match(/<link\b[^>]*href="([^"?#]*\/)catalog\.json"[^>]*>/)?.[1];
  assert(base && base.startsWith('/') && !base.startsWith('//'), 'Missing catalog preload/base');
  // Escape HTML-significant characters even if future catalog IDs contain them.
  const json = JSON.stringify(Object.fromEntries(catalog.tracks.map(track => [track.track_id, track.audio])))
    .replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `<script id="beatscape-early-audio">(${startEarlyAudio.toString()})(${json},${JSON.stringify(base)});</script>`;
}
export function filesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    assert(!entry.isSymbolicLink(), `Symlink in release: ${path}`);
    return entry.isDirectory() ? filesIn(path) : [path];
  }).sort();
}

export function assetPath(root, url) {
  assert(typeof url === 'string' && url.startsWith('/catalog/'), `Invalid catalog asset URL: ${url}`);
  const path = resolve(root, url.split('?')[0].slice(1));
  assert(path.startsWith(resolve(root) + sep), `Asset escapes release: ${url}`);
  assert(existsSync(path) && statSync(path).isFile() && statSync(path).size > 0, `Missing asset: ${url}`);
  return path;
}

export function validateCatalog(root) {
  const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'));
  assert(catalog.tracks?.length > 0, 'Empty catalog');
  const ids = new Set();
  for (const track of catalog.tracks) {
    assert(!ids.has(track.track_id), `Duplicate track: ${track.track_id}`);
    ids.add(track.track_id);
    assert(track.rights === 'owned' && track.theme === 'beatscape', `Content metadata: ${track.track_id}`);
    const audio = readFileSync(assetPath(root, track.audio));
    assert(audio.toString('ascii', 4, 8) === 'ftyp', `Invalid M4A: ${track.audio}`);
    assert(readFileSync(assetPath(root, track.cover), 'utf8').includes('<svg'), `Invalid cover: ${track.cover}`);
    if (track.preview) assetPath(root, track.preview);
    for (const tier of ['easy', 'standard', 'hard']) {
      const chart = JSON.parse(readFileSync(assetPath(root, track.charts[tier]), 'utf8'));
      assert(chart.track_id === track.track_id && chart.tier === tier && chart.format === 1, `Chart identity: ${track.track_id}/${tier}`);
      assert(chart.notes?.length > 0 && Number.isFinite(chart.bpm) && chart.bpm > 0, `Empty/invalid chart: ${track.track_id}/${tier}`);
      assert(Number.isFinite(chart.audio_offset_ms), `Chart offset: ${track.track_id}/${tier}`);
      let count = 0;
      let previous = -Infinity;
      const noteIds = new Set();
      for (const note of chart.notes) {
        assert(Number.isFinite(note.t) && note.t >= 0 && note.t >= previous && note.t <= track.duration_sec + 1, `Chart timing: ${track.track_id}/${tier}/${note.id}`);
        assert(!noteIds.has(note.id), `Duplicate note: ${track.track_id}/${tier}/${note.id}`);
        noteIds.add(note.id);
        previous = note.t;
        const lanes = note.type === 'chord' ? note.lanes : [note.lane];
        assert(Array.isArray(lanes) && lanes.length > 0 && new Set(lanes).size === lanes.length && lanes.every((lane) => [0, 1, 2, 3].includes(lane)), `Invalid lanes: ${track.track_id}/${tier}`);
        assert(['tap', 'hold', 'chord', 'slide'].includes(note.type), `Unknown note type: ${note.type}`);
        if (note.type === 'hold' || note.type === 'slide') {
          assert(Number.isFinite(note.end) && note.end > note.t && note.end <= track.duration_sec + 1, `Invalid tail: ${track.track_id}/${tier}`);
        }
        if (note.type === 'slide') assert([0, 1, 2, 3].includes(note.to) && Math.abs(note.to - note.lane) === 1, `Invalid slide: ${track.track_id}/${tier}`);
        count += note.type === 'hold' ? 2 : lanes.length;
      }
      assert(chart.total_notes === count, `Note count mismatch: ${track.track_id}/${tier}: ${count} != ${chart.total_notes}`);
    }
  }
  return catalog;
}

export function prepareRelease(root = dist) {
  const catalog = validateCatalog(root);
  // Only generated output is pruned. Masters and human QA stay in the workspace.
  for (const file of filesIn(root)) {
    const path = relative(root, file).split(sep).join('/');
    if (path.startsWith('catalog/') && (path.endsWith('/stream.m4a') || path.endsWith('/og.png'))) rmSync(file);
  }
  rmSync(join(root, 'reports'), { recursive: true, force: true });
  for (const track of catalog.tracks) {
    const version = (url) => `${url.split('?')[0]}?v=${sha(readFileSync(assetPath(root, url))).slice(0, 16)}`;
    for (const field of ['audio', 'cover', 'preview']) if (track[field]) track[field] = version(track[field]);
    for (const tier of ['easy', 'standard', 'hard']) track.charts[tier] = version(track.charts[tier]);
    // Per-track OG files are optional local outputs; keep the shipped site card as fallback.
    if (!existsSync(join(root, (track.og ?? '').replace(/^\//, '')))) track.og = '/og.png';
  }
  writeFileSync(join(root, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  const htmlPath = join(root, 'index.html');
  const html = readFileSync(htmlPath, 'utf8');
  writeFileSync(htmlPath, html.replace(earlyAudioTag, () => earlyAudioScript(html, catalog)));
  const files = Object.fromEntries(filesIn(root).filter((p) => p !== join(root, 'release.json'))
    .map((p) => [relative(root, p).split(sep).join('/'), sha(readFileSync(p))]));
  const manifest = {
    schema: 1,
    builtAt: new Date().toISOString(),
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: app, encoding: 'utf8' }).trim(),
    sourceDirty: Boolean(execFileSync('git', ['status', '--porcelain', '--', '.'], { cwd: app, encoding: 'utf8' }).trim()),
    sourceCatalogSha256: sha(readFileSync(join(app, 'public/catalog.json'))),
    catalogSha256: files['catalog.json'],
    trackCount: catalog.tracks.length,
    chartCount: catalog.tracks.length * 3,
    artifactSha256: sha(JSON.stringify(files)),
    files,
  };
  writeFileSync(join(root, 'release.json'), JSON.stringify(manifest, null, 2) + '\n');
  return verifyRelease(root);
}

export function verifyRelease(root = dist) {
  const catalog = validateCatalog(root);
  const manifest = JSON.parse(readFileSync(join(root, 'release.json'), 'utf8'));
  assert(manifest.sourceCatalogSha256 === sha(readFileSync(join(app, 'public/catalog.json'))), 'Source catalog changed; rebuild the candidate');
  const files = filesIn(root);
  assert(files.length < 20000, 'Pages file count exceeds release limit');
  assert(manifest.trackCount === catalog.tracks.length && manifest.chartCount === catalog.tracks.length * 3, 'Manifest catalog mismatch');
  const actual = {};
  for (const file of files) {
    const path = relative(root, file).split(sep).join('/');
    assert(statSync(file).size <= 25 * 1024 * 1024, `Pages file exceeds 25 MiB: ${path}`);
    assert(!/(^|\/)(\.env[^/]*|stream\.m4a|earcheck[^/]*|reports)(\/|$)/.test(path), `Private/unneeded release file: ${path}`);
    if (path !== 'release.json') actual[path] = sha(readFileSync(file));
  }
  assert.deepEqual(actual, manifest.files, 'Release modified since preparation');
  assert(sha(JSON.stringify(actual)) === manifest.artifactSha256, 'Artifact hash mismatch');
  assert(manifest.catalogSha256 === actual['catalog.json'], 'Catalog hash mismatch');
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert(html.match(earlyAudioTag)?.[0] === earlyAudioScript(html, catalog), 'Stale audio bootstrap; rebuild the candidate');
  assert(html.includes('property="og:image"') && html.includes('name="twitter:card"'), 'Missing static social cards');
  assert(!html.includes('/beatscape/assets/'), 'Wrong Pages base path');
  const png = readFileSync(join(root, 'og.png'));
  assert(png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630, 'Site OG must be a 1200x630 PNG');
  for (const file of ['_headers', '_redirects', 'robots.txt', 'sitemap.xml']) assert(existsSync(join(root, file)), `Missing hosting file: ${file}`);
  const bytes = files.reduce((sum, path) => sum + statSync(path).size, 0);
  console.log(`Release verified: ${manifest.trackCount} tracks / ${manifest.chartCount} charts / ${files.length} files / ${(bytes / 1024 / 1024).toFixed(1)} MiB · ${manifest.artifactSha256.slice(0, 12)}`);
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  assert(['prepare', 'verify'].includes(command), 'Usage: node scripts/release.mjs prepare|verify');
  if (command === 'prepare') prepareRelease();
  else verifyRelease();
}
