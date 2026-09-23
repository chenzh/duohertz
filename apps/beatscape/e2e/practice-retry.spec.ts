import { expect, test, type Page } from "@playwright/test";

// These app-level cases inject a deterministic four-note chart with page.route.
// A production Service Worker fetch bypasses that page route; PWA behavior has
// its own real-worker suite in pwa-offline.spec.ts.
test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_board", JSON.stringify([{ track_id: "seed", tier: "easy", score: 123, accuracy: 80, name: "Seed", at: "2026-09-01T00:00:00.000Z" }]));
    localStorage.setItem("bs_daily_board", JSON.stringify([{ track_id: "seed", tier: "easy", score: 123, accuracy: 80, name: "Seed", at: "2026-09-01T00:00:00.000Z", dateKey: "2026-09-01" }]));
    localStorage.setItem("bs_scores", JSON.stringify([{ track_id: "seed", tier: "easy", mode: "arcade", score: 123, accuracy: 80, at: "2026-09-01T00:00:00.000Z" }]));
    localStorage.setItem("bs_runs", JSON.stringify([{ seed: true }]));
    sessionStorage.setItem("bs_last_run", JSON.stringify({
      v: 1,
      track_id: "bs-s1-01",
      title: "Neon Pulse",
      artist: "Pulse Atlas",
      tier: "easy",
      mode: "arcade",
      score: 600,
      accuracy: 50,
      maxCombo: 1,
      grade: "D",
      fc: false,
      ap: false,
      failed: false,
      counts: { perfect: 2, great: 0, good: 0, miss: 2 },
      totalNotes: 4,
      missEvents: [{ tMs: 2250, lane: 1 }, { tMs: 2550, lane: 2 }],
      durationMs: 4000,
      endedAt: "2026-09-12T00:00:00.000Z",
    }));
  });
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({ json: {
    track_id: "bs-s1-01",
    tier: "easy",
    format: 1,
    bpm: 120,
    audio_offset_ms: 0,
    ar: 4,
    total_notes: 4,
    sections: [
      { id: "intro", t0: 0, t1: 2 },
      { id: "drop", t0: 2, t1: 4 },
    ],
    notes: [
      { id: "intro-1", t: 0.8, lane: 0, type: "tap" },
      { id: "intro-2", t: 1.2, lane: 1, type: "tap" },
      { id: "drop-1", t: 2.25, lane: 1, type: "tap" },
      { id: "drop-2", t: 2.55, lane: 2, type: "tap" },
    ],
  } }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("miss replay opens a touch-safe three-rep drill that cannot change competitive progress", async ({ page }, info) => {
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/results");

  await page.getByRole("button", { name: "Review missed sections", exact: true }).click();
  const retry = page.getByRole("link", { name: "Drill Drop 3 times from 0:02, 2 misses" });
  await expect(retry).toBeVisible();
  await expect(retry).toHaveAttribute("href", "/play/bs-s1-01?tier=easy&mode=practice&seek=2&until=4&reps=3");
  expect((await retry.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await retry.click();

  await expect(page).toHaveURL(/\/play\/bs-s1-01\?tier=easy&mode=practice&seek=2&until=4&reps=3$/);
  await expect(page.locator(".play-meta-tier")).toContainText("easy · practice · Drill · Rep 1/3 · Drop · 0:02–0:04");
  if (info.project.name === "mobile") {
    const titleFit = await page.locator(".play-meta > strong").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(titleFit.clientWidth).toBeGreaterThanOrEqual(titleFit.scrollWidth);
    await expect(page.locator(".play-meta-tier-compact")).toBeVisible();
    await expect(page.locator(".play-meta-tier-compact")).toHaveText("easy · Rep 1/3");
    await expect(page.locator(".play-meta-tier-full")).toContainText("easy · practice · Drill · Rep 1/3 · Drop · 0:02–0:04");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator(".overlay-tap .unlock-btn").click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const restartSection = page.getByRole("button", { name: "Restart section", exact: true });
  await expect(restartSection).toBeVisible();
  expect((await restartSection.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: info.outputPath("pause-section-menu.png"), animations: "disabled" });
  await restartSection.click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(page.locator(".play-meta-tier")).toContainText("Rep 2/3", { timeout: 10000 });
  const firstRecap = page.locator(".drill-recap");
  await expect(firstRecap).toHaveAttribute("role", "status");
  await expect(firstRecap).toContainText("Rep 1 complete");
  await expect(firstRecap).toContainText("0% · 2 misses");
  await expect(firstRecap).toContainText("Next · Rep 2/3");
  const firstRecapBox = (await firstRecap.boundingBox())!;
  const playfieldBox = (await page.locator(".play-wrap").boundingBox())!;
  expect(firstRecapBox.x).toBeGreaterThanOrEqual(playfieldBox.x);
  expect(firstRecapBox.x + firstRecapBox.width).toBeLessThanOrEqual(playfieldBox.x + playfieldBox.width);
  await page.screenshot({ path: info.outputPath("drill-rep-recap.png"), animations: "disabled" });
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(firstRecap).toContainText("Rep 1 complete");
  await page.getByRole("button", { name: "Restart section", exact: true }).click();
  await expect(firstRecap).toHaveCount(0);
  await expect(page).toHaveURL(/\/play\/bs-s1-01/);
  await expect(page.locator(".play-meta-tier")).toContainText("Rep 3/3", { timeout: 10000 });
  await expect(page.locator(".drill-recap")).toContainText("Rep 2 complete");
  await expect(page.locator(".drill-recap")).toContainText("Next · Rep 3/3");
  await expect(page).toHaveURL(/\/results$/, { timeout: 10000 });

  await expect(page.getByRole("status")).toContainText("3-rep drill complete — not ranked");
  await expect(page.getByRole("status")).toContainText("Section 0:02–0:04 · Final rep shown");
  const drillProgress = page.getByRole("region", { name: "Drill progress" });
  await expect(drillProgress).toContainText("Final vs first · 0 pp · same misses");
  const attempts = drillProgress.getByRole("listitem");
  await expect(attempts).toHaveCount(3);
  await expect(attempts.nth(0)).toContainText("Rep 1");
  await expect(attempts.nth(0)).toContainText("0%");
  await expect(attempts.nth(0)).toContainText("2 misses");
  await expect(attempts.nth(2)).toContainText("Rep 3");
  await expect(attempts.nth(2)).toHaveAttribute("data-best", "true");
  await expect(attempts.nth(2)).toContainText("Best");
  await expect(page.getByText("NEW RECORD", { exact: true })).toHaveCount(0);
  const drillAgain = page.getByRole("link", { name: "Drill again", exact: true });
  await expect(drillAgain).toHaveAttribute("href", "/play/bs-s1-01?tier=easy&mode=practice&seek=2&until=4&reps=3");
  await expect(page.getByRole("link", { name: "Play full Arcade", exact: true })).toBeVisible();
  const changeSetup = page.getByRole("link", { name: "Change setup", exact: true });
  await expect(changeSetup).toHaveAttribute(
    "href",
    "/track/bs-s1-01?tier=easy&mode=practice&seek=2&until=4",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (info.project.name === "mobile") {
    await drillAgain.scrollIntoViewIfNeeded();
    const drillAgainBox = (await drillAgain.boundingBox())!;
    const mobileNavBox = (await page.locator(".mobile-tabbar").boundingBox())!;
    expect(drillAgainBox.y + drillAgainBox.height).toBeLessThanOrEqual(mobileNavBox.y - 8);
    const fixedPractice = page.locator(".mobile-tabbar .tab-play");
    await expect(fixedPractice).toContainText("Drill");
    await expect(fixedPractice).toHaveAttribute("aria-label", "Drill Neon Pulse again");
    await expect(fixedPractice).toHaveAttribute(
      "href",
      "/play/bs-s1-01?tier=easy&mode=practice&seek=2&until=4&reps=3",
    );
  }

  const state = await page.evaluate(() => ({
    run: JSON.parse(sessionStorage.getItem("bs_last_run")!),
    board: JSON.parse(localStorage.getItem("bs_board")!),
    daily: JSON.parse(localStorage.getItem("bs_daily_board")!),
    scores: JSON.parse(localStorage.getItem("bs_scores")!),
    runs: JSON.parse(localStorage.getItem("bs_runs")!),
  }));
  expect(state.run).toMatchObject({
    mode: "practice",
    seekedFrom: 2,
    seekedUntil: 4,
    practiceRepetitions: 3,
    totalNotes: 2,
    practiceAttempts: [
      { accuracy: 0, misses: 2, score: 0, grade: "D" },
      { accuracy: 0, misses: 2, score: 0, grade: "D" },
      { accuracy: 0, misses: 2, score: 0, grade: "D" },
    ],
  });
  expect(state.board).toHaveLength(1);
  expect(state.daily).toHaveLength(1);
  expect(state.scores).toHaveLength(1);
  expect(state.runs).toEqual([{ seed: true }]);

  await page.screenshot({ path: info.outputPath("section-practice-results.png"), fullPage: true, animations: "disabled" });
  await changeSetup.click();
  await expect(page).toHaveURL("/track/bs-s1-01?tier=easy&mode=practice&seek=2&until=4");
  await expect(page.getByRole("radio", { name: "Drop 0:02–0:04", exact: true }))
    .toHaveAttribute("aria-checked", "true");
});

test("a crafted Arcade seek URL is forced into safe Practice mode", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade&seek=2&reps=3");
  await expect(page.locator(".play-meta-tier")).toContainText("easy · practice · from 0:02");
  await expect(page.locator(".play-meta-tier")).not.toContainText("Drill");
});

test("the pause menu gives pointer and touch players a working full-track restart", async ({ page }, info) => {
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 360, height: 740 });
  }
  await page.addInitScript(() => {
    const state = window as typeof window & { __musicStarts: number };
    state.__musicStarts = 0;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) state.__musicStarts++;
      return start.apply(this, args);
    };
  });

  const starts = () => page.evaluate(() => (window as typeof window & { __musicStarts: number }).__musicStarts);
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.locator(".overlay-tap .unlock-btn").click();
  await expect.poll(starts).toBe(1);
  await page.getByRole("button", { name: "Pause", exact: true }).click();

  const restartTrack = page.getByRole("button", { name: "Restart track", exact: true });
  await expect(restartTrack).toBeVisible();
  const restartBox = (await restartTrack.boundingBox())!;
  expect(restartBox.height).toBeGreaterThanOrEqual(44);
  if (info.project.name === "mobile") {
    const resumeBox = (await page.getByRole("button", { name: "Resume", exact: true }).boundingBox())!;
    expect(restartBox.y).toBeGreaterThanOrEqual(resumeBox.y + resumeBox.height);
  }
  await restartTrack.click();

  await expect.poll(starts).toBe(2);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
});

test("calibration shifts section seek without trimming the start of a full run", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_offset_ms", "120");
    const state = window as typeof window & { __musicOffsets: number[] };
    state.__musicOffsets = [];
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) state.__musicOffsets.push(args[1] ?? 0);
      return start.apply(this, args);
    };
  });

  const offsets = () => page.evaluate(() => (window as typeof window & { __musicOffsets: number[] }).__musicOffsets);
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.locator(".overlay-tap .unlock-btn").click();
  await expect.poll(offsets).toEqual([0]);

  await page.goto("/play/bs-s1-01?tier=easy&mode=practice&seek=2");
  await page.locator(".overlay-tap .unlock-btn").click();
  await expect.poll(offsets).toEqual([2.12]);
});
