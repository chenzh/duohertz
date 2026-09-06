import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Conductor as ConductorType } from "./playback";

const contextRef = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("./context", () => ({ getAudioContext: () => contextRef.current, unlockAudio: vi.fn() }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function buffer(duration = 120): AudioBuffer {
  return { duration, length: duration * 48000, sampleRate: 48000, numberOfChannels: 2 } as AudioBuffer;
}

function fakeContext() {
  const param = () => ({ value: 0, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn() });
  const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });
  const sources: Array<ReturnType<typeof source>> = [];
  const gains: Array<ReturnType<typeof gain>> = [];
  const gain = () => ({ ...node(), gain: param() });
  const source = () => ({ ...node(), buffer: null as AudioBuffer | null, playbackRate: param(), start: vi.fn(), stop: vi.fn(), onended: null });
  return {
    sampleRate: 48000,
    currentTime: 10,
    state: "running",
    destination: node(),
    createGain: () => { const n = gain(); gains.push(n); return n; },
    createBiquadFilter: () => ({ ...node(), frequency: param(), type: "" }),
    createAnalyser: () => ({ ...node(), frequencyBinCount: 128 }),
    createBufferSource: () => { const n = source(); sources.push(n); return n; },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    decodeAudioData: vi.fn(async () => buffer()),
    sources,
    gains,
  };
}

let ctx: ReturnType<typeof fakeContext>;
let Conductor: typeof ConductorType;
const conductors: ConductorType[] = [];
const makeConductor = () => { const c = new Conductor(); conductors.push(c); return c; };

beforeEach(async () => {
  vi.resetModules();
  ctx = fakeContext();
  contextRef.current = ctx;
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));
  ({ Conductor } = await import("./playback"));
});

afterEach(() => {
  for (const conductor of conductors.splice(0)) conductor.dispose();
  vi.unstubAllGlobals();
});

describe("Conductor shared audio lifetime", () => {
  it("shares Duo's decoded buffer while sources, gains and stopping stay independent", async () => {
    const first = makeConductor();
    const second = makeConductor();
    await Promise.all([first.load("duo?v=a"), second.load("duo?v=a")]);
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1);
    first.setMusicVolume(0.7);
    second.setMusicVolume(0);
    first.begin();
    second.begin();
    expect(ctx.sources).toHaveLength(2);
    expect(ctx.sources[0]!.buffer).toBe(ctx.sources[1]!.buffer);
    expect(ctx.gains[0]!.gain.value).toBe(0.7);
    expect(ctx.gains[1]!.gain.value).toBe(0);
    first.dispose();
    expect(ctx.sources[0]!.stop).toHaveBeenCalledTimes(1);
    expect(ctx.sources[1]!.stop).not.toHaveBeenCalled();
    expect(second.playing).toBe(true);
  });

  it("dispose during fetch releases immediately and rejects further loads without fetching", async () => {
    const network = deferred<Response>();
    const fetchAudio = vi.fn((_url: string, _init?: RequestInit) => network.promise);
    vi.stubGlobal("fetch", fetchAudio);
    const conductor = makeConductor();
    const cancelled = expect(conductor.load("a")).rejects.toMatchObject({ name: "AbortError" });
    conductor.dispose();
    expect(fetchAudio.mock.calls[0]![1]!.signal!.aborted).toBe(true);
    await cancelled;
    await expect(conductor.load("b")).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchAudio).toHaveBeenCalledTimes(1);
    network.reject(new Error("aborted"));
    conductor.begin();
    expect(ctx.sources).toHaveLength(0);
  });

  it("dispose during decode cannot restore a buffer or playable source", async () => {
    const decoding = deferred<AudioBuffer>();
    const started = deferred<void>();
    ctx.decodeAudioData.mockImplementationOnce(() => { started.resolve(); return decoding.promise; });
    const conductor = makeConductor();
    const cancelled = expect(conductor.load("a")).rejects.toMatchObject({ name: "AbortError" });
    await started.promise;
    conductor.dispose();
    decoding.resolve(buffer());
    await cancelled;
    conductor.begin();
    expect(conductor.durationMs).toBe(0);
    expect(ctx.sources).toHaveLength(0);
  });

  it("a superseded decode cannot replace the latest loaded track", async () => {
    const oldDecode = deferred<AudioBuffer>();
    const started = deferred<void>();
    ctx.decodeAudioData.mockImplementationOnce(() => { started.resolve(); return oldDecode.promise; });
    const conductor = makeConductor();
    const cancelled = expect(conductor.load("old")).rejects.toMatchObject({ name: "AbortError" });
    await started.promise;
    const current = buffer(60);
    ctx.decodeAudioData.mockResolvedValueOnce(current);
    await conductor.load("new");
    oldDecode.resolve(buffer(120));
    await cancelled;
    conductor.begin();
    expect(conductor.durationMs).toBe(60000);
    expect(ctx.sources[0]!.buffer).toBe(current);
  });

  it("an old load rejection cannot release a replacement using the same URL", async () => {
    const oldNetwork = deferred<Response>();
    const newNetwork = deferred<Response>();
    const fetchAudio = vi.fn((_url: string, _init?: RequestInit) => newNetwork.promise)
      .mockReturnValueOnce(oldNetwork.promise);
    vi.stubGlobal("fetch", fetchAudio);
    const conductor = makeConductor();
    const cancelled = expect(conductor.load("a")).rejects.toMatchObject({ name: "AbortError" });
    const current = conductor.load("a");
    oldNetwork.reject(new Error("old failure"));
    await cancelled;
    expect(fetchAudio.mock.calls[1]![1]!.signal!.aborted).toBe(false);
    newNetwork.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) } as Response);
    await current;
    conductor.begin();
    expect(ctx.sources).toHaveLength(1);
    expect(conductor.durationMs).toBe(120000);
  });
});
