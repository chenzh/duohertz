import { afterEach, describe, expect, it, vi } from "vitest";
import { DECODED_AUDIO_CACHE_BYTES, DecodedAudioCache } from "./decodedAudioCache";
import { startEarlyAudio } from "../../scripts/early-audio.mjs";
import { discardStaleEarlyAudio } from "./earlyAudio";
import type { AudioLoadProgress } from "./earlyAudio";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function buffer(bytes = 16): AudioBuffer {
  return { length: bytes / 8, numberOfChannels: 2, sampleRate: 48000, duration: 120 } as AudioBuffer;
}

function response(encoded = new ArrayBuffer(8), status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    arrayBuffer: async () => encoded,
  } as Response;
}

function decoder(sampleRate = 48000, decoded = buffer()) {
  return { sampleRate, decodeAudioData: vi.fn(async () => decoded) };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function earlyAudioWindow(pathname = "/play/selected") {
  const browser = Object.assign(new EventTarget(), {
    location: { pathname },
    setTimeout: vi.fn(() => 1),
    clearTimeout: vi.fn(),
    __beatscapeEarlyAudio: undefined as Window["__beatscapeEarlyAudio"],
  });
  vi.stubGlobal("window", browser);
  return browser;
}

describe("decoded music cache", () => {
  it("reports real streamed byte progress to both leases and decodes the exact assembled bytes once", async () => {
    let stream!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({ start(controller) { stream = controller; } });
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Length": "8" }),
      body,
    } as Response)));
    const ctx = decoder();
    const cache = new DecodedAudioCache();
    const p1: AudioLoadProgress[] = [];
    const p2: AudioLoadProgress[] = [];
    const first = cache.acquire(ctx, "/song", (progress) => p1.push(progress));
    const second = cache.acquire(ctx, "/song", (progress) => p2.push(progress));
    stream.enqueue(new Uint8Array([1, 2, 3]));
    await vi.waitFor(() => expect(p1).toContainEqual({ phase: "download", loadedBytes: 3, totalBytes: 8 }));
    expect(p2).toContainEqual({ phase: "download", loadedBytes: 3, totalBytes: 8 });
    stream.enqueue(new Uint8Array([4, 5, 6, 7, 8]));
    stream.close();
    await Promise.all([first.promise, second.promise]);
    expect(p1.at(-1)).toEqual({ phase: "decode" });
    expect(p2.at(-1)).toEqual({ phase: "decode" });
    expect(new Uint8Array(ctx.decodeAudioData.mock.calls[0]![0])).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it("adopts parser byte progress already in flight without a second download", async () => {
    earlyAudioWindow();
    let stream!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({ start(controller) { stream = controller; } });
    const fetchAudio = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Length": "4" }),
      body,
    } as Response));
    vi.stubGlobal("fetch", fetchAudio);
    startEarlyAudio({ selected: "/song" }, "/");
    stream.enqueue(new Uint8Array([1, 2]));
    await Promise.resolve();
    await Promise.resolve();
    const progress: AudioLoadProgress[] = [];
    const ctx = decoder();
    const lease = new DecodedAudioCache().acquire(ctx, "/song", (update) => progress.push(update));
    await vi.waitFor(() => expect(progress).toContainEqual({ phase: "download", loadedBytes: 2, totalBytes: 4 }));
    stream.enqueue(new Uint8Array([3, 4]));
    stream.close();
    await lease.promise;
    expect(fetchAudio).toHaveBeenCalledTimes(1);
    expect(progress.at(-1)).toEqual({ phase: "decode" });
    expect(new Uint8Array(ctx.decodeAudioData.mock.calls[0]![0])).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it("adopts the head download once for both players without copying encoded bytes", async () => {
    const browser = earlyAudioWindow("/duo/selected");
    const encoded = new ArrayBuffer(32);
    const fetchAudio = vi.fn(async () => response(encoded));
    vi.stubGlobal("fetch", fetchAudio);
    startEarlyAudio({ selected: "/audio.m4a?v=release" }, "/");
    expect(fetchAudio).toHaveBeenCalledTimes(1);
    const ctx = decoder();
    const cache = new DecodedAudioCache();
    const first = cache.acquire(ctx, "/audio.m4a?v=release");
    const second = cache.acquire(ctx, "/audio.m4a?v=release");
    expect(await first.promise).toBe(await second.promise);
    expect(fetchAudio).toHaveBeenCalledTimes(1);
    expect(ctx.decodeAudioData).toHaveBeenCalledExactlyOnceWith(encoded);
    expect(browser.__beatscapeEarlyAudio).toBeUndefined();
    expect(browser.clearTimeout).toHaveBeenCalledWith(1);
  });

  it("aborts an adopted request only at its last release and can remount immediately", async () => {
    earlyAudioWindow();
    const network = deferred<Response>();
    const fetchAudio = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(response()))
      .mockReturnValueOnce(network.promise);
    vi.stubGlobal("fetch", fetchAudio);
    startEarlyAudio({ selected: "/audio?v=a" }, "/");
    const ctx = decoder();
    const cache = new DecodedAudioCache();
    const first = cache.acquire(ctx, "/audio?v=a");
    const partner = cache.acquire(ctx, "/audio?v=a");
    const firstCancelled = expect(first.promise).rejects.toMatchObject({ name: "AbortError" });
    const partnerCancelled = expect(partner.promise).rejects.toMatchObject({ name: "AbortError" });
    first.release();
    expect(fetchAudio.mock.calls[0]![1]!.signal!.aborted).toBe(false);
    partner.release();
    expect(fetchAudio.mock.calls[0]![1]!.signal!.aborted).toBe(true);
    const replacement = cache.acquire(ctx, "/audio?v=a");
    network.reject(new Error("old request aborted"));
    await Promise.all([firstCancelled, partnerCancelled, replacement.promise]);
    expect(fetchAudio).toHaveBeenCalledTimes(2);
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it("discards a stale release URL and retries a failed early download normally", async () => {
    const browser = earlyAudioWindow();
    const fetchAudio = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(response()));
    vi.stubGlobal("fetch", fetchAudio);
    startEarlyAudio({ selected: "/audio?v=old" }, "/");
    const cache = new DecodedAudioCache();
    const ctx = decoder();
    await cache.acquire(ctx, "/audio?v=new").promise;
    expect(fetchAudio.mock.calls[0]![1]!.signal!.aborted).toBe(true);
    expect(fetchAudio.mock.calls[1]![0]).toBe("/audio?v=new");
    expect(browser.__beatscapeEarlyAudio).toBeUndefined();

    fetchAudio.mockRejectedValueOnce(new Error("temporary network failure"));
    startEarlyAudio({ selected: "/audio?v=next" }, "/");
    await Promise.resolve();
    await Promise.resolve();
    expect(browser.__beatscapeEarlyAudio).toBeUndefined();
    await cache.acquire(ctx, "/audio?v=next").promise;
    expect(fetchAudio).toHaveBeenCalledTimes(4);
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(2);
  });

  it("recovers an adopted parser download through the shared retry path", async () => {
    earlyAudioWindow();
    const firstNetwork = deferred<Response>();
    const fetchAudio = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(response()))
      .mockReturnValueOnce(firstNetwork.promise);
    vi.stubGlobal("fetch", fetchAudio);
    startEarlyAudio({ selected: "/audio?v=release" }, "/");
    const cache = new DecodedAudioCache(DECODED_AUDIO_CACHE_BYTES, [0, 0]);
    const ctx = decoder();
    const audio = cache.acquire(ctx, "/audio?v=release");
    firstNetwork.resolve(response(new ArrayBuffer(0), 503));

    await expect(audio.promise).resolves.toBeDefined();
    expect(fetchAudio).toHaveBeenCalledTimes(2);
    expect(fetchAudio.mock.calls[0]![1]!.signal!.aborted).toBe(false);
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it("router cleanup cancels an unadopted request after SPA navigation", () => {
    const browser = earlyAudioWindow();
    const fetchAudio = vi.fn((_url: string, _init?: RequestInit) => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchAudio);
    startEarlyAudio({ selected: "/audio?v=a" }, "/");
    discardStaleEarlyAudio();
    expect(fetchAudio.mock.calls[0]![1]!.signal!.aborted).toBe(false);
    browser.location.pathname = "/library";
    discardStaleEarlyAudio();
    expect(fetchAudio.mock.calls[0]![1]!.signal!.aborted).toBe(true);
    expect(browser.__beatscapeEarlyAudio).toBeUndefined();
  });

  it("shares concurrent fetch/decode and hands the fetched bytes directly to the decoder", async () => {
    const encoded = new ArrayBuffer(32);
    const fetchAudio = vi.fn(async () => response(encoded));
    vi.stubGlobal("fetch", fetchAudio);
    const ctx = decoder();
    const cache = new DecodedAudioCache();
    const first = cache.acquire(ctx, "/audio.m4a?v=a");
    const second = cache.acquire(ctx, "/audio.m4a?v=a");
    const [a, b] = await Promise.all([first.promise, second.promise]);
    expect(a).toBe(b);
    expect(fetchAudio).toHaveBeenCalledTimes(1);
    expect(ctx.decodeAudioData).toHaveBeenCalledExactlyOnceWith(encoded);
    first.release();
    second.release();
    expect(await cache.acquire(ctx, "/audio.m4a?v=a").promise).toBe(a);
    expect(fetchAudio).toHaveBeenCalledTimes(1);
  });

  it("keeps release hashes and decoder sample rates isolated", async () => {
    const fetchAudio = vi.fn(async () => response());
    vi.stubGlobal("fetch", fetchAudio);
    const cache = new DecodedAudioCache();
    const ctx48 = decoder();
    const ctx44 = decoder(44100);
    await Promise.all([
      cache.acquire(ctx48, "/audio.m4a?v=a").promise,
      cache.acquire(ctx48, "/audio.m4a?v=b").promise,
      cache.acquire(ctx44, "/audio.m4a?v=a").promise,
    ]);
    expect(fetchAudio).toHaveBeenCalledTimes(3);
    expect(ctx48.decodeAudioData).toHaveBeenCalledTimes(2);
    expect(ctx44.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it("shares automatic recovery from transient transport failures", async () => {
    const ctx = decoder();
    const fetchAudio = vi.fn(async () => response())
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(response(new ArrayBuffer(0), 503));
    vi.stubGlobal("fetch", fetchAudio);
    const cache = new DecodedAudioCache(DECODED_AUDIO_CACHE_BYTES, [0, 0]);
    const first = cache.acquire(ctx, "/audio");
    const partner = cache.acquire(ctx, "/audio");

    expect(await first.promise).toBe(await partner.promise);
    expect(fetchAudio).toHaveBeenCalledTimes(3);
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it("does not retry permanent HTTP failures", async () => {
    const fetchAudio = vi.fn(async () => response(new ArrayBuffer(0), 404));
    vi.stubGlobal("fetch", fetchAudio);
    const cache = new DecodedAudioCache(DECODED_AUDIO_CACHE_BYTES, [0, 0]);

    await expect(cache.acquire(decoder(), "/missing").promise).rejects.toThrow("Audio load failed (404)");
    expect(fetchAudio).toHaveBeenCalledTimes(1);
  });

  it("stops after three failed transport attempts", async () => {
    const fetchAudio = vi.fn(async () => response(new ArrayBuffer(0), 503));
    vi.stubGlobal("fetch", fetchAudio);
    const cache = new DecodedAudioCache(DECODED_AUDIO_CACHE_BYTES, [0, 0]);

    await expect(cache.acquire(decoder(), "/offline").promise).rejects.toThrow("Audio load failed (503)");
    expect(fetchAudio).toHaveBeenCalledTimes(3);
  });

  it("aborts a pending backoff when the final player leaves", async () => {
    vi.useFakeTimers();
    const fetchAudio = vi.fn(async () => response(new ArrayBuffer(0), 503));
    vi.stubGlobal("fetch", fetchAudio);
    const cache = new DecodedAudioCache(DECODED_AUDIO_CACHE_BYTES, [1_000, 1_000]);
    const audio = cache.acquire(decoder(), "/leave");
    const cancelled = expect(audio.promise).rejects.toMatchObject({ name: "AbortError" });
    await Promise.resolve();
    audio.release();

    await cancelled;
    await vi.runAllTimersAsync();
    expect(fetchAudio).toHaveBeenCalledTimes(1);
  });

  it("allows a manual retry after a decode failure", async () => {
    const ctx = decoder();
    const fetchAudio = vi.fn(async () => response());
    ctx.decodeAudioData.mockRejectedValueOnce(new Error("decode"));
    vi.stubGlobal("fetch", fetchAudio);
    const cache = new DecodedAudioCache(DECODED_AUDIO_CACHE_BYTES, [0, 0]);
    await expect(cache.acquire(ctx, "/audio").promise).rejects.toThrow();
    await expect(cache.acquire(ctx, "/audio").promise).resolves.toBeDefined();
    expect(fetchAudio).toHaveBeenCalledTimes(2);
  });

  it("evicts the least recently used decoded bytes within the budget", async () => {
    const fetchAudio = vi.fn(async () => response());
    vi.stubGlobal("fetch", fetchAudio);
    const cache = new DecodedAudioCache(32);
    const ctx = decoder();
    await cache.acquire(ctx, "a").promise;
    await cache.acquire(ctx, "b").promise;
    await cache.acquire(ctx, "a").promise; // Keep a newer than b.
    await cache.acquire(ctx, "c").promise;
    await cache.acquire(ctx, "a").promise;
    expect(fetchAudio).toHaveBeenCalledTimes(3);
    await cache.acquire(ctx, "b").promise;
    expect(fetchAudio).toHaveBeenCalledTimes(4);
  });

  it("shares an oversized buffer in flight but does not retain it", async () => {
    const fetchAudio = vi.fn(async () => response());
    vi.stubGlobal("fetch", fetchAudio);
    const cache = new DecodedAudioCache(8);
    const ctx = decoder();
    const [a, b] = await Promise.all([cache.acquire(ctx, "a").promise, cache.acquire(ctx, "a").promise]);
    expect(a).toBe(b);
    expect(fetchAudio).toHaveBeenCalledTimes(1);
    await cache.acquire(ctx, "a").promise;
    expect(fetchAudio).toHaveBeenCalledTimes(2);
  });

  it("an oversized track does not evict smaller reusable buffers", async () => {
    const fetchAudio = vi.fn(async () => response());
    vi.stubGlobal("fetch", fetchAudio);
    const cache = new DecodedAudioCache(16);
    const ctx = decoder();
    const small = await cache.acquire(ctx, "small").promise;
    ctx.decodeAudioData.mockResolvedValueOnce(buffer(32));
    await cache.acquire(ctx, "large").promise;
    expect(await cache.acquire(ctx, "small").promise).toBe(small);
    expect(fetchAudio).toHaveBeenCalledTimes(2);
  });

  it("one departing player does not cancel a remaining player's download", async () => {
    const network = deferred<Response>();
    const fetchAudio = vi.fn((_url: string, _init?: RequestInit) => network.promise);
    vi.stubGlobal("fetch", fetchAudio);
    const cache = new DecodedAudioCache();
    const ctx = decoder();
    const first = cache.acquire(ctx, "duo");
    const second = cache.acquire(ctx, "duo");
    const cancelled = expect(first.promise).rejects.toMatchObject({ name: "AbortError" });
    first.release();
    first.release();
    expect(fetchAudio.mock.calls[0]![1]!.signal!.aborted).toBe(false);
    network.resolve(response());
    await cancelled;
    await expect(second.promise).resolves.toBeDefined();
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it("last release aborts synchronously and a late failure cannot remove a replacement request", async () => {
    const oldNetwork = deferred<Response>();
    const newNetwork = deferred<Response>();
    const fetchAudio = vi.fn((_url: string, _init?: RequestInit) => newNetwork.promise)
      .mockReturnValueOnce(oldNetwork.promise);
    vi.stubGlobal("fetch", fetchAudio);
    const ctx = decoder();
    const cache = new DecodedAudioCache();
    const old = cache.acquire(ctx, "a");
    const cancelled = expect(old.promise).rejects.toMatchObject({ name: "AbortError" });
    old.release();
    expect(fetchAudio.mock.calls[0]![1]!.signal!.aborted).toBe(true);
    const current = cache.acquire(ctx, "a");
    oldNetwork.reject(new Error("old fetch aborted"));
    await cancelled;
    const partner = cache.acquire(ctx, "a");
    newNetwork.resolve(response());
    expect(await current.promise).toBe(await partner.promise);
    expect(fetchAudio).toHaveBeenCalledTimes(2);
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it("discards a decode completed after its last subscriber released", async () => {
    const decoding = deferred<AudioBuffer>();
    const decodeStarted = deferred<void>();
    const ctx = decoder();
    ctx.decodeAudioData.mockImplementationOnce(() => {
      decodeStarted.resolve();
      return decoding.promise;
    });
    const fetchAudio = vi.fn(async () => response());
    vi.stubGlobal("fetch", fetchAudio);
    const cache = new DecodedAudioCache();
    const first = cache.acquire(ctx, "a");
    const cancelled = expect(first.promise).rejects.toMatchObject({ name: "AbortError" });
    await decodeStarted.promise;
    first.release();
    decoding.resolve(buffer());
    await cancelled;
    await cache.acquire(ctx, "a").promise;
    expect(fetchAudio).toHaveBeenCalledTimes(2);
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(2);
  });
});
