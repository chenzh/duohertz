import type { ChartTier, PlayMode } from "../types/chart";

/** PRD first-run path — Neon Pulse Casual Easy (no calibration gate). */
export const FIRST_PLAY_TRACK_ID = "bs-s1-01";
export const FIRST_PLAY_TIER: ChartTier = "easy";
export const FIRST_PLAY_MODE: PlayMode = "casual";

export function firstPlayHref(trackId = FIRST_PLAY_TRACK_ID): string {
  return `/play/${trackId}?tier=${FIRST_PLAY_TIER}&mode=${FIRST_PLAY_MODE}`;
}
