import type { CatalogTrack } from "../types/catalog";

/** Base URL for MusicSaas streaming app, e.g. https://app.example.com */
const STREAM_APP_BASE = (import.meta.env.VITE_STREAM_APP_URL as string | undefined)?.replace(/\/$/, "");

export function resolveStreamAppUrl(track: CatalogTrack): string | null {
  if (track.stream_app_url) return track.stream_app_url;
  if (!STREAM_APP_BASE) return null;
  return `${STREAM_APP_BASE}/track/${track.track_id}`;
}

export function formatStreamDuration(sec: number | undefined): string | null {
  if (!sec || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function hasStreamAsset(track: CatalogTrack): boolean {
  return Boolean(track.stream_audio || track.stream_app_url || STREAM_APP_BASE);
}
