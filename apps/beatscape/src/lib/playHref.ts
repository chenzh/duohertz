import type { ChartTier, PlayMode } from "../types/chart";

/** Canonical /play deep link — one place so home, library and story agree. */
export function playHref(trackId: string, tier: ChartTier = "easy", mode: PlayMode = "casual"): string {
  return `/play/${trackId}?tier=${tier}&mode=${mode}`;
}
