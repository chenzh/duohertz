import { describe, expect, it } from "vitest";
import { BLOCKED_WORDS, hasProfanity, normalizeName } from "./profanity";

describe("normalizeName", () => {
  it("folds case, separators and diacritics", () => {
    expect(normalizeName("Néo  Grid")).toEqual(["neo", "grid"]);
    expect(normalizeName("P.U.L.S.E")).toEqual(["p", "u", "l", "s", "e"]);
  });
});

describe("hasProfanity", () => {
  it("flags blocked words case-insensitively", () => {
    expect(hasProfanity("ASS")).toBe(true);
    expect(hasProfanity("Sh1t Runner")).toBe(true);
  });

  it("flags blocked words with separator noise", () => {
    expect(hasProfanity("b!tch")).toBe(true); // listed variant
    expect(hasProfanity("a s s")).toBe(false); // token match only — accepted gap
  });

  it("never flags innocent words containing blocked substrings", () => {
    expect(hasProfanity("BassLine")).toBe(false);
    expect(hasProfanity("Classic Neon")).toBe(false);
    expect(hasProfanity("Scunthorpe")).toBe(false);
    expect(hasProfanity("Night Grid")).toBe(false);
  });

  it("handles empty input and has a non-trivial list", () => {
    expect(hasProfanity("")).toBe(false);
    expect(hasProfanity("   ")).toBe(false);
    expect(BLOCKED_WORDS.length).toBeGreaterThan(30);
  });
});
