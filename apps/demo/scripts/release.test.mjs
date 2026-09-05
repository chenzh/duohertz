import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { prepareRelease, readWav, validateSiteUrl, verifyRelease } from './release.mjs';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const options = { siteUrl: 'https://portal-preview.invalid', demoUrl: '' };
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'musicsaas-portal-release-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ['samples', 'assets', 'brand']) mkdirSync(join(root, dir));
  for (const name of ['bgm-demo.wav', 'vocal-demo.wav']) copyFileSync(join(app, 'public/samples', name), join(root, 'samples', name));
  copyFileSync(join(app, 'public/brand/og.png'), join(root, 'brand/og.png'));
  writeFileSync(join(root, 'assets/index-1234abcd.js'), 'document.querySelector("main").dataset.ready = "true";');
  writeFileSync(join(root, 'assets/index-1234abcd.css'), 'body { color: #111; }');
  writeFileSync(join(root, 'index.html'), `<!doctype html><html><head><link rel="canonical" href="${options.siteUrl}/"><meta property="og:url" content="${options.siteUrl}/"><meta property="og:image" content="${options.siteUrl}/brand/og.png"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/assets/index-1234abcd.css"><script type="module" src="/assets/index-1234abcd.js"></script></head><body><main><a href="https://beatscape.pages.dev">BeatScape</a><a href="https://scapemusic.pages.dev">Scape Music</a><audio src="/samples/bgm-demo.wav"></audio><audio src="/samples/vocal-demo.wav"></audio></main></body></html>`);
  return root;
}

test('static candidate includes verified PCM metadata and reproducible content identity', (t) => {
  const root = fixture(t);
  const first = prepareRelease(root, options);
  const second = prepareRelease(root, options);
  assert.equal(first.artifactSha256, second.artifactSha256);
  assert.equal(first.samples['samples/bgm-demo.wav'].durationSeconds, 5);
  assert.equal(first.samples['samples/vocal-demo.wav'].sampleRate, 44100);
  assert.match(readFileSync(join(root, '_headers'), 'utf8'), /connect-src 'none'/);
  assert.match(readFileSync(join(root, 'robots.txt'), 'utf8'), /Disallow: \//);
  verifyRelease(root, { ...options, expectedSha256: first.artifactSha256 });
});

test('Pages header merging gives each immutable asset exactly one cache policy', (t) => {
  const root = fixture(t);
  prepareRelease(root, options);
  const rules = readFileSync(join(root, '_headers'), 'utf8');
  const responseHeaders = (pathname) => {
    const headers = new Headers();
    let matches = false;
    for (const line of rules.split('\n')) {
      if (!line.trim()) continue;
      if (line.startsWith('/')) {
        matches = line.endsWith('*') ? pathname.startsWith(line.slice(0, -1)) : pathname === line;
      } else if (matches) {
        const colon = line.indexOf(':');
        // Cloudflare inherits every matching rule and joins repeated values with commas.
        headers.append(line.slice(0, colon).trim(), line.slice(colon + 1).trim());
      }
    }
    return headers;
  };
  for (const pathname of ['/assets/index-1234abcd.js', '/assets/index-1234abcd.css']) {
    const headers = responseHeaders(pathname);
    assert.equal(headers.get('cache-control'), 'public, max-age=31536000, immutable');
    assert.match(headers.get('content-security-policy'), /connect-src 'none'/);
    assert.equal(headers.get('x-content-type-options'), 'nosniff');
  }
  for (const pathname of ['/', '/index.html', '/404.html', '/portal-release.json', '/robots.txt', '/sitemap.xml', '/brand/og.png', '/samples/bgm-demo.wav']) {
    assert.equal(responseHeaders(pathname).get('cache-control'), 'public, max-age=0, must-revalidate', pathname);
  }
});

test('release rejects missing media and missing transitive CSS resources', (t) => {
  const root = fixture(t);
  prepareRelease(root, options);
  rmSync(join(root, 'samples/vocal-demo.wav'));
  assert.throws(() => verifyRelease(root, options), /Missing local resource/);
  copyFileSync(join(app, 'public/samples/vocal-demo.wav'), join(root, 'samples/vocal-demo.wav'));
  writeFileSync(join(root, 'assets/index-1234abcd.css'), 'body { background: url(./missing-1234abcd.png); }');
  assert.throws(() => prepareRelease(root, options), /Missing local resource/);
});

test('real compiled publicAsset arguments resolve at the root while dot-relative imports stay relative', (t) => {
  const root = fixture(t);
  copyFileSync(join(app, 'public/brand/logo.svg'), join(root, 'brand/logo.svg'));
  const html = join(root, 'index.html');
  writeFileSync(html, readFileSync(html, 'utf8').replace(/<audio[^>]*><\/audio>/g, ''));
  const js = join(root, 'assets/index-1234abcd.js');
  // Reduced from the actual Portal-oKFwCxvW.js bundle: the WAV strings remain bare.
  const compiled = 'function u(s){return`/${s.replace(/^\\/?demo\\//,"").replace(/^\\//,"")}`}const s="bgm",c=u(s==="bgm"?"samples/bgm-demo.wav":"samples/vocal-demo.wav"),logo=u("brand/logo.svg");';
  writeFileSync(js, compiled + 'const dependency="./index-1234abcd.css";');
  prepareRelease(root, options);
  writeFileSync(js, compiled + 'const dependency="./samples/bgm-demo.wav";');
  assert.throws(() => prepareRelease(root, options), /Missing local resource.*\.\/samples\/bgm-demo\.wav/);
  writeFileSync(js, compiled + 'const dependency="../samples/bgm-demo.wav";');
  prepareRelease(root, options);
  rmSync(join(root, 'samples/vocal-demo.wav'));
  assert.throws(() => prepareRelease(root, options), /Missing local resource.*samples\/vocal-demo\.wav/);
});

test('release rejects corrupted, shortened and changed WAV bytes', (t) => {
  const root = fixture(t);
  const path = join(root, 'samples/bgm-demo.wav');
  const original = readFileSync(path);
  assert.throws(() => readWav(original.subarray(0, original.length - 1)), /Truncated or appended WAV/);
  const invalidRate = Buffer.from(original);
  invalidRate.writeUInt32LE(48000, 24);
  assert.throws(() => readWav(invalidRate), /Unexpected technical sample WAV format/);
  const changed = Buffer.from(original);
  changed[100] ^= 1;
  writeFileSync(path, changed);
  assert.throws(() => prepareRelease(root, options), /Technical sample bytes changed/);
});

test('local closure and file identity reject added secrets, symlinks and changed bundles', (t) => {
  const root = fixture(t);
  prepareRelease(root, options);
  writeFileSync(join(root, '.env'), 'PRIVATE_KEY=do-not-publish');
  assert.throws(() => verifyRelease(root, options), /Unexpected\/private release file/);
  rmSync(join(root, '.env'));
  symlinkSync(join(app, 'public/samples/bgm-demo.wav'), join(root, 'outside.wav'));
  assert.throws(() => verifyRelease(root, options), /Symlink in release/);
  rmSync(join(root, 'outside.wav'));
  writeFileSync(join(root, 'assets/index-1234abcd.js'), 'document.title = "changed";');
  assert.throws(() => verifyRelease(root, options), /Release files changed/);
});

test('reviewed artifact hash prevents re-signing modified output with a fresh manifest', (t) => {
  const root = fixture(t);
  const original = prepareRelease(root, options);
  writeFileSync(join(root, 'assets/index-1234abcd.js'), 'document.title = "changed";');
  const replacement = prepareRelease(root, options);
  assert.notEqual(original.artifactSha256, replacement.artifactSha256);
  assert.throws(() => verifyRelease(root, { ...options, expectedSha256: original.artifactSha256 }), /Release differs from reviewed/);
});

test('hostile manifest file-set and sample metadata cannot replace output evidence', (t) => {
  const root = fixture(t);
  const manifest = prepareRelease(root, options);
  manifest.samples['samples/bgm-demo.wav'].durationSeconds = 30;
  writeFileSync(join(root, 'portal-release.json'), JSON.stringify(manifest));
  assert.throws(() => verifyRelease(root, options), /Sample metadata mismatch/);
  manifest.samples['samples/bgm-demo.wav'].durationSeconds = 5;
  delete manifest.files['assets/index-1234abcd.js'];
  manifest.artifactSha256 = sha(JSON.stringify(manifest.files));
  writeFileSync(join(root, 'portal-release.json'), JSON.stringify(manifest));
  assert.throws(() => verifyRelease(root, options), /Release files changed/);
});

test('production target rejects private/reserved domains, paths, credentials and mixed content', () => {
  for (const value of ['', 'http://portal.pages.dev', 'https://localhost', 'https://127.0.0.1', 'https://192.168.0.1', 'https://[::1]', 'https://intranet', 'https://portal.local', 'https://portal.invalid', 'https://portal.test', 'https://portal.test.', 'https://portal.example.com', 'https://portal-preview.invalid', 'https://user:secret@portal.pages.dev', 'https://portal.pages.dev/demo', 'https://portal.pages.dev/?key=secret']) {
    assert.throws(() => validateSiteUrl(value, { publicOnly: true }), undefined, value);
  }
  assert.equal(validateSiteUrl('https://musicsaas.pages.dev/', { publicOnly: true }), 'https://musicsaas.pages.dev');
  assert.equal(validateSiteUrl(options.siteUrl), options.siteUrl);
});

test('deployment refuses an unreviewed artifact and a preview domain before credentials or upload', () => {
  const script = resolve(app, '../../scripts/deploy-portal-cf-pages.sh');
  const env = { ...process.env, PORTAL_SITE_URL: options.siteUrl, CF_PAGES_PROJECT: 'portal-check-only', PORTAL_ARTIFACT_SHA256: '' };
  let run = spawnSync('bash', [script, 'deploy'], { env, encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Set the full reviewed/);
  run = spawnSync('bash', [script, 'deploy'], { env: { ...env, PORTAL_ARTIFACT_SHA256: '0'.repeat(64) }, encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /public hostname/);
});

test('output refuses backend calls, private URLs, placeholders and downgraded hosting policy', (t) => {
  const root = fixture(t);
  const js = join(root, 'assets/index-1234abcd.js');
  const original = readFileSync(js);
  for (const body of ['fetch("/demo/api/jobs")', 'fetch("https://192.168.0.199/api")', 'const help="https://example.com/help"', 'const key="YOUR_API_KEY"']) {
    writeFileSync(js, body);
    assert.throws(() => prepareRelease(root, options));
  }
  writeFileSync(js, original);
  prepareRelease(root, options);
  writeFileSync(join(root, '_headers'), "/*\n  Content-Security-Policy: default-src *\n");
  assert.throws(() => verifyRelease(root, options), /Hosting policy changed/);
});

test('configured domain is bound to canonical, Open Graph and manifest', (t) => {
  const root = fixture(t);
  prepareRelease(root, options);
  assert.throws(() => verifyRelease(root, { siteUrl: 'https://musicsaas.pages.dev', demoUrl: '' }), /Release domain changed/);
  const html = join(root, 'index.html');
  writeFileSync(html, readFileSync(html, 'utf8').replace('href="https://portal-preview.invalid/"', 'href="https://musicsaas.pages.dev/"'));
  assert.throws(() => prepareRelease(root, options), /Canonical URL does not match/);
});
