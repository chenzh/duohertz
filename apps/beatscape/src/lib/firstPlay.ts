import type { ChartTier, PlayMode } from "../types/chart";

/**
 * 首页与"Play"入口的默认曲目 = First Shift 第一首（Voltage Drop · easy · casual）。
 *
 * 以前是 Strike Vector（hard/arcade，两分钟）—— 一个从没玩过的人点"Play"就
 * 被丢进最难的那张谱。入口应该对应一首确定的、能打完的歌。
 */
export const HOME_HERO_TRACK_ID = "bs-s1-05";
export const FIRST_PLAY_TRACK_ID = HOME_HERO_TRACK_ID;
export const FIRST_PLAY_TIER: ChartTier = "easy";
export const FIRST_PLAY_MODE: PlayMode = "casual";

export function firstPlayHref(trackId = FIRST_PLAY_TRACK_ID): string {
  return `/play/${trackId}?tier=${FIRST_PLAY_TIER}&mode=${FIRST_PLAY_MODE}`;
}

/** Duo CTA — same hero track, split-screen versus. */
export function duoHref(trackId = FIRST_PLAY_TRACK_ID): string {
  return `/duo/${trackId}?tier=${FIRST_PLAY_TIER}&mode=${FIRST_PLAY_MODE}`;
}
