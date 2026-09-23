import { playHref } from "./playHref";
import { challengeReplayHref } from "./challenge";
import { calibrationHref } from "./calibration";
import type { ChartTier, LastRun } from "../types/chart";
import type { RunRecord } from "./progress";

export type RunCoach = {
  tone: "recover" | "practice" | "timing" | "advance" | "replay";
  title: string;
  detail: string;
  action:
    | { kind: "link"; label: string; href: string }
    | { kind: "review"; label: string };
};

const NEXT_TIER: Partial<Record<ChartTier, ChartTier>> = {
  easy: "standard",
  standard: "hard",
};

const PERSISTENT_BIAS_RUNS = 3;
const PER_RUN_BIAS_MS = 8;
const PERSISTENT_BIAS_MS = 10;
const MIN_TIMED_HITS = 20;

type BuildRunCoachOptions = {
  recentRuns?: readonly RunRecord[];
  /** Exact run identity, including Daily or shared-challenge context. */
  replayHref?: string;
  replayLabel?: string;
};

type TimingBias = {
  meanMs: number;
  direction: "early" | "late";
};

type TimingCandidate = {
  key: string;
  endedAt: number;
  meanMs: number;
};

function timingCandidate(
  run: Pick<LastRun, "track_id" | "tier" | "mode" | "failed" | "endedAt" | "timing">,
): TimingCandidate | null {
  const timing = run.timing;
  const endedAt = Date.parse(run.endedAt);
  if (run.mode !== "arcade" || run.failed || !timing || !Number.isFinite(endedAt) ||
    !Number.isInteger(timing.early) || timing.early < 0 ||
    !Number.isInteger(timing.late) || timing.late < 0 ||
    timing.early + timing.late < MIN_TIMED_HITS ||
    !Number.isFinite(timing.meanMs) || Math.abs(timing.meanMs) < PER_RUN_BIAS_MS) {
    return null;
  }
  return {
    key: `${run.track_id}|${run.tier}|${run.mode}|${run.endedAt}`,
    endedAt,
    meanMs: timing.meanMs,
  };
}

/**
 * Detect a setup-shaped problem without treating one run as proof. The current
 * result must be the newest eligible run; duplicate history rows cannot inflate
 * the sample, and median direction/magnitude resist one unusually large run.
 */
export function persistentTimingBias(
  current: LastRun,
  recentRuns: readonly RunRecord[] = [],
): TimingBias | null {
  const currentCandidate = timingCandidate(current);
  if (!currentCandidate) return null;

  const unique = new Map<string, TimingCandidate>();
  for (const candidateRun of [current, ...recentRuns]) {
    const candidate = timingCandidate(candidateRun);
    if (candidate && !unique.has(candidate.key)) unique.set(candidate.key, candidate);
  }
  const recent = [...unique.values()]
    .sort((a, b) => b.endedAt - a.endedAt)
    .slice(0, PERSISTENT_BIAS_RUNS);
  if (recent.length < PERSISTENT_BIAS_RUNS || recent[0]?.key !== currentCandidate.key) return null;

  const direction = recent[0]!.meanMs < 0 ? -1 : 1;
  if (!recent.every((candidate) => Math.sign(candidate.meanMs) === direction)) return null;
  const sortedMeans = recent.map((candidate) => candidate.meanMs).sort((a, b) => a - b);
  const medianMs = sortedMeans[Math.floor(sortedMeans.length / 2)]!;
  if (Math.abs(medianMs) < PERSISTENT_BIAS_MS) return null;
  return {
    meanMs: Math.round(medianMs),
    direction: direction < 0 ? "early" : "late",
  };
}

function sectionReplayHref(run: LastRun): string {
  const base = playHref(run.track_id, run.tier, "practice");
  const start = run.seekedFrom ?? 0;
  return `${base}&seek=${start}${run.seekedUntil !== undefined ? `&until=${run.seekedUntil}` : ""}${run.practiceRepetitions !== undefined ? `&reps=${run.practiceRepetitions}` : ""}`;
}

/**
 * One concrete recommendation after a run. Results already contains plenty of
 * data; this turns it into the next action instead of asking the player to
 * interpret every number alone.
 */
export function buildRunCoach(run: LastRun, options: BuildRunCoachOptions = {}): RunCoach {
  const replayHref = options.replayHref ?? challengeReplayHref(run);
  const replayLabel = options.replayLabel ?? (run.challenge ? "Retry challenge" : "Replay");

  if (run.seekedFrom !== undefined) {
    const drill = run.practiceRepetitions !== undefined;
    return {
      tone: "practice",
      title: drill ? `${run.practiceRepetitions}-rep drill complete` : "Lock in this section",
      detail: drill
        ? run.practiceAttempts
          ? "Headline stats use the final rep. Compare every pass above, then run the drill again or return to the full Arcade chart."
          : "Only the final rep is shown above. Run the drill again or return to the full Arcade chart."
        : "Repeat it until the pattern feels automatic, then return to the full Arcade chart.",
      action: {
        kind: "link",
        label: options.replayLabel ?? (drill ? "Drill again" : "Practice again"),
        href: options.replayHref ?? sectionReplayHref(run),
      },
    };
  }

  if (run.failed) {
    return {
      tone: "recover",
      title: "Take the pressure off",
      detail: "Learn the same notes in Casual with wider timing and no HP fail, then bring the run back to Arcade.",
      action: { kind: "link", label: "Try Casual", href: playHref(run.track_id, run.tier, "casual") },
    };
  }

  if ((run.missEvents?.length ?? 0) >= 2) {
    return {
      tone: "practice",
      title: "Drill the rough spots",
      detail: `${run.missEvents!.length} misses are mapped below. Open the busiest section and rehearse only that part.`,
      action: { kind: "review", label: "Review missed sections" },
    };
  }

  const persistentBias = persistentTimingBias(run, options.recentRuns);
  if (persistentBias) {
    return {
      tone: "timing",
      title: `You’re consistently ${Math.abs(persistentBias.meanMs)} ms ${persistentBias.direction}`,
      detail: `Your last 3 full Arcade clears lean ${persistentBias.direction}. Check calibration once, then replay this exact setup.`,
      action: { kind: "link", label: "Calibrate timing", href: calibrationHref(replayHref) },
    };
  }

  const meanMs = Math.round(run.timing?.meanMs ?? 0);
  if (run.timing && Math.abs(meanMs) >= 8) {
    const direction = meanMs < 0 ? "early" : "late";
    return {
      tone: "timing",
      title: `You’re landing ${Math.abs(meanMs)} ms ${direction}`,
      detail: meanMs < 0
        ? "Let each note travel a little farther before you press. Small changes beat a full offset adjustment."
        : "Start each input a touch earlier. Keep your setup unchanged and test the feel over one more run.",
      action: { kind: "link", label: replayLabel, href: replayHref },
    };
  }

  if (run.mode !== "arcade" && run.accuracy >= 90) {
    return {
      tone: "advance",
      title: "Ready for Arcade",
      detail: "Keep this chart and move to strict timing, HP pressure, and the local board.",
      action: {
        kind: "link",
        label: `Play ${run.tier[0]!.toUpperCase()}${run.tier.slice(1)} Arcade`,
        href: playHref(run.track_id, run.tier, "arcade"),
      },
    };
  }

  const nextTier = NEXT_TIER[run.tier];
  if (nextTier && run.counts.miss === 0 && run.accuracy >= 96) {
    const label = `${nextTier[0]!.toUpperCase()}${nextTier.slice(1)}`;
    return {
      tone: "advance",
      title: `Move up to ${label}`,
      detail: "This chart is clean enough to raise the pattern density without changing the rules.",
      action: { kind: "link", label: `Try ${label}`, href: playHref(run.track_id, nextTier, run.mode) },
    };
  }

  if (run.counts.miss === 0) {
    return {
      tone: "replay",
      title: "Clean run — find the center",
      detail: "You kept the combo. Replay now and turn the remaining Great and Good hits into Perfects.",
      action: { kind: "link", label: replayLabel, href: replayHref },
    };
  }

  return {
    tone: "replay",
    title: "Run it back",
    detail: "The chart is still fresh. Replay once before changing speed or difficulty.",
    action: { kind: "link", label: replayLabel, href: replayHref },
  };
}
