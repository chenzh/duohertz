import { describe, expect, it } from "vitest";
import { buildOrder, hashSeed, mulberry32, nextPos, prevPos, shuffled } from "./queue";

function expectPermutation(got: number[], n: number) {
  expect([...got].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
}

describe("mulberry32", () => {
  it("is deterministic per seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("hashSeed", () => {
  it("is stable for the same string", () => {
    expect(hashSeed("2026-08-30")).toBe(hashSeed("2026-08-30"));
  });

  it("differs across dates (probabilistic)", () => {
    expect(hashSeed("2026-08-30")).not.toBe(hashSeed("2026-08-31"));
  });
});

describe("shuffled", () => {
  it("returns a permutation and leaves the input untouched", () => {
    const input = [0, 1, 2, 3, 4];
    const out = shuffled(input, mulberry32(7));
    expectPermutation(out, 5);
    expect(input).toEqual([0, 1, 2, 3, 4]);
  });

  it("is deterministic for the same seed", () => {
    expect(shuffled([1, 2, 3, 4, 5], mulberry32(7))).toEqual(
      shuffled([1, 2, 3, 4, 5], mulberry32(7)),
    );
  });

  it("handles empty and single-element arrays", () => {
    expect(shuffled([], mulberry32(1))).toEqual([]);
    expect(shuffled([9], mulberry32(1))).toEqual([9]);
  });
});

describe("buildOrder", () => {
  it("is the identity when shuffle is off", () => {
    expect(buildOrder(4, { shuffle: false, seed: 1 })).toEqual([0, 1, 2, 3]);
  });

  it("is a permutation when shuffled", () => {
    expectPermutation(buildOrder(12, { shuffle: true, seed: 3 }), 12);
  });

  it("puts `first` at play position 0", () => {
    const order = buildOrder(10, { shuffle: true, seed: 42, first: 7 });
    expect(order[0]).toBe(7);
    expectPermutation(order, 10);
  });

  it("is deterministic for the same seed", () => {
    expect(buildOrder(20, { shuffle: true, seed: 5 })).toEqual(
      buildOrder(20, { shuffle: true, seed: 5 }),
    );
  });

  it("varies across seeds", () => {
    expect(buildOrder(20, { shuffle: true, seed: 1 })).not.toEqual(
      buildOrder(20, { shuffle: true, seed: 2 }),
    );
  });

  it("returns empty for empty queues", () => {
    expect(buildOrder(0, { shuffle: true, seed: 1 })).toEqual([]);
  });
});

describe("nextPos", () => {
  it("walks forward inside the queue", () => {
    expect(nextPos(0, 3, "off")).toBe(1);
    expect(nextPos(1, 3, "off")).toBe(2);
  });

  it("returns null at the end with repeat off", () => {
    expect(nextPos(2, 3, "off")).toBeNull();
  });

  it("wraps with repeat all", () => {
    expect(nextPos(2, 3, "all")).toBe(0);
  });

  it("returns null for empty queues", () => {
    expect(nextPos(0, 0, "all")).toBeNull();
  });
});

describe("prevPos", () => {
  it("walks backward", () => {
    expect(prevPos(2, 3)).toBe(1);
    expect(prevPos(1, 3)).toBe(0);
  });

  it("returns null at the start (caller restarts the track)", () => {
    expect(prevPos(0, 3)).toBeNull();
  });
});
