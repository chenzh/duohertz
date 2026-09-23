import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startEarlyAudio } from './early-audio.mjs';
import { startEarlyRoute } from './early-route.mjs';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(app, 'dist');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const earlyAudioTag = /<script id="beatscape-early-audio">[\s\S]*?<\/script>/g;
const earlyRouteTag = /<script id="beatscape-early-route">[\s\S]*?<\/script>/g;
const shellVersionToken = '__BEATSCAPE_SHELL_VERSION__';
const shellVersionDeclaration = /const SHELL_VERSION = "(?:__BEATSCAPE_SHELL_VERSION__|[a-f0-9]{16})";/;
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const trackRoutesStart = '# beatscape-track-routes:start';
const trackRoutesEnd = '# beatscape-track-routes:end';
const minSameLanePressGapSec = 0.100;
const sitemapRoutes = [
  ['/', 'weekly', '1.0'],
  ['/library', 'weekly', '0.9'],
  ['/characters', 'monthly', '0.8'],
  ['/radio', 'weekly', '0.8'],
  ['/shift', 'monthly', '0.8'],
  ['/leaderboard', 'daily', '0.6'],
  ['/privacy', 'yearly', '0.3'],
  ['/terms', 'yearly', '0.3'],
];

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeXml = (value) => escapeHtml(value).replace(/'/g, '&apos;');

function siteOrigin(html) {
  const href = html.match(/<link\b(?=[^>]*\brel="canonical")(?=[^>]*\bhref="([^"]+)")[^>]*>/)?.[1];
  assert(href, 'Missing static canonical URL');
  const url = new URL(href);
  assert(url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash, 'Release canonical must be an HTTPS site root');
  return url.origin;
}

function replaceHeadTag(html, pattern, replacement, label) {
  let count = 0;
  const result = html.replace(pattern, () => { count += 1; return replacement; });
  assert.equal(count, 1, `Expected exactly one ${label}`);
  return result;
}

function trackMeta(track) {
  assert(typeof track.title === 'string' && track.title && typeof track.artist === 'string' && track.artist, `Missing track title/artist: ${track.track_id}`);
  assert(typeof track.genre === 'string' && track.genre && Number.isFinite(track.bpm), `Missing track genre/BPM: ${track.track_id}`);
  const title = track.seo?.title ?? `${track.title} by ${track.artist} — BeatScape`;
  const description = `${track.seo?.description ?? `${track.bpm} BPM ${track.genre} AI original.`} Choose a chart and play solo or Duo in your browser.`;
  return { title, description };
}

function routeChunkHref(root, routeName) {
  const assetsDir = join(root, 'assets');
  assert(existsSync(assetsDir), `Missing assets directory for ${routeName} route preload`);
  const pattern = new RegExp(`^${routeName}-[A-Za-z0-9_-]+\\.js$`);
  const matches = readdirSync(assetsDir).filter((name) => pattern.test(name));
  assert.equal(matches.length, 1, `Expected exactly one ${routeName} route chunk, found ${matches.length}`);
  return `/assets/${matches[0]}`;
}

function routeChunkHrefs(root) {
  return {
    track: routeChunkHref(root, 'Track'),
    duo: routeChunkHref(root, 'Duo'),
    characters: routeChunkHref(root, 'Characters'),
    radio: routeChunkHref(root, 'Radio'),
    shift: routeChunkHref(root, 'FirstShift'),
    calibrate: routeChunkHref(root, 'Calibration'),
    settings: routeChunkHref(root, 'Settings'),
    leaderboard: routeChunkHref(root, 'Leaderboard'),
    profile: routeChunkHref(root, 'Profile'),
    legal: routeChunkHref(root, 'Legal'),
    notFound: routeChunkHref(root, 'NotFound'),
  };
}

function earlyRouteScript(chunks) {
  const json = JSON.stringify(chunks)
    .replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `<script id="beatscape-early-route">(${startEarlyRoute.toString()})(${json},window.location.pathname,document);</script>`;
}

function trackPageHtml(shellHtml, track, trackChunkHref) {
  const origin = siteOrigin(shellHtml);
  const canonical = `${origin}/track/${track.track_id}`;
  const image = new URL(track.og ?? '/og.png', origin).href;
  const { title, description } = trackMeta(track);
  // Track-selection documents never start audio. Keep the slot so the app can
  // take over normally, but do not duplicate the full deep-link audio map into
  // every crawlable card.
  let html = replaceHeadTag(shellHtml, earlyAudioTag, '<script id="beatscape-early-audio"></script>', 'head audio bootstrap');
  for (const [pattern, replacement, label] of [
    [/<title>[\s\S]*?<\/title>/g, `<title>${escapeHtml(title)}</title>`, 'title'],
    [/<meta\b(?=[^>]*\bname="description")[^>]*>/g, `<meta name="description" content="${escapeHtml(description)}" />`, 'description'],
    [/<link\b(?=[^>]*\brel="canonical")[^>]*>/g, `<link rel="canonical" href="${escapeHtml(canonical)}" />`, 'canonical'],
    [/<meta\b(?=[^>]*\bproperty="og:type")[^>]*>/g, '<meta property="og:type" content="music.song" />', 'Open Graph type'],
    [/<meta\b(?=[^>]*\bproperty="og:title")[^>]*>/g, `<meta property="og:title" content="${escapeHtml(title)}" />`, 'Open Graph title'],
    [/<meta\b(?=[^>]*\bproperty="og:description")[^>]*>/g, `<meta property="og:description" content="${escapeHtml(description)}" />`, 'Open Graph description'],
    [/<meta\b(?=[^>]*\bproperty="og:url")[^>]*>/g, `<meta property="og:url" content="${escapeHtml(canonical)}" />`, 'Open Graph URL'],
    [/<meta\b(?=[^>]*\bproperty="og:image")[^>]*>/g, `<meta property="og:image" content="${escapeHtml(image)}" />`, 'Open Graph image'],
    [/<meta\b(?=[^>]*\bproperty="og:image:alt")[^>]*>/g, `<meta property="og:image:alt" content="Play ${escapeHtml(track.title)} by ${escapeHtml(track.artist)} in BeatScape." />`, 'Open Graph image alt'],
    [/<meta\b(?=[^>]*\bname="twitter:title")[^>]*>/g, `<meta name="twitter:title" content="${escapeHtml(title)}" />`, 'X title'],
    [/<meta\b(?=[^>]*\bname="twitter:description")[^>]*>/g, `<meta name="twitter:description" content="${escapeHtml(description)}" />`, 'X description'],
    [/<meta\b(?=[^>]*\bname="twitter:image")[^>]*>/g, `<meta name="twitter:image" content="${escapeHtml(image)}" />`, 'X image'],
  ]) html = replaceHeadTag(html, pattern, replacement, label);
  const structured = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: track.title,
    byArtist: { '@type': 'MusicGroup', name: track.artist },
    genre: track.genre,
    duration: `PT${Math.round(track.duration_sec)}S`,
    url: canonical,
    isPartOf: { '@type': 'VideoGame', name: 'BeatScape', url: `${origin}/` },
  }).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  assert(!html.includes('data-beatscape-track-meta'), 'Track metadata already present in shell');
  assert(/^\/assets\/Track-[A-Za-z0-9_-]+\.js$/.test(trackChunkHref), 'Invalid Track route chunk preload');
  let routeBootstrapCount = 0;
  html = html.replace(earlyRouteTag, () => {
    routeBootstrapCount += 1;
    // A static Track document already knows its exact chunk. Keep the direct
    // declarative hint and omit the generic pathname bootstrap from all 105
    // cards, avoiding repeated inline bytes and duplicate DOM work.
    return `<link rel="modulepreload" crossorigin href="${escapeHtml(trackChunkHref)}" data-beatscape-route-preload="track" />`;
  });
  assert.equal(routeBootstrapCount, 1, 'Expected exactly one head route bootstrap');
  return html.replace(
    '</head>',
    `<script type="application/ld+json" data-beatscape-track-meta>${structured}</script>\n  </head>`,
  );
}

function sitemapXml(html, catalog) {
  const origin = siteOrigin(html);
  const routes = [
    ...sitemapRoutes.map(([path, changefreq, priority]) => ({ path, changefreq, priority })),
    ...catalog.tracks.map((track) => ({ path: `/track/${track.track_id}`, changefreq: 'monthly', priority: '0.7' })),
  ];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + routes.map(({ path, changefreq, priority }) => `  <url><loc>${escapeXml(new URL(path, `${origin}/`).href)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`).join('\n')
    + '\n</urlset>\n';
}

function trackRedirects(source, catalog) {
  const blockPattern = new RegExp(`${trackRoutesStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${trackRoutesEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  assert(blockPattern.test(source), 'Missing generated track-route markers');
  const routes = catalog.tracks.flatMap((track) => [
    `/track/${track.track_id} /track/${track.track_id}/index.html 200`,
    `/track/${track.track_id}/ /track/${track.track_id}/index.html 200`,
    `/beatscape/track/${track.track_id} /track/${track.track_id}/index.html 200`,
    `/beatscape/track/${track.track_id}/ /track/${track.track_id}/index.html 200`,
  ]).join('\n');
  return source.replace(blockPattern, `${trackRoutesStart}\n${routes}\n${trackRoutesEnd}`);
}

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

function assertPngDimensions(bytes, width, height, label) {
  assert(
    bytes.length >= 24
      && bytes.subarray(0, 8).equals(pngSignature)
      && bytes.readUInt32BE(16) === width
      && bytes.readUInt32BE(20) === height,
    `${label} must be a ${width}x${height} PNG`,
  );
}

export function validateCatalog(root) {
  const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'));
  assert(catalog.tracks?.length > 0, 'Empty catalog');
  const ids = new Set();
  for (const track of catalog.tracks) {
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(track.track_id), `Invalid track ID: ${track.track_id}`);
    assert(!ids.has(track.track_id), `Duplicate track: ${track.track_id}`);
    ids.add(track.track_id);
    assert(track.rights === 'owned' && track.theme === 'beatscape', `Content metadata: ${track.track_id}`);
    const audio = readFileSync(assetPath(root, track.audio));
    assert(audio.toString('ascii', 4, 8) === 'ftyp', `Invalid M4A: ${track.audio}`);
    assert(readFileSync(assetPath(root, track.cover), 'utf8').includes('<svg'), `Invalid cover: ${track.cover}`);
    assertPngDimensions(readFileSync(assetPath(root, track.og)), 1200, 630, `Track OG ${track.track_id}`);
    if (track.preview) assetPath(root, track.preview);
    for (const tier of ['easy', 'standard', 'hard']) {
      const chart = JSON.parse(readFileSync(assetPath(root, track.charts[tier]), 'utf8'));
      assert(chart.track_id === track.track_id && chart.tier === tier && chart.format === 1, `Chart identity: ${track.track_id}/${tier}`);
      assert(chart.notes?.length > 0 && Number.isFinite(chart.bpm) && chart.bpm > 0, `Empty/invalid chart: ${track.track_id}/${tier}`);
      assert(Number.isFinite(chart.audio_offset_ms), `Chart offset: ${track.track_id}/${tier}`);
      let count = 0;
      let previous = -Infinity;
      const noteIds = new Set();
      const pressEventsByLane = [[], [], [], []];
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
        for (const lane of lanes) pressEventsByLane[lane].push({ t: note.t, id: note.id, kind: note.type });
        if (note.type === 'slide') pressEventsByLane[note.to].push({ t: note.end, id: note.id, kind: 'slide-tail' });
        count += note.type === 'hold' ? 2 : lanes.length;
      }
      assert(chart.total_notes === count, `Note count mismatch: ${track.track_id}/${tier}: ${count} != ${chart.total_notes}`);
      for (let lane = 0; lane < pressEventsByLane.length; lane += 1) {
        const events = pressEventsByLane[lane].sort((a, b) => a.t - b.t);
        for (let index = 1; index < events.length; index += 1) {
          const before = events[index - 1];
          const after = events[index];
          const gap = after.t - before.t;
          assert(
            gap + 1e-9 >= minSameLanePressGapSec,
            `Ambiguous same-lane presses (<100ms): ${track.track_id}/${tier}/lane${lane} ${before.id}:${before.kind} -> ${after.id}:${after.kind}`,
          );
        }
        for (const hold of chart.notes.filter((note) => note.type === 'hold' && note.lane === lane)) {
          const blocked = events.find((event) => (
            event.id !== hold.id
            && event.t > hold.t + 1e-9
            && event.t < hold.end - 1e-9
          ));
          assert(
            !blocked,
            `Press during occupied Hold lane: ${track.track_id}/${tier}/lane${lane} ${hold.id} -> ${blocked?.id}:${blocked?.kind}`,
          );
        }
      }
    }
  }
  return catalog;
}

function stampServiceWorker(root) {
  const workerPath = join(root, 'sw.js');
  const worker = readFileSync(workerPath, 'utf8');
  assert(shellVersionDeclaration.test(worker), 'Missing/invalid service-worker shell version');
  const template = worker.replace(
    shellVersionDeclaration,
    `const SHELL_VERSION = "${shellVersionToken}";`,
  );
  const seedFiles = Object.fromEntries(filesIn(root)
    .filter((path) => path !== join(root, 'release.json'))
    .map((path) => {
      const name = relative(root, path).split(sep).join('/');
      return [name, sha(name === 'sw.js' ? Buffer.from(template) : readFileSync(path))];
    }));
  const version = sha(JSON.stringify(seedFiles)).slice(0, 16);
  writeFileSync(workerPath, template.replace(shellVersionToken, version));
  return version;
}

export function prepareRelease(root = dist) {
  const catalog = validateCatalog(root);
  // Only generated output is pruned. Masters and human QA stay in the workspace.
  for (const file of filesIn(root)) {
    const path = relative(root, file).split(sep).join('/');
    if (path.startsWith('catalog/') && path.endsWith('/stream.m4a')) rmSync(file);
  }
  rmSync(join(root, 'reports'), { recursive: true, force: true });
  for (const track of catalog.tracks) {
    const version = (url) => `${url.split('?')[0]}?v=${sha(readFileSync(assetPath(root, url))).slice(0, 16)}`;
    for (const field of ['audio', 'cover', 'preview', 'og']) if (track[field]) track[field] = version(track[field]);
    for (const tier of ['easy', 'standard', 'hard']) track.charts[tier] = version(track.charts[tier]);
  }
  writeFileSync(join(root, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  const htmlPath = join(root, 'index.html');
  const html = readFileSync(htmlPath, 'utf8');
  const chunks = routeChunkHrefs(root);
  const shellHtml = html
    .replace(earlyAudioTag, () => earlyAudioScript(html, catalog))
    .replace(earlyRouteTag, () => earlyRouteScript(chunks));
  const trackChunkHref = chunks.track;
  writeFileSync(htmlPath, shellHtml);
  rmSync(join(root, 'track'), { recursive: true, force: true });
  for (const track of catalog.tracks) {
    const routeDir = join(root, 'track', track.track_id);
    mkdirSync(routeDir, { recursive: true });
    writeFileSync(join(routeDir, 'index.html'), trackPageHtml(shellHtml, track, trackChunkHref));
  }
  writeFileSync(join(root, 'sitemap.xml'), sitemapXml(shellHtml, catalog));
  const redirectsPath = join(root, '_redirects');
  writeFileSync(redirectsPath, trackRedirects(readFileSync(redirectsPath, 'utf8'), catalog));
  stampServiceWorker(root);
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
  const chunks = routeChunkHrefs(root);
  assert(html.match(earlyRouteTag)?.[0] === earlyRouteScript(chunks), 'Stale route bootstrap; rebuild the candidate');
  assert.equal(readFileSync(join(root, 'sitemap.xml'), 'utf8'), sitemapXml(html, catalog), 'Stale sitemap; rebuild the candidate');
  const redirects = readFileSync(join(root, '_redirects'), 'utf8');
  assert.equal(redirects, trackRedirects(redirects, catalog), 'Stale track redirects; rebuild the candidate');
  const trackChunkHref = chunks.track;
  for (const track of catalog.tracks) {
    const page = join(root, 'track', track.track_id, 'index.html');
    assert(existsSync(page), `Missing static track page: ${track.track_id}`);
    assert.equal(readFileSync(page, 'utf8'), trackPageHtml(html, track, trackChunkHref), `Stale static track page: ${track.track_id}`);
  }
  assert(html.includes('property="og:image"') && html.includes('name="twitter:card"'), 'Missing static social cards');
  assert(!html.includes('/beatscape/assets/'), 'Wrong Pages base path');
  assertPngDimensions(readFileSync(join(root, 'og.png')), 1200, 630, 'Site OG');
  for (const file of [
    '_headers',
    '_redirects',
    'robots.txt',
    'sitemap.xml',
    'sw.js',
    'manifest.webmanifest',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/apple-touch-icon.png',
  ]) assert(existsSync(join(root, file)), `Missing hosting file: ${file}`);
  const worker = readFileSync(join(root, 'sw.js'), 'utf8');
  assert(!worker.includes(shellVersionToken), 'Unstamped service-worker shell version');
  assert(/const SHELL_VERSION = "[a-f0-9]{16}";/.test(worker), 'Invalid service-worker shell version');
  assert(!worker.includes('skipWaiting('), 'Service-worker upgrades must not take over active game clients');
  assert(html.includes('rel="manifest"') && html.includes('rel="apple-touch-icon"'), 'Missing PWA head metadata');
  const webManifest = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
  assert(webManifest.id === '.' && webManifest.start_url === '.' && webManifest.scope === '.' && webManifest.display === 'standalone', 'Invalid PWA navigation scope');
  assert(webManifest.icons?.some((icon) => icon.sizes === '192x192') && webManifest.icons?.some((icon) => icon.sizes === '512x512' && String(icon.purpose).includes('maskable')), 'Missing installable PWA icons');
  for (const [file, width, height] of [
    ['icons/icon-192.png', 192, 192],
    ['icons/icon-512.png', 512, 512],
    ['icons/apple-touch-icon.png', 180, 180],
  ]) {
    assertPngDimensions(readFileSync(join(root, file)), width, height, `PWA icon ${file}`);
  }
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
