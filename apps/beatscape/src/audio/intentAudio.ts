import type { AudioLoadProgress, EarlyAudioDownload } from "./earlyAudio";

/** A bounded encoded-byte handoff for a song the player has already chosen. */
export type IntentAudioLease = {
  /** Keep the request alive across the First Shift -> Play route transition. */
  handoff(): void;
  /** Abort when the player leaves the story without starting the song. */
  release(): void;
};

type PendingIntent = EarlyAudioDownload & {
  url: string;
  cancel(): void;
  timeout: number;
};

const INTENT_LIFETIME_MS = 60_000;
let pendingIntent: PendingIntent | null = null;

export function discardIntentAudio(): void {
  pendingIntent?.cancel();
}

export function takeIntentAudio(url: string): EarlyAudioDownload | null {
  const entry = pendingIntent;
  if (!entry || entry.url !== url || entry.controller.signal.aborted) return null;
  pendingIntent = null;
  window.clearTimeout(entry.timeout);
  return entry;
}

/**
 * Begin downloading after a deliberate story entry, without creating an
 * AudioContext before the browser's trusted sound-unlock gesture. The decoded
 * cache takes this exact fetch on Play, including any bytes already received.
 */
export function beginIntentAudio(url: string): IntentAudioLease | null {
  if (typeof window === "undefined") return null;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return null;

  discardIntentAudio();
  const controller = new AbortController();
  const listeners = new Set<(progress: AudioLoadProgress) => void>();
  let progress: AudioLoadProgress = { phase: "download", loadedBytes: 0, totalBytes: null };
  let handedOff = false;
  let entry!: PendingIntent;

  const report = (next: AudioLoadProgress) => {
    progress = next;
    for (const listener of listeners) listener(next);
  };
  const promise = (async () => {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const error = new Error(`Audio load failed (${response.status})`) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    const length = Number(response.headers?.get("Content-Length"));
    const totalBytes = Number.isFinite(length) && length > 0 ? length : null;
    report({ phase: "download", loadedBytes: 0, totalBytes });
    if (!response.body) return response.arrayBuffer();

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loadedBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loadedBytes += value.byteLength;
      report({ phase: "download", loadedBytes, totalBytes });
    }
    const encoded = new Uint8Array(loadedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      encoded.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return encoded.buffer;
  })();

  entry = {
    url, controller, promise, timeout: 0,
    subscribe(listener) {
      listeners.add(listener);
      listener(progress);
      return () => listeners.delete(listener);
    },
    cancel() {
      if (pendingIntent === entry) pendingIntent = null;
      window.clearTimeout(entry.timeout);
      controller.abort();
      listeners.clear();
    },
  };
  pendingIntent = entry;
  entry.timeout = window.setTimeout(() => entry.cancel(), INTENT_LIFETIME_MS);
  // The story has no awaiter. Failed prefetches must not become unhandled;
  // Play will use its ordinary shared fetch/retry path instead.
  void promise.catch(() => {
    if (pendingIntent === entry) {
      pendingIntent = null;
      window.clearTimeout(entry.timeout);
      listeners.clear();
    }
  });

  return {
    handoff() { handedOff = true; },
    release() { if (!handedOff && pendingIntent === entry) entry.cancel(); },
  };
}
