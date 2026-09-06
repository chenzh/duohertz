import { describe, expect, it } from "vitest";
import { MILESTONE_FONT, MILESTONE_MAX_SCALE, MilestoneTextSprites, milestoneTextBounds } from "./milestoneTextSprites";

function harness() {
  const canvases: Array<HTMLCanvasElement & { calls: Array<unknown[]> }> = [];
  let metrics = { width: 205, actualBoundingBoxLeft: 98, actualBoundingBoxRight: 102,
    actualBoundingBoxAscent: 37, actualBoundingBoxDescent: 3 } as TextMetrics;
  const makeCanvas = () => {
    const calls: Array<unknown[]> = [];
    const context = { font: "", textAlign: "", textBaseline: "", lineJoin: "", lineWidth: 0,
      strokeStyle: "", fillStyle: "",
      measureText: () => { calls.push(["measure"]); return metrics; },
      setTransform: (...args: number[]) => calls.push(["transform", ...args]),
      strokeText: (...args: unknown[]) => calls.push(["stroke", ...args]),
      fillText: (...args: unknown[]) => calls.push(["fill", ...args]),
    };
    const canvas = { width: 0, height: 0, calls, getContext: () => context } as unknown as typeof canvases[number];
    canvases.push(canvas);
    return canvas;
  };
  return { cache: new MilestoneTextSprites(makeCanvas), canvases, setMetrics: (next: TextMetrics) => { metrics = next; } };
}

describe("milestone text sprites", () => {
  it("uses measured baseline bounds plus the full round outline and antialias margin", () => {
    expect(milestoneTextBounds({ width: 205, actualBoundingBoxLeft: 98, actualBoundingBoxRight: 102,
      actualBoundingBoxAscent: 37, actualBoundingBoxDescent: 3 } as TextMetrics)).toEqual({ x: -104, y: -43, width: 212, height: 52 });
    expect(milestoneTextBounds({ width: 200 } as TextMetrics)).toEqual({ x: -106, y: -54, width: 212, height: 72 });
  });

  it("rasterizes at maximum animation scale times DPR without clipping fractional edge pixels", () => {
    const { cache, canvases } = harness();
    const sprite = cache.get("300 COMBO!", 2);
    expect(sprite.rasterScale).toBe(2 * MILESTONE_MAX_SCALE);
    expect(sprite.stroke.width).toBe(Math.ceil(212 * 2.8));
    expect(sprite.stroke.height).toBe(Math.ceil(52 * 2.8));
    expect(sprite.width * sprite.rasterScale).toBeCloseTo(sprite.stroke.width);
    expect(sprite.height * sprite.rasterScale).toBeCloseTo(sprite.stroke.height);
    expect(sprite.x).toBe(-104);
    expect(sprite.y).toBe(-43);
    expect(canvases[0]!.calls).toContainEqual(["transform", 2.8, 0, 0, 2.8, 104 * 2.8, 43 * 2.8]);
  });

  it("keeps stroke and fill on separate canvases with the original typography and colors", () => {
    const { cache, canvases } = harness();
    cache.get("300 COMBO!", 2, "middle");
    expect(canvases).toHaveLength(2);
    expect(canvases[0]!.calls.filter(call => call[0] === "stroke" || call[0] === "fill")).toEqual([["stroke", "300 COMBO!", 0, 0]]);
    expect(canvases[1]!.calls.filter(call => call[0] === "stroke" || call[0] === "fill")).toEqual([["fill", "300 COMBO!", 0, 0]]);
    for (const canvas of canvases) {
      expect(canvas.getContext("2d")).toMatchObject({ font: MILESTONE_FONT, textAlign: "center", textBaseline: "middle", lineJoin: "round", lineWidth: 10 });
    }
    expect(canvases[0]!.getContext("2d")!.strokeStyle).toBe("#000000");
    expect(canvases[1]!.getContext("2d")!.fillStyle).toBe("#FFB020");
  });

  it("reuses prepared images throughout the animation and keys changed DPR/baseline separately", () => {
    const { cache, canvases } = harness();
    const first = cache.get("300 COMBO!", 2);
    for (let frame = 0; frame < 50; frame++) expect(cache.get("300 COMBO!", 2)).toBe(first);
    expect(canvases).toHaveLength(2);
    expect(cache.get("300 COMBO!", 1)).not.toBe(first);
    expect(cache.get("300 COMBO!", 2, "middle")).not.toBe(first);
  });

  it("holds at most eight messages and releases both bitmaps on eviction and cleanup", () => {
    const { cache } = harness();
    const first = cache.get("old", 2);
    for (let index = 1; index <= 8; index++) cache.get(String(index), 2);
    expect(first.stroke.width).toBe(0);
    expect(first.fill.height).toBe(0);
    const current = cache.get("8", 2);
    expect(cache.estimatedBytes).toBe(8 * current.stroke.width * current.stroke.height * 4 * 2);
    cache.clear();
    expect(cache.estimatedBytes).toBe(0);
    expect(current.stroke.height).toBe(0);
    expect(current.fill.width).toBe(0);
    expect(cache.get("8", 2)).not.toBe(current);
  });

  it("re-measures after font invalidation instead of retaining fallback-font geometry", () => {
    const { cache, setMetrics } = harness();
    const fallback = cache.get("300 COMBO!", 2);
    setMetrics({ width: 240, actualBoundingBoxLeft: 120, actualBoundingBoxRight: 120,
      actualBoundingBoxAscent: 42, actualBoundingBoxDescent: 4 } as TextMetrics);
    cache.clear();
    const loaded = cache.get("300 COMBO!", 2);
    expect(loaded.x).toBe(-126);
    expect(loaded.y).toBe(-48);
    expect(loaded.width).toBeGreaterThan(fallback.width);
  });
});
