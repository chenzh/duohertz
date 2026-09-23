import { describe, expect, it } from "vitest";
import type { CatalogTrack } from "../types/catalog";
import type { RunRecord } from "./progress";
import { nextTrackForRun } from "./nextTrack";

function track(
  trackId: string,
  bpm: number,
  vibe: CatalogTrack["vibe"],
  charts: CatalogTrack["charts"] = {
    easy: `${trackId}/easy.json`,
    standard: `${trackId}/standard.json`,
    hard: `${trackId}/hard.json`,
  },
): CatalogTrack {
  return {
    track_id: trackId,
    title: trackId.toUpperCase(),
    artist: "NIGHTSHIFT",
    genre: "EDM",
    bpm,
    duration_sec: 75,
    preset_id: "instrumental",
    engine: "test",
    rights: "owned",
    theme: "beatscape",
    tags: [],
    vibe,
    district: "Test District",
    default_mode: "casual",
    default_tier: "easy",
    audio: `${trackId}.m4a`,
    cover: `${trackId}.webp`,
    charts,
  };
}

function run(trackId: string, endedAt: string): RunRecord {
  return {
    track_id: trackId,
    district: "Test District",
    tier: "easy",
    mode: "arcade",
    score: 100,
    accuracy: 90,
    maxCombo: 10,
    fc: false,
    ap: false,
    failed: false,
    durationMs: 75_000,
    endedAt,
    dateKey: endedAt.slice(0, 10),
  };
}

describe("nextTrackForRun", () => {
  const tracks = [
    track("current", 120, "night-drive"),
    track("near-played", 122, "night-drive"),
    track("near-fresh", 126, "night-drive"),
    track("other-vibe", 121, "battle"),
  ];

  it("prefers an unplayed track in the same vibe over the closest BPM", () => {
    expect(nextTrackForRun(
      tracks,
      "current",
      "easy",
      [run("near-played", "2026-09-15T10:00:00.000Z")],
    )?.track_id).toBe("near-fresh");
  });

  it("uses the least-recently played same-vibe track after every option was played", () => {
    expect(nextTrackForRun(
      tracks,
      "current",
      "easy",
      [
        run("near-played", "2026-09-10T10:00:00.000Z"),
        run("near-fresh", "2026-09-14T10:00:00.000Z"),
        run("other-vibe", "2026-09-01T10:00:00.000Z"),
      ],
    )?.track_id).toBe("near-played");
  });

  it("preserves the requested tier and degrades safely for unknown tracks", () => {
    const noHard = track("no-hard", 119, "night-drive", {
      easy: "no-hard/easy.json",
      standard: "no-hard/standard.json",
      hard: "",
    });
    expect(nextTrackForRun([tracks[0]!, noHard, tracks[3]!], "current", "hard")?.track_id)
      .toBe("other-vibe");
    expect(nextTrackForRun(tracks, "missing", "easy")).toBeNull();
  });
});
