import type { Judgment } from "../types/chart";

let ctx: AudioContext | null = null;

const LANE_FREQ = [523.25, 659.25, 783.99, 987.77];

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function noiseBurst(ac: AudioContext, dest: AudioNode, duration: number, vol: number, t: number) {
  const len = Math.floor(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  src.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.start(t);
  src.stop(t + duration + 0.01);
}

/** Instant mechanical click on every key down — always fires */
export function playKeyDown(lane = 0) {
  const ac = getCtx();
  const t = ac.currentTime;
  const master = ac.createGain();
  master.connect(ac.destination);
  master.gain.value = 0.55;

  const base = LANE_FREQ[lane] ?? 660;

  // Sub thump
  const sub = ac.createOscillator();
  const subG = ac.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(90, t);
  sub.frequency.exponentialRampToValueAtTime(45, t + 0.06);
  sub.connect(subG);
  subG.connect(master);
  subG.gain.setValueAtTime(0.9, t);
  subG.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  sub.start(t);
  sub.stop(t + 0.08);

  // Lane-pitched click
  const click = ac.createOscillator();
  const clickG = ac.createGain();
  click.type = "square";
  click.frequency.setValueAtTime(base * 1.5, t);
  click.frequency.exponentialRampToValueAtTime(base * 0.8, t + 0.025);
  click.connect(clickG);
  clickG.connect(master);
  clickG.gain.setValueAtTime(0.35, t);
  clickG.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  click.start(t);
  click.stop(t + 0.04);

  noiseBurst(ac, master, 0.012, 0.7, t);
}

export function playHit(j: Judgment, lane = 0) {
  const ac = getCtx();
  const t = ac.currentTime;
  const master = ac.createGain();
  master.connect(ac.destination);
  const vol = j === "perfect" ? 0.45 : j === "great" ? 0.38 : 0.3;
  master.gain.value = vol;

  const base = LANE_FREQ[lane] ?? 660;
  const mult = j === "perfect" ? 2.2 : j === "great" ? 1.6 : 1.2;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = j === "perfect" ? "square" : "sawtooth";
  osc.connect(gain);
  gain.connect(master);
  osc.frequency.setValueAtTime(base * mult, t);
  osc.frequency.exponentialRampToValueAtTime(base * 0.7, t + 0.04);
  gain.gain.setValueAtTime(1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.start(t);
  osc.stop(t + 0.11);

  noiseBurst(ac, master, 0.028, j === "perfect" ? 0.75 : 0.5, t);

  if (j === "perfect") {
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = "sine";
    o2.connect(g2);
    g2.connect(master);
    o2.frequency.value = base * 4;
    g2.gain.setValueAtTime(0.35, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o2.start(t);
    o2.stop(t + 0.09);
  }
}

export function playBreak() {
  const ac = getCtx();
  const t = ac.currentTime;
  const master = ac.createGain();
  master.connect(ac.destination);
  master.gain.value = 0.35;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sawtooth";
  osc.connect(gain);
  gain.connect(master);
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
  gain.gain.setValueAtTime(1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.start(t);
  osc.stop(t + 0.31);
  noiseBurst(ac, master, 0.18, 0.75, t);
}

export async function resumeAudio() {
  await getCtx().resume();
}
