import { takeEarlyAudio, type AudioLoadProgress, type EarlyAudioDownload } from "./earlyAudio";
import { takeIntentAudio } from "./intentAudio";

/** A stereo 120s track at 48 kHz uses ~44 MiB of decoded PCM. */
export const DECODED_AUDIO_CACHE_BYTES = 64 * 1024 * 1024;
/** Initial request + two short retries for transient mobile-network failures. */
export const AUDIO_FETCH_RETRY_DELAYS_MS = [250, 750] as const;

type Decoder = Pick<AudioContext, "sampleRate" | "decodeAudioData">;

export type DecodedAudioLease = {
  promise: Promise<AudioBuffer>;
  /** Release a pending subscription; safe to call again after it has settled. */
  release(): void;
};

type Consumer = {
  resolve(buffer: AudioBuffer): void;
  reject(reason: unknown): void;
  onProgress?: (progress: AudioLoadProgress) => void;
};

type Entry = {
  key: string;
  controller: AbortController;
  consumers: Set<Consumer>;
  buffer: AudioBuffer | null;
  bytes: number;
  abandoned: boolean;
  progress: AudioLoadProgress;
};

export function audioLoadAborted(): DOMException {
  return new DOMException("Audio load cancelled", "AbortError");
}

type AudioLoadError = Error & { status?: number };

function audioHttpError(status: number): AudioLoadError {
  const error = new Error(`Audio load failed (${status})`) as AudioLoadError;
  error.status = status;
  return error;
}

function statusFromError(error: unknown): number | null {
  const direct = (error as { status?: unknown } | null)?.status;
  if (typeof direct === "number" && Number.isFinite(direct)) return direct;
  if (!(error instanceof Error)) return null;
  const match = error.message.match(/^Audio load failed \((\d+)\)$/);
  return match ? Number(match[1]) : null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}

function isRetryableTransportError(error: unknown): boolean {
  if (isAbortError(error)) return false;
  const status = statusFromError(error);
  if (status === null) return true;
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function waitForRetry(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(audioLoadAborted());
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      globalThis.clearTimeout(timer);
      reject(audioLoadAborted());
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Shares fetch/decode work, not playback nodes. Completed buffers are LRU-bound
 * by decoded PCM bytes; current players can continue using an evicted buffer.
 * A track larger than the budget is shared in flight but never retained here.
 * No background work stays registered after its last consumer leaves.
 */
export class DecodedAudioCache {
  private entries = new Map<string, Entry>();
  private retainedBytes = 0;

  constructor(
    private readonly maxBytes = DECODED_AUDIO_CACHE_BYTES,
    private readonly retryDelaysMs: readonly number[] = AUDIO_FETCH_RETRY_DELAYS_MS,
  ) {
    if (!Number.isFinite(maxBytes) || maxBytes < 0) throw new RangeError("Invalid audio cache budget");
    if (retryDelaysMs.some((delay) => !Number.isFinite(delay) || delay < 0)) {
      throw new RangeError("Invalid audio retry delay");
    }
  }

  acquire(ctx: Decoder, url: string, onProgress?: (progress: AudioLoadProgress) => void): DecodedAudioLease {
    // Keep the complete URL, including the release's content-hash query string.
    // decodeAudioData resamples to its context, so sample rate is also identity.
    const key = JSON.stringify([ctx.sampleRate, url]);
    let entry = this.entries.get(key);
    if (entry?.buffer) {
      this.entries.delete(key);
      this.entries.set(key, entry);
      return { promise: Promise.resolve(entry.buffer), release() {} };
    }

    const created = !entry;
    let early: EarlyAudioDownload | null = null;
    if (!entry) {
      early = takeEarlyAudio(url) ?? takeIntentAudio(url);
      entry = {
        key,
        controller: early?.controller ?? new AbortController(),
        consumers: new Set(),
        buffer: null,
        bytes: 0,
        abandoned: false,
        progress: { phase: "download", loadedBytes: 0, totalBytes: null },
      };
      this.entries.set(key, entry);
    }
    const pending = entry;
    let consumer!: Consumer;
    const promise = new Promise<AudioBuffer>((resolve, reject) => {
      consumer = { resolve, reject, onProgress };
      pending.consumers.add(consumer);
    });
    onProgress?.(pending.progress);
    if (created) void this.load(pending, ctx, url, early);

    return {
      promise,
      release: () => {
        if (!pending.consumers.delete(consumer)) return;
        consumer.reject(audioLoadAborted());
        if (pending.consumers.size === 0) {
          pending.abandoned = true;
          pending.controller.abort();
          this.remove(pending);
        }
      },
    };
  }

  private async load(entry: Entry, ctx: Decoder, url: string, early: EarlyAudioDownload | null): Promise<void> {
    try {
      const stopEarlyProgress = early?.subscribe((progress) => this.report(entry, progress));
      let encoded: ArrayBuffer;
      try {
        encoded = await this.download(entry, url, early);
      } finally {
        stopEarlyProgress?.();
      }
      if (entry.abandoned) return;
      this.report(entry, { phase: "decode" });
      // Decoding consumes this freshly fetched buffer; no second copy is needed.
      const buffer = await ctx.decodeAudioData(encoded);
      if (entry.abandoned) return;

      entry.buffer = buffer;
      entry.bytes = buffer.length * buffer.numberOfChannels * Float32Array.BYTES_PER_ELEMENT;
      this.retainedBytes += entry.bytes;
      if (entry.bytes > this.maxBytes) {
        this.remove(entry);
      } else {
        this.entries.delete(entry.key);
        this.entries.set(entry.key, entry);
        this.trim();
      }
      for (const consumer of entry.consumers) consumer.resolve(buffer);
      entry.consumers.clear();
    } catch (error) {
      // A cancelled request may finish after a new request acquired the same key.
      this.remove(entry);
      for (const consumer of entry.consumers) consumer.reject(error);
      entry.consumers.clear();
    }
  }

  private report(entry: Entry, progress: AudioLoadProgress): void {
    if (entry.abandoned) return;
    entry.progress = progress;
    for (const consumer of entry.consumers) consumer.onProgress?.(progress);
  }

  /**
   * Retry only the encoded-byte transport. Decoding is deliberately outside
   * this loop: unsupported/corrupt media will not improve by downloading the
   * same multi-megabyte file three times. Every retry remains shared by Duo.
   */
  private async download(
    entry: Entry,
    url: string,
    early: EarlyAudioDownload | null,
  ): Promise<ArrayBuffer> {
    let attempts = 0;
    let adoptedEarly = early;
    while (true) {
      attempts++;
      try {
        if (entry.abandoned || entry.controller.signal.aborted) throw audioLoadAborted();
        if (adoptedEarly) {
          const pending = adoptedEarly;
          adoptedEarly = null;
          return await pending.promise;
        }
        const response = await fetch(url, { signal: entry.controller.signal });
        if (entry.abandoned) throw audioLoadAborted();
        if (!response.ok) throw audioHttpError(response.status);
        const length = Number(response.headers?.get("Content-Length"));
        const totalBytes = Number.isFinite(length) && length > 0 ? length : null;
        this.report(entry, { phase: "download", loadedBytes: 0, totalBytes });
        if (!response.body) return await response.arrayBuffer();
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let loadedBytes = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loadedBytes += value.byteLength;
          this.report(entry, { phase: "download", loadedBytes, totalBytes });
        }
        const encoded = new Uint8Array(loadedBytes);
        let offset = 0;
        for (const chunk of chunks) {
          encoded.set(chunk, offset);
          offset += chunk.byteLength;
        }
        return encoded.buffer;
      } catch (error) {
        const delay = this.retryDelaysMs[attempts - 1];
        if (
          delay === undefined
          || entry.abandoned
          || entry.controller.signal.aborted
          || !isRetryableTransportError(error)
        ) throw error;
        this.report(entry, { phase: "download", loadedBytes: 0, totalBytes: null });
        await waitForRetry(delay, entry.controller.signal);
      }
    }
  }

  private remove(entry: Entry): void {
    if (this.entries.get(entry.key) !== entry) return;
    this.entries.delete(entry.key);
    this.retainedBytes -= entry.bytes;
  }

  private trim(): void {
    for (const entry of this.entries.values()) {
      if (this.retainedBytes <= this.maxBytes) break;
      if (entry.buffer) this.remove(entry);
    }
  }
}

export const decodedAudioCache = new DecodedAudioCache();
