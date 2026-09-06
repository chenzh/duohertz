/** A stereo 120s track at 48 kHz uses ~44 MiB of decoded PCM. */
export const DECODED_AUDIO_CACHE_BYTES = 64 * 1024 * 1024;

type Decoder = Pick<AudioContext, "sampleRate" | "decodeAudioData">;

export type DecodedAudioLease = {
  promise: Promise<AudioBuffer>;
  /** Release a pending subscription; safe to call again after it has settled. */
  release(): void;
};

type Consumer = {
  resolve(buffer: AudioBuffer): void;
  reject(reason: unknown): void;
};

type Entry = {
  key: string;
  controller: AbortController;
  consumers: Set<Consumer>;
  buffer: AudioBuffer | null;
  bytes: number;
  abandoned: boolean;
};

export function audioLoadAborted(): DOMException {
  return new DOMException("Audio load cancelled", "AbortError");
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

  constructor(private readonly maxBytes = DECODED_AUDIO_CACHE_BYTES) {
    if (!Number.isFinite(maxBytes) || maxBytes < 0) throw new RangeError("Invalid audio cache budget");
  }

  acquire(ctx: Decoder, url: string): DecodedAudioLease {
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
    if (!entry) {
      entry = {
        key,
        controller: new AbortController(),
        consumers: new Set(),
        buffer: null,
        bytes: 0,
        abandoned: false,
      };
      this.entries.set(key, entry);
    }
    const pending = entry;
    let consumer!: Consumer;
    const promise = new Promise<AudioBuffer>((resolve, reject) => {
      consumer = { resolve, reject };
      pending.consumers.add(consumer);
    });
    if (created) void this.load(pending, ctx, url);

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

  private async load(entry: Entry, ctx: Decoder, url: string): Promise<void> {
    try {
      const response = await fetch(url, { signal: entry.controller.signal });
      if (entry.abandoned) return;
      if (!response.ok) throw new Error(`Audio load failed (${response.status})`);
      const encoded = await response.arrayBuffer();
      if (entry.abandoned) return;
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
