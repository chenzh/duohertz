import { describe, expect, it } from "vitest";
import { homeEntry } from "./homeEntry";
import { FIRST_SHIFT } from "../data/firstShift";
import { CURATED_NEXT_PICKS } from "../data/curated";
import type { CatalogTrack } from "../types/catalog";
import type { ShiftProgress } from "./firstShift";

function track(id: string, title: string, duration_sec: number): CatalogTrack {
  return { track_id: id, title, duration_sec, artist: "Gridline" } as unknown as CatalogTrack;
}

const tracks = [
  track("bs-s1-05", "Voltage Drop", 60),
  track("bs-s1-06", "Chrome Riff", 75),
  track("bs-s2-02", "Skyline Hook", 90),
  track(CURATED_NEXT_PICKS[0]!.trackId, "Neon Pulse", 75),
];

const done = (n: number): ShiftProgress => ({
  v: 1,
  completed: FIRST_SHIFT.slice(0, n).map((step, i) => ({ id: step.id, runId: `r${i}` })),
});

describe("home entry", () => {
  it("starts a new player on the first track of the shift, not on a story page", () => {
    const entry = homeEntry(tracks, done(0));
    expect(entry.cta).toBe("Play first track");
    expect(entry.href).toContain("/play/bs-s1-05");
    expect(entry.href).toContain("shift=studio");
    expect(entry.sub).toContain("Voltage Drop");
    expect(entry.sub).toContain("First Shift 1/3");
    expect(entry.line.text.length).toBeGreaterThan(0);
  });

  it("continues from the next unfinished connection, with the count on the button", () => {
    const entry = homeEntry(tracks, done(1));
    expect(entry.cta).toBe("Continue First Shift · 2/3");
    expect(entry.href).toContain("/play/bs-s1-06");
    expect(entry.progress).toContain("1/3");
  });

  it("offers a curated pick once the shift is complete, and never repeats the welcome", () => {
    const entry = homeEntry(tracks, done(3));
    expect(entry.cta).toBe("Play Neon Pulse");
    expect(entry.href).toContain(`/play/${CURATED_NEXT_PICKS[0]!.trackId}`);
    expect(entry.inShift).toBe(false);
    expect(entry.sub).toContain("easy");
  });

  it("never names a track that is missing from the catalog", () => {
    const entry = homeEntry([], done(0));
    expect(entry.href).toContain("/play/bs-s1-05");
    expect(entry.cta).toBe("Play first track");
  });
});
