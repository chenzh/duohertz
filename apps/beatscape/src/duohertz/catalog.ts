import { parseDuohertzChart, type DuohertzChart, type DuohertzTier } from "./chart";

const TIERS = ["easy", "standard", "hard"] as const;
const GENRES = ["Melodic House", "Synthwave", "Future Bass", "Drum & Bass", "Trance"] as const;
type DuohertzGenre = typeof GENRES[number];

export type DuohertzCatalogTrack = {
  track_id: string;
  title: string;
  artist: string;
  genre: DuohertzGenre;
  bpm: number;
  duration_sec: number;
  stream_duration_sec: number;
  theme: "duohertz";
  chart_format: 2;
  rights: "signed_catalog_candidate";
  audio: string;
  stream_audio: string;
  preview: string;
  cover: string;
  cover_thumb: string;
  cover_thumb_sha256: string;
  og: string;
  charts: Record<DuohertzTier, string>;
  manifest_sha256: string;
};

export type DuohertzCatalog = {
  version: 2;
  brand: "duohertz";
  tracks: DuohertzCatalogTrack[];
  source_observations_sha256: string;
  source_catalog_signoff_sha256: string;
  site_and_deployment_approval: boolean;
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

/** Checks v2 metadata shape; the builder, not this parser, checks evidence and file hashes. */
export function parseDuohertzCatalog(value: unknown): DuohertzCatalog {
  if (!record(value) || value.version !== 2 || value.brand !== "duohertz"
    || !Array.isArray(value.tracks) || value.tracks.length !== 105
    || !sha256(value.source_observations_sha256)
    || !sha256(value.source_catalog_signoff_sha256)
    || typeof value.site_and_deployment_approval !== "boolean") {
    throw new Error("Expected a complete duohertz v2 catalog");
  }

  const seen = new Set<string>();
  const counts = new Map<DuohertzGenre, number>(GENRES.map((genre) => [genre, 0]));
  for (const track of value.tracks) {
    if (!record(track) || typeof track.track_id !== "string"
      || !/^dh-\d{3}-[a-z0-9-]+$/.test(track.track_id) || seen.has(track.track_id)
      || track.theme !== "duohertz" || track.chart_format !== 2
      || track.rights !== "signed_catalog_candidate"
      || !nonempty(track.title) || !nonempty(track.artist)
      || !GENRES.includes(track.genre as DuohertzGenre)
      || !positive(track.bpm) || !positive(track.duration_sec)
      || !positive(track.stream_duration_sec)
      || track.stream_duration_sec < track.duration_sec * 1.8
      || !sha256(track.manifest_sha256) || !record(track.charts)) {
      throw new Error("Invalid duohertz v2 catalog track");
    }
    seen.add(track.track_id);
    const base = `/catalog/${track.track_id}/`;
    const assets = {
      audio: "audio.m4a",
      stream_audio: "stream.m4a",
      preview: "preview_48s.m4a",
      cover: "cover-art.png",
      cover_thumb: "cover-thumb.webp",
      og: "og.png",
    } as const;
    for (const [field, name] of Object.entries(assets)) {
      if (track[field] !== `${base}${name}`) throw new Error(`Invalid duohertz ${field} path: ${track.track_id}`);
    }
    if (!sha256(track.cover_thumb_sha256)) throw new Error(`Invalid duohertz thumbnail hash: ${track.track_id}`);
    for (const tier of TIERS) {
      if (track.charts[tier] !== `${base}${tier}.json`) {
        throw new Error(`Invalid duohertz chart path: ${track.track_id}/${tier}`);
      }
    }
    const genre = track.genre as DuohertzGenre;
    counts.set(genre, counts.get(genre)! + 1);
  }
  if (GENRES.some((genre) => counts.get(genre) !== 21)) {
    throw new Error("duohertz catalog must contain 21 tracks in each electronic genre");
  }
  return value as DuohertzCatalog;
}

/** Deliberately separate from the BeatScape v1 loader and its cache. */
export async function loadDuohertzCatalog(url: string): Promise<DuohertzCatalog> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to load duohertz catalog");
  return parseDuohertzCatalog(await response.json());
}

const approvedCatalogCache = new Map<string, Promise<DuohertzCatalog>>();

/** A manual retry must re-read the catalog; failed or unsigned responses never remain cached. */
export function clearApprovedDuohertzCatalogCache(url?: string): void {
  if (url === undefined) approvedCatalogCache.clear();
  else approvedCatalogCache.delete(url);
}

/** Public player paths must not consume a merely staged v2 catalog. */
export function loadApprovedDuohertzCatalog(url: string): Promise<DuohertzCatalog> {
  const cached = approvedCatalogCache.get(url);
  if (cached) return cached;
  const request = loadDuohertzCatalog(url).then((catalog) => {
    if (!catalog.site_and_deployment_approval) {
      throw new Error("duohertz catalog has not been approved for the website");
    }
    return catalog;
  });
  approvedCatalogCache.set(url, request);
  void request.catch(() => {
    if (approvedCatalogCache.get(url) === request) approvedCatalogCache.delete(url);
  });
  return request;
}

export async function loadDuohertzChart(track: DuohertzCatalogTrack, tier: DuohertzTier,
  base = import.meta.env.BASE_URL): Promise<DuohertzChart> {
  const response = await fetch(`${base}${track.charts[tier].slice(1)}`);
  if (!response.ok) throw new Error(`duohertz chart missing: ${track.track_id}/${tier}`);
  const chart = parseDuohertzChart(await response.json());
  if (chart.track_id !== track.track_id || chart.tier !== tier || chart.bpm !== track.bpm) {
    throw new Error(`duohertz chart identity mismatch: ${track.track_id}/${tier}`);
  }
  if (chart.audio_offset_ms !== 0 || chart.notes.some((note) =>
    (note.type === "hold" ? note.end : note.t) >= track.duration_sec)) {
    throw new Error(`duohertz chart timing exceeds its game audio: ${track.track_id}/${tier}`);
  }
  return chart;
}
