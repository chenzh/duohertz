import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { isIP } from 'node:net';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(app, 'dist-portal');
const manifestName = 'portal-release.json';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
// Identity of the two existing technical fixtures. Adding music requires a new content review.
export const samples = {
  'samples/bgm-demo.wav': 'd224a3c7b33f0588052b8f71e1f2fc5d6cd9b8657becbb7b10898763fe6f7135',
  'samples/vocal-demo.wav': '2493c93092930ac31c703f448d8e2c7dd7f9c6634c204984e94bc0144be958d0',
};

export function validateSiteUrl(value, { publicOnly = false, allowPath = false } = {}) {
  assert(typeof value === 'string' && value.length > 0, 'PORTAL_SITE_URL is required');
  const url = new URL(value);
  assert(url.protocol === 'https:' && !url.username && !url.password, 'Portal URLs must use HTTPS without credentials');
  assert(!url.port || url.port === '443', 'Portal URLs must use the default HTTPS port');
  const host = url.hostname.toLowerCase();
  assert(!host.endsWith('.') && host.split('.').every((label) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)), 'Portal URLs must use a valid DNS hostname');
  const preview = host === 'portal-preview.invalid';
  const reserved = !host.includes('.') || isIP(host.replace(/^\[|\]$/g, '')) ||
    /(^|\.)(localhost|local|internal|lan|home|invalid|test|example|onion)$/.test(host) ||
    /(^|\.)(example\.(com|net|org)|home\.arpa)$/.test(host);
  assert(!reserved || (!publicOnly && preview), 'Portal URLs must use a public hostname; reserved/local addresses cannot be published');
  assert(!url.hash && !url.search, 'Portal URLs cannot contain query parameters or fragments');
  assert(allowPath || url.pathname === '/', 'PORTAL_SITE_URL must be an origin without a path');
  return allowPath ? url.href : url.origin;
}

function settings(options = {}) {
  const siteUrl = validateSiteUrl(options.siteUrl ?? process.env.PORTAL_SITE_URL, { publicOnly: options.publicOnly });
  const rawDemo = options.demoUrl ?? process.env.PORTAL_DEMO_URL ?? '';
  const demoUrl = rawDemo ? validateSiteUrl(rawDemo, { publicOnly: true, allowPath: true }) : null;
  return { siteUrl, demoUrl };
}

function filesIn(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    assert(!entry.isSymbolicLink(), `Symlink in release: ${path}`);
    assert(entry.isDirectory() || entry.isFile(), `Non-regular release file: ${path}`);
    return entry.isDirectory() ? filesIn(path) : [path];
  }).sort();
}

function relativeFiles(root) {
  return filesIn(root).map((path) => relative(root, path).split(sep).join('/'));
}

export function readWav(bytes) {
  assert(bytes.length >= 44 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WAVE', 'Invalid WAV header');
  assert(bytes.readUInt32LE(4) + 8 === bytes.length, 'Truncated or appended WAV');
  let format;
  let dataBytes;
  for (let offset = 12; offset < bytes.length;) {
    assert(offset + 8 <= bytes.length, 'Truncated WAV chunk header');
    const size = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + size;
    assert(end <= bytes.length, 'Truncated WAV chunk');
    const kind = bytes.toString('ascii', offset, offset + 4);
    if (kind === 'fmt ') {
      assert(!format && size >= 16, 'Invalid WAV format chunk');
      format = { encoding: bytes.readUInt16LE(offset + 8), channels: bytes.readUInt16LE(offset + 10), sampleRate: bytes.readUInt32LE(offset + 12), byteRate: bytes.readUInt32LE(offset + 16), blockAlign: bytes.readUInt16LE(offset + 20), bitsPerSample: bytes.readUInt16LE(offset + 22) };
    }
    if (kind === 'data') { assert(dataBytes === undefined, 'Multiple WAV data chunks'); dataBytes = size; }
    offset = end + size % 2;
    assert(offset <= bytes.length, 'Missing WAV chunk padding');
  }
  assert(format && dataBytes > 0, 'Missing WAV format/audio');
  const { encoding, channels, sampleRate, byteRate, blockAlign, bitsPerSample } = format;
  assert(encoding === 1 && channels === 1 && sampleRate === 44100 && bitsPerSample === 16, 'Unexpected technical sample WAV format');
  assert(blockAlign === channels * bitsPerSample / 8 && byteRate === sampleRate * blockAlign && dataBytes % blockAlign === 0, 'Invalid WAV sample alignment');
  const durationSeconds = dataBytes / byteRate;
  assert(durationSeconds === 5, 'Technical samples must be exactly five seconds');
  return { encoding: 'PCM', channels, sampleRate, bitsPerSample, durationSeconds, dataBytes };
}

function hostingFiles(siteUrl) {
  const preview = new URL(siteUrl).hostname === 'portal-preview.invalid';
  // Pages joins duplicate headers across matching rules; keep cache rules disjoint.
  // https://developers.cloudflare.com/pages/configuration/headers/
  const revalidate = ['/', '/index.html', '/404.html', '/portal-release.json', '/robots.txt', '/sitemap.xml', '/brand/*', '/samples/*']
    .map((path) => `${path}\n  Cache-Control: public, max-age=0, must-revalidate\n`).join('\n');
  return {
    '_headers': `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'\n${preview ? '  X-Robots-Tag: noindex, nofollow\n' : ''}\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n\n${revalidate}`,
    '404.html': '<!doctype html>\n<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>页面未找到 · Page not found · MusicSaas</title></head><body><main><h1>页面未找到 <span lang="en">/ Page not found</span></h1><p>这个地址暂时没有内容。<span lang="en">There is no page at this address.</span></p><a href="/">返回 MusicSaas 门户 <span lang="en">/ Back to MusicSaas</span></a></main></body></html>\n',
    'robots.txt': preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
    'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url></urlset>\n`,
  };
}

function checkLocalReference(root, value, from, siteUrl) {
  if (!value || value.startsWith('#') || /^(data:|mailto:|tel:)/.test(value)) return;
  assert(!/^(javascript:|http:|\/\/)/i.test(value), `Unsafe resource URL in ${from}: ${value}`);
  // publicAsset() compiles BASE_URL to "/" and keeps its bare argument in JS.
  // Dot-relative imports and CSS/HTML URLs retain the browser's file-relative rules.
  const publicAssetArgument = from.endsWith('.js') && /^(?:samples|brand|assets)\//.test(value);
  const base = new URL(publicAssetArgument ? '/' : from, `${siteUrl}/`);
  const url = new URL(value, base);
  if (url.origin !== siteUrl) return;
  const path = decodeURIComponent(url.pathname);
  assert(!path.includes('\\') && !path.includes('\0'), `Invalid asset path: ${value}`);
  const local = resolve(root, `.${path === '/' ? '/index.html' : path}`);
  assert(local.startsWith(resolve(root) + sep), `Asset escapes release: ${value}`);
  assert(existsSync(local) && statSync(local).isFile() && statSync(local).size > 0, `Missing local resource in ${from}: ${value}`);
  return path;
}

function validateOutput(root, { siteUrl, demoUrl }) {
  const paths = relativeFiles(root);
  assert(paths.length < 20000, 'Too many Pages files');
  const metadata = {};
  const texts = [];
  const localReferences = new Set();
  const checkReference = (value, from) => {
    const path = checkLocalReference(root, value, from, siteUrl);
    if (path) localReferences.add(path);
  };
  for (const path of paths) {
    assert(/^(index\.html|404\.html|_headers|robots\.txt|sitemap\.xml|portal-release\.json|samples\/(bgm-demo|vocal-demo)\.wav|(?:assets|brand)\/[\w./-]+\.(?:js|css|svg|png|jpe?g|webp|avif|ico|woff2?))$/.test(path), `Unexpected/private release file: ${path}`);
    assert(!path.split('/').some((part) => part.startsWith('.')), `Hidden release file: ${path}`);
    if (path.startsWith('assets/')) assert(/-[\w-]{8,}\.[a-z0-9]+$/i.test(path), `Immutable asset needs a content-hashed name: ${path}`);
    const bytes = readFileSync(join(root, path));
    assert(bytes.length > 0 && bytes.length <= 25 * 1024 * 1024, `Invalid Pages file size: ${path}`);
    if (samples[path]) {
      assert(hash(bytes) === samples[path], `Technical sample bytes changed: ${path}`);
      metadata[path] = { ...readWav(bytes), sha256: hash(bytes) };
    }
    if (['.html', '.js', '.css', '.svg'].includes(extname(path))) {
      const text = bytes.toString('utf8');
      texts.push(text);
      for (const match of text.matchAll(/https?:\/\/(\[[^\]]+\]|[^/:?#\s"'`<>\\]+)/g)) {
        // XML/SVG namespace identifiers do not make network requests.
        if (['http://www.w3.org', 'http://www.sitemaps.org'].includes(match[0])) continue;
        validateSiteUrl(match[0], { publicOnly: new URL(siteUrl).hostname !== 'portal-preview.invalid' });
      }
      assert(!/https?:\/\/(?:localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\])\b/i.test(text), `Localhost URL in ${path}`);
      assert(!/(?:https?:\/\/[^\s"'<>]*(?:example\.(?:com|org|net)|\.test\b)|YOUR_API_KEY|REPLACE_ME|changeme|__PORTAL_[A-Z_]+__)/i.test(text), `Placeholder in ${path}`);
      assert(!/(?:\/demo\/api|(?:fetch|axios\.[a-z]+)\s*\(\s*["'`]\/v1\/(?:jobs|generate)|\/health\/inference|sk_live_[\w]+|-----BEGIN [\w ]*PRIVATE KEY-----|CLOUDFLARE_API_TOKEN|new\s+(?:WebSocket|EventSource|XMLHttpRequest)|serviceWorker\.register|navigator\.sendBeacon)/i.test(text), `Backend/secret content in static portal: ${path}`);
      if (path.endsWith('.html')) {
        assert(!/<(?:form|iframe)\b/i.test(text), `Active form/frame in portal: ${path}`);
        for (const match of text.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)) checkReference(match[1], path);
        for (const match of text.matchAll(/<(?:script|img|audio|video|source|link)\b[^>]*>/gi)) {
          if (/\brel=["'](?:canonical|alternate)["']/.test(match[0])) continue;
          for (const attr of match[0].matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)) {
            assert(attr[1].startsWith('data:') || new URL(attr[1], `${siteUrl}/`).origin === siteUrl, `Remote runtime resource in ${path}: ${attr[1]}`);
          }
        }
        for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) assert(/\bsrc\s*=/.test(match[1]) && !match[2].trim(), `Inline script incompatible with portal CSP: ${path}`);
      }
      for (const match of text.matchAll(/(?:["'`]((?:\/?(?:assets|samples|brand)\/|\.\.?\/)[^"'`\s]+\.(?:js|css|svg|png|jpe?g|webp|avif|ico|woff2?|wav)(?:\?[^"'`\s]*)?)["'`]|url\(\s*["']?([^\s)'";]+))/g)) checkReference(match[1] ?? match[2], path);
    }
  }
  assert.deepEqual(Object.keys(metadata).sort(), Object.keys(samples).sort(), 'Missing required technical sample');
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const canonical = [...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi)];
  const og = [...html.matchAll(/<meta\b[^>]*\bproperty=["']og:url["'][^>]*>/gi)];
  assert(canonical.length === 1 && canonical[0][0].includes(`href="${siteUrl}/"`), 'Canonical URL does not match PORTAL_SITE_URL');
  assert(og.length === 1 && og[0][0].includes(`content="${siteUrl}/"`), 'og:url does not match PORTAL_SITE_URL');
  const social = [...html.matchAll(/<meta\b[^>]*\bproperty=["']og:image["'][^>]*>/gi)];
  assert(social.length === 1 && social[0][0].includes(`content="${siteUrl}/brand/og.png"`), 'Social image must be the absolute portal PNG URL');
  assert(/<meta\b[^>]*\bname=["']twitter:card["'][^>]*\bcontent=["']summary_large_image["']/.test(html), 'Missing Twitter large-image card');
  const png = readFileSync(join(root, 'brand/og.png'));
  assert(png.length > 24 && png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && png.toString('ascii', 12, 16) === 'IHDR' && png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630, 'Social PNG must be 1200 × 630');
  for (const [path, expected] of Object.entries(hostingFiles(siteUrl))) assert(readFileSync(join(root, path), 'utf8') === expected, `Hosting policy changed: ${path}`);
  const visible = texts.join('\n');
  for (const url of ['https://beatscape.pages.dev', 'https://scapemusic.pages.dev']) assert(visible.includes(url), `Missing product link: ${url}`);
  for (const path of Object.keys(samples)) assert(localReferences.has(`/${path}`), `Missing sample link: /${path}`);
  if (demoUrl) assert(visible.includes(demoUrl), 'Configured PORTAL_DEMO_URL missing from portal');
  return metadata;
}

function fileHashes(root) {
  return Object.fromEntries(relativeFiles(root).filter((path) => path !== manifestName).map((path) => [path, hash(readFileSync(join(root, path)))]));
}

export function prepareRelease(root = dist, options = {}) {
  const config = settings(options);
  for (const [path, body] of Object.entries(hostingFiles(config.siteUrl))) writeFileSync(join(root, path), body);
  const sampleMetadata = validateOutput(root, config);
  const files = fileHashes(root);
  const manifest = {
    schema: 1,
    kind: 'musicsaas-static-portal',
    ...config,
    builtAt: new Date().toISOString(),
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: app, encoding: 'utf8' }).trim(),
    sourceDirty: Boolean(execFileSync('git', ['status', '--porcelain', '--', '.'], { cwd: app, encoding: 'utf8' }).trim()),
    samples: sampleMetadata,
    files,
    artifactSha256: hash(JSON.stringify(files)),
  };
  writeFileSync(join(root, manifestName), JSON.stringify(manifest, null, 2) + '\n');
  return verifyRelease(root, options);
}

export function verifyRelease(root = dist, options = {}) {
  const config = settings(options);
  const manifest = JSON.parse(readFileSync(join(root, manifestName), 'utf8'));
  assert.deepEqual(Object.keys(manifest).sort(), ['schema', 'kind', 'siteUrl', 'demoUrl', 'builtAt', 'sourceCommit', 'sourceDirty', 'samples', 'files', 'artifactSha256'].sort(), 'Unexpected manifest fields');
  assert(manifest.schema === 1 && manifest.kind === 'musicsaas-static-portal', 'Invalid portal manifest');
  assert(/^[a-f0-9]{40}$/.test(manifest.sourceCommit) && typeof manifest.sourceDirty === 'boolean' && new Date(manifest.builtAt).toISOString() === manifest.builtAt, 'Invalid manifest provenance');
  assert.equal(manifest.siteUrl, config.siteUrl, 'Release domain changed; rebuild for PORTAL_SITE_URL');
  assert.equal(manifest.demoUrl, config.demoUrl, 'Release demo URL changed; rebuild for PORTAL_DEMO_URL');
  assert.deepEqual(manifest.samples, validateOutput(root, config), 'Sample metadata mismatch');
  const files = fileHashes(root);
  assert.deepEqual(manifest.files, files, 'Release files changed since preparation');
  assert.equal(manifest.artifactSha256, hash(JSON.stringify(files)), 'Artifact hash mismatch');
  const expected = options.expectedSha256 ?? process.env.PORTAL_ARTIFACT_SHA256;
  if (expected) assert.equal(manifest.artifactSha256, expected, 'Release differs from reviewed PORTAL_ARTIFACT_SHA256');
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  assert(['prepare', 'verify', 'verify-public-url'].includes(command), 'Usage: node scripts/release.mjs prepare|verify|verify-public-url');
  if (command === 'verify-public-url') {
    const config = settings({ publicOnly: true });
    console.log(`Public portal target: ${config.siteUrl}`);
  } else {
    const manifest = command === 'prepare' ? prepareRelease() : verifyRelease();
    console.log(`Portal verified: ${Object.keys(manifest.files).length} files, 2 × 5 s technical samples, SHA-256 ${manifest.artifactSha256}`);
  }
}
