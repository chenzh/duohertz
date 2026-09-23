import { describe, expect, it } from "vitest";
import {
  chartTierFromParam,
  playHref,
  playModeFromParam,
  trackSetupHref,
} from "./playHref";

describe("run deep links", () => {
  it("builds exact Play and Track setup links", () => {
    expect(playHref("bs-s1-01", "hard", "arcade"))
      .toBe("/play/bs-s1-01?tier=hard&mode=arcade");
    expect(trackSetupHref("bs-s1-01", "hard", "arcade"))
      .toBe("/track/bs-s1-01?tier=hard&mode=arcade");
    expect(trackSetupHref("bs-s1-01", "easy", "practice", { seek: 6, until: 24 }))
      .toBe("/track/bs-s1-01?tier=easy&mode=practice&seek=6&until=24");
    expect(trackSetupHref("bs-s1-01", "easy", "arcade", { seek: 6, until: 24 }))
      .toBe("/track/bs-s1-01?tier=easy&mode=arcade");
    expect(trackSetupHref("bs-s1-01", "easy", "practice", { seek: 24, until: 6 }))
      .toBe("/track/bs-s1-01?tier=easy&mode=practice");
  });

  it("accepts only supported setup values", () => {
    expect(chartTierFromParam("standard")).toBe("standard");
    expect(chartTierFromParam("expert")).toBeNull();
    expect(chartTierFromParam(null)).toBeNull();
    expect(playModeFromParam("practice")).toBe("practice");
    expect(playModeFromParam("ranked")).toBeNull();
    expect(playModeFromParam(undefined)).toBeNull();
  });
});
