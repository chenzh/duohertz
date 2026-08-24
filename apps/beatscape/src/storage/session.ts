import type { LastRun, PlayResult } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";
import { maxScore } from "../engine/judge";
import { saveScore } from "./settings";

export type BoardEntry = {
  track_id: string;
  tier: string;
  score: number;
  accuracy: number;
  name: string;
  at: string;
};

export function loadBoard(): BoardEntry[] {
  try {
    const raw = localStorage.getItem("bs_board");
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

export function saveBoardEntry(entry: BoardEntry, cap = 50) {
  const board = loadBoard();
  const next = [...board, entry].sort((a, b) => b.score - a.score).slice(0, cap);
  localStorage.setItem("bs_board", JSON.stringify(next));
}

export function getDisplayName(): string {
  return localStorage.getItem("bs_display_name") || "Player";
}

export function writeLastRun(
  track: CatalogTrack,
  tier: string,
  mode: string,
  result: PlayResult,
  durationMs: number,
) {
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
    counts: result.judgments,
    totalNotes: result.totalNotes,
    durationMs,
    endedAt: new Date().toISOString(),
  };
  sessionStorage.setItem("bs_last_run", JSON.stringify(run));

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
      tier,
      score: result.score,
      accuracy: result.accuracy,
      name: getDisplayName(),
      at: run.endedAt,
    });
  }
}

export function readLastRun(): LastRun | null {
  try {
    const raw = sessionStorage.getItem("bs_last_run");
    if (!raw) return null;
    return JSON.parse(raw) as LastRun;
  } catch {
    return null;
  }
}
