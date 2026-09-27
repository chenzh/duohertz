/** duohertz charts are authored against new audio; format 1 four-lane charts are never adapted at runtime. */
export type InputCount = 1 | 2;
export type KeyIndex = 0 | 1;
export type DuohertzTier = "easy" | "standard" | "hard";

export type DuohertzNote =
  | { id: string; type: "tap"; t: number; key: KeyIndex }
  | { id: string; type: "hold"; t: number; end: number; key: KeyIndex }
  | { id: string; type: "chord"; t: number; keys: [0, 1] };

export type DuohertzChart = {
  format: 2;
  theme: "duohertz";
  track_id: string;
  tier: DuohertzTier;
  input_count: InputCount;
  bpm: number;
  audio_offset_ms: number;
  total_notes: number;
  notes: DuohertzNote[];
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function keyWithinCount(value: unknown, inputCount: InputCount): value is KeyIndex {
  return Number.isInteger(value) && (value === 0 || (inputCount === 2 && value === 1));
}

export function countDuohertzJudgments(notes: readonly DuohertzNote[]): number {
  return notes.reduce((total, note) => total + (note.type === "chord" ? 2 : 1), 0);
}

/** Fail closed before gameplay or release tooling can treat an old chart as new content. */
export function parseDuohertzChart(value: unknown): DuohertzChart {
  if (!record(value) || value.format !== 2 || value.theme !== "duohertz") {
    throw new Error("Expected a duohertz format 2 chart");
  }
  const tier = value.tier;
  const inputCount = value.input_count;
  if (tier !== "easy" && tier !== "standard" && tier !== "hard") {
    throw new Error("Invalid duohertz tier");
  }
  if (inputCount !== (tier === "easy" ? 1 : 2)) {
    throw new Error("Easy must use one key; Standard and Hard must use two keys");
  }
  const validInputCount: InputCount = tier === "easy" ? 1 : 2;
  if (typeof value.track_id !== "string" || !/^dh-[a-z0-9-]+$/.test(value.track_id)) {
    throw new Error("Invalid duohertz track ID");
  }
  if (!finite(value.bpm) || value.bpm <= 0 || !finite(value.audio_offset_ms)) {
    throw new Error("Invalid chart timing metadata");
  }
  if (!Array.isArray(value.notes) || value.notes.length === 0) {
    throw new Error("A duohertz chart needs notes");
  }

  const seenIds = new Set<string>();
  const heldUntil = [-1, -1];
  const usedKeys = new Set<KeyIndex>();
  let previousTime = -1;
  for (const rawNote of value.notes) {
    if (!record(rawNote) || typeof rawNote.id !== "string" || !rawNote.id.trim() || seenIds.has(rawNote.id)) {
      throw new Error("Chart notes need unique non-empty IDs");
    }
    seenIds.add(rawNote.id);
    if (!finite(rawNote.t) || rawNote.t < 0 || rawNote.t <= previousTime) {
      throw new Error(`Invalid, duplicate or unsorted note time: ${rawNote.id}`);
    }
    previousTime = rawNote.t;
    if (rawNote.type === "tap") {
      if (!keyWithinCount(rawNote.key, validInputCount)) throw new Error(`Invalid tap key: ${rawNote.id}`);
      usedKeys.add(rawNote.key);
      if (rawNote.t <= heldUntil[rawNote.key]) throw new Error(`Tap overlaps a hold: ${rawNote.id}`);
    } else if (rawNote.type === "hold") {
      if (!keyWithinCount(rawNote.key, validInputCount) || !finite(rawNote.end) || rawNote.end <= rawNote.t) {
        throw new Error(`Invalid hold: ${rawNote.id}`);
      }
      usedKeys.add(rawNote.key);
      if (rawNote.t <= heldUntil[rawNote.key]) throw new Error(`Hold overlaps a hold: ${rawNote.id}`);
      heldUntil[rawNote.key] = rawNote.end;
    } else if (rawNote.type === "chord") {
      if (tier !== "hard" || !Array.isArray(rawNote.keys) || rawNote.keys.length !== 2
        || rawNote.keys[0] !== 0 || rawNote.keys[1] !== 1) {
        throw new Error(`Chords require both keys on Hard: ${rawNote.id}`);
      }
      if (rawNote.t <= heldUntil[0] || rawNote.t <= heldUntil[1]) {
        throw new Error(`Chord overlaps a hold: ${rawNote.id}`);
      }
      usedKeys.add(0);
      usedKeys.add(1);
    } else {
      throw new Error(`Unsupported duohertz note: ${rawNote.id}`);
    }
  }

  if (!usedKeys.has(0) || (validInputCount === 2 && !usedKeys.has(1))) {
    throw new Error("duohertz chart does not use every declared key");
  }

  const chart = value as unknown as DuohertzChart;
  if (!Number.isInteger(chart.total_notes) || chart.total_notes !== countDuohertzJudgments(chart.notes)) {
    throw new Error("duohertz total_notes does not match the chart");
  }
  return chart;
}
