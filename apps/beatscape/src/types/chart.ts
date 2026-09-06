export type ChartTier = "easy" | "standard" | "hard";
export type PlayMode = "casual" | "arcade" | "practice";
export type Judgment = "perfect" | "great" | "good" | "miss";

export type MissEvent = { tMs: number; lane: number };

export type TapNote = {
  id: string;
  t: number;
  lane: 0 | 1 | 2 | 3;
  type: "tap";
};

export type HoldNote = {
  id: string;
  t: number;
  lane: 0 | 1 | 2 | 3;
  type: "hold";
  end: number;
};

export type ChordNote = {
  id: string;
  t: number;
  lanes: Array<0 | 1 | 2 | 3>;
  type: "chord";
};

export type SlideNote = {
  id: string;
  t: number;
  lane: 0 | 1 | 2 | 3;
  to: 0 | 1 | 2 | 3;
  end: number;
  type: "slide";
};

export type ChartNote = TapNote | HoldNote | ChordNote | SlideNote;

export type ChartSection = { id: string; t0: number; t1: number };

export type ChartJSON = {
  track_id: string;
  tier: ChartTier;
  format: 1;
  bpm: number;
  audio_offset_ms: number;
  ar: number;
  total_notes: number;
  sections?: ChartSection[];
  notes: ChartNote[];
};

/**
 * Signed timing profile of one run (T3: judge early/late + results error bar).
 * `meanMs` is positive when the player hits late (after the note) and negative
 * when early. Misses carry no reliable delta, so they are excluded from all
 * three numbers — read them as "how the hits you landed were distributed".
 */
export type TimingSummary = {
  early: number;
  late: number;
  meanMs: number;
};

export type PlayResult = {
  score: number;
  accuracy: number;
  maxCombo: number;
  grade: "S" | "A" | "B" | "C" | "D";
  fullCombo: boolean;
  allPerfect: boolean;
  failed: boolean;
  judgments: Record<Judgment, number>;
  totalNotes: number;
  missEvents: MissEvent[];
  /** Absent when no note was actually hit (all-miss run) or the field predates this build. */
  timing?: TimingSummary;
  /** Highest SIGNAL atmosphere tier reached this run (docs/BEATSCAPE-SURGE-FX.md). Presentation-only. */
  surgeMaxTier?: 0 | 1 | 2 | 3;
};

export type LastRun = {
  v: 1;
  track_id: string;
  title: string;
  artist: string;
  tier: ChartTier;
  mode: PlayMode;
  score: number;
  accuracy: number;
  maxCombo: number;
  grade: "S" | "A" | "B" | "C" | "D";
  fc: boolean;
  ap: boolean;
  /** Optional so older device saves remain readable. */
  failed?: boolean;
  counts: Record<Judgment, number>;
  totalNotes: number;
  missEvents?: MissEvent[];
  /** Signed early/late profile copied from `PlayResult.timing`. Optional for old saves. */
  timing?: TimingSummary;
  durationMs: number;
  endedAt: string;
  /** Optional playable opening-night scene; absent for ordinary free play. */
  shiftStep?: "studio" | "yard" | "rooftop";
  /** PB score captured before this run was saved — used to flag a true new record. */
  prevBestScore?: number;
  /** Highest SIGNAL tier reached (LIVE/ON AIR earn the Results badge + poster tag). */
  surgeMaxTier?: 0 | 1 | 2 | 3;
};
