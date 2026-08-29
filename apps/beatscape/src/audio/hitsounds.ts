import { getAudioContext } from "./context";
import type { Judgment } from "../types/chart";

// Self-owned percussion-style SFX (no external samples).
// Layered noise transient + short tonal body — closer to stick/clap hits
// than single oscillator blips. Shares AudioContext with music for one clock.

const SFX_GAIN = 0.55;

let sfxBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

function bus(): GainNode {
  if (!sfxBus) {
    const ctx = getAudioContext();
    sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_GAIN;
    sfxBus.connect(ctx.destination);
  }
  return sfxBus;
}

export function setSfxVolume(v: number): void {
  bus().gain.value = Math.max(0, Math.min(1, v));
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  const len = Math.floor(ctx.sampleRate * 0.25);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    // Slightly pink-ish: average successive white samples
    const w = Math.random() * 2 - 1;
    data[i] = i === 0 ? w : (data[i - 1]! * 0.65 + w * 0.35);
  }
  noiseBuf = buf;
  return buf;
}

/** Sharp filtered noise transient — the “stick hit” attack. */
function strike(opts: {
  dur: number;
  peak: number;
  /** High-pass Hz — higher = sharper click */
  hp: number;
  /** Optional band-pass for body of the crack */
  bp?: number;
  q?: number;
}) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(opts.hp, now);
  hp.Q.setValueAtTime(0.7, now);

  let last: AudioNode = hp;
  if (opts.bp != null) {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(opts.bp, now);
    bp.Q.setValueAtTime(opts.q ?? 1.2, now);
    hp.connect(bp);
    last = bp;
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(opts.peak, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.dur);

  src.connect(hp);
  last.connect(gain);
  gain.connect(bus());
  src.start(now);
  src.stop(now + opts.dur + 0.02);
}

/** Short decaying tone — pitch cue for judgment tier. */
function body(opts: {
  freq: number;
  dur: number;
  peak: number;
  type?: OscillatorType;
  /** Optional end frequency for a tiny pitch drop */
  toFreq?: number;
}) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.toFreq != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.toFreq), now + opts.dur);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(opts.peak, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.dur);
  osc.connect(gain);
  gain.connect(bus());
  osc.start(now);
  osc.stop(now + opts.dur + 0.02);
}

/** Soft low thump under miss/break — weight without cartoon buzz. */
function thump(peak: number, dur = 0.09) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(95, now);
  osc.frequency.exponentialRampToValueAtTime(48, now + dur);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain);
  gain.connect(bus());
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export function playHit(judgment: Judgment) {
  if (judgment === "miss") {
    playMiss();
    return;
  }
  if (judgment === "perfect") {
    // Bright stick crack + high ping (≤80ms attack feel)
    strike({ dur: 0.045, peak: 0.48, hp: 2800, bp: 5200, q: 1.4 });
    body({ freq: 1760, dur: 0.055, peak: 0.22, type: "triangle" });
    body({ freq: 2640, dur: 0.03, peak: 0.1, type: "sine" });
    return;
  }
  if (judgment === "great") {
    strike({ dur: 0.04, peak: 0.4, hp: 1800, bp: 3600, q: 1.1 });
    body({ freq: 1180, dur: 0.05, peak: 0.18, type: "sine" });
    return;
  }
  // good
  strike({ dur: 0.035, peak: 0.3, hp: 1200, bp: 2400, q: 0.9 });
  body({ freq: 780, dur: 0.045, peak: 0.14, type: "sine" });
}

export function playMiss() {
  // Filtered noise slap + low thump — firm, not goofy (PRD §6.0.13)
  strike({ dur: 0.07, peak: 0.36, hp: 400, bp: 900, q: 0.8 });
  thump(0.28, 0.1);
}

export function playBreak() {
  strike({ dur: 0.08, peak: 0.32, hp: 300, bp: 700, q: 0.7 });
  thump(0.3, 0.11);
  body({ freq: 220, dur: 0.09, peak: 0.1, type: "triangle", toFreq: 110 });
}

/**
 * Countdown metronome (3 → 2 → 1). Rising pitch + rim crack —
 * quiet enough for PRD −16 dB feel vs hits, but clear and intentional.
 */
export function playCountdownTick(beat = 3) {
  const step = Math.max(1, Math.min(3, Math.floor(beat)));
  // A5 → C♯6 → F6 — clean rising cue into the chart
  const freq = step === 3 ? 880 : step === 2 ? 1108 : 1397;
  const tonePeak = step === 1 ? 0.2 : 0.15;
  // Wood/rim transient (narrow high band) — not a soft fart noise
  strike({ dur: 0.022, peak: tonePeak * 0.85, hp: 3600, bp: 7200, q: 2.4 });
  body({ freq, dur: 0.085, peak: tonePeak, type: "sine" });
  if (step === 1) {
    // Final “ready” shimmer — still short, no fanfare
    body({ freq: freq * 1.5, dur: 0.055, peak: 0.09, type: "triangle" });
  }
}

export function playKeyTick() {
  strike({ dur: 0.018, peak: 0.08, hp: 2500 });
}
