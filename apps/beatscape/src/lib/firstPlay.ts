import type { ChartTier, PlayMode } from "../types/chart";

/** Home hero + first-run CTA — Strike Vector Casual Easy. */
export const HOME_HERO_TRACK_ID = "bs-s4-10";
export const FIRST_PLAY_TRACK_ID = HOME_HERO_TRACK_ID;
export const FIRST_PLAY_TIER: ChartTier = "easy";
export const FIRST_PLAY_MODE: PlayMode = "casual";

export function firstPlayHref(trackId = FIRST_PLAY_TRACK_ID): string {
  return `/play/${trackId}?tier=${FIRST_PLAY_TIER}&mode=${FIRST_PLAY_MODE}`;
}
