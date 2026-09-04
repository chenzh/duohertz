import { describe, expect, it } from "vitest";
import { filterTracks, GENRES, TRACKS, trackById, VIBES, type Vibe } from "./catalog";

const VIBE_IDS = VIBES.map((v) => v.id);

describe("catalog integrity (synced from apps/beatscape/public/catalog.json)", () => {
  it("has the full 105-track library", () => {
    expect(TRACKS).toHaveLength(105);
  });

  it("has unique track ids", () => {
    expect(new Set(TRACKS.map((t) => t.track_id)).size).toBe(TRACKS.length);
  });

  it("carries streamable full-length assets for every track", () => {
    for (const t of TRACKS) {
      expect(t.stream_audio).toMatch(/^\/catalog\/[\w-]+\/stream\.m4a$/);
      expect(t.cover).toMatch(/^\/catalog\/[\w-]+\/cover\.svg$/);
      expect(t.og).toMatch(/^\/catalog\/[\w-]+\/og\.png$/);
      expect(t.stream_duration_sec).toBeGreaterThanOrEqual(150);
      expect(t.stream_duration_sec).toBeLessThanOrEqual(240);
      expect(t.bpm).toBeGreaterThan(0);
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.artist.length).toBeGreaterThan(0);
    }
  });

  it("only uses known vibes and genres", () => {
    for (const t of TRACKS) {
      expect(VIBE_IDS).toContain(t.vibe as Vibe);
      expect(GENRES).toContain(t.genre);
      expect(t.district.length).toBeGreaterThan(0);
    }
  });

  it("ships The Late Static call-in quotes for (nearly) all tracks", () => {
    const withQuotes = TRACKS.filter((t) => t.quote && t.quote.length > 0);
    expect(withQuotes.length).toBeGreaterThanOrEqual(80);
  });

  it("round-trips trackById", () => {
    expect(trackById(TRACKS[0].track_id)?.title).toBe(TRACKS[0].title);
    expect(trackById("no-such-id")).toBeUndefined();
  });
});

describe("filterTracks", () => {
  it("finds tracks by title query", () => {
    const hits = filterTracks({ query: "neon pulse" });
    expect(hits[0]?.track_id).toBe("bs-s1-01");
  });

  it("matches artist and district too", () => {
    expect(filterTracks({ query: TRACKS[0].artist }).length).toBeGreaterThan(0);
    expect(filterTracks({ query: "Pulse Core" }).every((t) => t.district === "Pulse Core")).toBe(
      true,
    );
  });

  it("filters by vibe", () => {
    for (const vibe of VIBE_IDS) {
      const hits = filterTracks({ vibe });
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.every((t) => t.vibe === vibe)).toBe(true);
    }
  });

  it("filters by genre", () => {
    const hits = filterTracks({ genre: "EDM" });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((t) => t.genre === "EDM")).toBe(true);
  });

  it("sorts by title / artist / bpm / duration", () => {
    const byTitle = filterTracks({ sort: "title" });
    for (let i = 1; i < byTitle.length; i++) {
      expect(byTitle[i - 1].title.localeCompare(byTitle[i].title)).toBeLessThanOrEqual(0);
    }
    const byBpm = filterTracks({ sort: "bpm" });
    for (let i = 1; i < byBpm.length; i++) {
      expect(byBpm[i - 1].bpm).toBeLessThanOrEqual(byBpm[i].bpm);
    }
    const byDuration = filterTracks({ sort: "duration" });
    for (let i = 1; i < byDuration.length; i++) {
      expect(byDuration[i - 1].stream_duration_sec).toBeGreaterThanOrEqual(
        byDuration[i].stream_duration_sec,
      );
    }
    const byArtist = filterTracks({ sort: "artist" });
    for (let i = 1; i < byArtist.length; i++) {
      expect(byArtist[i - 1].artist.localeCompare(byArtist[i].artist)).toBeLessThanOrEqual(0);
    }
  });

  it("never mutates the shared TRACKS order", () => {
    const before = TRACKS.map((t) => t.track_id);
    filterTracks({ sort: "bpm" });
    expect(TRACKS.map((t) => t.track_id)).toEqual(before);
  });
});
