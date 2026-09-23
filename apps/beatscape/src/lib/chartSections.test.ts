import { describe, expect, it } from "vitest";
import {
  chartSectionClock,
  chartSectionLabel,
  selectableChartSections,
} from "./chartSections";

describe("chart section presentation", () => {
  it("formats chart ids and seconds for player-facing section actions", () => {
    expect(chartSectionLabel("final_drop")).toBe("Final Drop");
    expect(chartSectionLabel("  ")).toBe("Section");
    expect(chartSectionClock(58.9)).toBe("0:58");
    expect(chartSectionClock(75)).toBe("1:15");
  });

  it("keeps only finite forward section ranges", () => {
    expect(selectableChartSections([
      { id: "intro", t0: 0, t1: 4 },
      { id: "", t0: 4, t1: 8 },
      { id: "reverse", t0: 8, t1: 7 },
      { id: "nan", t0: Number.NaN, t1: 9 },
    ])).toEqual([{ id: "intro", t0: 0, t1: 4 }]);
  });
});
