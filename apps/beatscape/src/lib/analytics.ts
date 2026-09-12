import { readJSON, writeJSON } from "../storage/safeStorage";

export type AnalyticsEvent =
  | "home_view"
  | "home_play_click"
  | "home_sound_toggle"
  | "home_hero_play_start"
  | "home_hero_play_finish"
  | "daily_challenge_click"
  | "radio_view"
  | "play_start"
  | "play_finish"
  | "duo_start"
  | "duo_finish"
  | "share_copy"
  | "share_poster"
  | "share_poster_copy"
  /** 首页/曲库的人工精选被点开。 */
  | "curated_play"
  /** 结算页"继续下一关"按钮。 */
  | "shift_continue"
  /** 打歌前的声音检查 / 校准入口。 */
  | "sound_check"
  | "calibrate_open";

const BUFFER_KEY = "bs_analytics";

export function trackEvent(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (import.meta.env.DEV) {
    console.debug("[beatscape]", event, props);
  }
  try {
    const plausible = (window as unknown as { plausible?: (e: string, o?: { props?: object }) => void }).plausible;
    plausible?.(event, { props });
  } catch {
    /* optional third-party */
  }
  // 埋点缓冲区写不进去无所谓（本来就没有上报端），但绝不能因为隐私模式抛异常。
  const buf = readJSON<unknown[]>(BUFFER_KEY, [], (v) => (Array.isArray(v) ? v : null));
  buf.push({ event, props, t: Date.now() });
  writeJSON(BUFFER_KEY, buf.slice(-120));
}
