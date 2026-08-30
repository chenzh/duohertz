export type AnalyticsEvent =
  | "home_view"
  | "home_play_click"
  | "home_sound_toggle"
  | "home_hero_play_start"
  | "home_hero_play_finish"
  | "daily_challenge_click"
  | "intro_start"
  | "intro_dismiss"
  | "play_start"
  | "play_finish"
  | "share_copy"
  | "share_poster";

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
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    const buf: unknown[] = raw ? JSON.parse(raw) : [];
    buf.push({ event, props, t: Date.now() });
    localStorage.setItem(BUFFER_KEY, JSON.stringify(buf.slice(-120)));
  } catch {
    /* private mode */
  }
}
