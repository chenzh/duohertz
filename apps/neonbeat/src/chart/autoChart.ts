import { TIER_AR, type Preset } from "../presets";
import type { ChartJSON, ChartNote, ChartTier, TapNote, HoldNote } from "../types/chart";
import { buildDemoChartFromPlan, planDemoSong } from "../audio/demoSong";

const TIER_CONFIG: Record<
  ChartTier,
  { notesPerSec: number; holdRatio: number; chordCap: number; eighth: boolean }
> = {
  easy: { notesPerSec: 1.2, holdRatio: 0.1, chordCap: 0, eighth: false },
  standard: { notesPerSec: 3, holdRatio: 0.2, chordCap: 1, eighth: false },
  hard: { notesPerSec: 5, holdRatio: 0.25, chordCap: 2, eighth: true },
};

function beatMs(bpm: number) {
  return 60000 / bpm;
}

function detectOnsets(channel: Float32Array, sampleRate: number, hop: number): number[] {
  const onsets: number[] = [];
  let prev = 0;
  for (let i = hop; i < channel.length; i += hop) {
    let sum = 0;
    for (let j = i - hop; j < i; j++) sum += Math.abs(channel[j] ?? 0);
    const flux = Math.max(0, sum - prev);
    prev = sum;
    if (flux > 0.02 * hop) onsets.push((i / sampleRate) * 1000);
  }
  return onsets;
}

function estimateBpm(onsets: number[], hint: number): number {
  if (onsets.length < 4) return hint;
  const intervals: number[] = [];
  for (let i = 1; i < Math.min(onsets.length, 40); i++) {
    const d = onsets[i]! - onsets[i - 1]!;
    if (d > 200 && d < 1200) intervals.push(d);
  }
  if (!intervals.length) return hint;
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)]!;
  const bpm = 60000 / median;
  const quantized = Math.round(bpm / 5) * 5;
  return Math.abs(quantized - hint) <= 15 ? hint : quantized;
}

export async function buildChartsFromAudio(
  buffer: AudioBuffer,
  preset: Preset,
  title: string,
  audioUrl: string,
): Promise<Record<ChartTier, ChartJSON>> {
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  const onsets = detectOnsets(left, buffer.sampleRate, 512);
  const bpm = estimateBpm(onsets, preset.bpm);
  const durationMs = buffer.duration * 1000;
  const charts = {} as Record<ChartTier, ChartJSON>;

  for (const tier of ["easy", "standard", "hard"] as ChartTier[]) {
    charts[tier] = buildTierChart({
      tier,
      preset,
      title,
      audioUrl,
      bpm,
      durationMs,
      onsets,
      left,
      right,
      sampleRate: buffer.sampleRate,
    });
  }
  return charts;
}

function buildTierChart(args: {
  tier: ChartTier;
  preset: Preset;
  title: string;
  audioUrl: string;
  bpm: number;
  durationMs: number;
  onsets: number[];
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
}): ChartJSON {
  const cfg = TIER_CONFIG[args.tier];
  const beat = beatMs(args.bpm);
  const step = cfg.eighth ? beat / 2 : beat;
  const maxNotes = Math.floor((args.durationMs / 1000) * cfg.notesPerSec);
  const candidates: Array<{ t: number; lane: 0 | 1 | 2 | 3; energy: number }> = [];

  for (const t of args.onsets) {
    if (t < 500 || t > args.durationMs - 500) continue;
    const q = Math.round(t / step) * step;
    const idx = Math.floor((q / 1000) * args.sampleRate);
    const l = Math.abs(args.left[idx] ?? 0);
    const r = Math.abs(args.right[idx] ?? 0);
    const lane = (l >= r ? (l > r * 1.2 ? 0 : 1) : r > l * 1.2 ? 3 : 2) as 0 | 1 | 2 | 3;
    candidates.push({ t: q, lane, energy: l + r });
  }

  candidates.sort((a, b) => a.t - b.t);
  const filtered: typeof candidates = [];
  for (const c of candidates) {
    if (filtered.length && c.t - filtered[filtered.length - 1]!.t < 80) continue;
    filtered.push(c);
    if (filtered.length >= maxNotes) break;
  }

  if (filtered.length < 8) {
    for (let t = beat; t < args.durationMs - beat; t += step * 2) {
      filtered.push({ t, lane: (Math.floor(t / beat) % 4) as 0 | 1 | 2 | 3, energy: 1 });
      if (filtered.length >= maxNotes) break;
    }
  }

  const notes: ChartNote[] = [];
  let holdBudget = Math.floor(filtered.length * cfg.holdRatio);
  let i = 0;
  while (i < filtered.length) {
    const cur = filtered[i]!;
    if (
      holdBudget > 0 &&
      i + 1 < filtered.length &&
      filtered[i + 1]!.lane === cur.lane &&
      filtered[i + 1]!.t - cur.t <= 600
    ) {
      const end = filtered[i + 1]!.t;
      if (end - cur.t >= beat * 2) {
        notes.push({
          id: `h-${notes.length}`,
          t: cur.t,
          lane: cur.lane,
          type: "hold",
          end_t: end,
        } satisfies HoldNote);
        holdBudget--;
        i += 2;
        continue;
      }
    }
    notes.push({
      id: `t-${notes.length}`,
      t: cur.t,
      lane: cur.lane,
      type: "tap",
    } satisfies TapNote);
    i++;
  }

  return {
    version: "1.1",
    meta: {
      title: args.title,
      artist: "AI Generated",
      bpm: args.bpm,
      offset_ms: 0,
      preset_id: args.preset.id,
      chart_tier: args.tier,
      approach_rate: TIER_AR[args.tier],
      audio_url: args.audioUrl,
      engine: args.preset.engine,
    },
    notes,
  };
}

/** Offline demo chart when MusicSaas is unavailable */
export function buildDemoCharts(preset: Preset, audioUrl: string): Record<ChartTier, ChartJSON> {
  const plan = planDemoSong(preset);
  const charts = {} as Record<ChartTier, ChartJSON>;
  for (const tier of ["easy", "standard", "hard"] as ChartTier[]) {
    charts[tier] = buildDemoChartFromPlan(plan, preset, tier, audioUrl, TIER_AR[tier]);
  }
  return charts;
}
