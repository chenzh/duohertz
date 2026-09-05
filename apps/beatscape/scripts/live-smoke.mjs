// Read-only verification after publishing the prepared artifact.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const base = new URL(process.argv[2] ?? 'https://beatscape.pages.dev/');
const expected = JSON.parse(readFileSync(new URL('../dist/release.json', import.meta.url), 'utf8'));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function request(path, options = {}) {
  const response = await fetch(new URL(path.replace(/^\//, ''), base), { ...options, signal: AbortSignal.timeout(20000), cache: 'no-cache' });
  assert(response.ok, `${path}: HTTP ${response.status}`);
  if (path.split('?')[0].endsWith('.json')) assert(response.headers.get('content-type')?.includes('application/json'), `${path}: expected JSON, received SPA fallback or wrong content type`);
  return response;
}
const manifest = await (await request('release.json')).json();
assert.equal(manifest.artifactSha256, expected.artifactSha256, 'Live artifact differs from the reviewed local candidate');
const bytes = Buffer.from(await (await request('catalog.json')).arrayBuffer());
assert.equal(sha(bytes), expected.catalogSha256, 'Live catalog does not match candidate');
const catalog = JSON.parse(bytes);
for (const path of ['/', '/library', '/track/bs-s1-01', '/play/bs-s1-01', '/privacy', '/terms']) {
  const html = await (await request(path)).text();
  assert(html.includes('property="og:image"') && html.includes('id="root"'), `Broken SPA/deep link: ${path}`);
}
const og = Buffer.from(await (await request('og.png')).arrayBuffer());
assert.equal(sha(og), expected.files['og.png'], 'Live social card differs');
for (const path of Object.keys(expected.files).filter((p) => /^assets\/.*\.(js|css)$/.test(p))) {
  const asset = Buffer.from(await (await request(path)).arrayBuffer());
  assert.equal(sha(asset), expected.files[path], `Live application bundle differs: ${path}`);
}
for (const id of ['bs-s1-01', 'bs-s2-01', 'bs-p3-01', 'bs-p4-10']) {
  const track = catalog.tracks.find((t) => t.track_id === id);
  assert(track, `Missing live track: ${id}`);
  const chartBytes = Buffer.from(await (await request(track.charts.standard)).arrayBuffer());
  assert.equal(sha(chartBytes), expected.files[track.charts.standard.split('?')[0].slice(1)], `Live chart differs: ${id}`);
  const chart = JSON.parse(chartBytes);
  assert(chart.track_id === id && chart.notes.length > 0, `Broken live chart: ${id}`);
  const audio = await request(track.audio, { headers: { Range: 'bytes=0-15' } });
  // Pages may return a complete 200 response to Range requests (documented).
  assert([200, 206].includes(audio.status), `Audio Range response: ${id}`);
  const header = Buffer.from(await audio.arrayBuffer());
  assert.equal(header.toString('ascii', 4, 8), 'ftyp', `Audio returned non-M4A: ${id}`);
  if (audio.status === 200) assert.equal(sha(header), expected.files[track.audio.split('?')[0].slice(1)], `Live audio differs: ${id}`);
}
console.log(`Live smoke passed: ${base.href} · ${manifest.trackCount} tracks · ${manifest.artifactSha256.slice(0, 12)}`);
