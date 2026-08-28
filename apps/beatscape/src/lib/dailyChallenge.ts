import type { ChartTier, PlayMode } from "../types/chart";

export type DailyChallenge = {
  dateKey: string;
  trackId: string;
  tier: ChartTier;
  mode: PlayMode;
};

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
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
  return `/play/${challenge.trackId}?tier=${challenge.tier}&mode=${challenge.mode}&daily=1`;
}
