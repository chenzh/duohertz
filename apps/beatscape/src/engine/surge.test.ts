import { describe, expect, it } from "vitest";
import {
  ScoreStreak,
  SurgeMeter,
  SURGE_DECAY_PER_SEC,
  SURGE_GAIN,
  SURGE_TIERS,
  decayAtmosphere,
  tierForHeat,
} from "./surge";

describe("tierForHeat", () => {
  it("maps heat onto the three visible tiers", () => {
    expect(tierForHeat(0)).toBe(0);
    expect(tierForHeat(SURGE_TIERS.t1 - 0.5)).toBe(0);
    expect(tierForHeat(SURGE_TIERS.t1)).toBe(1);
    expect(tierForHeat(SURGE_TIERS.t2)).toBe(2);
    expect(tierForHeat(SURGE_TIERS.t3)).toBe(3);
    expect(tierForHeat(100)).toBe(3);
  });
});

describe("SurgeMeter.apply", () => {
  it("climbs to ON AIR on a perfect streak and never past 100", () => {
    const m = new SurgeMeter();
    for (let i = 0; i < 200; i++) m.apply("perfect");
    expect(m.heat).toBe(100);
    expect(m.tier()).toBe(3);
  });

  it("needs only greats to hold the field warm, but not the top tier", () => {
    const m = new SurgeMeter();
    for (let i = 0; i < 25; i++) m.apply("great"); // 25 * 1.2 = 30
    expect(m.tier()).toBe(1);
    expect(m.maxTier).toBe(1);
  });

  it("a miss dumps the tier immediately", () => {
    const m = new SurgeMeter();
    for (let i = 0; i < 45; i++) m.apply("perfect"); // 99 heat
    expect(m.tier()).toBe(3);
    m.apply("miss"); // -16 -> 83, below t3 (85)
    expect(m.tier()).toBe(2);
    // maxTier latches for the results screen even after the drop
    expect(m.maxTier).toBe(3);
  });

  it("good drags heat down, not just freezes it", () => {
    const m = new SurgeMeter();
    m.apply("perfect");
    const before = m.heat;
    m.apply("good");
    expect(m.heat).toBeLessThan(before);
    expect(m.heat).toBe(Math.max(0, before + SURGE_GAIN.good));
  });

  it("clamps at zero after repeated misses", () => {
    const m = new SurgeMeter();
    for (let i = 0; i < 10; i++) m.apply("miss");
    expect(m.heat).toBe(0);
    expect(m.tier()).toBe(0);
  });
});

describe("SurgeMeter.decay", () => {
  it("bleeds while playing and stops at zero", () => {
    const m = new SurgeMeter();
    m.apply("perfect");
    m.decay(1000);
    expect(m.heat).toBeCloseTo(SURGE_GAIN.perfect - SURGE_DECAY_PER_SEC, 5);
    m.decay(10_000);
    expect(m.heat).toBe(0);
  });

  it("ignores non-positive deltas (clock rewinds / pause frames)", () => {
    const m = new SurgeMeter();
    m.apply("perfect");
    const h = m.heat;
    m.decay(0);
    m.decay(-5);
    expect(m.heat).toBe(h);
  });
});

describe("SurgeMeter.reset", () => {
  it("clears heat and the latched max tier", () => {
    const m = new SurgeMeter();
    for (let i = 0; i < 50; i++) m.apply("perfect");
    m.reset();
    expect(m.heat).toBe(0);
    expect(m.maxTier).toBe(0);
    expect(m.tier()).toBe(0);
  });
});

describe("ScoreStreak", () => {
  it("counts every scoring judgment and only miss resets it", () => {
    const s = new ScoreStreak();
    s.apply("perfect");
    s.apply("great");
    s.apply("good");
    expect(s.count).toBe(3);
    s.apply("miss");
    expect(s.count).toBe(0);
  });

  it("maps count onto neon levels (30 / 70 / 120)", () => {
    const s = new ScoreStreak();
    for (let i = 0; i < 29; i++) s.apply("good");
    expect(s.level()).toBe(0);
    s.apply("good");
    expect(s.level()).toBe(1);
    for (let i = 0; i < 40; i++) s.apply("good"); // 70
    expect(s.level()).toBe(2);
    for (let i = 0; i < 50; i++) s.apply("good"); // 120
    expect(s.level()).toBe(3);
  });

  it("latches the max level across a miss", () => {
    const s = new ScoreStreak();
    for (let i = 0; i < 120; i++) s.apply("perfect");
    expect(s.max).toBe(3);
    s.apply("miss");
    expect(s.level()).toBe(0);
    expect(s.max).toBe(3);
  });

  it("holds steady for 2s, then bleeds about 2/s", () => {
    const s = new ScoreStreak();
    for (let i = 0; i < 40; i++) s.apply("good");
    expect(s.count).toBe(40);
    s.decay(2000);
    expect(s.count).toBe(40); // grace window
    s.decay(1000); // one second of bleed = ~2
    expect(s.count).toBe(38);
    s.decay(5000);
    expect(s.count).toBe(28);
  });

  it("scoring again stops the bleed and resets the idle window", () => {
    const s = new ScoreStreak();
    for (let i = 0; i < 40; i++) s.apply("good");
    s.decay(3000); // 2s grace + 1s bleed → 40 - 2
    expect(s.count).toBe(38);
    s.apply("perfect"); // 39, idle window restarts
    s.decay(1500); // within the new grace window
    expect(s.count).toBe(39);
  });

  it("reset clears everything", () => {
    const s = new ScoreStreak();
    for (let i = 0; i < 130; i++) s.apply("perfect");
    s.reset();
    expect(s.count).toBe(0);
    expect(s.max).toBe(0);
    expect(s.level()).toBe(0);
  });
});

describe("decayAtmosphere", () => {
  // 回归守卫：调用方曾把两个仪表的 decay 分开写，并在中间提前把 lastEffMs
  // 赋了值，导致 streak 拿到的 delta 恒为 0、整段 idle bleed 变成死代码。
  // 共用同一个 dtMs 参数后，这个错误在结构上就不可能再犯。
  it("feeds the SAME delta to both meters", () => {
    const surge = new SurgeMeter();
    const streak = new ScoreStreak();
    for (let i = 0; i < 40; i++) {
      surge.apply("perfect");
      streak.apply("perfect");
    }
    const heat0 = surge.heat;
    const count0 = streak.count;

    // 3s：超过 2s 宽限期，两个仪表都必须真的动。
    decayAtmosphere(surge, streak, 3000);

    expect(surge.heat).toBeLessThan(heat0);
    expect(streak.count).toBeLessThan(count0);
  });

  it("is a no-op for non-positive deltas (pause / first frame)", () => {
    const surge = new SurgeMeter();
    const streak = new ScoreStreak();
    for (let i = 0; i < 10; i++) {
      surge.apply("perfect");
      streak.apply("perfect");
    }
    const heat0 = surge.heat;
    const count0 = streak.count;

    decayAtmosphere(surge, streak, 0);
    decayAtmosphere(surge, streak, -16);

    expect(surge.heat).toBe(heat0);
    expect(streak.count).toBe(count0);
  });

  it("accumulates across small per-frame slices the same way as one big step", () => {
    const big = new ScoreStreak();
    const sliced = new ScoreStreak();
    for (let i = 0; i < 40; i++) {
      big.apply("perfect");
      sliced.apply("perfect");
    }
    // 每帧 16ms 推 3 秒 vs 一次 3000ms —— 衰减必须收敛到同一个值，
    // 否则帧率会影响氛围层的观感。
    decayAtmosphere(new SurgeMeter(), big, 3000);
    const s = new SurgeMeter();
    for (let i = 0; i < 187; i++) decayAtmosphere(s, sliced, 16);

    expect(Math.abs(big.count - sliced.count)).toBeLessThanOrEqual(1);
  });
});
