import type { ChartTier, PlayMode } from "../types/chart";
import type { DailyBoardEntry } from "../storage/session";

export type DailyChallenge = {
  dateKey: string;
  trackId: string;
  tier: ChartTier;
  mode: PlayMode;
};

export type DailyChallengeSummary = {
  entries: DailyBoardEntry[];
  best: DailyBoardEntry | null;
  clears: number;
};

export type DailyClockSnapshot = {
  dateKey: string;
  resetInMs: number;
  resetLabel: string;
};

type DailySelection = Pick<DailyChallenge, "trackId" | "tier" | "mode">;

type DailyReplayRun = {
  track_id: string;
  tier: ChartTier;
  mode: PlayMode;
  dailyDateKey?: string;
  seekedFrom?: number;
};

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Time remaining until the next globally shared Daily boundary. */
export function dailyResetInMs(d = new Date()): number {
  const nextUtcMidnight = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
  );
  return Math.max(0, nextUtcMidnight - d.getTime());
}

/** Compact English countdown for the Home banner and Daily board. */
export function formatDailyReset(resetInMs: number): string {
  const safeMs = Number.isFinite(resetInMs) ? Math.max(0, resetInMs) : 0;
  const totalMinutes = Math.floor(safeMs / 60_000);
  if (totalMinutes < 1) return "Resets in <1m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0
    ? `Resets in ${hours}h ${minutes}m`
    : `Resets in ${minutes}m`;
}

export function dailyClockSnapshot(d = new Date()): DailyClockSnapshot {
  const resetInMs = dailyResetInMs(d);
  return {
    dateKey: todayKey(d),
    resetInMs,
    resetLabel: formatDailyReset(resetInMs),
  };
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function hashDate(dateKey: string): number {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic daily pick from catalog track ids (UTC date). */
export function getDailyChallenge(trackIds: string[], dateKey = todayKey()): DailyChallenge | null {
  if (!trackIds.length) return null;
  const idx = hashDate(dateKey) % trackIds.length;
  const trackId = [...trackIds].sort()[idx]!;
  return {
    dateKey,
    trackId,
    tier: "standard",
    mode: "arcade",
  };
}

export function dailyPlayHref(challenge: DailyChallenge): string {
  const params = new URLSearchParams({
    tier: challenge.tier,
    mode: challenge.mode,
    date: challenge.dateKey,
    daily: "1",
  });
  return `/play/${encodeURIComponent(challenge.trackId)}?${params}`;
}

/** Resolve a Daily URL into ranked context. `daily=1` alone is never enough:
 * the selected chart must be today's deterministic Standard Arcade pick. A
 * legacy URL without `date` remains valid for the current UTC day. */
export function resolveDailyChallenge(
  params: URLSearchParams,
  trackIds: string[],
  selection: DailySelection,
  currentDateKey = todayKey(),
): DailyChallenge | null {
  if (params.get("daily") !== "1" || !isDateKey(currentDateKey)) return null;
  const requestedDate = params.get("date") ?? currentDateKey;
  if (!isDateKey(requestedDate) || requestedDate !== currentDateKey) return null;
  const challenge = getDailyChallenge(trackIds, requestedDate);
  if (!challenge) return null;
  return challenge.trackId === selection.trackId &&
    challenge.tier === selection.tier &&
    challenge.mode === selection.mode
    ? challenge
    : null;
}

/** Old or forged `daily=1` rows can exist on a device. Only exact challenge
 * clears participate in today's progress and board presentation. */
export function summarizeDailyChallenge(
  challenge: DailyChallenge,
  rows: DailyBoardEntry[],
): DailyChallengeSummary {
  const entries = rows
    .filter((entry) =>
      entry.dateKey === challenge.dateKey &&
      entry.track_id === challenge.trackId &&
      entry.tier === challenge.tier,
    )
    .sort((left, right) =>
      right.score - left.score ||
      right.accuracy - left.accuracy ||
      right.at.localeCompare(left.at),
    );
  return { entries, best: entries[0] ?? null, clears: entries.length };
}

/** Keep Results/mobile-nav retries inside Daily only while that UTC challenge
 * is still current. Yesterday's result safely falls back to a normal replay. */
export function dailyReplayHref(run: DailyReplayRun, currentDateKey = todayKey()): string | null {
  if (
    run.seekedFrom !== undefined ||
    !isDateKey(run.dailyDateKey) ||
    run.dailyDateKey !== currentDateKey ||
    run.tier !== "standard" ||
    run.mode !== "arcade"
  ) return null;
  return dailyPlayHref({
    dateKey: run.dailyDateKey,
    trackId: run.track_id,
    tier: run.tier,
    mode: run.mode,
  });
}
