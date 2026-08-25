import type { LastRun, PlayResult } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";
import { maxScore } from "../engine/judge";
import { saveScore, getPersonalBest } from "./settings";

const SESSION_RUN_KEY = "bs_last_run";
/** Survives new-tab share links (`?run=local`, PRD §6.0.24). */
const LOCAL_RUN_KEY = "bs_last_run_local";

export type BoardEntry = {
  track_id: string;
  title?: string;
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

function parseRun(raw: string | null): LastRun | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LastRun;
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
    counts: result.judgments,
    totalNotes: result.totalNotes,
    durationMs,
    endedAt: new Date().toISOString(),
    prevBestScore: prevBest?.score,
  };
  const payload = JSON.stringify(run);
  sessionStorage.setItem(SESSION_RUN_KEY, payload);
  localStorage.setItem(LOCAL_RUN_KEY, payload);

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
}

/** Prefer session (same tab); fall back to localStorage for share deep links. */
export function readLastRun(preferLocal = false): LastRun | null {
  if (preferLocal) {
    return parseRun(localStorage.getItem(LOCAL_RUN_KEY)) ?? parseRun(sessionStorage.getItem(SESSION_RUN_KEY));
  }
  return parseRun(sessionStorage.getItem(SESSION_RUN_KEY)) ?? parseRun(localStorage.getItem(LOCAL_RUN_KEY));
}

export function shareResultsUrl(origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  const base = (import.meta.env.BASE_URL || "/beatscape/").replace(/\/$/, "");
  return `${origin}${base}/results?run=local`;
}

export function shareResultsCopy(run: LastRun, url: string): string {
  return `I just ran ${run.title} on BeatScape — ${run.accuracy}% ${run.grade}. Feel the Beat, Own the Scape. ${url}`;
}
