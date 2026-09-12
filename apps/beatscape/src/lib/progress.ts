import type { ChartTier, PlayMode, PlayResult } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";
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
};

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
  { id: "ach-first-clear", label: "First Light", condition: "Finish any track once" },
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
  /** Longest run of consecutive calendar days with ≥1 run. */
  bestStreakDays: number;
};

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function loadRuns(): RunRecord[] {
  return readJSON<RunRecord[]>(RUNS_KEY, [], (v) => (Array.isArray(v) ? (v as RunRecord[]) : null));
}

export function loadUnlockedAchievements(): AchievementId[] {
  // 顺手过滤掉已下线的成就 id：旧存档里可能留着不再存在的条目。
  return readJSON<AchievementId[]>(ACHIEVEMENTS_KEY, [], (v) =>
    Array.isArray(v) ? (v.filter((id): id is AchievementId => typeof id === "string") as AchievementId[]) : null,
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

export function computeStats(runs: RunRecord[]): PlayStats {
  const clears = runs.filter((r) => !r.failed);
  const arcade = runs.filter((r) => r.mode === "arcade");
  const window = arcade.slice(-AVG_WINDOW);
  const recentArcadeAccuracy = window.length
    ? window.reduce((sum, r) => sum + r.accuracy, 0) / window.length
    : 0;
  const days = [...new Set(runs.map((r) => r.dateKey))].sort();
  let bestStreak = 0;
  let current = 0;
  let prev: string | null = null;
  for (const day of days) {
    current = prev !== null && dayDiff(prev, day) === 1 ? current + 1 : 1;
    bestStreak = Math.max(bestStreak, current);
    prev = day;
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
    districtsPlayed: new Set(runs.map((r) => r.district).filter(Boolean)).size,
    uniqueTracks: new Set(runs.map((r) => r.track_id)).size,
    totalPlayMs: runs.reduce((sum, r) => sum + r.durationMs, 0),
    bestStreakDays: bestStreak,
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

export type RecordRunOutcome = {
  newAchievements: AchievementId[];
  rank: RankId;
  rankUp: boolean;
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
  const run: RunRecord = {
    track_id: track.track_id,
    district: track.district,
    tier,
    mode,
    score: result.score,
    accuracy: result.accuracy,
    maxCombo: result.maxCombo,
    fc: result.fullCombo,
    ap: result.allPerfect,
    failed: result.failed,
    durationMs,
    endedAt: now.toISOString(),
    dateKey: todayKey(now),
  };
  const runs = [...loadRuns(), run];
  saveRuns(runs);

  const stats = computeStats(runs);
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

  return { newAchievements, rank, rankUp };
}
