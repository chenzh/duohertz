import { expect, test, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    const run = (trackId: string, dateKey: string) => ({
      track_id: trackId,
      district: "Pulse Core",
      tier: "standard",
      mode: "arcade",
      score: 100000,
      accuracy: 93,
      maxCombo: 120,
      fc: true,
      ap: false,
      failed: false,
      durationMs: 90000,
      endedAt: `${dateKey}T12:00:00.000Z`,
      dateKey,
    });
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_display_name", "Riley West");
    localStorage.setItem("bs_rank", "beat-player");
    localStorage.setItem("bs_runs", JSON.stringify([
      run("bs-s1-01", "2026-09-10"),
      { track_id: "invalid-old-save" },
      run("bs-s1-02", "2026-09-11"),
    ]));
    localStorage.setItem("bs_achievements", JSON.stringify([
      "ach-first-clear",
      "retired-achievement",
      "ach-first-fc",
    ]));
  });
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("Profile makes rank and achievement progress explicit", async ({ page }, info) => {
  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
  await expect(page.locator(".profile-current-rank")).toContainText("Beat Player");
  await expect(page.locator(".profile-next-rank")).toContainText("Rhythm Master");
  await expect(page.locator(".profile-next-rank")).toContainText("Complete every goal");

  const progress = page.getByRole("progressbar");
  await expect(progress).toHaveCount(2);
  await expect(page.getByRole("progressbar", { name: "Arcade Full Combos progress" })).toHaveAttribute("value", "2");
  await expect(page.getByRole("progressbar", { name: "Recent Arcade accuracy progress" })).toHaveAttribute("value", "92");

  await expect(page.getByRole("listitem", { name: "First Light — Unlocked" })).toBeVisible();
  await expect(page.getByRole("listitem", { name: "Absolute Pulse — Locked" })).toBeVisible();
  await expect(page.locator(".profile-achievement-head")).toContainText("2 / 8 unlocked");
  await expect(page.locator(".profile-stats")).toContainText("2");

  const rankLadder = page.getByRole("list", { name: "Rank ladder" });
  const streak = page.getByRole("region", { name: "Night streak status" });
  const streakAction = streak.getByRole("link", { name: "Start First Shift", exact: true });
  await expect(streakAction).toHaveAttribute(
    "href",
    "/play/bs-s1-05?tier=easy&mode=casual&shift=studio",
  );
  await expect(streak.locator(".profile-next-run-meta")).toContainText("Next · Voltage Drop");
  if (info.project.name === "mobile") {
    const ladderToggle = page.getByRole("button", { name: "Show rank ladder", exact: true });
    await expect(ladderToggle).toBeVisible();
    expect((await ladderToggle.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(ladderToggle).toHaveAttribute("aria-expanded", "false");
    await expect(rankLadder).toBeHidden();
    expect((await streak.boundingBox())!.y).toBeLessThan((await ladderToggle.boundingBox())!.y);
    await page.screenshot({ path: info.outputPath("profile-progress-compact.png"), fullPage: true, animations: "disabled" });

    await ladderToggle.click();
    await expect(page.getByRole("button", { name: "Hide rank ladder", exact: true })).toHaveAttribute("aria-expanded", "true");
    await expect(rankLadder).toBeVisible();
  } else {
    await expect(page.getByRole("button", { name: /rank ladder/i })).toHaveCount(0);
    await expect(rankLadder).toBeVisible();
  }
  await expect(page.getByRole("listitem", { name: "Beat Player — Current" })).toHaveAttribute("aria-current", "step");

  const achievementCards = page.locator(".achievement-card");
  const [firstAchievement, secondAchievement] = await Promise.all([
    achievementCards.nth(0).boundingBox(),
    achievementCards.nth(1).boundingBox(),
  ]);
  expect(firstAchievement).not.toBeNull();
  expect(secondAchievement).not.toBeNull();
  expect(Math.abs(firstAchievement!.y - secondAchievement!.y)).toBeLessThanOrEqual(1);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const primary = page.locator(".profile > .cta-row").getByRole("link", { name: "Start First Shift", exact: true });
  await expect(primary).toBeVisible();
  await expect(primary).toHaveAttribute("href", await streakAction.getAttribute("href") ?? "");
  expect((await primary.boundingBox())!.height).toBeGreaterThanOrEqual(44);

  await page.screenshot({ path: info.outputPath("profile-progress.png"), fullPage: true, animations: "disabled" });
});

test("Profile sends a returning player straight into the next exact run", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_first_shift_v1", JSON.stringify({
      v: 1,
      completed: [
        { id: "studio", runId: "profile-studio" },
        { id: "yard", runId: "profile-yard" },
        { id: "rooftop", runId: "profile-rooftop" },
      ],
    }));
  });
  await page.goto("/profile");

  const streak = page.getByRole("region", { name: "Night streak status" });
  const streakAction = streak.getByRole("link", { name: "Continue the set", exact: true });
  const bottomAction = page.locator(".profile > .cta-row").getByRole("link", {
    name: "Continue the set",
    exact: true,
  });
  const href = await streakAction.getAttribute("href");

  expect(href).not.toBeNull();
  await expect(bottomAction).toHaveAttribute("href", href!);
  const target = new URL(href!, page.url());
  expect(target.pathname).toMatch(/^\/play\/[^/]+$/);
  expect(target.pathname).not.toBe("/play/bs-s1-02");
  expect(target.searchParams.get("tier")).toBe("standard");
  expect(target.searchParams.get("mode")).toBe("arcade");
  await expect(streak.locator(".profile-next-run-meta")).toContainText("Next ·");
});

test("a returning Echo Novice sees earned progress instead of a first-run instruction", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_rank", "echo-novice");
    localStorage.setItem("bs_runs", JSON.stringify([{
      track_id: "bs-s1-01",
      district: "Pulse Core",
      tier: "easy",
      mode: "casual",
      score: 12000,
      accuracy: 82.5,
      maxCombo: 24,
      fc: false,
      ap: false,
      failed: false,
      durationMs: 75000,
      endedAt: "2026-09-14T12:00:00.000Z",
      dateKey: "2026-09-14",
    }]));
  });
  await page.goto("/profile");

  const currentRank = page.locator(".profile-current-rank");
  await expect(currentRank).toContainText("Echo Novice");
  await expect(currentRank).toContainText("First run complete");
  await expect(currentRank).not.toContainText("Finish your first run");
});

test("new honors are announced on Results and lead into Profile", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    sessionStorage.setItem("bs_last_run", JSON.stringify({
      v: 1,
      track_id: "bs-s1-01",
      title: "Neon Pulse",
      artist: "Luma Drive",
      tier: "standard",
      mode: "arcade",
      score: 100000,
      accuracy: 93,
      maxCombo: 120,
      grade: "S",
      fc: true,
      ap: false,
      failed: false,
      counts: { perfect: 100, great: 5, good: 0, miss: 0 },
      totalNotes: 105,
      missEvents: [],
      durationMs: 90000,
      endedAt: "2026-09-12T12:00:00.000Z",
    }));
    sessionStorage.setItem("bs_new_achievements", JSON.stringify(["ach-first-clear", "ach-first-fc"]));
    sessionStorage.setItem("bs_rank_up", "beat-player");
  });

  await page.goto("/results");
  const honorUpdate = page.locator(".honor-toast");
  await expect(honorUpdate).toHaveAttribute("role", "status");
  await expect(honorUpdate).toContainText("Rank up — Beat Player");
  await expect(honorUpdate).toContainText("First Light");
  await expect(honorUpdate).toContainText("Full Circuit");
  await honorUpdate.getByRole("link", { name: "View profile", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.locator(".profile-current-rank")).toContainText("Beat Player");
});
