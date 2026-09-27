import { appHref, normalizeAppBase } from "../lib/appBase";
import { parseDuohertzCatalog } from "./catalog";

export const DUOHERTZ_GENRES = ["Melodic House", "Synthwave", "Future Bass", "Drum & Bass", "Trance"] as const;
export type DuohertzGenre = typeof DUOHERTZ_GENRES[number];

export type DuohertzTrackCard = {
  id: string;
  title: string;
  genre: DuohertzGenre;
  bpm: number;
  durationMs: number;
  coverUrl: string;
  coverAlt: string;
  href: string;
  actionLabel: string;
  radioHref?: string;
  /** Difficulty badge label matching the approved home mockup (derived from BPM). */
  difficulty: string;
};

/** Deterministic difficulty label so the home grid shows varied badges like the mockup. */
export function difficultyFromBpm(bpm: number): string {
  if (bpm >= 172) return "EXTREME";
  if (bpm >= 158) return "HARD";
  if (bpm >= 140) return "STANDARD";
  return "EASY";
}

type CandidateCardSource = {
  title: string;
  subgenre: string;
  bpm: number;
  durationMs: number;
  coverUrl: string;
  thumbnailUrl: string;
  coverAlt: string;
};

function genre(value: string): DuohertzGenre {
  const match = DUOHERTZ_GENRES.find((item) => item === value);
  if (!match) throw new Error(`Unknown duohertz music style: ${value}`);
  return match;
}

/** Internal previews stay explicitly labeled as candidates. */
export function candidateTrackCards(entries: ReadonlyArray<readonly [string, CandidateCardSource]>): DuohertzTrackCard[] {
  return entries.map(([id, candidate]) => ({
    id,
    title: candidate.title,
    genre: genre(candidate.subgenre),
    bpm: candidate.bpm,
    durationMs: candidate.durationMs,
    coverUrl: candidate.thumbnailUrl,
    coverAlt: candidate.coverAlt,
    href: `/lab/duohertz?track=${encodeURIComponent(id)}`,
    actionLabel: "Play candidate",
    difficulty: difficultyFromBpm(candidate.bpm),
  }));
}

/**
 * Runtime guard for future public pages. A true catalog flag is necessary, but
 * release tooling must still independently verify signed evidence and assets.
 */
export function publicCatalogTrackCards(value: unknown, trackHref: (id: string) => string,
  base = import.meta.env.BASE_URL, radioHref?: (id: string) => string): DuohertzTrackCard[] {
  const catalog = parseDuohertzCatalog(value);
  if (!catalog.site_and_deployment_approval) {
    throw new Error("duohertz catalog is staged and cannot be shown as a public library");
  }
  const appBase = normalizeAppBase(base);
  return catalog.tracks.map((track) => ({
    id: track.track_id,
    title: track.title,
    genre: track.genre,
    bpm: track.bpm,
    durationMs: Math.round(track.duration_sec * 1000),
    coverUrl: appHref(track.cover_thumb, appBase),
    coverAlt: `${track.title} cover art`,
    href: trackHref(track.track_id),
    actionLabel: "Play track",
    radioHref: radioHref?.(track.track_id),
    difficulty: difficultyFromBpm(track.bpm),
  }));
}
