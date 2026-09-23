import type { ChartJSON, ChartTier, PlayMode } from "../types/chart";

export type ChartProfile = {
  judgments: number;
  pace: number;
  sections: number;
  patterns: string;
};

export type ChartMechanicGuide = {
  type: "hold" | "chord" | "slide";
  label: string;
  detail: string;
};

export type ChartMechanicInput = "press" | "touch";

export const TIER_GUIDANCE: Record<ChartTier, {
  label: string;
  title: string;
  detail: string;
}> = {
  easy: {
    label: "Easy",
    title: "Learn the groove",
    detail: "Clear spacing and readable patterns.",
  },
  standard: {
    label: "Standard",
    title: "Play the full flow",
    detail: "The intended mix of rhythm and movement.",
  },
  hard: {
    label: "Hard",
    title: "Push the peak",
    detail: "Dense patterns built for confident players.",
  },
};

export const MODE_GUIDANCE: Record<PlayMode, {
  label: string;
  title: string;
  detail: string;
  record: string;
  duoAvailable: boolean;
}> = {
  casual: {
    label: "Casual",
    title: "Finish the full track",
    detail: "No fail · wider 28 / 55 / 90 ms timing",
    record: "Run history · no ranking",
    duoAvailable: true,
  },
  arcade: {
    label: "Arcade",
    title: "Play for the board",
    detail: "100 HP · strict 15 / 30 / 50 ms timing",
    record: "Local leaderboard",
    duoAvailable: true,
  },
  practice: {
    label: "Practice",
    title: "Learn without failing",
    detail: "Strict timing · auto-slow after 3 misses",
    record: "Practice only · solo · no ranking",
    duoAvailable: false,
  },
};

const PATTERN_LABELS = {
  tap: "Taps",
  hold: "Holds",
  chord: "Chords",
  slide: "Slides",
} as const;

const MECHANIC_GUIDES: Record<ChartMechanicGuide["type"], {
  label: string;
  detail: Record<ChartMechanicInput, string>;
}> = {
  hold: {
    label: "Hold",
    detail: {
      press: "Press when it lands. Release at the end.",
      touch: "Touch and hold on the line. Lift at the end.",
    },
  },
  chord: {
    label: "Chord",
    detail: {
      press: "Hit every marked lane at the same time.",
      touch: "Touch every marked lane at the same time.",
    },
  },
  slide: {
    label: "Slide",
    detail: {
      press: "Press the first lane, move to the target, and hold through the end.",
      touch: "Touch the first lane, slide to the target, and hold through the end.",
    },
  },
};

/** Advanced moves in first-appearance order; taps are already explained by the base start hint. */
export function chartMechanicGuides(
  chart: ChartJSON,
  input: ChartMechanicInput = "press",
): ChartMechanicGuide[] {
  const seen = new Set<ChartMechanicGuide["type"]>();
  const out: ChartMechanicGuide[] = [];
  for (const note of [...chart.notes].sort((a, b) => a.t - b.t)) {
    if (note.type === "tap" || seen.has(note.type)) continue;
    seen.add(note.type);
    const guide = MECHANIC_GUIDES[note.type];
    out.push({ type: note.type, label: guide.label, detail: guide.detail[input] });
  }
  return out;
}

/** Compact, player-facing facts for deciding whether to start this chart. */
export function chartProfile(chart: ChartJSON, durationSec: number): ChartProfile {
  const present = new Set(chart.notes.map((note) => note.type));
  const patterns = (Object.keys(PATTERN_LABELS) as Array<keyof typeof PATTERN_LABELS>)
    .filter((type) => present.has(type))
    .map((type) => PATTERN_LABELS[type])
    .join(" + ");
  const judgments = Math.max(0, chart.total_notes);
  const playableDuration = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 1;

  return {
    judgments,
    pace: Math.round((judgments / playableDuration) * 10) / 10,
    sections: chart.sections?.length ?? 0,
    patterns: patterns || "Rhythm notes",
  };
}

/** Practice can change playback rate per player, so it cannot share a Duo clock. */
export function duoMode(mode: PlayMode): Exclude<PlayMode, "practice"> {
  return mode === "arcade" ? "arcade" : "casual";
}
