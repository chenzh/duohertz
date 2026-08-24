import { describe, expect, it } from "vitest";
import { judgeDelta, judgmentScore, gradeFromAccuracy, hpDelta } from "./judge";

describe("judge", () => {
  it("windows", () => {
    expect(judgeDelta(0, "arcade")).toBe("perfect");
    expect(judgeDelta(22, "arcade")).toBe("perfect");
    expect(judgeDelta(30, "arcade")).toBe("great");
    expect(judgeDelta(50, "arcade")).toBe("good");
    expect(judgeDelta(90, "arcade")).toBe("miss");
    expect(judgeDelta(30, "casual")).toBe("perfect");
    expect(judgeDelta(40, "casual")).toBe("great");
  });

  it("scores", () => {
    expect(judgmentScore("perfect")).toBe(300);
    expect(gradeFromAccuracy(96)).toBe("S");
    expect(hpDelta("miss")).toBe(-7);
  });
});
