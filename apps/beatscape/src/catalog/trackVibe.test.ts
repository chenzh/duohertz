import { describe, expect, it } from "vitest";
import { inferTrackVibe, isBeginnerTrack, resolveTrackVibe, trackHasVocals } from "./trackVibe";
import type { CatalogTrack } from "../types/catalog";

function base(overrides: Partial<CatalogTrack>): CatalogTrack {
  return {
    track_id: "bs-test",
    title: "Test",
    artist: "Test",
    genre: "EDM",
    bpm: 120,
    duration_sec: 75,
    preset_id: "bs-edm-main",
    engine: "stable-audio-3",
    rights: "owned",
    theme: "beatscape",
    tags: [],
    district: "Pulse Core",
    default_mode: "arcade",
    default_tier: "standard",
    audio: "/a.m4a",
    cover: "/c.svg",
    charts: { easy: "/e.json", standard: "/s.json", hard: "/h.json" },
    ...overrides,
  };
}

describe("resolveTrackVibe", () => {
  it("uses catalog vibe when present", () => {
    expect(resolveTrackVibe(base({ vibe: "chill" }))).toBe("chill");
  });

  it("infers night drive from title", () => {
    expect(inferTrackVibe(base({ title: "Night Drive 808", genre: "Hip-hop" }))).toBe("night-drive");
  });
});

describe("trackHasVocals", () => {
  it("detects english vocal preset", () => {
    expect(trackHasVocals(base({ preset_id: "bs-theme-en" }))).toBe(true);
    expect(trackHasVocals(base({ preset_id: "bs-pop-hook" }))).toBe(false);
  });
});

describe("isBeginnerTrack", () => {
  it("flags beginner pick tag", () => {
    expect(isBeginnerTrack(base({ tags: ["Beginner Pick"] }))).toBe(true);
  });
});
