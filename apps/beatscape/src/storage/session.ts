import type { LastRun, PlayResult } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";
import { maxScore } from "../engine/judge";
import { saveScore, getPersonalBest } from "./settings";
import { readItem, readJSON, writeItem, writeJSON } from "./safeStorage";

const SESSION_RUN_KEY = "bs_last_run";
/** Survives new-tab share links (`?run=local`, PRD §6.0.24). */
const LOCAL_RUN_KEY = "bs_last_run_local";
let visitRun: LastRun | null = null;
let needsVisitRun = false;

export type BoardEntry = {
  track_id: string;
  title?: string;
  tier: string;
  score: number;
  accuracy: number;
  name: string;
  at: string;
};

function isEntry(v: unknown): v is BoardEntry {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return typeof e.track_id === "string" && typeof e.tier === "string" && typeof e.name === "string";
}

function boardEntries(v: unknown): BoardEntry[] | null {
  if (!Array.isArray(v)) return null;
  return v.filter(isEntry);
}

export function loadBoard(): BoardEntry[] {
  return readJSON<BoardEntry[]>("bs_board", [], boardEntries);
}

export function saveBoardEntry(entry: BoardEntry, cap = 50) {
  const board = loadBoard();
  const next = [...board, entry].sort((a, b) => b.score - a.score).slice(0, cap);
  writeJSON("bs_board", next);
}

export type DailyBoardEntry = BoardEntry & { dateKey: string };

export function loadDailyBoard(dateKey = new Date().toISOString().slice(0, 10)): DailyBoardEntry[] {
  const all = readJSON<(BoardEntry & { dateKey?: string })[]>("bs_daily_board", [], (v) => {
    if (!Array.isArray(v)) return null;
    return v.filter(isEntry) as (BoardEntry & { dateKey?: string })[];
  });
  return all
    .filter((e) => e.dateKey === dateKey)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50) as DailyBoardEntry[];
}

export function saveDailyBoardEntry(entry: DailyBoardEntry, cap = 200) {
  const all = readJSON<DailyBoardEntry[]>("bs_daily_board", [], (v) => {
    if (!Array.isArray(v)) return null;
    return v.filter(isEntry) as DailyBoardEntry[];
  });
  const next = [...all, entry].sort((a, b) => b.score - a.score).slice(0, cap);
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
    if (run.shiftStep !== undefined && !["studio", "yard", "rooftop"].includes(run.shiftStep)) delete run.shiftStep;
    // T3 timing profile is additive: a corrupt/foreign shape must not kill the whole save.
    if (run.timing !== undefined) {
      const t = run.timing;
      if (!t || ![t.early, t.late, t.meanMs].every(Number.isFinite)) delete run.timing;
    }
    return run;
  } catch {
    return null;
  }
}

export function writeLastRun(
  track: CatalogTrack,
  tier: string,
  mode: string,
  result: PlayResult,
  durationMs: number,
  opts?: { daily?: boolean; shiftStep?: LastRun["shiftStep"] },
) {
  // Capture the standing record BEFORE this run is saved, so Results can flag a true new best.
  const prevBest = getPersonalBest(track.track_id, tier, mode);
  const run: LastRun = {
    v: 1,
    track_id: track.track_id,
    title: track.title,
    artist: track.artist,
    tier: tier as LastRun["tier"],
    mode: mode as LastRun["mode"],
    score: result.score,
    accuracy: result.accuracy,
    maxCombo: result.maxCombo,
    grade: result.grade,
    fc: result.fullCombo,
    ap: result.allPerfect,
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
  if (result.score <= ceiling && mode === "arcade" && !result.failed) {
    saveScore({
      track_id: track.track_id,
      tier,
      mode,
      score: result.score,
      accuracy: result.accuracy,
      at: run.endedAt,
    });
    saveBoardEntry({
      track_id: track.track_id,
      title: track.title,
      tier,
      score: result.score,
      accuracy: result.accuracy,
      name: getDisplayName(),
      at: run.endedAt,
    });
  }

  if (opts?.daily && result.score <= ceiling && mode === "arcade" && !result.failed) {
    saveDailyBoardEntry({
      track_id: track.track_id,
      title: track.title,
      tier,
      score: result.score,
      accuracy: result.accuracy,
      name: getDisplayName(),
      at: run.endedAt,
      dateKey: new Date().toISOString().slice(0, 10),
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
  return `I just ran ${run.title} on BeatScape — ${run.accuracy}% ${run.grade}. No account, no ads. Scores stay in your browser. Try this chart: ${url}`;
}

/** A recipient can play the same chart without access to the sender's local save. */
export function shareChallengeUrl(run: LastRun, origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  const base = (import.meta.env.BASE_URL || "/beatscape/").replace(/\/$/, "");
  return `${origin}${base}/play/${encodeURIComponent(run.track_id)}?tier=${run.tier}&mode=${run.mode}`;
}
