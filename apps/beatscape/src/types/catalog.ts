import type { ChartTier, PlayMode } from "./chart";

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
  district: string;
  default_mode: PlayMode;
  default_tier: ChartTier;
  audio: string;
  audio_master?: string;
  preview?: string;
  cover: string;
  charts: Record<ChartTier, string>;
  seo?: { title: string; description: string };
  artist_bio?: string;
};

export type CatalogJSON = {
  version: number;
  tracks: CatalogTrack[];
};
