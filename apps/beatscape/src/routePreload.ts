import type { ComponentType } from "react";

// Route components carry different props (LegalPage receives `kind`), so the
// registry constraint is intentionally broad while each loader keeps its own
// inferred component type for React.lazy.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyPageModule = { default: ComponentType<any> };
type LazyRouteLoader = () => Promise<LazyPageModule>;

/**
 * Keep one in-flight/successful module request per route, but allow a later
 * navigation to retry after a transient prefetch failure.
 */
function retryable<T extends LazyPageModule>(loader: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    pending ??= loader().catch((error) => {
      pending = null;
      throw error;
    });
    return pending;
  };
}

export const lazyRouteLoaders = {
  duo: retryable(() => import("./pages/Duo").then(({ DuoPage }) => ({ default: DuoPage }))),
  characters: retryable(() => import("./pages/Characters").then(({ CharactersPage }) => ({ default: CharactersPage }))),
  radio: retryable(() => import("./pages/Radio").then(({ RadioPage }) => ({ default: RadioPage }))),
  shift: retryable(() => import("./pages/FirstShift").then(({ FirstShiftPage }) => ({ default: FirstShiftPage }))),
  track: retryable(() => import("./pages/Track").then(({ TrackPage }) => ({ default: TrackPage }))),
  calibrate: retryable(() => import("./pages/Calibration").then(({ CalibrationPage }) => ({ default: CalibrationPage }))),
  settings: retryable(() => import("./pages/Settings").then(({ SettingsPage }) => ({ default: SettingsPage }))),
  leaderboard: retryable(() => import("./pages/Leaderboard").then(({ LeaderboardPage }) => ({ default: LeaderboardPage }))),
  profile: retryable(() => import("./pages/Profile").then(({ ProfilePage }) => ({ default: ProfilePage }))),
  legal: retryable(() => import("./pages/Legal").then(({ LegalPage }) => ({ default: LegalPage }))),
  notFound: retryable(() => import("./pages/NotFound").then(({ NotFoundPage }) => ({ default: NotFoundPage }))),
} satisfies Record<string, LazyRouteLoader>;

export type LazyRouteKey = keyof typeof lazyRouteLoaders;

/** Route key for an internal destination; eager routes intentionally return null. */
export function lazyRouteKey(to: string): LazyRouteKey | null {
  const path = to.split(/[?#]/, 1)[0] || "/";
  if (path === "/duo" || path.startsWith("/duo/")) return "duo";
  if (path === "/characters") return "characters";
  if (path === "/radio") return "radio";
  if (path === "/shift") return "shift";
  if (path === "/track" || path.startsWith("/track/")) return "track";
  if (path === "/calibrate") return "calibrate";
  if (path === "/settings") return "settings";
  if (path === "/leaderboard") return "leaderboard";
  if (path === "/profile") return "profile";
  if (path === "/privacy" || path === "/terms") return "legal";
  return null;
}

/**
 * Warm a lazy route on real navigation intent. Failures stay silent here; the
 * actual route keeps the existing loading/error UI and gets a fresh retry.
 */
export function preloadRoute(to: string): void {
  // The isolated duohertz artifact has no BeatScape routes. This compile-time
  // branch also keeps their lazy chunks out of that build entirely.
  if (import.meta.env.VITE_DUOHERTZ_PREVIEW === "1"
      || import.meta.env.VITE_DUOHERTZ_RELEASE_SOURCE === "1") return;
  const key = lazyRouteKey(to);
  if (!key) return;
  void lazyRouteLoaders[key]().catch(() => undefined);
}
