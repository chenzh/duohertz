import { describe, expect, it } from "vitest";
import {
  libraryHrefForSearch,
  safeLibraryReturn,
  withLibraryReturn,
} from "./libraryReturn";

describe("Library return context", () => {
  it("normalizes a Library query and keeps the default route clean", () => {
    expect(libraryHrefForSearch("")).toBe("/library");
    expect(libraryHrefForSearch("q=chrome%20riff&genre=Rock"))
      .toBe("/library?q=chrome+riff&genre=Rock");
  });

  it("accepts only the exact local Library route", () => {
    expect(safeLibraryReturn("/library?q=chrome+riff&genre=Rock"))
      .toBe("/library?q=chrome+riff&genre=Rock");
    expect(safeLibraryReturn("/library#matches")).toBe("/library");
    expect(safeLibraryReturn(null)).toBe("/library");
    expect(safeLibraryReturn("//evil.example/library")).toBe("/library");
    expect(safeLibraryReturn("https://evil.example/library")).toBe("/library");
    expect(safeLibraryReturn("/library/../settings")).toBe("/library");
    expect(safeLibraryReturn("/library-old?q=chrome")).toBe("/library");
  });

  it("threads a non-default return through existing route parameters", () => {
    const returnTo = "/library?q=chrome+riff&genre=Rock";
    expect(withLibraryReturn("/track/bs-s1-06", returnTo)).toBe(
      "/track/bs-s1-06?returnTo=%2Flibrary%3Fq%3Dchrome%2Briff%26genre%3DRock",
    );
    expect(withLibraryReturn("/play/bs-s1-06?tier=easy&mode=casual", returnTo)).toBe(
      "/play/bs-s1-06?tier=easy&mode=casual&returnTo=%2Flibrary%3Fq%3Dchrome%2Briff%26genre%3DRock",
    );
    expect(withLibraryReturn("/track/bs-s1-06", "/library")).toBe("/track/bs-s1-06");
  });
});
