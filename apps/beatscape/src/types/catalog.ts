import type { ChartTier, PlayMode } from "./chart";

export type TrackVibe = "night-drive" | "groove" | "battle" | "chill";

export type CatalogTrack = {
  track_id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  duration_sec: number;
  preset_id: string;
  engine: string;
  job_id?: string;
  rights: "owned";
  theme: "beatscape";
  tags: string[];
  /** Player mood filter — night-drive · groove · battle · chill */
  vibe?: TrackVibe;
  district: string;
  default_mode: PlayMode;
  default_tier: ChartTier;
  audio: string;
  /** Game clip length (seconds); charts align to `audio` */
  audio_master?: string;
  preview?: string;
  /** Streaming app full version (PRD §6.0.27) */
  stream_audio?: string;
  stream_duration_sec?: number;
  stream_app_url?: string;
  cover: string;
  /** Open Graph 1200×630 (PRD §6.0.24) */
  og?: string;
  charts: Record<ChartTier, string>;
  seo?: { title: string; description: string };
  artist_bio?: string;
};

export type CatalogJSON = {
  version: number;
  tracks: CatalogTrack[];
};
