import { describe, expect, it } from "vitest";
import {
  analyzeCalibration,
  calibrationBeatTimes,
  calibrationHref,
  calibrationTimingDirection,
  matchCalibrationTap,
  safeCalibrationReturn,
} from "./calibration";

describe("calibration timing", () => {
  it("builds eight sample-aligned 120 BPM pulse times", () => {
    expect(calibrationBeatTimes(1_000)).toEqual([
      1_000, 1_500, 2_000, 2_500, 3_000, 3_500, 4_000, 4_500,
    ]);
  });

  it("matches the closest unused pulse and rejects repeats or ambiguous late taps", () => {
    const beats = calibrationBeatTimes(1_000);
    expect(matchCalibrationTap(1_031, beats, new Set())).toEqual({ beatIndex: 0, deltaMs: 31 });
    expect(matchCalibrationTap(1_031, beats, new Set([0]))).toBeNull();
    expect(matchCalibrationTap(1_250, beats, new Set())).toBeNull();
  });

  it("uses the true median and reports a stable run", () => {
    expect(analyzeCalibration([
      { beatIndex: 0, deltaMs: 20 },
      { beatIndex: 1, deltaMs: 24 },
      { beatIndex: 2, deltaMs: 22 },
      { beatIndex: 3, deltaMs: 200 },
    ])).toMatchObject({
      sampleCount: 4,
      rawOffsetMs: 23,
      offsetMs: 23,
      medianAbsoluteDeviationMs: 2,
      status: "steady",
      clamped: false,
    });
  });

  it("flags sparse or inconsistent runs and clamps stored offsets", () => {
    expect(analyzeCalibration([
      { beatIndex: 0, deltaMs: 10 },
      { beatIndex: 1, deltaMs: 20 },
    ]).status).toBe("not-enough");

    expect(analyzeCalibration([
      { beatIndex: 0, deltaMs: -90 },
      { beatIndex: 1, deltaMs: 0 },
      { beatIndex: 2, deltaMs: 90 },
    ]).status).toBe("variable");

    expect(analyzeCalibration([
      { beatIndex: 0, deltaMs: 230 },
      { beatIndex: 1, deltaMs: 225 },
      { beatIndex: 2, deltaMs: 220 },
    ])).toMatchObject({ offsetMs: 200, clamped: true });
  });

  it("describes the measured timing direction without reversing the correction sign", () => {
    expect(calibrationTimingDirection(61)).toBe("late");
    expect(calibrationTimingDirection(-48)).toBe("early");
    expect(calibrationTimingDirection(0)).toBe("centered");
  });
});

describe("calibration return path", () => {
  it("round-trips an in-app route and rejects protocol-relative destinations", () => {
    const href = calibrationHref("/play/bs-s1-01?tier=hard&mode=arcade");
    expect(href).toBe("/calibrate?return=%2Fplay%2Fbs-s1-01%3Ftier%3Dhard%26mode%3Darcade");
    expect(safeCalibrationReturn(href.slice(href.indexOf("?")))).toBe("/play/bs-s1-01?tier=hard&mode=arcade");
    expect(safeCalibrationReturn("?return=%2F%2Fevil.example")).toBeNull();
  });
});
