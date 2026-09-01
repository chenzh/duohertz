import { describe, expect, it } from "vitest";
import { TRACKS, trackById, vibeMeta } from "./catalog";
import { allPlaylists, buildDailyStream, buildPlaylists, playlistById } from "./playlists";

function trackIdsOf(list: string[]): string[] {
  return list.map((id) => trackById(id)?.track_id).filter((x): x is string => Boolean(x));
}

describe("buildPlaylists", () => {
  it("produces non-empty playlists with valid, deduped ids", () => {
    const lists = buildPlaylists();
    expect(lists.length).toBeGreaterThan(10);
    const names = new Set<string>();
    for (const p of lists) {
      expect(p.trackIds.length).toBeGreaterThan(0);
      expect(names.has(p.name)).toBe(false);
      names.add(p.name);
      expect(new Set(p.trackIds).size).toBe(p.trackIds.length);
      for (const id of p.trackIds) expect(trackById(id)).toBeDefined();
    }
  });

  it("covers every track exactly once across the four vibe columns", () => {
    const vibeLists = buildPlaylists().filter((p) => p.kind === "vibe");
    expect(vibeLists).toHaveLength(4);
    const merged = vibeLists.flatMap((p) => p.trackIds).sort();
    expect(merged).toEqual(TRACKS.map((t) => t.track_id).sort());
  });

  it("names vibe columns after The Late Static programming", () => {
    const names = buildPlaylists()
      .filter((p) => p.kind === "vibe")
      .map((p) => p.name);
    expect(names).toEqual(
      expect.arrayContaining(["Overnight Drive", "Groove Hour", "Battle Call", "Last Call"]),
    );
  });

  it("has a district playlist for every district in the catalog", () => {
    const districtLists = buildPlaylists().filter((p) => p.kind === "district");
    const expected = new Set(TRACKS.map((t) => t.district));
    expect(new Set(districtLists.map((p) => p.name))).toEqual(expected);
  });

  it("round-trips through playlistById", () => {
    const first = allPlaylists()[0];
    expect(playlistById(first.id)?.name).toBe(first.name);
    expect(playlistById("does-not-exist")).toBeUndefined();
  });
});

describe("buildDailyStream", () => {
  it("is deterministic per seed", () => {
    expect(buildDailyStream(TRACKS, "2026-08-30")).toEqual(
      buildDailyStream(TRACKS, "2026-08-30"),
    );
  });

  it("contains every track exactly once", () => {
    const stream = buildDailyStream(TRACKS, "2026-08-30");
    expect(new Set(stream).size).toBe(TRACKS.length);
    expect(trackIdsOf(stream).length).toBe(TRACKS.length);
  });

  it("rotates vibes so consecutive tracks rarely share a vibe", () => {
    const stream = buildDailyStream(TRACKS, "2026-08-30");
    const vibes = stream.slice(0, 8).map((id) => trackById(id)!.vibe);
    expect(new Set(vibes).size).toBeGreaterThanOrEqual(3);
  });

  it("differs across days", () => {
    expect(buildDailyStream(TRACKS, "2026-08-30")).not.toEqual(
      buildDailyStream(TRACKS, "2026-08-31"),
    );
  });

  it("keeps vibe column metadata consistent with the catalog", () => {
    for (const t of TRACKS) {
      expect(vibeMeta(t.vibe).column.length).toBeGreaterThan(0);
    }
  });
});
