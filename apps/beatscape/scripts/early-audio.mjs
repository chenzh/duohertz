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
      return { controller, promise: pending.promise };
    },
    promise: fetch(url, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error(`Audio load failed (${response.status})`);
      return response.arrayBuffer();
    }),
  };
  window.__beatscapeEarlyAudio = pending;
  window.addEventListener('pagehide', cancel);
  window.addEventListener('popstate', discardIfStale);
  // A failed module/catalog must not leave a download or encoded buffer rooted.
  timer = window.setTimeout(cancel, 30000);
  // Before adoption nobody awaits this promise. Handle failure immediately so
  // normal application loading can retry without an unhandled rejection.
  void pending.promise.catch(cancel);
}
