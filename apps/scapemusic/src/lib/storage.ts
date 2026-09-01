// Local persistence — `sm_*` keys (BeatScape uses `bs_*`; the streaming app
// keeps its own namespace). Zero accounts, zero collection — same privacy
// posture as the game.

import { useSyncExternalStore } from "react";

const KEYS = {
  favorites: "sm_favorites",
  recent: "sm_recent",
  player: "sm_player",
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / storage full — degrade to memory-only */
  }
}

// --- favorites (pub/sub so every heart on screen stays in sync) ---

let favorites: string[] = readJson<string[]>(KEYS.favorites, []);
const favSubs = new Set<() => void>();

function emitFavorites(): void {
  for (const fn of favSubs) fn();
}

export function subscribeFavorites(fn: () => void): () => void {
  favSubs.add(fn);
  return () => favSubs.delete(fn);
}

export function getFavorites(): string[] {
  return favorites;
}

export function toggleFavorite(id: string): void {
  favorites = favorites.includes(id)
    ? favorites.filter((x) => x !== id)
    : [id, ...favorites];
  writeJson(KEYS.favorites, favorites);
  emitFavorites();
}

export function useFavorites(): {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
} {
  const list = useSyncExternalStore(subscribeFavorites, getFavorites);
  return {
    favorites: list,
    isFavorite: (id: string) => list.includes(id),
    toggleFavorite,
  };
}

// --- recently played ---

const RECENT_CAP = 60;

let recent: string[] = readJson<string[]>(KEYS.recent, []);
const recentSubs = new Set<() => void>();

function emitRecent(): void {
  for (const fn of recentSubs) fn();
}

export function subscribeRecent(fn: () => void): () => void {
  recentSubs.add(fn);
  return () => recentSubs.delete(fn);
}

export function getRecent(): string[] {
  return recent;
}

export function pushRecent(id: string): void {
  recent = [id, ...recent.filter((x) => x !== id)].slice(0, RECENT_CAP);
  writeJson(KEYS.recent, recent);
  emitRecent();
}

export function useRecent(): string[] {
  return useSyncExternalStore(subscribeRecent, getRecent);
}

// --- player resume ---

export interface SavedPlayer {
  trackId: string;
  posSec: number;
}

export function readSavedPlayer(): SavedPlayer | null {
  const saved = readJson<SavedPlayer | null>(KEYS.player, null);
  return saved && typeof saved.trackId === "string" ? saved : null;
}

export function writeSavedPlayer(saved: SavedPlayer): void {
  writeJson(KEYS.player, saved);
}
