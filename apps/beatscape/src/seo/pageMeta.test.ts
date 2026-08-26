import { describe, expect, it } from "vitest";
import type { CatalogTrack } from "../types/catalog";
import { buildPlayPageMeta, DEFAULT_PAGE_META } from "./pageMeta";

const baseTrack: CatalogTrack = {
  track_id: "bs-s1-01",
  title: "Neon Pulse",
  artist: "Lumen Grid",
  genre: "EDM",
  bpm: 160,
  duration_sec: 180,
  preset_id: "edm",
  engine: "beatscape",
  rights: "owned",
  theme: "beatscape",
  tags: ["edm"],
  district: "neon-district",
  default_mode: "arcade",
  default_tier: "standard",
  audio: "catalog/bs-s1-01/audio.m4a",
  cover: "catalog/bs-s1-01/cover.webp",
  charts: {
    easy: "catalog/bs-s1-01/easy.json",
    standard: "catalog/bs-s1-01/standard.json",
    hard: "catalog/bs-s1-01/hard.json",
  },
  seo: {
    title: "Neon Pulse — BeatScape AI Original",
    description: "Own the Scape. 160 BPM EDM chart.",
  },
};

describe("buildPlayPageMeta", () => {
  it("builds play title from track name", () => {
    const meta = buildPlayPageMeta(baseTrack, "standard", "arcade");
    expect(meta.title).toBe("Play Neon Pulse — BeatScape");
  });

  it("includes tier, mode, and catalog seo description", () => {
    const meta = buildPlayPageMeta(baseTrack, "hard", "casual");
    expect(meta.description).toContain("Neon Pulse · hard · casual.");
    expect(meta.description).toContain("Own the Scape. 160 BPM EDM chart.");
    expect(meta.description).toContain("Feel the Beat, Own the Scape.");
  });

  it("falls back when track has no seo block", () => {
    const { seo: _, ...noSeo } = baseTrack;
    const meta = buildPlayPageMeta(noSeo, "easy", "practice");
    expect(meta.description).toContain("Own the Scape. 160 BPM EDM chart.");
  });

  it("default site meta matches index.html title", () => {
    expect(DEFAULT_PAGE_META.title).toBe("BeatScape — Feel the Beat, Own the Scape");
  });
});
