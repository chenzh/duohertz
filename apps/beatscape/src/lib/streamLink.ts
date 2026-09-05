import type { CatalogTrack } from "../types/catalog";

/** Base URL for MusicSaas streaming app, e.g. https://app.example.com */
const STREAM_APP_BASE = (import.meta.env.VITE_STREAM_APP_URL as string | undefined)?.replace(/\/$/, "");

export function resolveStreamAppUrl(track: CatalogTrack): string | null {
  if (track.stream_app_url) return track.stream_app_url;
  if (!STREAM_APP_BASE) return null;
  // Scape Music uses a hash router; a pathname deep link silently opens Discover.
  const base = STREAM_APP_BASE === "https://scapemusic.pages.dev"
    ? `${STREAM_APP_BASE}/#`
    : STREAM_APP_BASE;
  return `${base}/track/${encodeURIComponent(track.track_id)}`;
}

export function formatStreamDuration(sec: number | undefined): string | null {
  if (!sec || sec <= 0) return null;
  const seconds = Math.round(sec);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function hasStreamAsset(track: CatalogTrack): boolean {
  return Boolean(track.stream_audio || track.stream_app_url || STREAM_APP_BASE);
}
