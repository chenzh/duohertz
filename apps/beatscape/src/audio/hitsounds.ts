import { getAudioContext } from "./context";
import type { Judgment } from "../types/chart";
import type { SurgeTier } from "../engine/surge";

// Self-owned percussion-style SFX (no external samples).
// V2: additive-synth bell/wood tones + a small algorithmic convolution reverb.
// Shares AudioContext with music for one clock.
//
// P2-4 perf: every composite hit used to spawn ~50 WebAudio nodes per call
// (additive partials × oscillators + filters). Each sound is now pre-rendered
// ONCE into an AudioBuffer via OfflineAudioContext; playback is a single
// BufferSource (~2 nodes) reusing the identical synth graph — same timbre,
// ~20× fewer allocations during dense charts.

const SFX_GAIN = 0.5;
const VOICE_SECONDS = 0.85; // longest voice (surge ON AIR carrier swell ~0.6s) + reverb tail

type AnyCtx = BaseAudioContext;
interface VoiceCtx {
  ctx: AnyCtx;
  bus: AudioNode;
}

let sfxBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

/** Build a mix bus + tiny algorithmic reverb send (dry+wet). */
function makeReverbBus(ctx: AnyCtx): GainNode {
  const out = ctx.createGain();
  out.gain.value = 1;
  out.connect(ctx.destination);
  const conv = ctx.createConvolver();
  conv.buffer = makeImpulse(ctx, 0.16, 2.8);
  const wet = ctx.createGain();
  wet.gain.value = 0.14;
  out.connect(conv);
  conv.connect(wet);
  wet.connect(ctx.destination);
  return out;
}

/** Live mix bus. Applies SFX_GAIN; offline renders use gain 1 and play through this on playback. */
function bus(): GainNode {
  if (!sfxBus) {
    sfxBus = makeReverbBus(getAudioContext());
    sfxBus.gain.value = SFX_GAIN;
  }
  return sfxBus;
}

/** Exponentially-decaying noise burst as a convolution impulse response. */
function makeImpulse(ctx: AnyCtx, seconds: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return buf;
}

export function setSfxVolume(v: number): void {
  bus().gain.value = Math.max(0, Math.min(1, v));
}

function noiseBuffer(ctx: AnyCtx): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  const len = Math.floor(ctx.sampleRate * 0.25);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    data[i] = i === 0 ? w : (data[i - 1]! * 0.65 + w * 0.35);
  }
  noiseBuf = buf;
  return buf;
}

/**
 * Softened noise transient — the "stick/wood" attack.
 * Lower high-pass + a low-pass cap keeps it from turning into a glassy click.
 */
function strike(v: VoiceCtx, opts: {
  dur: number;
  peak: number;
  hp: number;
  bp?: number;
  q?: number;
  lp?: number;
  at?: number;
}) {
  const { ctx } = v;
  const now = ctx.currentTime + (opts.at ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(opts.hp, now);
  hp.Q.setValueAtTime(0.7, now);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(opts.lp ?? 7000, now);

  let node: AudioNode = hp;
  if (opts.bp != null) {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(opts.bp, now);
    bp.Q.setValueAtTime(opts.q ?? 1.0, now);
    hp.connect(bp);
    node = bp;
  }
  node.connect(lp);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(opts.peak, now + 0.0018); // smooth 2ms attack
  gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.dur);

  src.connect(hp);
  lp.connect(gain);
  gain.connect(v.bus);
  src.start(now);
  src.stop(now + opts.dur + 0.02);
}

/**
 * Additive bell/wood tone — several inharmonic-ish partials summed give a
 * real "instrument" timbre instead of a single-oscillator bleep.
 */
function bell(v: VoiceCtx, opts: {
  base: number;
  dur: number;
  peak: number;
  partials?: number[];
  pgains?: number[];
  type?: OscillatorType;
  toFreq?: number;
  lp?: number;
  at?: number;
}) {
  const { ctx } = v;
  const now = ctx.currentTime + (opts.at ?? 0);
  const partials = opts.partials ?? [1, 2.0, 3.0, 4.2];
  const pgains = opts.pgains ?? [1, 0.5, 0.28, 0.16];

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.linearRampToValueAtTime(opts.peak, now + 0.002); // smooth attack
  env.gain.exponentialRampToValueAtTime(0.0001, now + opts.dur);

  let last: AudioNode = env;
  if (opts.lp) {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(opts.lp, now);
    env.connect(lp);
    last = lp;
  }
  last.connect(v.bus);

  partials.forEach((p, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? "triangle";
    osc.frequency.setValueAtTime(opts.base * p, now);
    if (opts.toFreq != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.toFreq * p), now + opts.dur);
    }
    g.gain.value = (pgains[i] ?? 0.1) / partials.length;
    osc.connect(g);
    g.connect(env);
    osc.start(now);
    osc.stop(now + opts.dur + 0.02);
  });
}

/** Soft low thump under miss/break — weight without cartoon buzz. */
function thump(v: VoiceCtx, peak: number, dur = 0.09) {
  const { ctx } = v;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(95, now);
  osc.frequency.exponentialRampToValueAtTime(48, now + dur);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain);
  gain.connect(v.bus);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

/** Low pad under scoring hits at ON AIR — the station hums with you. */
function padLow(v: VoiceCtx) {
  bell(v, { base: 130.81, dur: 0.1, peak: 0.09, type: "sine", partials: [1, 2], pgains: [1, 0.3], lp: 900 });
}

/** Soft band-passed noise swell under the ON AIR chime — "carrier locked". */
function carrierSwell(v: VoiceCtx) {
  const { ctx } = v;
  const now = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(1800, now);
  bp.Q.setValueAtTime(0.8, now);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.09, now + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  src.connect(bp);
  bp.connect(gain);
  gain.connect(v.bus);
  src.start(now);
  src.stop(now + 0.6);
}

// ---- Voice registry: single source of truth for each sound (live + offline share it) ----

type Builder = (v: VoiceCtx) => void;

const VOICES: Record<string, Builder> = {
  // perfect: tier accumulates layering (>=1 -> strike, >=2 -> bell, >=3 -> bell+pad)
  "hit:perfect:0": (v) => {
    strike(v, { dur: 0.05, peak: 0.4, hp: 2000, bp: 4200, q: 1.0, lp: 8000 });
    bell(v, { base: 1046, dur: 0.07, peak: 0.22, lp: 6500 }); // C6 bright
    bell(v, { base: 1568, dur: 0.04, peak: 0.1, type: "sine", partials: [1, 2.7], pgains: [1, 0.4], lp: 9000 });
  },
  "hit:perfect:1": (v) => {
    VOICES["hit:perfect:0"](v);
    strike(v, { dur: 0.035, peak: 0.14, hp: 1100, bp: 2200, q: 0.9, lp: 6000 });
  },
  "hit:perfect:2": (v) => {
    VOICES["hit:perfect:1"](v);
    bell(v, { base: 2093, dur: 0.05, peak: 0.09, type: "sine", partials: [1, 2.2], pgains: [1, 0.35], lp: 9000 });
  },
  "hit:perfect:3": (v) => {
    VOICES["hit:perfect:2"](v);
    bell(v, { base: 3136, dur: 0.05, peak: 0.06, type: "sine", partials: [1, 2], pgains: [1, 0.3], lp: 9500 });
    padLow(v);
  },
  // great: >=1 -> strike, >=3 -> pad
  "hit:great:0": (v) => {
    strike(v, { dur: 0.045, peak: 0.34, hp: 1500, bp: 3000, q: 0.9, lp: 6500 });
    bell(v, { base: 784, dur: 0.06, peak: 0.18, lp: 4800 }); // G5 mid
  },
  "hit:great:1": (v) => {
    VOICES["hit:great:0"](v);
    strike(v, { dur: 0.032, peak: 0.12, hp: 1000, bp: 2000, q: 0.9, lp: 5500 });
  },
  "hit:great:3": (v) => {
    VOICES["hit:great:0"](v);
    padLow(v);
  },
  // good: only >=3 adds pad
  "hit:good:0": (v) => {
    strike(v, { dur: 0.04, peak: 0.28, hp: 950, bp: 1900, q: 0.8, lp: 4200 });
    bell(v, { base: 523, dur: 0.05, peak: 0.15, type: "sine", partials: [1, 2.4], pgains: [1, 0.35], lp: 2600 }); // C5 wood
  },
  "hit:good:3": (v) => {
    VOICES["hit:good:0"](v);
    padLow(v);
  },
  "miss": (v) => {
    strike(v, { dur: 0.07, peak: 0.34, hp: 380, bp: 850, q: 0.8, lp: 3000 });
    thump(v, 0.28, 0.1);
  },
  "break": (v) => {
    strike(v, { dur: 0.08, peak: 0.3, hp: 300, bp: 700, q: 0.7, lp: 2600 });
    thump(v, 0.3, 0.11);
    bell(v, { base: 220, dur: 0.09, peak: 0.1, type: "triangle", toFreq: 110, lp: 1800 });
  },
  "countdown:3": (v) => {
    strike(v, { dur: 0.024, peak: 0.105, hp: 1400, bp: 2600, q: 1.0, lp: 5000 });
    bell(v, { base: 880, dur: 0.12, peak: 0.15, lp: 5200 });
  },
  "countdown:2": (v) => {
    strike(v, { dur: 0.024, peak: 0.105, hp: 1400, bp: 2600, q: 1.0, lp: 5000 });
    bell(v, { base: 1108, dur: 0.12, peak: 0.15, lp: 5200 });
  },
  "countdown:1": (v) => {
    strike(v, { dur: 0.024, peak: 0.14, hp: 1400, bp: 2600, q: 1.0, lp: 5000 });
    bell(v, { base: 1397, dur: 0.12, peak: 0.2, lp: 5200 });
    bell(v, { base: 2095.5, dur: 0.07, peak: 0.09, type: "triangle", partials: [1, 2, 3], pgains: [1, 0.4, 0.2], lp: 7000 });
  },
  "key": (v) => {
    strike(v, { dur: 0.018, peak: 0.07, hp: 1800, lp: 6000 });
  },
  // Hold release: a brief downward settle confirms that the tail was judged,
  // while the normal judgment voice still communicates timing quality.
  "hold-release": (v) => {
    bell(v, {
      base: 987.77,
      toFreq: 659.25,
      dur: 0.14,
      peak: 0.085,
      type: "sine",
      partials: [1, 2],
      pgains: [1, 0.2],
      lp: 3600,
    });
    strike(v, {
      at: 0.025,
      dur: 0.035,
      peak: 0.08,
      hp: 700,
      bp: 1400,
      q: 0.8,
      lp: 3200,
    });
  },
  // Slide completion: a restrained upward lock-on chirp layered beneath the
  // normal timing judgment, so the gesture reads without masking the track.
  "slide": (v) => {
    bell(v, {
      base: 659.25,
      toFreq: 987.77,
      dur: 0.16,
      peak: 0.11,
      type: "sine",
      partials: [1, 2],
      pgains: [1, 0.25],
      lp: 4200,
    });
    bell(v, {
      at: 0.055,
      base: 1318.51,
      dur: 0.085,
      peak: 0.055,
      type: "triangle",
      partials: [1, 2.4],
      pgains: [1, 0.2],
      lp: 5600,
    });
  },
  "stamp": (v) => {
    strike(v, { dur: 0.05, peak: 0.34, hp: 700, bp: 1500, q: 0.8, lp: 3600 });
    thump(v, 0.3, 0.11);
    bell(v, { base: 196, dur: 0.14, peak: 0.12, type: "triangle", toFreq: 150, lp: 1800 });
  },
  // SIGNAL tier-entry cues
  "surge:2": (v) => {
    strike(v, { at: 0, dur: 0.024, peak: 0.1, hp: 1400, bp: 2600, q: 1.0, lp: 5000 });
    bell(v, { at: 0, base: 880, dur: 0.1, peak: 0.15, lp: 5600 });
    bell(v, { at: 0, base: 1174.7, dur: 0.14, peak: 0.17, lp: 6200 });
  },
  "surge:3": (v) => {
    strike(v, { at: 0, dur: 0.024, peak: 0.11, hp: 1400, bp: 2600, q: 1.0, lp: 5000 });
    bell(v, { at: 0, base: 1174.7, dur: 0.12, peak: 0.16, lp: 6400 });
    bell(v, { at: 0.08, base: 1480, dur: 0.12, peak: 0.16, lp: 6800 });
    bell(v, { at: 0.16, base: 1760, dur: 0.2, peak: 0.18, type: "triangle", partials: [1, 2, 2.9], pgains: [1, 0.35, 0.18], lp: 7600 });
    carrierSwell(v);
  },
};

// ---- Pre-rendered cache (P2-4) ----

const voiceCache = new Map<string, AudioBuffer>();
let renderPromise: Promise<void> | null = null;

/** Play a pre-rendered buffer through the live bus (≈2 nodes). */
function playBuffer(buf: AudioBuffer) {
  const ctx = getAudioContext();
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(bus());
  src.start();
}

/** Map a hit judgment + surge tier to the cached voice key (tiers collapse to changed layering). */
export function voiceKeyFor(judgment: Judgment, tier: SurgeTier): string {
  if (judgment === "miss") return "miss";
  let t: number;
  if (judgment === "good") t = tier >= 3 ? 3 : 0;
  else if (judgment === "great") t = tier >= 3 ? 3 : tier >= 1 ? 1 : 0;
  else t = tier >= 3 ? 3 : tier >= 2 ? 2 : tier >= 1 ? 1 : 0; // perfect
  return `hit:${judgment}:${t}`;
}

/**
 * Pre-render every voice once into an AudioBuffer via OfflineAudioContext.
 * Idempotent + single-flight; safe to call on every play (resolves instantly
 * once warmed). Falls back to live synth until the cache is ready.
 */
export function ensureRendered(): Promise<void> {
  if (renderPromise) return renderPromise;
  renderPromise = (async () => {
    const ctx = getAudioContext();
    const rate = ctx.sampleRate;
    const frames = Math.ceil(rate * VOICE_SECONDS);
    for (const key of Object.keys(VOICES)) {
      if (voiceCache.has(key)) continue;
      const oc = new OfflineAudioContext(2, frames, rate);
      const b = makeReverbBus(oc);
      VOICES[key]({ ctx: oc, bus: b });
      voiceCache.set(key, await oc.startRendering());
    }
  })();
  return renderPromise;
}

/** Test-only: how many voices are currently cached. */
export function __voiceCacheSize(): number {
  return voiceCache.size;
}

function playVoice(key: string) {
  const cached = voiceCache.get(key);
  if (cached) {
    playBuffer(cached);
    return;
  }
  const build = VOICES[key];
  if (build) build({ ctx: getAudioContext(), bus: bus() });
  void ensureRendered();
}

// ---- Backward-compatible public API ----

export function playHit(
  judgment: Judgment,
  surgeTier: SurgeTier = 0,
  accent?:
    | "hold-release"
    | "hold-release-miss"
    | "slide-complete"
    | "slide-target-miss"
    | "slide-hold-miss"
    | "chord-assist",
) {
  playVoice(voiceKeyFor(judgment, surgeTier));
  if (judgment === "miss") return;
  if (accent === "hold-release") playVoice("hold-release");
  else if (accent === "slide-complete") playVoice("slide");
}

export function playMiss() {
  playVoice("miss");
}

export function playBreak() {
  playVoice("break");
}

export function playCountdownTick(beat = 3) {
  const step = Math.max(1, Math.min(3, Math.floor(beat)));
  playVoice(`countdown:${step}`);
}

export function playKeyTick() {
  playVoice("key");
}

/** Results grade stamp — a dry "thunk": wood crack + low thump + dull bell. */
export function playStamp() {
  playVoice("stamp");
}

/**
 * SIGNAL tier-entry cue — the station goes live.
 * LIVE: two-note "tuned in" rise (A5 → D6). ON AIR: bright D6/F♯6/A6 chime
 * plus a soft carrier-noise swell, the transmitter switching on.
 */
export function playSurgeTier(tier: 2 | 3) {
  playVoice(`surge:${tier}`);
}
