import type { Preset } from "../presets";
import type { ChartJSON, ChartNote, ChartTier } from "../types/chart";

export type SectionType = "intro" | "build" | "rise" | "drop" | "break" | "outro";

export type Section = { startBeat: number; type: SectionType };

export type ChartCue = {
  beat: number;
  lane: 0 | 1 | 2 | 3;
  type: "tap" | "hold";
  holdBeats?: number;
  minTier: ChartTier;
};

export type DemoPlan = {
  bpm: number;
  totalBeats: number;
  sections: Section[];
  cues: ChartCue[];
};

type Lane = 0 | 1 | 2 | 3;

const TIER_RANK: Record<ChartTier, number> = { easy: 0, standard: 1, hard: 2 };

export function beatMs(bpm: number) {
  return 60000 / bpm;
}

export function beatToMs(beat: number, bpm: number) {
  return beat * beatMs(bpm);
}

function sectionAt(beat: number, sections: Section[]): SectionType {
  let cur: SectionType = "intro";
  for (const s of sections) {
    if (beat >= s.startBeat) cur = s.type;
  }
  return cur;
}

function cue(
  cues: ChartCue[],
  beat: number,
  lane: Lane,
  minTier: ChartTier,
  type: "tap" | "hold" = "tap",
  holdBeats?: number,
) {
  cues.push({ beat, lane, type, holdBeats, minTier });
}

/** Fast-paced 45s loop — drop ~6s in, FNF-style intro */
export function planDemoSong(preset: Preset): DemoPlan {
  const bpm = preset.bpm;
  const durationSec = Math.min(preset.duration_sec, 48);
  const totalBeats = Math.floor((durationSec * bpm) / 60);

  const sections: Section[] = [
    { startBeat: 0, type: "intro" },
    { startBeat: 8, type: "build" },
    { startBeat: 16, type: "rise" },
    { startBeat: 24, type: "drop" },
    { startBeat: 56, type: "break" },
    { startBeat: 64, type: "drop" },
    { startBeat: Math.max(totalBeats - 12, 80), type: "outro" },
  ];

  const cues: ChartCue[] = [];

  for (let beat = 4; beat < totalBeats; beat++) {
    const bb = beat % 4;
    const sec = sectionAt(beat, sections);
    const drop = sec === "drop";
    const build = sec === "build" || sec === "rise";
    const active = sec !== "break";

    if (!active) {
      if (bb === 0) cue(cues, beat, 0, "easy");
      continue;
    }

    // Kick → lane 0, Snare → lane 3 (FNF / osu feel)
    if (bb === 0 || (drop && bb === 2)) cue(cues, beat, 0, "easy");
    if (bb === 1 || bb === 3) cue(cues, beat, 3, "easy");

    // Intro: simple outer-lane alternation so you feel rhythm immediately
    if (sec === "intro") {
      if (bb === 2) cue(cues, beat, 0, "easy");
      continue;
    }

    // Build: inner lanes on offbeats
    if (build) {
      cue(cues, beat + 0.5, (bb % 2 === 0 ? 1 : 2) as Lane, "standard");
      if (bb === 0) cue(cues, beat, 1, "standard");
      if (bb === 2) cue(cues, beat, 2, "standard");
    }

    // Rise: long notes + jump
    if (sec === "rise") {
      if (bb === 0) {
        cue(cues, beat, 1, "standard", "hold", 1.5);
        cue(cues, beat, 2, "standard", "hold", 1.5);
      }
      if (bb === 1) {
        cue(cues, beat + 0.5, 1, "standard");
        cue(cues, beat + 0.75, 2, "standard");
      }
    }

    // DROP — the fun part
    if (drop) {
      if (bb === 0) {
        cue(cues, beat, 0, "standard");
        cue(cues, beat, 1, "standard");
      }
      if (bb === 1) {
        const stream: Lane[] = [1, 2, 3, 2, 1, 0, 1, 2];
        stream.forEach((lane, i) => cue(cues, beat + i * 0.25, lane, "hard"));
      }
      if (bb === 2) {
        cue(cues, beat, 0, "hard");
        cue(cues, beat + 0.25, 0, "hard");
        cue(cues, beat + 0.5, 3, "hard");
        cue(cues, beat + 0.75, 3, "hard");
      }
      if (bb === 3) {
        cue(cues, beat, 1, "standard");
        cue(cues, beat + 0.5, 2, "standard");
        cue(cues, beat + 0.75, 3, "hard");
      }
    }

    if (sec === "outro" && bb === 0) {
      cue(cues, beat, 0, "easy");
    }
  }

  cues.sort((a, b) => a.beat - b.beat || a.lane - b.lane);
  return { bpm, totalBeats, sections, cues };
}

export function cuesToNotes(plan: DemoPlan, tier: ChartTier): ChartNote[] {
  const rank = TIER_RANK[tier];
  const notes: ChartNote[] = [];
  let id = 0;
  const seen = new Set<string>();

  for (const c of plan.cues) {
    if (TIER_RANK[c.minTier] > rank) continue;
    const t = Math.round(beatToMs(c.beat, plan.bpm));
    const key = `${t}-${c.lane}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (c.type === "hold" && c.holdBeats) {
      notes.push({
        id: `h${id++}`,
        t,
        lane: c.lane,
        type: "hold",
        end_t: Math.round(beatToMs(c.beat + c.holdBeats, plan.bpm)),
      });
    } else {
      notes.push({ id: `t${id++}`, t, lane: c.lane, type: "tap" });
    }
  }
  return notes;
}

export function renderDemoAudio(ctx: AudioContext, plan: DemoPlan, _preset: Preset): AudioBuffer {
  const sr = ctx.sampleRate;
  const beatSamples = Math.floor((60 / plan.bpm) * sr);
  const len = plan.totalBeats * beatSamples;
  const buffer = ctx.createBuffer(2, len, sr);
  const roots = [55, 49, 65.41, 43.65];
  const leads = [440, 392, 523, 349];

  const env = (p: number, a: number, d: number) => (p < a ? p / a : Math.exp(-(p - a) / d));
  const rng = (i: number) => {
    const n = Math.sin(i * 12.9898) * 43758.5453;
    return n - Math.floor(n);
  };

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    const pan = ch === 0 ? 0.95 : 1.05;

    for (let beat = 0; beat < plan.totalBeats; beat++) {
      const bar = Math.floor(beat / 4);
      const bb = beat % 4;
      const sec = sectionAt(beat, plan.sections);
      const drop = sec === "drop";
      const build = sec === "build" || sec === "rise";
      const active = sec !== "break";
      const root = roots[bar % 4]!;
      const lead = leads[bar % 4]!;
      const start = beat * beatSamples;

      for (let i = 0; i < beatSamples; i++) {
        const idx = start + i;
        if (idx >= len) break;
        const phase = i / beatSamples;
        let s = 0;

        const kick = active && (bb === 0 || (drop && bb === 2));
        if (kick) {
          const f = 180 * Math.exp(-phase * 11);
          s += Math.sin((2 * Math.PI * f * i) / sr) * Math.exp(-phase * 16) * 1.1;
          if (phase < 0.015) s += (1 - phase / 0.015) * 0.55;
        }

        if (active && (bb === 1 || bb === 3)) {
          const p = (phase - (bb === 1 ? 0.25 : 0.75)) * 4;
          if (p >= 0 && p < 0.2) {
            s += rng(idx) * env(p, 0.015, 0.06) * (drop ? 0.7 : 0.5);
          }
        }

        if ((build || drop) && active) {
          for (let e = 0; e < 2; e++) {
            const ep = phase * 2 - e;
            if (ep >= 0 && ep < 0.08) s += rng(idx + e) * (1 - ep / 0.08) * (drop ? 0.18 : 0.1);
          }
        }

        const duck = 1 - Math.exp(-phase * 11) * 0.75;
        s += Math.sin((2 * Math.PI * root * i) / sr) * 0.38 * duck;
        s += Math.sin((2 * Math.PI * root * 1.5 * i) / sr) * 0.12 * duck;

        if (build || drop) {
          const mel = lead * (drop ? 2 : 1);
          s +=
            Math.sin((2 * Math.PI * mel * i) / sr) *
            env(phase, 0.008, drop ? 0.22 : 0.35) *
            (drop ? 0.28 : 0.16);
        }

        // Riser before drop
        if (sec === "rise" && beat >= 20) {
          s += Math.sin((2 * Math.PI * (200 + (beat - 20) * 40) * i) / sr) * 0.06 * phase;
        }

        if (drop && bb === 0) {
          const saw = 2 * ((lead * i) / sr - Math.floor((lead * i) / sr + 0.5));
          s += saw * 0.08 * duck;
        }

        data[idx] = Math.tanh(s * pan * 1.35);
      }
    }
  }
  return buffer;
}

export function buildDemoChartFromPlan(
  plan: DemoPlan,
  preset: Preset,
  tier: ChartTier,
  audioUrl: string,
  approachRate: number,
): ChartJSON {
  const dropSections = plan.sections
    .filter((s) => s.type === "drop")
    .map((s) => ({ t: beatToMs(s.startBeat, plan.bpm), type: "drop" as const }));

  return {
    version: "1.1",
    meta: {
      title: `${preset.label}`,
      artist: "NeonBeat",
      bpm: plan.bpm,
      offset_ms: 0,
      preset_id: preset.id,
      chart_tier: tier,
      approach_rate: approachRate,
      audio_url: audioUrl,
      engine: preset.engine,
      sections: dropSections,
    },
    notes: cuesToNotes(plan, tier),
  };
}
