/** Serialized into the release HTML: no imports or application module needed. */
export function startEarlyAudio(tracks, base) {
  const match = window.location.pathname.match(/^(?:\/beatscape)?\/(?:play|duo)\/([^/]+)\/?$/);
  if (!match) return;
  let id;
  try { id = decodeURIComponent(match[1]); } catch { return; }
  if (!Object.hasOwn(tracks, id)) return;

  const url = base + tracks[id].replace(/^\//, '');
  const pathname = window.location.pathname;
  const controller = new AbortController();
  const listeners = new Set();
  let progress = { phase: 'download', loadedBytes: 0, totalBytes: null };
  const report = (next) => {
    progress = next;
    for (const listener of listeners) listener(progress);
  };
  let timer;
  const detach = () => {
    window.clearTimeout(timer);
    window.removeEventListener('pagehide', cancel);
    window.removeEventListener('popstate', discardIfStale);
    if (window.__beatscapeEarlyAudio === pending) delete window.__beatscapeEarlyAudio;
  };
  const cancel = () => { detach(); controller.abort(); };
  const discardIfStale = () => { if (window.location.pathname !== pathname) cancel(); };
  const pending = {
    discardIfStale,
    take(requestedUrl) {
      if (requestedUrl !== url || window.location.pathname !== pathname || controller.signal.aborted) {
        cancel();
        return null;
      }
      detach();
      return {
        controller,
        promise: pending.promise,
        subscribe(listener) {
          listeners.add(listener);
          listener(progress);
          return () => listeners.delete(listener);
        },
      };
    },
    promise: fetch(url, { signal: controller.signal }).then(async response => {
      if (!response.ok) {
        const error = new Error(`Audio load failed (${response.status})`);
        error.status = response.status;
        throw error;
      }
      const length = Number(response.headers?.get('Content-Length'));
      const totalBytes = Number.isFinite(length) && length > 0 ? length : null;
      report({ phase: 'download', loadedBytes: 0, totalBytes });
      if (!response.body) {
        const encoded = await response.arrayBuffer();
        report({ phase: 'decode' });
        return encoded;
      }
      const reader = response.body.getReader();
      const chunks = [];
      let loadedBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loadedBytes += value.byteLength;
        report({ phase: 'download', loadedBytes, totalBytes });
      }
      const encoded = new Uint8Array(loadedBytes);
      let offset = 0;
      for (const chunk of chunks) {
        encoded.set(chunk, offset);
        offset += chunk.byteLength;
      }
      report({ phase: 'decode' });
      return encoded.buffer;
    }),
  };
  window.__beatscapeEarlyAudio = pending;
  window.addEventListener('pagehide', cancel);
  window.addEventListener('popstate', discardIfStale);
  // A failed module/catalog must not leave a download or encoded buffer rooted.
  timer = window.setTimeout(cancel, 30000);
  // Before adoption nobody awaits this promise. Handle failure immediately so
  // normal application loading can retry without an unhandled rejection.
  void pending.promise.catch(() => {
    // Once adopted, the app cache owns cancellation and may retry a transient
    // transport failure with the same controller. Only orphaned parser work
    // should abort itself here.
    if (window.__beatscapeEarlyAudio === pending) cancel();
  });
}
