import { getAudioContext } from "./context";
import type { Judgment } from "../types/chart";

// Self-owned synth SFX (no external samples). A single shared context is
// used so SFX are scheduled on the same clock as the music.

const SFX_GAIN = 0.55;

let sfxBus: GainNode | null = null;

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

function blip(freq: number, durSec: number, type: OscillatorType, peak: number) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durSec);
  osc.connect(gain);
  gain.connect(bus());
  osc.start(now);
  osc.stop(now + durSec + 0.02);
}

export function playHit(judgment: Judgment) {
  if (judgment === "miss") {
    playMiss();
    return;
  }
  if (judgment === "perfect") {
    blip(1480, 0.07, "sine", 0.42);
    blip(2220, 0.04, "triangle", 0.18);
    return;
  }
  if (judgment === "great") {
    blip(1040, 0.06, "sine", 0.36);
    return;
  }
  blip(720, 0.05, "sine", 0.28);
}

export function playMiss() {
  blip(160, 0.11, "sawtooth", 0.38);
}

export function playBreak() {
  blip(140, 0.12, "square", 0.34);
}

export function playCountdownTick() {
  blip(880, 0.05, "triangle", 0.25);
}

export function playKeyTick() {
  blip(220, 0.025, "sine", 0.12);
}
