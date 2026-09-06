import { afterEach, describe, expect, it, vi } from "vitest";
import { DecodedAudioCache } from "./decodedAudioCache";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function buffer(bytes = 16): AudioBuffer {
  return { length: bytes / 8, numberOfChannels: 2, sampleRate: 48000, duration: 120 } as AudioBuffer;
}

function response(encoded = new ArrayBuffer(8)): Response {
  return { ok: true, arrayBuffer: async () => encoded } as Response;
}

function decoder(sampleRate = 48000, decoded = buffer()) {
  return { sampleRate, decodeAudioData: vi.fn(async () => decoded) };
}

afterEach(() => vi.unstubAllGlobals());

describe("decoded music cache", () => {
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

  it.each(["fetch", "decode"])("allows retry after a %s failure", async (stage) => {
    const ctx = decoder();
    const fetchAudio = vi.fn(async () => response());
    if (stage === "fetch") fetchAudio.mockRejectedValueOnce(new Error("network"));
    else ctx.decodeAudioData.mockRejectedValueOnce(new Error("decode"));
    vi.stubGlobal("fetch", fetchAudio);
    const cache = new DecodedAudioCache();
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
