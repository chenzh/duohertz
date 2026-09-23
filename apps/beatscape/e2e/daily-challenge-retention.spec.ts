import { expect, test, type APIRequestContext } from "@playwright/test";
import { CURRENT_SCORING_VERSION } from "../src/engine/scoringRules";

test.use({ serviceWorkers: "block" });

type CatalogTrack = { track_id: string; title: string; artist: string };

function dateHash(dateKey: string): number {
  let hash = 0;
  for (let index = 0; index < dateKey.length; index++) {
    hash = (hash * 31 + dateKey.charCodeAt(index)) >>> 0;
  }
  return hash;
}

async function dailyFixture(request: APIRequestContext, dateKey = new Date().toISOString().slice(0, 10)) {
  const response = await request.get("/catalog.json");
  expect(response.ok()).toBe(true);
  const catalog = await response.json() as { tracks: CatalogTrack[] };
  const ordered = [...catalog.tracks].sort((left, right) => left.track_id.localeCompare(right.track_id));
  const track = ordered[dateHash(dateKey) % ordered.length]!;
  const other = ordered.find((candidate) => candidate.track_id !== track.track_id)!;
  const href = `/play/${track.track_id}?tier=standard&mode=arcade&date=${dateKey}&daily=1`;
  return { dateKey, track, other, href, scoringVersion: CURRENT_SCORING_VERSION };
}

test("Home counts down and rolls the Daily challenge over at UTC midnight without reloading", async ({ page, request }) => {
  const today = await dailyFixture(request, "2026-09-16");
  const tomorrow = await dailyFixture(request, "2026-09-17");
  expect(tomorrow.track.track_id).not.toBe(today.track.track_id);

  await page.clock.install({ time: new Date("2026-09-16T23:59:30.000Z") });
  await page.goto("/");

  const banner = page.getByRole("region", { name: "Today's Daily challenge" });
  await expect(banner).toContainText(today.track.title);
  await expect(banner).toContainText("Resets in <1m");
  await expect(banner.getByRole("link", { name: "Play Daily", exact: true }))
    .toHaveAttribute("href", today.href);
  const originalBanner = await banner.elementHandle();

  await page.clock.fastForward(31_000);

  await expect(banner).toContainText(tomorrow.track.title);
  await expect(banner).toContainText("Resets in 23h 59m");
  await expect(banner.getByRole("link", { name: "Play Daily", exact: true }))
    .toHaveAttribute("href", tomorrow.href);
  expect(await banner.evaluate((node, original) => node === original, originalBanner)).toBe(true);
});

test("an open Daily board swaps to the new UTC score set without reloading", async ({ page, request }) => {
  const today = await dailyFixture(request, "2026-09-16");
  const tomorrow = await dailyFixture(request, "2026-09-17");
  await page.clock.install({ time: new Date("2026-09-16T23:59:30.000Z") });
  await page.addInitScript(({ today, tomorrow }) => {
    localStorage.setItem("bs_daily_board", JSON.stringify([
      {
        track_id: today.track.track_id,
        title: today.track.title,
        tier: "standard",
        score: 111_111,
        accuracy: 91.11,
        name: "Today",
        at: `${today.dateKey}T20:00:00.000Z`,
        dateKey: today.dateKey,
        scoringVersion: today.scoringVersion,
      },
      {
        track_id: tomorrow.track.track_id,
        title: tomorrow.track.title,
        tier: "standard",
        score: 222_222,
        accuracy: 92.22,
        name: "Tomorrow",
        at: `${tomorrow.dateKey}T00:00:00.000Z`,
        dateKey: tomorrow.dateKey,
        scoringVersion: tomorrow.scoringVersion,
      },
    ]));
  }, { today, tomorrow });
  await page.goto("/leaderboard?view=daily");

  const panel = page.getByRole("tabpanel", { name: "Daily challenge" });
  await expect(page.locator(".page-header")).toContainText("Resets in <1m");
  await expect(panel).toContainText("111,111");
  await expect(panel).not.toContainText("222,222");
  const originalPanel = await panel.elementHandle();

  await page.clock.fastForward(31_000);

  await expect(page.locator(".page-header")).toContainText("Resets in 23h 59m");
  await expect(panel).toContainText("222,222");
  await expect(panel).not.toContainText("111,111");
  await expect(panel.getByRole("link", { name: /Play today/ })).toHaveAttribute("href", tomorrow.href);
  expect(await panel.evaluate((node, original) => node === original, originalPanel)).toBe(true);
});

test("Home turns a cleared Daily into a precise improve loop", async ({ page, request }, info) => {
  const daily = await dailyFixture(request);
  await page.addInitScript(({ dateKey, track, other, scoringVersion }) => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_daily_board", JSON.stringify([
      {
        track_id: track.track_id,
        title: track.title,
        tier: "standard",
        score: 123456,
        accuracy: 98.76,
        name: "Riley West",
        at: `${dateKey}T06:00:00.000Z`,
        dateKey,
        scoringVersion,
      },
      {
        track_id: other.track_id,
        title: other.title,
        tier: "standard",
        score: 999999,
        accuracy: 100,
        name: "Forged route",
        at: `${dateKey}T07:00:00.000Z`,
        dateKey,
        scoringVersion,
      },
    ]));
  }, daily);
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });

  await page.goto("/");
  const banner = page.getByRole("region", { name: "Today's Daily challenge" });
  await expect(banner).toContainText("Daily cleared");
  await expect(banner).toContainText(daily.track.title);
  await expect(banner).toContainText("Best 123,456 PTS");
  await expect(banner).toContainText("98.76% ACC");
  await expect(banner).toContainText("1 clear");
  await expect(banner).not.toContainText("999,999");
  const improve = banner.getByRole("link", { name: "Improve score", exact: true });
  await expect(improve).toHaveAttribute("href", daily.href);
  expect((await improve.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(banner.getByRole("link", { name: "View Daily board", exact: true }))
    .toHaveAttribute("href", "/leaderboard?view=daily");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await banner.scrollIntoViewIfNeeded();
  await expect(banner).toHaveClass(/is-visible/);
  await expect(banner).toHaveCSS("opacity", "1");
  await banner.screenshot({ path: info.outputPath("daily-home-cleared.png"), animations: "disabled" });
});

test("Home promotes Daily after the hero once First Shift is complete", async ({ page, request }, info) => {
  const daily = await dailyFixture(request);
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_first_shift_v1", JSON.stringify({
      v: 1,
      completed: [
        { id: "studio", runId: "studio-run" },
        { id: "yard", runId: "yard-run" },
        { id: "rooftop", runId: "rooftop-run" },
      ],
    }));
  });
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });

  await page.goto("/");
  const hero = page.locator(".hero-split");
  const banner = page.getByRole("region", { name: "Today's Daily challenge" });
  const story = page.locator(".shift-home-card");
  await expect(hero).toHaveCount(1);
  await expect(banner).toHaveCount(1);
  await expect(story).toHaveCount(1);

  expect(await hero.evaluate((node, dailyNode) => Boolean(
    node.compareDocumentPosition(dailyNode as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
  ), await banner.elementHandle())).toBe(true);
  expect(await banner.evaluate((node, storyNode) => Boolean(
    node.compareDocumentPosition(storyNode as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
  ), await story.elementHandle())).toBe(true);

  await banner.scrollIntoViewIfNeeded();
  await expect(banner).toHaveClass(/is-visible/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await banner.screenshot({ path: info.outputPath("daily-return-priority.png"), animations: "disabled" });
});

test("Home keeps First Shift ahead of Daily for a new player", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
  await page.goto("/");

  const story = page.locator(".shift-home-card");
  const banner = page.getByRole("region", { name: "Today's Daily challenge" });
  await expect(story).toHaveCount(1);
  await expect(banner).toHaveCount(1);
  expect(await story.evaluate((node, dailyNode) => Boolean(
    node.compareDocumentPosition(dailyNode as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
  ), await banner.elementHandle())).toBe(true);
});

test("only today's exact Daily route receives Daily game context", async ({ page, request }, info) => {
  const daily = await dailyFixture(request);
  await page.addInitScript(({ track, scoringVersion }) => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_scores", JSON.stringify([{
      track_id: track.track_id,
      tier: "standard",
      mode: "arcade",
      score: 924_000,
      accuracy: 92.4,
      at: "2026-09-13T12:00:00.000Z",
      scoringVersion,
    }]));
  }, daily);
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });

  await page.goto(daily.href);
  const context = page.getByRole("note", { name: `Daily challenge for ${daily.dateKey}` });
  await expect(context).toContainText("Daily challenge");
  await expect(context).toContainText("Standard Arcade");
  await expect(page.locator(".play-meta-tier")).toContainText("Daily");
  await expect(page.locator(".personal-best-target, .hud-score-target")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("daily-ready.png"), animations: "disabled" });

  await page.goto(`/play/${daily.other.track_id}?tier=standard&mode=arcade&date=${daily.dateKey}&daily=1`);
  await expect(page.getByRole("note", { name: /Daily challenge for/ })).toHaveCount(0);
  await expect(page.locator(".play-meta-tier")).not.toContainText("Daily");
});

test("Daily Results report today's best and preserve the ranked retry", async ({ page, request }, info) => {
  const daily = await dailyFixture(request);
  const endedAt = `${daily.dateKey}T08:00:00.000Z`;
  await page.addInitScript(({ dateKey, track, endedAt, scoringVersion }) => {
    localStorage.setItem("bs_onboarded", "true");
    const run = {
      v: 1,
      track_id: track.track_id,
      title: track.title,
      artist: track.artist,
      tier: "standard",
      mode: "arcade",
      score: 123456,
      accuracy: 98.76,
      maxCombo: 98,
      grade: "S",
      fc: false,
      ap: false,
      failed: false,
      counts: { perfect: 90, great: 6, good: 2, miss: 1 },
      totalNotes: 99,
      durationMs: 75000,
      endedAt,
      dailyDateKey: dateKey,
      scoringVersion,
    };
    sessionStorage.setItem("bs_last_run", JSON.stringify(run));
    localStorage.setItem("bs_last_run_local", JSON.stringify(run));
    localStorage.setItem("bs_daily_board", JSON.stringify([{
      track_id: track.track_id,
      title: track.title,
      tier: "standard",
      score: 123456,
      accuracy: 98.76,
      name: "Riley West",
      at: endedAt,
      dateKey,
      scoringVersion,
    }]));
  }, { ...daily, endedAt });
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });

  await page.goto("/results");
  await expect(page.locator(".results-hero-card")).toContainText("DAILY COMPLETE");
  const result = page.getByRole("region", { name: "Daily challenge result" });
  await expect(result).toContainText("New Daily best");
  await expect(result).toContainText("Best today 123,456 PTS");
  await expect(result).toContainText("98.76% ACC");
  await expect(result).toContainText("1 clear");
  const improve = result.locator(".daily-result-actions a.primary");
  await expect(improve).toHaveAttribute("href", daily.href);
  await expect(result.getByRole("link", { name: "View Daily board", exact: true }))
    .toHaveAttribute("href", "/leaderboard?view=daily");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await result.screenshot({ path: info.outputPath("daily-results.png"), animations: "disabled" });

  const activeImprove = info.project.name === "mobile"
    ? page.getByRole("link", { name: "Improve today's Daily score", exact: true })
    : result.getByRole("link", { name: "Improve Daily", exact: true });
  if (info.project.name === "mobile") {
    const mobileImprove = activeImprove;
    await expect(mobileImprove).toHaveAttribute("href", daily.href);
    expect((await mobileImprove.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }

  await activeImprove.click();
  await expect(page).toHaveURL(new RegExp(`${daily.href.replace(/[?]/g, "\\?")}$`));
  await expect(page.getByRole("note", { name: `Daily challenge for ${daily.dateKey}` })).toBeVisible();
});

test("Daily board deep links to the Daily tab and hides forged-route scores", async ({ page, request }) => {
  const daily = await dailyFixture(request);
  await page.addInitScript(({ dateKey, track, other, scoringVersion }) => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_daily_board", JSON.stringify([
      { track_id: track.track_id, title: track.title, tier: "standard", score: 123456, accuracy: 98.76, name: "Riley", at: `${dateKey}T06:00:00.000Z`, dateKey, scoringVersion },
      { track_id: other.track_id, title: other.title, tier: "standard", score: 999999, accuracy: 100, name: "Forged", at: `${dateKey}T07:00:00.000Z`, dateKey, scoringVersion },
    ]));
  }, daily);

  await page.goto("/leaderboard?view=daily");
  await expect(page.getByRole("tab", { name: "Daily challenge" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".board-row")).toHaveCount(1);
  await expect(page.locator(".board-row")).toContainText("123,456");
  await expect(page.locator(".board-row")).not.toContainText("999,999");
});
