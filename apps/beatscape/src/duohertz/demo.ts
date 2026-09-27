import { parseDuohertzChart, type DuohertzChart, type DuohertzTier } from "./chart";

/** Original, synthesized timing sketch for the development lab. Not release catalog content. */
const easyNotes = [
  { id: "e1", type: "tap", t: 1, key: 0 },
  { id: "e2", type: "tap", t: 2, key: 0 },
  { id: "e3", type: "tap", t: 3, key: 0 },
  { id: "e4", type: "tap", t: 4, key: 0 },
  { id: "e5", type: "tap", t: 5, key: 0 },
  { id: "e6", type: "tap", t: 6, key: 0 },
  { id: "e7", type: "hold", t: 7, end: 7.5, key: 0 },
];

const standardNotes = Array.from({ length: 14 }, (_, index) => ({
  id: `s${index + 1}`,
  type: "tap",
  t: 1 + index * 0.5,
  key: index % 2,
}));

const hardNotes = [
  { id: "h1", type: "tap", t: 1, key: 0 },
  { id: "h2", type: "tap", t: 1.5, key: 1 },
  { id: "h3", type: "chord", t: 2, keys: [0, 1] },
  { id: "h4", type: "tap", t: 2.5, key: 1 },
  { id: "h5", type: "tap", t: 3, key: 0 },
  { id: "h6", type: "tap", t: 3.5, key: 1 },
  { id: "h7", type: "tap", t: 4, key: 0 },
  { id: "h8", type: "tap", t: 4.5, key: 1 },
  { id: "h9", type: "tap", t: 5, key: 0 },
  { id: "h10", type: "tap", t: 5.5, key: 1 },
  { id: "h11", type: "chord", t: 6, keys: [0, 1] },
  { id: "h12", type: "tap", t: 6.5, key: 0 },
  { id: "h13", type: "tap", t: 7, key: 1 },
  { id: "h14", type: "tap", t: 7.5, key: 0 },
];

const notesByTier: Record<DuohertzTier, unknown[]> = {
  easy: easyNotes,
  standard: standardNotes,
  hard: hardNotes,
};

export const DEMO_CHARTS: Record<DuohertzTier, DuohertzChart> = Object.fromEntries(
  (["easy", "standard", "hard"] as const).map((tier) => {
    const notes = notesByTier[tier];
    return [tier, parseDuohertzChart({
      format: 2,
      theme: "duohertz",
      track_id: "dh-lab-pulse",
      tier,
      input_count: tier === "easy" ? 1 : 2,
      bpm: 120,
      audio_offset_ms: 0,
      total_notes: notes.reduce<number>((total, raw) => total + ((raw as { type: string }).type === "chord" ? 2 : 1), 0),
      notes,
    })];
  }),
) as Record<DuohertzTier, DuohertzChart>;

export const DEMO_DURATION_MS = 8_000;

function tone(context: AudioContext, start: number, duration: number, frequency: number,
  volume: number, shape: OscillatorType, output: AudioNode): OscillatorNode {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = shape;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(output);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.005);
  oscillator.addEventListener("ended", () => {
    oscillator.disconnect();
    gain.disconnect();
  }, { once: true });
  return oscillator;
}

/** Schedules a short original electronic loop against the same clock used for judgments. */
export function scheduleDemoAudio(context: AudioContext, start: number, output: AudioNode): OscillatorNode[] {
  const sources: OscillatorNode[] = [];
  const bass = [110, 130.81, 146.83, 130.81];
  const lead = [440, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 440];
  for (let beat = 0; beat < 16; beat++) {
    const at = start + beat * 0.5;
    sources.push(tone(context, at, 0.18, bass[Math.floor(beat / 4)], 0.13, "sine", output));
    sources.push(tone(context, at + 0.25, 0.055, 880, 0.025, "triangle", output));
    if (beat % 2 === 0) sources.push(tone(context, at, 0.23, lead[(beat / 2) % lead.length], 0.06, "triangle", output));
  }
  return sources;
}

/** Immediate, quiet key response; it does not move the authored music clock. */
export function scheduleInputFeedback(context: AudioContext, key: 0 | 1, output: AudioNode): OscillatorNode {
  return tone(context, context.currentTime, 0.085, key === 0 ? 523.25 : 659.25, 0.025, "triangle", output);
}
