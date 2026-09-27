import { parseDuohertzChart, type DuohertzChart, type DuohertzTier } from "./chart";

type StagedCandidate = {
  title: string;
  artist: string;
  subgenre: string;
  bpm: number;
  audioUrl: string;
  streamUrl: string;
  coverUrl: string;
  thumbnailUrl: string;
  coverAlt: string;
  durationMs: number;
  streamDurationMs: number;
  streamReady: boolean;
  charts: Record<DuohertzTier, DuohertzChart>;
};

// This module is imported only by the DEV-only Lab route. Every staged manifest
// must have its playable assets; a partial candidate fails loudly in development.
const manifests = import.meta.glob("../../candidates/duohertz/dh-*/manifest.json", {
  eager: true, query: "?raw", import: "default",
}) as Record<string, string>;
const charts = import.meta.glob("../../candidates/duohertz/dh-*/{easy,standard,hard}.json", {
  eager: true, query: "?raw", import: "default",
}) as Record<string, string>;
const audioUrls = import.meta.glob("../../candidates/duohertz/dh-*/audio.m4a", {
  eager: true, query: "?url", import: "default",
}) as Record<string, string>;
const streamUrls = import.meta.glob("../../candidates/duohertz/dh-*/stream.m4a", {
  eager: true, query: "?url", import: "default",
}) as Record<string, string>;
const coverUrls = import.meta.glob("../../candidates/duohertz/dh-*/cover-art.png", {
  eager: true, query: "?url", import: "default",
}) as Record<string, string>;
const thumbnailUrls = import.meta.glob("../../candidates/duohertz/thumbnails/dh-*.webp", {
  eager: true, query: "?url", import: "default",
}) as Record<string, string>;

function required(source: Record<string, string>, path: string): string {
  const value = source[path];
  if (!value) throw new Error(`Incomplete duohertz development candidate: ${path}`);
  return value;
}

function loadCandidate(path: string, raw: string): [string, StagedCandidate] {
  const directory = path.slice(0, -"/manifest.json".length);
  const manifest = JSON.parse(raw) as Record<string, unknown>;
  const trackId = manifest.track_id;
  const title = manifest.title;
  const duration = manifest.duration_sec;
  const streamDuration = manifest.stream_duration_sec;
  if (typeof trackId !== "string" || !/^dh-\d{3}-[a-z0-9-]+$/.test(trackId)
      || !directory.endsWith(`/${trackId}`) || manifest.theme !== "duohertz"
      || manifest.rights_status !== "internal_candidate_unreviewed"
      || typeof title !== "string" || !title.trim()
      || typeof manifest.artist !== "string" || !manifest.artist.trim()
      || typeof manifest.subgenre !== "string" || !manifest.subgenre.trim()
      || typeof manifest.bpm !== "number" || !Number.isFinite(manifest.bpm) || manifest.bpm <= 0
      || typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0
      || typeof streamDuration !== "number" || !Number.isFinite(streamDuration) || streamDuration < duration) {
    throw new Error(`Invalid duohertz development manifest: ${path}`);
  }
  const parsedCharts = Object.fromEntries((["easy", "standard", "hard"] as const).map((tier) => {
    const chart = parseDuohertzChart(JSON.parse(required(charts, `${directory}/${tier}.json`)));
    if (chart.track_id !== trackId || chart.tier !== tier) {
      throw new Error(`Wrong duohertz chart identity: ${trackId}/${tier}`);
    }
    return [tier, chart];
  })) as Record<DuohertzTier, DuohertzChart>;
  const hashes = manifest.files_sha256 as Record<string, unknown> | undefined;
  return [trackId, {
    title,
    artist: manifest.artist,
    subgenre: manifest.subgenre,
    bpm: manifest.bpm,
    durationMs: Math.round(duration * 1000),
    streamDurationMs: Math.round(streamDuration * 1000),
    streamReady: streamDuration >= duration * 1.8 && typeof hashes?.["audio.m4a"] === "string"
      && typeof hashes?.["stream.m4a"] === "string" && hashes?.["audio.m4a"] !== hashes?.["stream.m4a"],
    audioUrl: required(audioUrls, `${directory}/audio.m4a`),
    streamUrl: required(streamUrls, `${directory}/stream.m4a`),
    coverUrl: required(coverUrls, `${directory}/cover-art.png`),
    thumbnailUrl: required(thumbnailUrls, `../../candidates/duohertz/thumbnails/${trackId}.webp`),
    coverAlt: `${title} unreviewed candidate cover art`,
    charts: parsedCharts,
  }];
}

export const DUOHERTZ_CANDIDATE_ENTRIES = Object.entries(manifests).sort(([a], [b]) => a.localeCompare(b))
  .map(([path, raw]) => loadCandidate(path, raw));
export const DUOHERTZ_CANDIDATES = Object.fromEntries(DUOHERTZ_CANDIDATE_ENTRIES) as Record<string, StagedCandidate>;
export const DUOHERTZ_STREAM_CANDIDATE_ENTRIES = DUOHERTZ_CANDIDATE_ENTRIES.filter(([, candidate]) => candidate.streamReady);
export type DuohertzCandidateKey = string;
