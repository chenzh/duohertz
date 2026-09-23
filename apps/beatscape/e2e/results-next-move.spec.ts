import { expect, test, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

const baseRun = {
  v: 1,
  track_id: "bs-s1-01",
  title: "Neon Pulse",
  artist: "Pulse Atlas",
  tier: "easy",
  mode: "arcade",
  score: 82_400,
  accuracy: 82.4,
  maxCombo: 44,
  grade: "B",
  fc: false,
  ap: false,
  failed: false,
  counts: { perfect: 76, great: 20, good: 15, miss: 3 },
  totalNotes: 114,
  durationMs: 75_000,
  endedAt: "2026-09-12T00:00:00.000Z",
};

async function seedResult(
  page: Page,
  overrides: Record<string, unknown> = {},
  history: Record<string, unknown>[] = [],
) {
  await page.addInitScript(({ run, history }) => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_runs", JSON.stringify(history));
    sessionStorage.setItem("bs_last_run", JSON.stringify(run));
  }, { run: { ...baseRun, ...overrides }, history });
}

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test("an empty Results visit offers a player-facing recovery path", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.removeItem("bs_last_run");
    sessionStorage.removeItem("bs_last_run");
  });
  await page.goto("/results");

  await expect(page.getByRole("heading", { name: "No result yet", exact: true })).toBeVisible();
  await expect(page.getByText("Finish a track to unlock your score breakdown, coaching, and next move."))
    .toBeVisible();
  await expect(page.getByText("?run=local", { exact: true })).toHaveCount(0);

  const chooseTrack = page.getByRole("link", { name: "Choose a track", exact: true });
  const home = page.getByRole("link", { name: "Back to Home", exact: true });
  await expect(chooseTrack).toHaveAttribute("href", "/library");
  await expect(home).toHaveAttribute("href", "/");
  for (const action of [chooseTrack, home]) {
    const box = await action.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  const homeBox = (await home.boundingBox())!;
  const tabbarBox = (await page.locator(".mobile-tabbar").boundingBox())!;
  expect(homeBox.y + homeBox.height).toBeLessThanOrEqual(tabbarBox.y - 8);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("results-empty.png"), fullPage: true, animations: "disabled" });
});

test("clustered misses lead to a focused section-review action", async ({ page }, info) => {
  await seedResult(page, {
    missEvents: [
      { tMs: 8_000, lane: 0 },
      { tMs: 9_000, lane: 1 },
      { tMs: 30_000, lane: 3 },
    ],
    timing: { early: 20, late: 60, meanMs: 14 },
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/results");

  const coach = page.getByRole("region", { name: "Drill the rough spots" });
  await expect(coach).toContainText("3 misses are mapped below");
  const review = page.getByRole("button", { name: "Review missed sections", exact: true });
  const missReview = page.locator("#miss-review");
  const dropPractice = page.getByRole("link", { name: /Drill Drop 3 times from 0:06/ });
  await expect(missReview).not.toHaveAttribute("open", "");
  await expect(dropPractice).toBeHidden();
  expect((await review.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  if (info.project.name === "mobile") {
    const fixedReview = page.locator(".mobile-tabbar").getByRole("button", {
      name: "Review missed sections for Neon Pulse",
      exact: true,
    });
    await expect(fixedReview).toContainText("Review");
    await fixedReview.click();
  } else {
    await review.click();
  }
  await expect(missReview).toHaveAttribute("open", "");
  const missReviewSummary = page.locator("#miss-review summary");
  await expect(missReviewSummary).toBeFocused();
  await expect(dropPractice).toBeVisible();
  await expect(dropPractice).toHaveAttribute("href", /seek=6&until=24&reps=3/);
  if (info.project.name === "mobile") {
    const [summaryBox, practiceBox, tabbarBox] = await Promise.all([
      missReviewSummary.boundingBox(),
      dropPractice.boundingBox(),
      page.locator(".mobile-tabbar").boundingBox(),
    ]);
    expect(summaryBox).not.toBeNull();
    expect(practiceBox).not.toBeNull();
    expect(tabbarBox).not.toBeNull();
    expect(summaryBox!.y).toBeGreaterThanOrEqual(0);
    expect(summaryBox!.height, "Miss review disclosure target").toBeGreaterThanOrEqual(44);
    expect(practiceBox!.y + practiceBox!.height).toBeLessThanOrEqual(tabbarBox!.y - 8);
  }

  await expect(page.getByRole("heading", { name: "Stay on this track", exact: true })).toBeVisible();
  const nextTrack = page.locator(".results-next-track");
  await expect(nextTrack).toContainText("Up next");
  await expect(nextTrack.getByRole("link", { name: "Play next", exact: true }))
    .toHaveAttribute("href", /\/play\/(?!bs-s1-01)[^?]+\?tier=easy&mode=arcade$/);
  await expect(page.locator(".results-actions ~ .stream-cta")).toBeVisible();
  await expect(page.getByRole("link", { name: "Replay", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Change setup", exact: true }))
    .toHaveAttribute("href", "/track/bs-s1-01?tier=easy&mode=arcade");
  await expect(page.getByText("Share this run", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy link", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^(Share|Copy) poster$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download 4:5", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  // The personalized next action owns the immediate post-score decision. Its
  // missed-section review stays directly beside the coach instead of making
  // players jump past sharing or the radio reply; share remains ahead of the
  // lower-level run telemetry.
  await page.evaluate(() => scrollTo(0, 0));
  const resultFlow = await page.evaluate(() => {
    const coach = document.querySelector<HTMLElement>(".result-coach")!;
    const missReview = document.querySelector<HTMLElement>("#miss-review")!;
    const nextTrack = document.querySelector<HTMLElement>(".results-next-track")!;
    const share = document.querySelector<HTMLElement>(".results-share-panel")!;
    const story = document.querySelector<HTMLElement>(".shift-result")!;
    const breakdown = document.querySelector<HTMLElement>(".judge-bars")!;
    return {
      coachTop: coach.getBoundingClientRect().top + scrollY,
      missReviewTop: missReview.getBoundingClientRect().top + scrollY,
      nextTrackTop: nextTrack.getBoundingClientRect().top + scrollY,
      shareTop: share.getBoundingClientRect().top + scrollY,
      storyTop: story.getBoundingClientRect().top + scrollY,
      breakdownTop: breakdown.getBoundingClientRect().top + scrollY,
    };
  });
  expect(resultFlow.coachTop).toBeLessThan(resultFlow.missReviewTop);
  expect(resultFlow.missReviewTop).toBeLessThan(resultFlow.nextTrackTop);
  expect(resultFlow.nextTrackTop).toBeLessThan(resultFlow.shareTop);
  expect(resultFlow.nextTrackTop).toBeLessThan(resultFlow.storyTop);
  expect(resultFlow.missReviewTop).toBeLessThan(resultFlow.shareTop);
  expect(resultFlow.missReviewTop).toBeLessThan(resultFlow.storyTop);
  expect(resultFlow.coachTop).toBeLessThan(resultFlow.shareTop);
  expect(resultFlow.coachTop).toBeLessThan(resultFlow.storyTop);
  expect(resultFlow.shareTop).toBeLessThan(resultFlow.breakdownTop);
  const [reviewBox, tabbarBox] = await Promise.all([
    review.boundingBox(),
    page.locator(".mobile-tabbar").boundingBox(),
  ]);
  if (info.project.name === "mobile") {
    expect(reviewBox).not.toBeNull();
    expect(tabbarBox).not.toBeNull();
    expect(reviewBox!.y + reviewBox!.height).toBeLessThanOrEqual(tabbarBox!.y - 8);
  }

  await page.screenshot({ path: info.outputPath("results-next-move.png"), fullPage: true, animations: "disabled" });
  await page.setViewportSize({ width: 320, height: 568 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  if (info.project.name === "mobile") {
    await page.evaluate(() => scrollTo(0, 0));
    const [compactReview, compactActionBar] = await Promise.all([
      review.boundingBox(),
      page.locator(".mobile-tabbar").boundingBox(),
    ]);
    expect(compactReview).not.toBeNull();
    expect(compactActionBar).not.toBeNull();
    expect(compactReview!.y + compactReview!.height)
      .toBeLessThanOrEqual(compactActionBar!.y - 8);
    await page.locator(".mobile-tabbar").getByRole("button", {
      name: "Review missed sections for Neon Pulse",
      exact: true,
    }).click();
    const [practiceBox, compactTabbarBox] = await Promise.all([
      dropPractice.boundingBox(),
      page.locator(".mobile-tabbar").boundingBox(),
    ]);
    expect(practiceBox).not.toBeNull();
    expect(compactTabbarBox).not.toBeNull();
    expect(practiceBox!.y + practiceBox!.height).toBeLessThanOrEqual(compactTabbarBox!.y - 8);
  }

  const statRows = await page.locator(".results-stats .stat-pill").evaluateAll((nodes) =>
    new Set(nodes.map((node) => Math.round(node.getBoundingClientRect().top))).size,
  );
  const playRows = await page.locator(".results-play-actions .btn").evaluateAll((nodes) =>
    new Set(nodes.map((node) => Math.round(node.getBoundingClientRect().top))).size,
  );
  const shareTops = await page.locator(".results-share-actions .btn").evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
  );
  expect(statRows).toBe(1);
  expect(playRows).toBe(1);
  expect(shareTops.length).toBeGreaterThanOrEqual(2);
  expect(shareTops[0]).toBe(shareTops[1]);
});

test("Results keeps diagnostics compact on phones and expanded on desktop", async ({ page }, info) => {
  await seedResult(page, {
    missEvents: [
      { tMs: 8_000, lane: 0 },
      { tMs: 9_000, lane: 1 },
      { tMs: 30_000, lane: 3 },
    ],
    timing: { early: 20, late: 60, meanMs: 14 },
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/results");

  const diagnostics = page.locator(".result-diagnostics");
  const summary = diagnostics.locator("summary");
  const firstJudgment = diagnostics.locator(".judge-row").first();
  await expect(diagnostics).toBeVisible();
  await expect(summary).toContainText("Run details");
  await expect(summary).toContainText("114 notes · 3 misses");

  if (info.project.name === "mobile") {
    const phoneViewport = page.viewportSize();
    expect(phoneViewport).not.toBeNull();
    await expect(diagnostics).not.toHaveAttribute("open", "");
    await expect(firstJudgment).toBeHidden();
    const collapsedBox = await diagnostics.boundingBox();
    expect(collapsedBox).not.toBeNull();
    expect(collapsedBox!.height).toBeGreaterThanOrEqual(44);
    expect(collapsedBox!.height).toBeLessThanOrEqual(64);

    await page.setViewportSize({ width: 900, height: 800 });
    await expect(diagnostics).toHaveAttribute("open", "");
    await page.setViewportSize(phoneViewport!);
    await expect(diagnostics).not.toHaveAttribute("open", "");
    await page.screenshot({
      path: info.outputPath("results-diagnostics-collapsed.png"),
      fullPage: true,
      animations: "disabled",
    });

    await summary.click();
    await expect(diagnostics).toHaveAttribute("open", "");
    await expect(firstJudgment).toBeVisible();
    await expect(diagnostics.locator(".timing-bar")).toBeVisible();
  } else {
    await expect(diagnostics).toHaveAttribute("open", "");
    await expect(firstJudgment).toBeVisible();
    await expect(diagnostics.locator(".timing-bar")).toBeVisible();
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("Results keeps a filtered Library origin across every next-run action", async ({ page }, info) => {
  await seedResult(page, {
    mode: "casual",
    accuracy: 94,
    counts: { perfect: 100, great: 10, good: 4, miss: 0 },
    missEvents: [],
  });
  const libraryHref = "/library?q=neon+pulse&genre=Electronic";
  const returnParam = encodeURIComponent(libraryHref);
  await page.goto(`/results?returnTo=${returnParam}`);

  await expect(page.getByRole("link", { name: "Play Easy Arcade", exact: true })).toHaveAttribute(
    "href",
    `/play/bs-s1-01?tier=easy&mode=arcade&returnTo=${returnParam}`,
  );
  await expect(page.getByRole("link", { name: "Replay", exact: true })).toHaveAttribute(
    "href",
    `/play/bs-s1-01?tier=easy&mode=casual&returnTo=${returnParam}`,
  );
  await expect(page.getByRole("link", { name: "Change setup", exact: true })).toHaveAttribute(
    "href",
    `/track/bs-s1-01?tier=easy&mode=casual&returnTo=${returnParam}`,
  );
  const nextTrack = page.locator(".results-next-track");
  const playNext = nextTrack.getByRole("link", { name: "Play next", exact: true });
  await expect(nextTrack).toContainText("Up next");
  const nextHref = await playNext.getAttribute("href");
  expect(nextHref).not.toBeNull();
  const nextUrl = new URL(nextHref!, "https://beatscape.test");
  expect(nextUrl.pathname).toMatch(/^\/play\/[^/]+$/);
  expect(nextUrl.pathname).not.toBe("/play/bs-s1-01");
  expect(nextUrl.searchParams.get("tier")).toBe("easy");
  expect(nextUrl.searchParams.get("mode")).toBe("casual");
  expect(nextUrl.searchParams.get("returnTo")).toBe(libraryHref);
  const nextBox = await playNext.boundingBox();
  expect(nextBox).not.toBeNull();
  expect(nextBox!.height).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole("link", { name: "Browse Library", exact: true }))
    .toHaveAttribute("href", libraryHref);
  if (info.project.name === "mobile") {
    const fixedArcade = page.locator(".mobile-tabbar .tab-play");
    await expect(fixedArcade).toContainText("Arcade");
    await expect(fixedArcade).toHaveAttribute(
      "aria-label",
      "Play Easy Arcade for Neon Pulse",
    );
    await expect(fixedArcade).toHaveAttribute(
      "href",
      `/play/bs-s1-01?tier=easy&mode=arcade&returnTo=${returnParam}`,
    );
  }
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/results$/);
});

test("signed timing becomes a specific correction with one Replay", async ({ page }) => {
  await seedResult(page, {
    tier: "standard",
    score: 180_000,
    accuracy: 96,
    grade: "S",
    counts: { perfect: 180, great: 30, good: 8, miss: 0 },
    totalNotes: 218,
    missEvents: [],
    timing: { early: 12, late: 206, meanMs: 18.2 },
  });
  await page.goto("/results");

  const coach = page.getByRole("region", { name: "You’re landing 18 ms late" });
  await expect(coach).toContainText("Start each input a touch earlier");
  await expect(page.locator("#miss-review")).toHaveCount(0);
  const replay = page.getByRole("link", { name: "Replay", exact: true });
  await expect(replay).toHaveCount(1);
  await expect(replay).toHaveAttribute("href", /\/play\/bs-s1-01\?tier=standard&mode=arcade$/);
});

test("three consistently late Arcade runs offer calibration and return to the exact setup", async ({ page }, info) => {
  const current = {
    tier: "standard",
    score: 180_000,
    accuracy: 96,
    grade: "S",
    counts: { perfect: 180, great: 30, good: 8, miss: 0 },
    totalNotes: 218,
    missEvents: [],
    timing: { early: 12, late: 206, meanMs: 14.4 },
  };
  const history = [
    {
      track_id: "bs-s1-02",
      district: "Night Grid",
      tier: "standard",
      mode: "arcade",
      score: 170_000,
      accuracy: 95,
      maxCombo: 160,
      fc: false,
      ap: false,
      failed: false,
      durationMs: 75_000,
      endedAt: "2026-09-11T00:00:00.000Z",
      dateKey: "2026-09-11",
      timing: { early: 14, late: 196, meanMs: 12.1 },
    },
    {
      track_id: "bs-s1-03",
      district: "Glass Rim",
      tier: "hard",
      mode: "arcade",
      score: 220_000,
      accuracy: 94,
      maxCombo: 180,
      fc: false,
      ap: false,
      failed: false,
      durationMs: 90_000,
      endedAt: "2026-09-10T00:00:00.000Z",
      dateKey: "2026-09-10",
      timing: { early: 10, late: 200, meanMs: 13.2 },
    },
  ];
  await seedResult(page, current, history);
  await page.goto("/results");

  const coach = page.getByRole("region", { name: "You’re consistently 13 ms late" });
  await expect(coach).toContainText("last 3 full Arcade clears");
  const calibrate = coach.getByRole("link", { name: "Calibrate timing", exact: true });
  await expect(calibrate).toHaveAttribute(
    "href",
    /\/calibrate\?return=%2Fplay%2Fbs-s1-01%3Ftier%3Dstandard%26mode%3Darcade$/,
  );
  await page.setViewportSize({ width: 320, height: 568 });
  await calibrate.scrollIntoViewIfNeeded();
  const [calibrateBox, navBox] = await Promise.all([
    calibrate.boundingBox(),
    page.locator(".mobile-tabbar").boundingBox(),
  ]);
  expect(calibrateBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect(calibrateBox!.height).toBeGreaterThanOrEqual(44);
  expect(calibrateBox!.y + calibrateBox!.height).toBeLessThanOrEqual(navBox!.y + 1);
  const fixedCalibrate = page.locator(".mobile-tabbar .tab-play");
  await expect(fixedCalibrate).toContainText("Calibrate");
  await expect(fixedCalibrate).toHaveAttribute("aria-label", "Calibrate timing for Neon Pulse");
  await expect(fixedCalibrate).toHaveAttribute("href", await calibrate.getAttribute("href"));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({
    path: info.outputPath("persistent-timing-coach-320.png"),
    fullPage: true,
    animations: "disabled",
  });
  await calibrate.click();
  await expect(page).toHaveURL(
    /\/calibrate\?return=%2Fplay%2Fbs-s1-01%3Ftier%3Dstandard%26mode%3Darcade$/,
  );
  await page.getByRole("button", { name: /Keep current offset/ }).click();
  await expect(page).toHaveURL(/\/play\/bs-s1-01\?tier=standard&mode=arcade$/);
  await expect(page.getByRole("button", { name: "Start playing", exact: true })).toBeVisible();
});

test("a failed Arcade run exposes an immediate recovery choice", async ({ page }, info) => {
  await seedResult(page, {
    failed: true,
    score: 12_000,
    accuracy: 44,
    grade: "D",
    counts: { perfect: 20, great: 8, good: 5, miss: 20 },
    totalNotes: 114,
    missEvents: [{ tMs: 8_000, lane: 0 }, { tMs: 9_000, lane: 1 }],
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/results");

  await expect(page.locator(".badge.failed")).toHaveText("ARCADE FAILED");
  await expect(page.locator(".failed-run-note")).toContainText("HP depleted — run failed");
  await expect(page.locator(".failed-run-note"))
    .toContainText("not added to your Personal Best or Local Board");
  await expect(page.locator(".results-next-track")).toHaveCount(0);
  const recovery = page.getByRole("region", { name: "Take the pressure off" });
  await expect(recovery).toContainText("wider timing and no HP fail");
  const tryCasual = recovery.getByRole("link", { name: "Try Casual", exact: true });
  await expect(tryCasual).toHaveAttribute("href", /\/play\/bs-s1-01\?tier=easy&mode=casual$/);
  const exactRetryHref = /\/play\/bs-s1-01\?tier=easy&mode=arcade$/;

  if (info.project.name === "mobile") {
    const fixedCasual = page.locator(".mobile-tabbar .tab-play");
    await expect(fixedCasual).toContainText("Casual");
    await expect(fixedCasual).toHaveAttribute("aria-label", "Try Casual for Neon Pulse");
    await expect(fixedCasual).toHaveAttribute("href", /\/play\/bs-s1-01\?tier=easy&mode=casual$/);
    expect((await tryCasual.boundingBox())!.height).toBeLessThanOrEqual(56);
  } else {
    const retry = recovery.getByRole("link", { name: "Retry Arcade", exact: true });
    await expect(retry).toHaveAttribute("href", exactRetryHref);
    const [recoveryBox, storyBox] = await Promise.all([
      recovery.boundingBox(),
      page.locator(".shift-result").boundingBox(),
    ]);
    expect(recoveryBox).not.toBeNull();
    expect(storyBox).not.toBeNull();
    expect(recoveryBox!.y + recoveryBox!.height).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
    expect(recoveryBox!.y).toBeLessThan(storyBox!.y);
  }

  await page.screenshot({
    path: info.outputPath("failed-recovery-viewport.png"),
    animations: "disabled",
  });
});
