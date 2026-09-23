import type { ChartTier, PlayMode, PlayResult, TimingSummary } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";
import { isAllPerfect, isFullCombo } from "../engine/judge";
import { readItem, readJSON, writeItem, writeJSON } from "../storage/safeStorage";

// PRD-BEATSCAPE §17 — honor ranks + achievements, localStorage only (no account).
// Ranks only go up (§17.1 降级：不自动降段): bs_rank stores the highest reached.

export const RUNS_KEY = "bs_runs";
export const ACHIEVEMENTS_KEY = "bs_achievements";
export const RANK_KEY = "bs_rank";
const RUNS_CAP = 100;
/** Rank average window (PRD §17.1: 近 20 局 Arcade 加权准确率). */
const AVG_WINDOW = 20;

export type RunRecord = {
  track_id: string;
  district: string;
  tier: ChartTier;
  mode: PlayMode;
  score: number;
  accuracy: number;
  maxCombo: number;
  fc: boolean;
  ap: boolean;
  failed: boolean;
  durationMs: number;
  endedAt: string;
  dateKey: string;
  /** Optional for history written before persistent timing coaching shipped. */
  timing?: TimingSummary;
};

/** A run that ended without one successful judgment still needs recovery language. */
export function runNeedsRetry(run: Pick<RunRecord, "failed" | "accuracy">): boolean {
  return run.failed || run.accuracy <= 0;
}

export type RankId = "echo-novice" | "beat-player" | "rhythm-master" | "scape-legend";

export const RANKS: Array<{ id: RankId; label: string; condition: string }> = [
  { id: "echo-novice", label: "Echo Novice", condition: "Finish your first run" },
  { id: "beat-player", label: "Beat Player", condition: "5 clears, or one run at 90% accuracy" },
  { id: "rhythm-master", label: "Rhythm Master", condition: "3 Full Combos, and 92% recent accuracy" },
  {
    id: "scape-legend",
    label: "Scape Legend",
    condition: "1 All Perfect, 3 Hard clears, and 95% recent accuracy",
  },
];

export type AchievementId =
  | "ach-first-clear"
  | "ach-first-fc"
  | "ach-first-ap"
  | "ach-combo-100"
  | "ach-combo-200"
  | "ach-hard-clear"
  | "ach-district-5"
  | "ach-streak-3";

export const ACHIEVEMENTS: Array<{ id: AchievementId; label: string; condition: string }> = [
  { id: "ach-first-clear", label: "First Light", condition: "Land a note and finish any track" },
  { id: "ach-first-fc", label: "Full Circuit", condition: "First Full Combo" },
  { id: "ach-first-ap", label: "Absolute Pulse", condition: "First All Perfect" },
  { id: "ach-combo-100", label: "Hundred Echo", condition: "Max Combo 100 in one run" },
  { id: "ach-combo-200", label: "Overload", condition: "Max Combo 200 in one run" },
  { id: "ach-hard-clear", label: "Core Breach", condition: "Clear any Hard chart" },
  { id: "ach-district-5", label: "City Walker", condition: "Play tracks from 5 districts" },
  { id: "ach-streak-3", label: "Three Nights", condition: "Play on 3 calendar days in a row" },
];

export type PlayStats = {
  totalRuns: number;
  totalClears: number;
  fcCount: number;
  apCount: number;
  hardClears: number;
  bestMaxCombo: number;
  bestAccuracy: number;
  /** Mean accuracy of the last 20 arcade runs (failed included — honest average). */
  recentArcadeAccuracy: number;
  districtsPlayed: number;
  uniqueTracks: number;
  totalPlayMs: number;
  /** Consecutive local calendar days ending today, or yesterday while still recoverable today. */
  activeStreakDays: number;
  /** Longest run of consecutive calendar days with ≥1 run. */
  bestStreakDays: number;
  /** Whether today's local-calendar run is complete, still recoverable, or no longer active. */
  streakStatus: "played-today" | "ready-today" | "inactive";
};

export type RankProgressRequirement = {
  id: "clears" | "accuracy" | "full-combos" | "all-perfect" | "hard-clears";
  label: string;
  current: number;
  target: number;
  format: "count" | "percent";
};

export type NextRankProgress = {
  rank: (typeof RANKS)[number];
  rule: "any" | "all";
  requirements: RankProgressRequirement[];
};

const VALID_TIERS = new Set<ChartTier>(["easy", "standard", "hard"]);
const VALID_MODES = new Set<PlayMode>(["casual", "arcade", "practice"]);
const VALID_ACHIEVEMENTS = new Set<AchievementId>(ACHIEVEMENTS.map((achievement) => achievement.id));

function isCalendarDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isTimingSummary(value: unknown): value is TimingSummary {
  if (!value || typeof value !== "object") return false;
  const timing = value as Partial<TimingSummary>;
  return Number.isInteger(timing.early)
    && (timing.early ?? -1) >= 0
    && Number.isInteger(timing.late)
    && (timing.late ?? -1) >= 0
    && (timing.early ?? 0) + (timing.late ?? 0) > 0
    && Number.isFinite(timing.meanMs);
}

function isRunRecord(value: unknown): value is RunRecord {
  if (!value || typeof value !== "object") return false;
  const run = value as Partial<RunRecord>;
  const valid = typeof run.track_id === "string"
    && typeof run.district === "string"
    && VALID_TIERS.has(run.tier as ChartTier)
    && VALID_MODES.has(run.mode as PlayMode)
    && [run.score, run.accuracy, run.maxCombo, run.durationMs].every(Number.isFinite)
    && (run.score ?? -1) >= 0
    && (run.accuracy ?? -1) >= 0
    && (run.accuracy ?? 101) <= 100
    && (run.maxCombo ?? -1) >= 0
    && (run.durationMs ?? -1) >= 0
    && typeof run.fc === "boolean"
    && typeof run.ap === "boolean"
    && typeof run.failed === "boolean"
    && typeof run.endedAt === "string"
    && Number.isFinite(Date.parse(run.endedAt))
    && isCalendarDateKey(run.dateKey);
  if (!valid) return false;
  // Timing was added after the base run-history schema. Drop only this optional
  // profile when a foreign/corrupt save supplies an impossible shape.
  if (run.timing !== undefined && !isTimingSummary(run.timing)) delete run.timing;
  return true;
}

/** Local calendar day for player streaks. Daily Challenge uses its own global UTC key. */
export function todayKey(d = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function loadRuns(): RunRecord[] {
  return readJSON<RunRecord[]>(RUNS_KEY, [], (v) => (
    Array.isArray(v) ? v.filter(isRunRecord) : null
  ));
}

/** Newest full run whose track still exists in the current playable catalog. */
export function latestRunForTrackIds(
  runs: RunRecord[],
  trackIds: Iterable<string>,
): RunRecord | null {
  const playable = new Set(trackIds);
  let latest: RunRecord | null = null;
  let latestAt = Number.NEGATIVE_INFINITY;

  for (const run of runs) {
    if (!playable.has(run.track_id)) continue;
    const endedAt = Date.parse(run.endedAt);
    if (!Number.isFinite(endedAt) || endedAt < latestAt) continue;
    latest = run;
    latestAt = endedAt;
  }

  return latest;
}

export function loadUnlockedAchievements(): AchievementId[] {
  // 顺手过滤掉已下线的成就 id：旧存档里可能留着不再存在的条目。
  return readJSON<AchievementId[]>(ACHIEVEMENTS_KEY, [], (v) =>
    Array.isArray(v)
      ? [...new Set(v.filter((id): id is AchievementId => (
          typeof id === "string" && VALID_ACHIEVEMENTS.has(id as AchievementId)
        )))]
      : null,
  );
}

export function loadRank(): RankId {
  const raw = readItem(RANK_KEY);
  return raw === "beat-player" || raw === "rhythm-master" || raw === "scape-legend"
    ? raw
    : "echo-novice";
}

function saveRuns(runs: RunRecord[]) {
  writeJSON(RUNS_KEY, runs.slice(-RUNS_CAP));
}

function dayDiff(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(da) || Number.isNaN(db)) return Number.NaN;
  return Math.round((db - da) / 86400000);
}

/**
 * Lifetime growth starts when the player actually joins the chart. A complete
 * no-input/no-hit attempt remains valuable run history and recovery context,
 * but must not claim a clear, streak night, district visit, or honor unlock.
 * Score is the backwards-compatible persisted proof of a successful judgment:
 * every Perfect/Great/Good awards points, while every all-Miss run stays at 0.
 */
function runCountsForProgress(run: Pick<RunRecord, "score">): boolean {
  return run.score > 0;
}

export function computeStats(runs: RunRecord[], currentDateKey = todayKey()): PlayStats {
  const progressRuns = runs.filter(runCountsForProgress);
  const clears = progressRuns.filter((r) => !r.failed);
  const arcade = progressRuns.filter((r) => r.mode === "arcade");
  const window = arcade.slice(-AVG_WINDOW);
  const recentArcadeAccuracy = window.length
    ? window.reduce((sum, r) => sum + r.accuracy, 0) / window.length
    : 0;
  const days = [...new Set(progressRuns.map((r) => r.dateKey).filter(isCalendarDateKey))].sort();
  let bestStreak = 0;
  let current = 0;
  let prev: string | null = null;
  for (const day of days) {
    current = prev !== null && dayDiff(prev, day) === 1 ? current + 1 : 1;
    bestStreak = Math.max(bestStreak, current);
    prev = day;
  }
  let activeStreakDays = 0;
  let streakStatus: PlayStats["streakStatus"] = "inactive";
  const lastDay = days.at(-1);
  if (lastDay && isCalendarDateKey(currentDateKey)) {
    const gapToToday = dayDiff(lastDay, currentDateKey);
    if (gapToToday === 0 || gapToToday === 1) {
      activeStreakDays = 1;
      for (let index = days.length - 1; index > 0; index--) {
        if (dayDiff(days[index - 1]!, days[index]!) !== 1) break;
        activeStreakDays += 1;
      }
      streakStatus = gapToToday === 0 ? "played-today" : "ready-today";
    }
  }
  return {
    totalRuns: runs.length,
    totalClears: clears.length,
    fcCount: clears.filter((r) => r.mode === "arcade" && r.fc).length,
    apCount: clears.filter((r) => r.mode === "arcade" && r.ap).length,
    hardClears: clears.filter((r) => r.mode === "arcade" && r.tier === "hard").length,
    bestMaxCombo: runs.reduce((max, r) => Math.max(max, r.maxCombo), 0),
    bestAccuracy: runs.reduce((max, r) => Math.max(max, r.accuracy), 0),
    recentArcadeAccuracy: Math.round(recentArcadeAccuracy * 100) / 100,
    districtsPlayed: new Set(progressRuns.map((r) => r.district).filter(Boolean)).size,
    uniqueTracks: new Set(progressRuns.map((r) => r.track_id)).size,
    totalPlayMs: runs.reduce((sum, r) => sum + r.durationMs, 0),
    activeStreakDays,
    bestStreakDays: bestStreak,
    streakStatus,
  };
}

/** Highest rank whose condition is met (PRD §17.1). Pure — the ladder only goes up. */
export function rankFor(stats: PlayStats): RankId {
  if (stats.apCount >= 1 && stats.hardClears >= 3 && stats.recentArcadeAccuracy >= 95) {
    return "scape-legend";
  }
  if (stats.fcCount >= 3 && stats.recentArcadeAccuracy >= 92) return "rhythm-master";
  if (stats.totalClears >= 5 || stats.bestAccuracy >= 90) return "beat-player";
  return "echo-novice";
}

/** Quantified requirements for the rank immediately above the saved rank. */
export function nextRankProgress(stats: PlayStats, currentRank: RankId): NextRankProgress | null {
  const currentIndex = RANKS.findIndex((rank) => rank.id === currentRank);
  const next = RANKS[currentIndex + 1];
  if (!next) return null;

  if (next.id === "beat-player") {
    return {
      rank: next,
      rule: "any",
      requirements: [
        { id: "clears", label: "Clears", current: stats.totalClears, target: 5, format: "count" },
        { id: "accuracy", label: "Best accuracy", current: stats.bestAccuracy, target: 90, format: "percent" },
      ],
    };
  }
  if (next.id === "rhythm-master") {
    return {
      rank: next,
      rule: "all",
      requirements: [
        { id: "full-combos", label: "Arcade Full Combos", current: stats.fcCount, target: 3, format: "count" },
        {
          id: "accuracy",
          label: "Recent Arcade accuracy",
          current: stats.recentArcadeAccuracy,
          target: 92,
          format: "percent",
        },
      ],
    };
  }
  return {
    rank: next,
    rule: "all",
    requirements: [
      { id: "all-perfect", label: "Arcade All Perfect", current: stats.apCount, target: 1, format: "count" },
      { id: "hard-clears", label: "Hard Arcade clears", current: stats.hardClears, target: 3, format: "count" },
      {
        id: "accuracy",
        label: "Recent Arcade accuracy",
        current: stats.recentArcadeAccuracy,
        target: 95,
        format: "percent",
      },
    ],
  };
}

export function achievementsFor(stats: PlayStats): AchievementId[] {
  const unlocked: AchievementId[] = [];
  const grant = (id: AchievementId, when: boolean) => {
    if (when) unlocked.push(id);
  };
  grant("ach-first-clear", stats.totalClears >= 1);
  grant("ach-first-fc", stats.fcCount >= 1);
  grant("ach-first-ap", stats.apCount >= 1);
  grant("ach-combo-100", stats.bestMaxCombo >= 100);
  grant("ach-combo-200", stats.bestMaxCombo >= 200);
  grant("ach-hard-clear", stats.hardClears >= 1);
  grant("ach-district-5", stats.districtsPlayed >= 5);
  grant("ach-streak-3", stats.bestStreakDays >= 3);
  return unlocked;
}

export const STREAK_UPDATE_KEY = "bs_streak_update";

export type StreakUpdate = {
  kind: "started" | "extended";
  activeDays: number;
  newBest: boolean;
};

export type RecordRunOutcome = {
  newAchievements: AchievementId[];
  rank: RankId;
  rankUp: boolean;
  /** Present only for the first lifetime-progress run recorded on this local day. */
  streakUpdate: StreakUpdate | null;
};

/** Append a finished run, then evaluate achievements + rank. Call once per finished run. */
export function recordRun(
  track: Pick<CatalogTrack, "track_id" | "district">,
  tier: ChartTier,
  mode: PlayMode,
  result: PlayResult,
  durationMs: number,
  now = new Date(),
): RecordRunOutcome {
  // Section slices are deliberately excluded from lifetime stats. Their score,
  // accuracy and duration are not comparable with a full chart, and counting
  // them would let a 20-second retry inflate runs, rank and streak progress.
  if (result.seekedFrom !== undefined) {
    return { newAchievements: [], rank: loadRank(), rankUp: false, streakUpdate: null };
  }
  const run: RunRecord = {
    track_id: track.track_id,
    district: track.district,
    tier,
    mode,
    score: result.score,
    accuracy: result.accuracy,
    maxCombo: result.maxCombo,
    // Re-derive achievement facts at the persistence boundary so a stale or
    // foreign PlayResult cannot award an impossible badge.
    fc: isFullCombo(result.judgments, result.totalNotes),
    ap: isAllPerfect(result.judgments, result.totalNotes),
    failed: result.failed,
    durationMs,
    endedAt: now.toISOString(),
    dateKey: todayKey(now),
    ...(result.timing && isTimingSummary(result.timing) ? { timing: result.timing } : {}),
  };
  const previousRuns = loadRuns();
  const previousStats = computeStats(previousRuns, run.dateKey);
  const isFirstProgressRunToday = runCountsForProgress(run)
    && !previousRuns.some((previousRun) => (
      previousRun.dateKey === run.dateKey && runCountsForProgress(previousRun)
    ));
  const runs = [...previousRuns, run];
  saveRuns(runs);

  const stats = computeStats(runs, run.dateKey);
  const unlocked = achievementsFor(stats);

  const prevAchievements = loadUnlockedAchievements();
  const newAchievements = unlocked.filter((id) => !prevAchievements.includes(id));
  if (newAchievements.length) {
    writeJSON(ACHIEVEMENTS_KEY, [...prevAchievements, ...newAchievements]);
  }

  const rank = rankFor(stats);
  const prevRank = loadRank();
  const rankUp = RANKS.findIndex((r) => r.id === rank) > RANKS.findIndex((r) => r.id === prevRank);
  if (rankUp) writeItem(RANK_KEY, rank);

  const streakUpdate: StreakUpdate | null = isFirstProgressRunToday && stats.activeStreakDays > 0
    ? {
        kind: previousStats.streakStatus === "ready-today" ? "extended" : "started",
        activeDays: stats.activeStreakDays,
        newBest: stats.bestStreakDays > previousStats.bestStreakDays,
      }
    : null;

  return { newAchievements, rank, rankUp, streakUpdate };
}
