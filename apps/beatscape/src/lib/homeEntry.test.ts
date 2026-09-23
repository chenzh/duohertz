import { describe, expect, it } from "vitest";
import { homeEntry, homeMobileAction, nextHomePlayHref } from "./homeEntry";
import { FIRST_SHIFT } from "../data/firstShift";
import { CURATED_NEXT_PICKS } from "../data/curated";
import type { CatalogTrack } from "../types/catalog";
import type { ShiftProgress } from "./firstShift";
import type { RunRecord } from "./progress";

function track(
  id: string,
  title: string,
  duration_sec: number,
  bpm: number,
  vibe: CatalogTrack["vibe"],
): CatalogTrack {
  return {
    track_id: id,
    title,
    duration_sec,
    bpm,
    vibe,
    artist: "Gridline",
    charts: {
      easy: `/catalog/${id}/easy.json`,
      standard: `/catalog/${id}/standard.json`,
      hard: `/catalog/${id}/hard.json`,
    },
  } as CatalogTrack;
}

const tracks = [
  track("bs-s1-05", "Voltage Drop", 60, 130, "groove"),
  track("bs-s1-06", "Chrome Riff", 75, 150, "battle"),
  track("bs-s2-02", "Skyline Hook", 90, 145, "battle"),
  track(CURATED_NEXT_PICKS[0]!.trackId, "Neon Pulse", 75, 162, "battle"),
];

const done = (n: number): ShiftProgress => ({
  v: 1,
  completed: FIRST_SHIFT.slice(0, n).map((step, i) => ({ id: step.id, runId: `r${i}` })),
});

const run = (over: Partial<RunRecord> = {}): RunRecord => ({
  track_id: "bs-s1-06",
  district: "Chrome Yard",
  tier: "hard",
  mode: "arcade",
  score: 924000,
  accuracy: 92.4,
  maxCombo: 184,
  fc: false,
  ap: false,
  failed: false,
  durationMs: 75000,
  endedAt: "2026-09-13T12:30:00.000Z",
  dateKey: "2026-09-13",
  ...over,
});

describe("home entry", () => {
  it("starts a new player on the first track of the shift, not on a story page", () => {
    const entry = homeEntry(tracks, done(0), []);
    expect(entry.cta).toBe("Start first run");
    expect(entry.href).toContain("/play/bs-s1-05");
    expect(entry.href).toContain("shift=studio");
    expect(entry.sub).toContain("Voltage Drop");
    expect(entry.sub).toContain("First Shift 1/3");
    expect(entry.line.text.length).toBeGreaterThan(0);
  });

  it("names First Shift instead of claiming a returning player has never played", () => {
    const entry = homeEntry(tracks, done(0), [run()]);
    expect(entry.cta).toBe("Start First Shift");
    expect(entry.href).toContain("shift=studio");
    expect(homeMobileAction(entry)).toEqual({
      label: "Start",
      ariaLabel: "Start First Shift · Voltage Drop · Easy Casual",
      replayIcon: false,
    });
  });

  it("continues from the next unfinished connection, with the count on the button", () => {
    const entry = homeEntry(tracks, done(1), [run()]);
    expect(entry.cta).toBe("Continue First Shift · 2/3");
    expect(entry.href).toContain("/play/bs-s1-06");
    expect(entry.progress).toContain("1/3");
  });

  it("offers a curated pick once the shift is complete and no playable history exists", () => {
    const entry = homeEntry(tracks, done(3), [run({ track_id: "retired-track" })]);
    expect(entry.cta).toBe("Play Neon Pulse");
    expect(entry.href).toContain(`/play/${CURATED_NEXT_PICKS[0]!.trackId}`);
    expect(entry.inShift).toBe(false);
    expect(entry.sub).toContain("easy");
  });

  it("never names a track that is missing from the catalog", () => {
    const entry = homeEntry([], done(0), []);
    expect(entry.href).toContain("/play/bs-s1-05");
    expect(entry.cta).toBe("Start first run");
  });

  it("keeps the loading fallback neutral after the First Shift is complete", () => {
    const entry = homeEntry([], done(3), []);
    expect(entry.href).toContain(`/play/${CURATED_NEXT_PICKS[0]!.trackId}`);
    expect(entry.cta).toBe("Start a run");
    expect(entry.inShift).toBe(false);
  });

  it("moves a successful returning player to a fresh same-vibe track with the same setup", () => {
    const entry = homeEntry(tracks, done(3), [
      run({
        track_id: "bs-s1-01",
        tier: "easy",
        mode: "casual",
        accuracy: 86.5,
        endedAt: "2026-09-12T20:00:00.000Z",
        dateKey: "2026-09-12",
      }),
      run(),
    ]);

    expect(entry.cta).toBe("Continue the set");
    expect(entry.sub).toBe("Skyline Hook · Gridline · Hard Arcade · 145 BPM");
    expect(entry.progress).toBe("Last run 92.4% ACC");
    expect(entry.href).toBe("/play/bs-s2-02?tier=hard&mode=arcade");
    expect(entry.track?.title).toBe("Skyline Hook");
    expect(entry.inShift).toBe(false);
  });

  it("keeps a full-track Practice run on the exact track instead of inventing a set", () => {
    const entry = homeEntry(tracks, done(3), [run({ mode: "practice" })]);
    expect(entry.cta).toBe("Play again");
    expect(entry.href).toBe("/play/bs-s1-06?tier=hard&mode=practice");
    expect(entry.track?.title).toBe("Chrome Riff");
  });

  it("labels a failed returning run as a retry", () => {
    const entry = homeEntry(tracks, done(3), [run({ failed: true, accuracy: 41.8 })]);
    expect(entry.cta).toBe("Retry last run");
    expect(entry.progress).toBe("Last run dropped");
    expect(entry.sub).toContain("41.8% ACC");
  });

  it("labels a completed zero-hit returning run as a retry", () => {
    const entry = homeEntry(tracks, done(3), [run({ accuracy: 0, score: 0, maxCombo: 0 })]);
    expect(entry.cta).toBe("Retry last run");
    expect(entry.progress).toBe("No notes hit");
    expect(entry.intent).toBe("retry");
    expect(entry.line.text).toContain("meet the notes on the line");
  });

  it("keeps the fixed Play navigation aligned with the current Home entry", () => {
    for (const progress of [done(0), done(1), done(2), done(3)]) {
      const runs = [run()];
      expect(nextHomePlayHref(tracks, progress, runs)).toBe(homeEntry(tracks, progress, runs).href);
    }
  });

  it("gives the fixed mobile action exact semantics for every Home state", () => {
    expect(homeMobileAction(homeEntry(tracks, done(0), []))).toEqual({
      label: "Start",
      ariaLabel: "Start first run · Voltage Drop · Easy Casual",
      replayIcon: false,
    });
    expect(homeMobileAction(homeEntry(tracks, done(1), []))).toEqual({
      label: "Continue",
      ariaLabel: "Continue First Shift · 2/3 · Chrome Riff · Easy Casual",
      replayIcon: false,
    });
    expect(homeMobileAction(homeEntry(tracks, done(3), [run()]))).toEqual({
      label: "Play",
      ariaLabel: "Play Skyline Hook · Hard Arcade",
      replayIcon: false,
    });
    expect(homeMobileAction(homeEntry(tracks, done(3), [run({ failed: true })]))).toEqual({
      label: "Retry",
      ariaLabel: "Retry Chrome Riff · Hard Arcade",
      replayIcon: true,
    });
  });
});
