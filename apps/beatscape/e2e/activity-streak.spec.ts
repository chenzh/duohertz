import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

type StreakRun = {
  track_id: string;
  district: string;
  tier: "standard";
  mode: "arcade";
  score: number;
  accuracy: number;
  maxCombo: number;
  fc: boolean;
  ap: boolean;
  failed: boolean;
  durationMs: number;
  endedAt: string;
  dateKey: string;
};

function localDateKey(offsetDays: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function run(dateKey: string, index: number): StreakRun {
  return {
    track_id: `bs-s1-${String((index % 9) + 1).padStart(2, "0")}`,
    district: "Pulse Core",
    tier: "standard",
    mode: "arcade",
    score: 100000 + index,
    accuracy: 93,
    maxCombo: 120,
    fc: true,
    ap: false,
    failed: false,
    durationMs: 90000,
    endedAt: `${dateKey}T12:00:00.000Z`,
    dateKey,
  };
}

async function seedRuns(page: Page, offsets: number[]) {
  const runs = offsets.map((offset, index) => run(localDateKey(offset), index));
  await page.addInitScript((seededRuns) => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_runs", JSON.stringify(seededRuns));
  }, runs);
}

test("an at-risk streak stays actionable on Home and truthful on Profile", async ({ page }, info) => {
  await seedRuns(page, [-15, -14, -13, -12, -11, -3, -2, -1]);
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });

  await page.goto("/");
  const daily = page.getByRole("region", { name: "Today's Daily challenge" });
  await daily.scrollIntoViewIfNeeded();
  await expect(daily.locator(".daily-streak-status")).toContainText("3-night streak ready");
  await expect(daily.locator(".daily-streak-status")).toContainText("Play today to keep it alive");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await daily.screenshot({ path: info.outputPath("daily-streak-ready.png"), animations: "disabled" });

  await page.goto("/profile");
  const streak = page.getByRole("region", { name: "Night streak status" });
  await expect(streak).toContainText("3 nights active");
  await expect(streak).toContainText("Finish a full run with at least one hit to keep it alive");
  await expect(streak.getByRole("link", { name: "Start First Shift", exact: true })).toHaveAttribute(
    "href",
    "/play/bs-s1-05?tier=easy&mode=casual&shift=studio",
  );
  await expect(streak.locator(".profile-next-run-meta")).toContainText("Next · Voltage Drop");
  await expect(page.locator(".profile-stats")).toContainText("Best streak5d");
});

test("today's run is visibly locked into the streak", async ({ page }, info) => {
  await seedRuns(page, [-3, -2, -1, 0]);
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });

  await page.goto("/");
  const daily = page.getByRole("region", { name: "Today's Daily challenge" });
  await daily.scrollIntoViewIfNeeded();
  await expect(daily.locator(".daily-streak-status")).toContainText("4-night streak active");
  await expect(daily.locator(".daily-streak-status")).toContainText("Today is locked in");

  await page.goto("/profile");
  const streak = page.getByRole("region", { name: "Night streak status" });
  await expect(streak).toContainText("4 nights active");
  await expect(streak).toContainText("Today is locked in");
  await expect(streak.locator(".profile-streak-complete")).toContainText("Today counted");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("Results confirms a newly extended streak exactly once", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.evaluate(() => {
    sessionStorage.setItem("bs_last_run", JSON.stringify({
      v: 1,
      track_id: "bs-s1-01",
      title: "Neon Pulse",
      artist: "Pulse Atlas",
      tier: "standard",
      mode: "arcade",
      score: 180000,
      accuracy: 96,
      maxCombo: 120,
      grade: "S",
      fc: true,
      ap: false,
      failed: false,
      counts: { perfect: 180, great: 30, good: 8, miss: 0 },
      totalNotes: 218,
      durationMs: 90000,
      endedAt: new Date().toISOString(),
    }));
    sessionStorage.setItem("bs_streak_update", JSON.stringify({
      kind: "extended",
      activeDays: 4,
      newBest: true,
    }));
  });

  await page.goto("/results");
  const update = page.getByRole("region", { name: "Night streak update" });
  await expect(update).toContainText("Night 4 secured");
  await expect(update).toContainText("New best");
  await expect(update).toContainText("Today counts");
  await expect(update.getByRole("link", { name: "View streak", exact: true })).toHaveAttribute("href", "/profile");

  const order = await page.locator(".results-stats, .results-streak-update, .judge-bars")
    .evaluateAll((nodes) => nodes.map((node) => node.className));
  expect(order).toEqual(["results-stats", "results-streak-update", "judge-bars"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await update.evaluate((node) => {
    window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 12, behavior: "auto" });
  });
  await expect(update.getByRole("link", { name: "View streak", exact: true })).toBeVisible();
  if (info.project.name === "mobile") {
    const [actionBox, tabbarBox] = await Promise.all([
      update.getByRole("link", { name: "View streak", exact: true }).boundingBox(),
      page.locator(".mobile-tabbar").boundingBox(),
    ]);
    expect(actionBox).not.toBeNull();
    expect(tabbarBox).not.toBeNull();
    expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(tabbarBox!.y);
  }
  await update.screenshot({ path: info.outputPath("results-streak-update.png"), animations: "disabled" });

  await page.reload();
  await expect(page.getByRole("region", { name: "Night streak update" })).toHaveCount(0);
});

test("a zero-hit full attempt keeps recovery without false streak or honor rewards", async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(Element.prototype, "webkitRequestFullscreen", {
      configurable: true,
      value: undefined,
    });
  });
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 1,
      sections: [{ id: "opening", t0: 0, t1: 2 }],
      notes: [{ id: "tap-1", t: 0.5, lane: 0, type: "tap" }],
    },
  }));
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });

  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await expect(page).toHaveURL(/\/results$/, { timeout: 10_000 });

  await expect(page.getByRole("region", { name: "Night streak update" })).toHaveCount(0);
  await expect(page.getByText("First Light", { exact: true })).toHaveCount(0);
  const recovery = page.getByRole("region", { name: "Run it back" });
  await expect(recovery).toBeVisible();
  await expect(recovery.getByRole("link", { name: "Replay", exact: true })).toHaveAttribute(
    "href",
    "/play/bs-s1-01?tier=easy&mode=casual",
  );
  const progress = await page.evaluate(() => ({
    runs: JSON.parse(localStorage.getItem("bs_runs") ?? "[]"),
    achievements: JSON.parse(localStorage.getItem("bs_achievements") ?? "[]"),
  }));
  expect(progress.runs).toHaveLength(1);
  expect(progress.runs[0]).toMatchObject({ score: 0, accuracy: 0 });
  expect(progress.achievements).toEqual([]);
});
