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
  vi.restoreAllMocks();
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

  it("schedules section practice at an absolute audio offset after the lead-in", async () => {
    const conductor = makeConductor();
    await conductor.load("section");
    conductor.begin(3000, 45000);
    expect(ctx.sources[0]!.start).toHaveBeenCalledWith(13, 45);
  });

  it("preserves a section-practice lead-in when paused before audio starts", async () => {
    const conductor = makeConductor();
    await conductor.load("section-pause");
    conductor.begin(3000, 45000);
    conductor.pause();
    conductor.resume();
    expect(ctx.sources).toHaveLength(2);
    expect(ctx.sources[1]!.start).toHaveBeenCalledWith(13, 45);
  });

  it("freezes song time during an AudioContext-aligned resume countdown", async () => {
    vi.spyOn(performance, "now").mockReturnValue(1_000);
    const conductor = makeConductor();
    await conductor.load("resume-countdown");
    conductor.begin(0);
    ctx.currentTime = 20;
    expect(conductor.songTimeMs()).toBeCloseTo(10_000);

    conductor.pause();
    conductor.resume(3_000);
    expect(ctx.sources).toHaveLength(2);
    expect(ctx.sources[1]!.start).toHaveBeenCalledWith(23, 10);
    expect(conductor.countdownRemainingMs).toBeCloseTo(3_000);

    ctx.currentTime = 22;
    expect(conductor.songTimeMs()).toBeCloseTo(10_000);
    expect(conductor.countdownRemainingMs).toBeCloseTo(1_000);
    ctx.currentTime = 23;
    expect(conductor.songTimeMs()).toBeCloseTo(10_000);
    ctx.currentTime = 24;
    expect(conductor.songTimeMs()).toBeCloseTo(11_000);
  });

  it("preserves the remaining lead-in when a resume countdown is paused", async () => {
    vi.spyOn(performance, "now").mockReturnValue(1_000);
    const conductor = makeConductor();
    await conductor.load("resume-countdown-pause");
    conductor.begin(0);
    ctx.currentTime = 20;
    conductor.songTimeMs();
    conductor.pause();
    conductor.resume(3_000);

    ctx.currentTime = 21;
    conductor.pause();
    expect(conductor.countdownRemainingMs).toBeCloseTo(2_000);
    ctx.currentTime = 50;
    expect(conductor.countdownRemainingMs).toBeCloseTo(2_000);

    // A fresh 3s request must continue the retained 2s, not restart it.
    conductor.resume(3_000);
    expect(ctx.sources).toHaveLength(3);
    expect(ctx.sources[2]!.start).toHaveBeenCalledWith(52, 10);
    ctx.currentTime = 51;
    expect(conductor.songTimeMs()).toBeCloseTo(10_000);
    expect(conductor.countdownRemainingMs).toBeCloseTo(1_000);
  });

  it("keeps the resume countdown at three real seconds during Practice slowdown", async () => {
    vi.spyOn(performance, "now").mockReturnValue(1_000);
    const conductor = makeConductor();
    await conductor.load("practice-resume-countdown");
    conductor.begin(0);
    conductor.setRate(0.5, 5_000);
    ctx.currentTime = 12;
    expect(conductor.songTimeMs()).toBeCloseTo(1_000);

    conductor.pause();
    conductor.resume(3_000);
    expect(ctx.sources).toHaveLength(2);
    expect(ctx.sources[1]!.playbackRate.value).toBe(0.5);
    expect(ctx.sources[1]!.start).toHaveBeenCalledWith(15, 1);
    expect(conductor.countdownRemainingMs).toBeCloseTo(3_000);

    ctx.currentTime = 14;
    expect(conductor.songTimeMs()).toBeCloseTo(1_000);
    expect(conductor.countdownRemainingMs).toBeCloseTo(1_000);
    ctx.currentTime = 16;
    expect(conductor.songTimeMs()).toBeCloseTo(1_500);
  });

  it("exposes a temporary Practice rate and clears it after the assist window", async () => {
    const wallClock = vi.spyOn(performance, "now").mockReturnValue(1_000);
    const conductor = makeConductor();
    await conductor.load("practice-rate");
    conductor.begin(0);
    conductor.setRate(0.5, 5_000);
    expect(conductor.playbackRate).toBe(0.5);
    expect(conductor.rateRemainingMs).toBe(5_000);

    wallClock.mockReturnValue(3_500);
    ctx.currentTime = 12.5;
    expect(conductor.rateRemainingMs).toBe(2_500);

    wallClock.mockReturnValue(6_100);
    ctx.currentTime = 15.1;
    expect(conductor.playbackRate).toBe(1);
    expect(conductor.rateRemainingMs).toBe(0);
  });

  it("keeps a selected Practice tempo through begin, resume, and restart", async () => {
    const conductor = makeConductor();
    await conductor.load("manual-practice-rate");
    conductor.setBaseRate(0.75);
    conductor.begin(0);
    expect(conductor.basePlaybackRate).toBe(0.75);
    expect(ctx.sources[0]!.playbackRate.value).toBe(0.75);

    conductor.pause();
    conductor.resume(3_000);
    expect(ctx.sources[1]!.playbackRate.value).toBe(0.75);

    conductor.stop();
    conductor.begin(0);
    expect(ctx.sources[2]!.playbackRate.value).toBe(0.75);
  });

  it("keeps the opening countdown at three real seconds below full tempo", async () => {
    vi.spyOn(performance, "now").mockReturnValue(1_000);
    const conductor = makeConductor();
    await conductor.load("manual-practice-countdown");
    conductor.setBaseRate(0.75);
    conductor.begin(3_000);
    expect(conductor.countdownRemainingMs).toBeCloseTo(3_000);
    expect(ctx.sources[0]!.start).toHaveBeenCalledWith(13, 0);

    ctx.currentTime = 13;
    expect(conductor.songTimeMs()).toBeCloseTo(0);
    expect(conductor.countdownRemainingMs).toBeCloseTo(0);
  });

  it("restores temporary Practice assist to the selected tempo and lets manual choice cancel it", async () => {
    const wallClock = vi.spyOn(performance, "now").mockReturnValue(1_000);
    const conductor = makeConductor();
    await conductor.load("manual-practice-assist");
    conductor.setBaseRate(0.75);
    conductor.begin(0);
    conductor.setRate(0.5, 5_000);
    expect(conductor.playbackRate).toBe(0.5);

    wallClock.mockReturnValue(6_100);
    ctx.currentTime = 15.1;
    expect(conductor.playbackRate).toBe(0.75);
    expect(conductor.rateRemainingMs).toBe(0);

    conductor.setRate(0.5, 5_000);
    conductor.setBaseRate(1);
    expect(conductor.basePlaybackRate).toBe(1);
    expect(conductor.playbackRate).toBe(1);
    expect(conductor.rateRemainingMs).toBe(0);
  });
});
