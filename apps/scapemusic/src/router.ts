// Tiny hash router — same "no router dependency" posture as BeatScape.
// Hash routing keeps deep links (/#/track/bs-s1-01) working on any static
// host without SPA-fallback config.

import { useSyncExternalStore } from "react";

export type Route =
  | { name: "feed" }
  | { name: "library" }
  | { name: "playlists" }
  | { name: "playlist"; id: string }
  | { name: "track"; id: string }
  | { name: "favorites" }
  | { name: "notfound" };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#/, "").split("/").filter(Boolean);
  if (parts.length === 0) return { name: "feed" };
  switch (parts[0]) {
    case "library":
      return { name: "library" };
    case "playlists":
      return { name: "playlists" };
    case "playlist":
      return parts[1]
        ? { name: "playlist", id: decodeURIComponent(parts[1]) }
        : { name: "playlists" };
    case "track":
      return parts[1]
        ? { name: "track", id: decodeURIComponent(parts[1]) }
        : { name: "notfound" };
    case "favorites":
      return { name: "favorites" };
    default:
      return { name: "notfound" };
  }
}

export function trackHref(id: string): string {
  return `#/track/${id}`;
}

export function playlistHref(id: string): string {
  return `#/playlist/${id}`;
}

const listeners = new Set<() => void>();

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  window.addEventListener("hashchange", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("hashchange", fn);
  };
}

function getSnapshot(): string {
  return window.location.hash;
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getSnapshot);
  return parseHash(hash);
}

export function navigate(hash: string): void {
  window.location.hash = hash;
}
