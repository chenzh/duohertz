import type { ChartTier, LastRun, PlayMode, PlayResult } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";
import { isAllPerfect, isFullCombo, maxScore } from "../engine/judge";
import { saveScore, getPersonalBest } from "./settings";
import { readItem, readJSON, writeItem, writeJSON } from "./safeStorage";
import { challengeTargetForRun, isChallengeTarget } from "../lib/challenge";
import { isDateKey } from "../lib/dailyChallenge";
import type { DailyChallenge } from "../lib/dailyChallenge";
import { CURRENT_SCORING_VERSION, isCompatibleScoringVersion } from "../engine/scoringRules";
import { normalizePracticeAttempts, normalizePracticeRepetitions } from "../lib/practiceDrill";

const SESSION_RUN_KEY = "bs_last_run";
/** Survives new-tab share links (`?run=local`, PRD §6.0.24). */
const LOCAL_RUN_KEY = "bs_last_run_local";
let visitRun: LastRun | null = null;
let needsVisitRun = false;

export type BoardEntry = {
  track_id: string;
  title?: string;
  tier: ChartTier;
  score: number;
  accuracy: number;
  name: string;
  at: string;
  scoringVersion?: number;
};

function isEntry(v: unknown): v is BoardEntry {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return typeof e.track_id === "string" && e.track_id.trim().length > 0 &&
    (e.title === undefined || typeof e.title === "string") &&
    typeof e.tier === "string" && ["easy", "standard", "hard"].includes(e.tier) &&
    typeof e.score === "number" && Number.isFinite(e.score) && e.score >= 0 &&
    typeof e.accuracy === "number" && Number.isFinite(e.accuracy) && e.accuracy >= 0 && e.accuracy <= 100 &&
    typeof e.name === "string" && e.name.trim().length > 0 &&
    typeof e.at === "string" && e.at.length > 0 &&
    isCompatibleScoringVersion(e.track_id as string, e.tier as string, e.scoringVersion);
}

function boardEntries(v: unknown): BoardEntry[] | null {
  if (!Array.isArray(v)) return null;
  return v.filter(isEntry);
}

export function loadBoard(): BoardEntry[] {
  return readJSON<BoardEntry[]>("bs_board", [], boardEntries);
}

export function saveBoardEntry(entry: BoardEntry, cap = 50) {
  if (!isEntry(entry)) return;
  const board = loadBoard();
  const next = [...board, entry].sort((a, b) => b.score - a.score).slice(0, cap);
  writeJSON("bs_board", next);
}

export type DailyBoardEntry = BoardEntry & { dateKey: string };

function isDailyEntry(v: unknown): v is DailyBoardEntry {
  return isEntry(v) && isDateKey((v as { dateKey?: unknown }).dateKey);
}

export function loadDailyBoard(dateKey = new Date().toISOString().slice(0, 10)): DailyBoardEntry[] {
  const all = readJSON<DailyBoardEntry[]>("bs_daily_board", [], (v) => {
    if (!Array.isArray(v)) return null;
    return v.filter(isDailyEntry);
  });
  return all
    .filter((e) => e.dateKey === dateKey)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50) as DailyBoardEntry[];
}

export function saveDailyBoardEntry(entry: DailyBoardEntry, cap = 200) {
  const all = readJSON<DailyBoardEntry[]>("bs_daily_board", [], (v) => {
    if (!Array.isArray(v)) return null;
    return v.filter(isDailyEntry);
  });
  if (!isDailyEntry(entry)) return;
  // The cap bounds history, not an all-time hall of fame. Keeping globally
  // highest scores would let old days permanently evict a lower-scoring new
  // challenge, making today's completed state disappear from Home.
  const next = [...all, entry]
    .sort((a, b) =>
      b.dateKey.localeCompare(a.dateKey) ||
      b.at.localeCompare(a.at) ||
      b.score - a.score,
    )
    .slice(0, cap);
  writeJSON("bs_daily_board", next);
}

export function getDisplayName(): string {
  return readItem("bs_display_name") || "Player";
}

function parseRun(raw: string | null): LastRun | null {
  if (!raw) return null;
  try {
    const run = JSON.parse(raw) as LastRun;
    if (!run || run.v !== 1 || typeof run.track_id !== "string" || typeof run.title !== "string" ||
      typeof run.artist !== "string" || !["easy", "standard", "hard"].includes(run.tier) ||
      !["casual", "arcade", "practice"].includes(run.mode) || !["S", "A", "B", "C", "D"].includes(run.grade) ||
      ![run.score, run.accuracy, run.maxCombo, run.totalNotes, run.durationMs].every(Number.isFinite) ||
      !run.counts || ![run.counts.perfect, run.counts.great, run.counts.good, run.counts.miss].every(Number.isFinite) ||
      (run.missEvents !== undefined && (!Array.isArray(run.missEvents) ||
        !run.missEvents.every((e) => e && Number.isFinite(e.tMs) && [0, 1, 2, 3].includes(e.lane))))) return null;
    if (!isCompatibleScoringVersion(run.track_id, run.tier, run.scoringVersion)) return null;
    if (run.shiftStep !== undefined && !["studio", "yard", "rooftop"].includes(run.shiftStep)) delete run.shiftStep;
    if (run.seekedFrom !== undefined && (!Number.isFinite(run.seekedFrom) || run.seekedFrom < 0)) {
      delete run.seekedFrom;
    }
    if (run.seekedUntil !== undefined &&
      (run.seekedFrom === undefined || !Number.isFinite(run.seekedUntil) || run.seekedUntil <= run.seekedFrom)) {
      delete run.seekedUntil;
    }
    const practiceRepetitions = normalizePracticeRepetitions(
      typeof run.practiceRepetitions === "number" ? run.practiceRepetitions : undefined,
      run.seekedFrom !== undefined && run.seekedUntil !== undefined,
    );
    if (practiceRepetitions > 1) run.practiceRepetitions = practiceRepetitions;
    else delete run.practiceRepetitions;
    const practiceAttempts = normalizePracticeAttempts(
      run.practiceAttempts,
      practiceRepetitions,
      run.totalNotes,
    );
    if (practiceAttempts) run.practiceAttempts = practiceAttempts;
    else delete run.practiceAttempts;
    // T3 timing profile is additive: a corrupt/foreign shape must not kill the whole save.
    if (run.timing !== undefined) {
      const t = run.timing;
      if (!t ||
        !Number.isInteger(t.early) || t.early < 0 ||
        !Number.isInteger(t.late) || t.late < 0 ||
        t.early + t.late <= 0 ||
        !Number.isFinite(t.meanMs)) delete run.timing;
    }
    if (run.challenge !== undefined && (run.seekedFrom !== undefined || !isChallengeTarget(run.challenge))) {
      delete run.challenge;
    }
    if (run.dailyDateKey !== undefined && (
      !isDateKey(run.dailyDateKey) ||
      run.tier !== "standard" ||
      run.mode !== "arcade" ||
      run.seekedFrom !== undefined
    )) delete run.dailyDateKey;
    // Badges are derived facts, not trusted storage. This also repairs a
    // legacy Good-only result that was incorrectly persisted as Full Combo.
    run.fc = isFullCombo(run.counts, run.totalNotes);
    run.ap = isAllPerfect(run.counts, run.totalNotes);
    return run;
  } catch {
    return null;
  }
}

export function writeLastRun(
  track: CatalogTrack,
  tier: ChartTier,
  mode: PlayMode,
  result: PlayResult,
  durationMs: number,
  opts?: {
    daily?: DailyChallenge;
    shiftStep?: LastRun["shiftStep"];
    challenge?: LastRun["challenge"];
  },
) {
  // Capture the standing record BEFORE this run is saved, so Results can flag a true new best.
  const prevBest = getPersonalBest(track.track_id, tier, mode);
  const daily = opts?.daily;
  const validDaily = daily &&
    isDateKey(daily.dateKey) &&
    daily.trackId === track.track_id &&
    daily.tier === tier &&
    daily.mode === mode &&
    daily.tier === "standard" &&
    daily.mode === "arcade" &&
    result.seekedFrom === undefined
      ? daily
      : null;
  const practiceRepetitions = normalizePracticeRepetitions(
    result.practiceRepetitions,
    result.seekedFrom !== undefined && result.seekedUntil !== undefined,
  );
  const practiceAttempts = normalizePracticeAttempts(
    result.practiceAttempts,
    practiceRepetitions,
    result.totalNotes,
  );
  const run: LastRun = {
    v: 1,
    scoringVersion: CURRENT_SCORING_VERSION,
    track_id: track.track_id,
    title: track.title,
    artist: track.artist,
    tier,
    mode,
    score: result.score,
    accuracy: result.accuracy,
    maxCombo: result.maxCombo,
    grade: result.grade,
    fc: isFullCombo(result.judgments, result.totalNotes),
    ap: isAllPerfect(result.judgments, result.totalNotes),
    failed: result.failed,
    counts: result.judgments,
    totalNotes: result.totalNotes,
    durationMs,
    endedAt: new Date().toISOString(),
    ...(opts?.shiftStep ? { shiftStep: opts.shiftStep } : {}),
    prevBestScore: prevBest?.score,
    missEvents: result.missEvents,
    surgeMaxTier: result.surgeMaxTier,
    ...(result.timing ? { timing: result.timing } : {}),
    ...(result.seekedFrom !== undefined ? { seekedFrom: result.seekedFrom } : {}),
    ...(result.seekedUntil !== undefined ? { seekedUntil: result.seekedUntil } : {}),
    ...(practiceRepetitions > 1 ? { practiceRepetitions } : {}),
    ...(practiceAttempts ? { practiceAttempts } : {}),
    ...(validDaily ? { dailyDateKey: validDaily.dateKey } : {}),
    ...(result.seekedFrom === undefined && opts?.challenge && isChallengeTarget(opts.challenge)
      ? { challenge: opts.challenge }
      : {}),
  };
  const payload = JSON.stringify(run);
  // 这两次写入绝不能因为配额 / 隐私模式抛异常而中断：后面的成绩与排行榜存档
  // 都在这两行之后，一抛就是"打完一局，什么都没存下来"。
  visitRun = run;
  writeItem(SESSION_RUN_KEY, payload, "session");
  writeItem(LOCAL_RUN_KEY, payload);
  // A denied write can leave an older readable save behind. Prefer this actual
  // finish for the current visit instead of showing stale results (or no run).
  needsVisitRun = readItem(SESSION_RUN_KEY, "session") !== payload;

  const ceiling = maxScore(result.totalNotes) * 1.01;
  const counts = Object.values(result.judgments);
  const rankableResult = Number.isInteger(result.totalNotes) && result.totalNotes > 0 &&
    counts.every((count) => Number.isInteger(count) && count >= 0) &&
    counts.reduce((sum, count) => sum + count, 0) === result.totalNotes &&
    Number.isFinite(result.score) && result.score >= 0 && result.score <= ceiling &&
    Number.isFinite(result.accuracy) && result.accuracy >= 0 && result.accuracy <= 100 &&
    Number.isInteger(result.maxCombo) && result.maxCombo >= 0 && result.maxCombo <= result.totalNotes;
  if (rankableResult && mode === "arcade" && !result.failed && result.seekedFrom === undefined) {
    saveScore({
      track_id: track.track_id,
      tier,
      mode,
      score: result.score,
      accuracy: result.accuracy,
      at: run.endedAt,
      scoringVersion: CURRENT_SCORING_VERSION,
    });
    saveBoardEntry({
      track_id: track.track_id,
      title: track.title,
      tier,
      score: result.score,
      accuracy: result.accuracy,
      name: getDisplayName(),
      at: run.endedAt,
      scoringVersion: CURRENT_SCORING_VERSION,
    });
  }

  if (validDaily && rankableResult && mode === "arcade" && !result.failed && result.seekedFrom === undefined) {
    saveDailyBoardEntry({
      track_id: track.track_id,
      title: track.title,
      tier,
      score: result.score,
      accuracy: result.accuracy,
      name: getDisplayName(),
      at: run.endedAt,
      dateKey: validDaily.dateKey,
      scoringVersion: CURRENT_SCORING_VERSION,
    });
  }
  return run;
}

/** Prefer session (same tab); fall back to localStorage for share deep links. */
export function readLastRun(preferLocal = false): LastRun | null {
  if (needsVisitRun && visitRun) return visitRun;
  if (preferLocal) {
    return parseRun(readItem(LOCAL_RUN_KEY)) ?? parseRun(readItem(SESSION_RUN_KEY, "session"));
  }
  return parseRun(readItem(SESSION_RUN_KEY, "session")) ?? parseRun(readItem(LOCAL_RUN_KEY));
}

export function shareResultsUrl(origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  const base = (import.meta.env.BASE_URL || "/beatscape/").replace(/\/$/, "");
  return `${origin}${base}/results?run=local`;
}

export function shareResultsCopy(run: LastRun, url: string): string {
  if (run.seekedFrom !== undefined) {
    const totalSeconds = Math.max(0, Math.floor(run.seekedFrom));
    const clock = `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
    const range = run.seekedUntil === undefined
      ? `from ${clock}`
      : `${clock}–${Math.floor(run.seekedUntil / 60)}:${String(Math.floor(run.seekedUntil) % 60).padStart(2, "0")}`;
    return run.practiceRepetitions
      ? `I ran a ${run.practiceRepetitions}-rep drill on ${run.title} ${range} in BeatScape — final rep ${run.accuracy}% ${run.grade}. Practice scores stay off the rankings. Try the full chart: ${url}`
      : `I practiced ${run.title} ${range} on BeatScape — ${run.accuracy}% ${run.grade}. Practice scores stay off the rankings. Try the full chart: ${url}`;
  }
  return `I just ran ${run.title} on BeatScape — ${run.accuracy}% ${run.grade}. No account, no ads. Scores stay in your browser. Try this chart: ${url}`;
}

/** A recipient can play the same chart without access to the sender's local save. */
export function shareChallengeUrl(run: LastRun, origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  const base = (import.meta.env.BASE_URL || "/beatscape/").replace(/\/$/, "");
  const params = new URLSearchParams({ tier: run.tier, mode: run.mode });
  const target = challengeTargetForRun(run);
  if (target) {
    params.set("challenge", "1");
    params.set("target", String(target.score));
    params.set("acc", String(target.accuracy));
    params.set("grade", target.grade);
  }
  return `${origin}${base}/play/${encodeURIComponent(run.track_id)}?${params}`;
}
