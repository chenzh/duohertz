import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// P2-4 regression: hits must play from a pre-rendered AudioBuffer (≈1–2 nodes),
// not spawn the full additive-synth graph (≈50 nodes) on every hit.

const ctxRef: { current: any } = { current: null };
vi.mock("../audio/context", () => ({ getAudioContext: () => ctxRef.current }));

import { ensureRendered, __voiceCacheSize, playHit, voiceKeyFor } from "./hitsounds";

function makeCountingCtx() {
  const counts = { total: 0, bufferSource: 0, oscillator: 0, gain: 0, biquad: 0, convolver: 0 };
  const param = () => ({
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
    value: 0,
  });
  const node = () => ({
    connect() {},
    start() {},
    stop() {},
    gain: param(),
    frequency: param(),
    Q: param(),
    type: "",
    buffer: null,
    loop: false,
  });
  return {
    counts,
    ctx: {
      sampleRate: 44100,
      currentTime: 0,
      destination: node(),
      createGain: () => { counts.total++; counts.gain++; return node(); },
      createBiquadFilter: () => { counts.total++; counts.biquad++; return node(); },
      createBufferSource: () => { counts.total++; counts.bufferSource++; return node(); },
      createOscillator: () => { counts.total++; counts.oscillator++; return node(); },
      createConvolver: () => { counts.total++; counts.convolver++; return node(); },
      createBuffer: () => ({ getChannelData: () => new Float32Array(16) }),
    },
  };
}

// Minimal OfflineAudioContext stub: records play, returns a fake AudioBuffer.
const param = () => ({
  value: 0,
  setValueAtTime() {},
  linearRampToValueAtTime() {},
  exponentialRampToValueAtTime() {},
});
class FakeOffline {
  constructor(public channels: number, public length: number, public sampleRate: number) {}
  createGain() { return { connect() {}, gain: param() }; }
  createBiquadFilter() { return { connect() {}, frequency: param(), Q: param(), type: "" }; }
  createBufferSource() { return { connect() {}, start() {}, stop() {}, buffer: null, loop: false }; }
  createOscillator() { return { connect() {}, start() {}, stop() {}, type: "", frequency: param() }; }
  createConvolver() { return { connect() {}, buffer: null }; }
  createBuffer() { return { getChannelData: () => new Float32Array(16) }; }
  startRendering() { return Promise.resolve({ duration: 0, length: 1, sampleRate: 44100 }); }
}

let live: ReturnType<typeof makeCountingCtx>;

beforeEach(() => {
  live = makeCountingCtx();
  ctxRef.current = live.ctx;
  (globalThis as any).OfflineAudioContext = FakeOffline;
});

afterEach(() => {
  (globalThis as any).OfflineAudioContext = undefined;
});

describe("hitsounds P2-4 pre-render", () => {
  it("pre-renders every voice into the cache", async () => {
    await ensureRendered();
    // 18 distinct voices: perfect/great/good × tiers + miss/break/countdown×3/key/stamp/surge×2
    expect(__voiceCacheSize()).toBe(18);
  });

  it("cached playback spawns only a buffer source (~2 nodes), not the full graph", async () => {
    await ensureRendered();
    // First cached play also builds the live bus (gain + convolver + wet) once.
    playHit("perfect", 3);
    live.counts.total = 0; // reset; subsequent cached plays should be ~1 node
    playHit("perfect", 3);
    // bufferSource only — the additive synth (oscillators/filters) is baked in.
    expect(live.counts.total).toBeLessThanOrEqual(2);
    expect(live.counts.oscillator).toBe(0);
    expect(live.counts.biquad).toBe(0);
  });

  it("voiceKeyFor collapses surge tiers to changed layering only", () => {
    expect(voiceKeyFor("miss", 3)).toBe("miss");
    expect(voiceKeyFor("good", 0)).toBe("hit:good:0");
    expect(voiceKeyFor("good", 1)).toBe("hit:good:0"); // good layers only at >=3
    expect(voiceKeyFor("good", 3)).toBe("hit:good:3");
    expect(voiceKeyFor("great", 0)).toBe("hit:great:0");
    expect(voiceKeyFor("great", 1)).toBe("hit:great:1");
    expect(voiceKeyFor("great", 3)).toBe("hit:great:3");
    expect(voiceKeyFor("perfect", 0)).toBe("hit:perfect:0");
    expect(voiceKeyFor("perfect", 1)).toBe("hit:perfect:1");
    expect(voiceKeyFor("perfect", 3)).toBe("hit:perfect:3");
  });
});
