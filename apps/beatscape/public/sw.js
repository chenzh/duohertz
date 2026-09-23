/* BeatScape offline shell + bounded, on-demand track caching. */
const SHELL_VERSION = "__BEATSCAPE_SHELL_VERSION__";
const SHELL_CACHE = `beatscape-shell-${SHELL_VERSION}`;
const RUNTIME_CACHE = "beatscape-runtime-v1";
const AUDIO_CACHE = "beatscape-audio-v1";
const PREVIEW_CACHE = "beatscape-preview-v1";
const OWNED_CACHES = new Set([SHELL_CACHE, RUNTIME_CACHE, AUDIO_CACHE, PREVIEW_CACHE]);
const MAX_RUNTIME_ENTRIES = 500;
const MAX_AUDIO_TRACKS = 6;
const MAX_PREVIEWS = 12;

function scoped(path = "") {
  return new URL(path, self.registration.scope).toString();
}

async function trim(cache, maxEntries) {
  const keys = await cache.keys();
  while (keys.length > maxEntries) await cache.delete(keys.shift());
}

async function store(cacheName, request, response, maxEntries) {
  if (!response || response.status !== 200 || response.type === "opaque") return;
  try {
    const copy = response.clone();
    const cache = await caches.open(cacheName);
    await cache.put(request, copy);
    await trim(cache, maxEntries);
  } catch {
    // Quota/private-mode failures must never break an online request.
  }
}

async function installShell() {
  const releaseResponse = await fetch(scoped("release.json"), { cache: "no-store" });
  if (!releaseResponse.ok) throw new Error("BeatScape release manifest unavailable");
  const release = await releaseResponse.json();
  const releaseFiles = release.files || {};
  const assets = Object.keys(releaseFiles).filter((path) => path.startsWith("assets/"));
  const shellUrl = scoped();
  const shellResponse = await fetch(shellUrl, { cache: "reload" });
  if (!shellResponse.ok) throw new Error("BeatScape shell unavailable");
  const shellHtml = await shellResponse.clone().text();
  const scopePath = new URL(self.registration.scope).pathname;
  const initialScripts = [...shellHtml.matchAll(/\b(?:src|href)=["']([^"']+\.js)["']/gi)]
    .map((match) => new URL(match[1], shellUrl).pathname)
    .filter((path) => path.startsWith(scopePath))
    .map((path) => path.slice(scopePath.length).replace(/^\/+/, ""))
    .filter((path) => path.startsWith("assets/") && releaseFiles[path]);
  if (initialScripts.length === 0) throw new Error("BeatScape initial script unavailable");
  // Lazy route/gameplay JS enters this cache through cacheFirst after it is
  // actually requested. The install stays small without weakening revisits.
  const installAssets = assets.filter((path) => !path.endsWith(".js"));
  const smallCharacterArt = Object.keys(release.files || {}).filter((path) => (
    path.startsWith("characters/") && path.endsWith("-128.webp")
  ));
  const paths = [
    "catalog.json",
    "manifest.webmanifest",
    "icons/icon-192.png",
    "icons/icon-512.png",
    ...installAssets,
    ...initialScripts,
    ...smallCharacterArt,
  ];
  const urls = [...new Set(paths.map(scoped))];
  const cache = await caches.open(SHELL_CACHE);
  await cache.put(shellUrl, shellResponse);
  await Promise.all(urls.map(async (url) => {
    const response = await fetch(url, { cache: "reload" });
    if (!response.ok) throw new Error(`Could not cache ${url}`);
    await cache.put(url, response);
  }));
}

self.addEventListener("install", (event) => {
  // Do not skipWaiting on upgrades. The active worker and its versioned shell
  // must remain available to already-open pages until those clients close, or
  // a later lazy-route import could lose its old hashed chunk mid-session.
  event.waitUntil(installShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("beatscape-") && !OWNED_CACHES.has(key)) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function navigationResponse(request) {
  try {
    return await fetch(request);
  } catch {
    const shell = await caches.open(SHELL_CACHE);
    const fallback = await shell.match(scoped());
    if (fallback) return fallback;
    throw new Error("BeatScape is not available offline yet");
  }
}

function respondAndStore(event, resultPromise, cacheName, maxEntries) {
  event.waitUntil(resultPromise.then(({ response, shouldStore }) => (
    shouldStore ? store(cacheName, event.request, response, maxEntries) : undefined
  )).catch(() => undefined));
  return resultPromise.then(({ response }) => response);
}

function cacheFirst(event, cacheName, maxEntries, ignoreVary = false) {
  const result = (async () => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(event.request, { ignoreVary });
    if (cached) return { response: cached, shouldStore: false };
    return { response: await fetch(event.request), shouldStore: true };
  })();
  return respondAndStore(event, result, cacheName, maxEntries);
}

function networkFirst(event) {
  const result = (async () => {
    try {
      return { response: await fetch(event.request), shouldStore: true };
    } catch {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(event.request);
      if (cached) return { response: cached, shouldStore: false };
      throw new Error(`Offline resource unavailable: ${event.request.url}`);
    }
  })();
  return respondAndStore(event, result, RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
}

function rangeResponse(response, rangeHeader) {
  return response.arrayBuffer().then((buffer) => {
    const size = buffer.byteLength;
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (!match) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const suffixLength = match[1] === "" ? Number(match[2]) : null;
    const start = suffixLength === null ? Number(match[1]) : Math.max(0, size - suffixLength);
    const requestedEnd = match[2] === "" || suffixLength !== null ? size - 1 : Number(match[2]);
    const end = Math.min(size - 1, requestedEnd);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const headers = new Headers(response.headers);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Content-Length", String(end - start + 1));
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    return new Response(buffer.slice(start, end + 1), { status: 206, statusText: "Partial Content", headers });
  });
}

async function audioRangeFallback(request) {
  try {
    return await fetch(request);
  } catch {
    const range = request.headers.get("range");
    for (const cacheName of [AUDIO_CACHE, PREVIEW_CACHE]) {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(request.url, { ignoreVary: true });
      if (cached && range) return rangeResponse(cached, range);
    }
    throw new Error(`Offline audio unavailable: ${request.url}`);
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const scopePath = new URL(self.registration.scope).pathname;
  if (!url.pathname.startsWith(scopePath)) return;

  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }
  if (request.headers.has("range")) {
    event.respondWith(audioRangeFallback(request));
    return;
  }
  if (url.pathname.endsWith("/audio.m4a")) {
    event.respondWith(cacheFirst(event, AUDIO_CACHE, MAX_AUDIO_TRACKS));
    return;
  }
  if (url.pathname.endsWith("/preview_48s.m4a")) {
    event.respondWith(cacheFirst(event, PREVIEW_CACHE, MAX_PREVIEWS));
    return;
  }
  if (url.pathname.includes("/assets/")) {
    // Fonts are fetched in CORS mode and may carry an Origin header that was
    // absent during shell installation. Vite's `Vary: Origin` response would
    // otherwise hide the already-cached, same-origin immutable asset offline.
    event.respondWith(cacheFirst(event, SHELL_CACHE, 80, true));
    return;
  }
  if (
    url.pathname.endsWith(".json")
    || url.pathname.endsWith(".svg")
    || url.pathname.endsWith(".png")
    || url.pathname.endsWith(".webp")
  ) {
    event.respondWith(networkFirst(event));
  }
});
