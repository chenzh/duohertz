import { getAudioContext } from "./context";
import type { Judgment } from "../types/chart";

// Self-owned synth SFX (no external samples needed). A single shared context is
// used so SFX are scheduled on the same clock as the music.

const HIT_GAIN = 0.5; // SFX are mixed well below the music
const BREAK_GAIN = 0.4;

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
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durSec + 0.02);
}

export function playHit(judgment: Judgment) {
  if (judgment === "miss") return;
  const freq = judgment === "perfect" ? 1320 : judgment === "great" ? 990 : 660;
  blip(freq, 0.06, "sine", HIT_GAIN);
}

export function playBreak() {
  blip(140, 0.12, "square", BREAK_GAIN);
}

export function playCountdownTick() {
  blip(880, 0.05, "triangle", 0.25);
}

export function playKeyTick() {
  blip(220, 0.025, "sine", 0.12);
}
