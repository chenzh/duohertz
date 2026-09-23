export const CALIBRATION_BPM = 120;
export const CALIBRATION_BEAT_MS = 60_000 / CALIBRATION_BPM;
export const CALIBRATION_BEAT_COUNT = 8;
export const CALIBRATION_LEAD_IN_MS = 850;
/** Half a 120 BPM beat is 250ms; stay just inside it so one tap cannot match two pulses. */
export const CALIBRATION_TAP_WINDOW_MS = 240;
export const CALIBRATION_MIN_TAPS = 3;
export const CALIBRATION_STEADY_MAD_MS = 45;

export type CalibrationSample = {
  beatIndex: number;
  deltaMs: number;
};

export type CalibrationAnalysis = {
  sampleCount: number;
  rawOffsetMs: number;
  offsetMs: number;
  medianAbsoluteDeviationMs: number;
  status: "not-enough" | "steady" | "variable";
  clamped: boolean;
};

export type CalibrationTimingDirection = "early" | "centered" | "late";

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle]!;
  return (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function calibrationBeatTimes(startMs: number): number[] {
  return Array.from(
    { length: CALIBRATION_BEAT_COUNT },
    (_, index) => startMs + index * CALIBRATION_BEAT_MS,
  );
}

/**
 * Match an input edge to one, and only one, scheduled pulse.
 *
 * Pointer/key repeats are rejected via `usedBeatIndexes`; the sub-half-beat
 * window prevents a tap from ambiguously spilling into the next pulse.
 */
export function matchCalibrationTap(
  nowMs: number,
  beatTimesMs: readonly number[],
  usedBeatIndexes: ReadonlySet<number>,
): CalibrationSample | null {
  if (!Number.isFinite(nowMs)) return null;

  let best: CalibrationSample | null = null;
  for (let beatIndex = 0; beatIndex < beatTimesMs.length; beatIndex++) {
    if (usedBeatIndexes.has(beatIndex)) continue;
    const expectedMs = beatTimesMs[beatIndex];
    if (!Number.isFinite(expectedMs)) continue;
    const deltaMs = nowMs - expectedMs;
    if (Math.abs(deltaMs) > CALIBRATION_TAP_WINDOW_MS) continue;
    if (!best || Math.abs(deltaMs) < Math.abs(best.deltaMs)) {
      best = { beatIndex, deltaMs };
    }
  }
  return best;
}

/** Median resists one accidental tap; MAD tells the UI when the run was too variable to trust. */
export function analyzeCalibration(samples: readonly CalibrationSample[]): CalibrationAnalysis {
  const unique = new Map<number, number>();
  for (const sample of samples) {
    if (!Number.isInteger(sample.beatIndex) || sample.beatIndex < 0) continue;
    if (!Number.isFinite(sample.deltaMs) || unique.has(sample.beatIndex)) continue;
    unique.set(sample.beatIndex, sample.deltaMs);
  }

  const deltas = [...unique.values()];
  const rawOffsetMs = median(deltas);
  const medianAbsoluteDeviationMs = median(deltas.map((delta) => Math.abs(delta - rawOffsetMs)));
  const rounded = Math.round(rawOffsetMs);
  const offsetMs = Math.max(-200, Math.min(200, rounded));
  const sampleCount = deltas.length;

  return {
    sampleCount,
    rawOffsetMs,
    offsetMs,
    medianAbsoluteDeviationMs,
    status: sampleCount < CALIBRATION_MIN_TAPS
      ? "not-enough"
      : medianAbsoluteDeviationMs > CALIBRATION_STEADY_MAD_MS
        ? "variable"
        : "steady",
    clamped: offsetMs !== rounded,
  };
}

/** Positive offsets mean input arrived after the pulse; negative offsets mean it arrived before it. */
export function calibrationTimingDirection(offsetMs: number): CalibrationTimingDirection {
  if (!Number.isFinite(offsetMs) || Math.abs(offsetMs) < 0.5) return "centered";
  return offsetMs > 0 ? "late" : "early";
}

export function safeCalibrationReturn(search: string): string | null {
  const value = new URLSearchParams(search).get("return");
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function calibrationHref(returnTo: string): string {
  const safe = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  return `/calibrate?return=${encodeURIComponent(safe)}`;
}
