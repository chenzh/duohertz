import { describe, expect, it } from "vitest";
import { CURATED_NEXT_PICKS, CURATED_STARTER_PICKS, curatedPicks, type CuratedPick } from "./curated";

/** 出厂的试听资产是 `public/catalog/<id>/preview_48s.m4a`。 */
const PREVIEW_CLIP_SECONDS = 48;

const groups: Array<[string, readonly CuratedPick[]]> = [
  ["starter", CURATED_STARTER_PICKS],
  ["next", CURATED_NEXT_PICKS],
];

describe("curated picks", () => {
  it("keeps three picks per group, all different tracks", () => {
    for (const [name, picks] of groups) {
      expect(picks, name).toHaveLength(3);
      const ids = picks.map((p) => p.trackId);
      expect(new Set(ids).size, `${name} has a duplicate track`).toBe(ids.length);
    }
  });

  it("auditions a chosen passage, never the top of the song", () => {
    for (const [name, picks] of groups) {
      for (const pick of picks) {
        expect(pick.previewStart, `${name} ${pick.trackId}`).toBeGreaterThan(0);
        expect(pick.previewSeconds, `${name} ${pick.trackId}`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps every audition inside the shipped 48-second clip", () => {
    for (const [name, picks] of groups) {
      for (const pick of picks) {
        expect(
          pick.previewStart + pick.previewSeconds,
          `${name} ${pick.trackId} runs past the preview clip`,
        ).toBeLessThanOrEqual(PREVIEW_CLIP_SECONDS);
      }
    }
  });

  it("always explains why this track, in one written line", () => {
    for (const [name, picks] of groups) {
      for (const pick of picks) {
        expect(pick.why.trim().length, `${name} ${pick.trackId}`).toBeGreaterThan(20);
        expect(pick.line.text.trim().length, `${name} ${pick.trackId}`).toBeGreaterThan(0);
      }
    }
  });

  it("switches group only after the first shift is complete", () => {
    expect(curatedPicks(0).picks).toBe(CURATED_STARTER_PICKS);
    expect(curatedPicks(2).picks).toBe(CURATED_STARTER_PICKS);
    expect(curatedPicks(3).picks).toBe(CURATED_NEXT_PICKS);
  });
});
