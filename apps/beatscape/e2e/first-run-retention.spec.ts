import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const ENDED_AT = "2026-09-13T02:45:00.000Z";
const RUN_ID = `bs-s1-05:${ENDED_AT}`;

const firstShiftRun = {
  v: 1,
  track_id: "bs-s1-05",
  title: "Voltage Drop",
  artist: "Gridline",
  tier: "easy",
  mode: "casual",
  score: 86_400,
  accuracy: 86.4,
  maxCombo: 41,
  grade: "B",
  fc: false,
  ap: false,
  failed: false,
  counts: { perfect: 82, great: 20, good: 10, miss: 4 },
  totalNotes: 116,
  durationMs: 60_000,
  endedAt: ENDED_AT,
  shiftStep: "studio",
};

const noHitFirstShiftRun = {
  ...firstShiftRun,
  score: 0,
  accuracy: 0,
  maxCombo: 0,
  grade: "D",
  counts: { perfect: 0, great: 0, good: 0, miss: 116 },
  endedAt: "2026-09-13T03:15:00.000Z",
};

const shiftResultCases = [
  {
    id: "studio",
    track_id: "bs-s1-05",
    title: "Voltage Drop",
    endedAt: "2026-09-13T02:45:00.000Z",
    from: "Studio return · no signal",
    to: "Studio return · live",
  },
  {
    id: "yard",
    track_id: "bs-s1-06",
    title: "Chrome Riff",
    endedAt: "2026-09-13T02:46:00.000Z",
    from: "Yard speaker · silent",
    to: "Yard speaker · holding a steady signal",
  },
  {
    id: "rooftop",
    track_id: "bs-s2-02",
    title: "Skyline Hook",
    endedAt: "2026-09-13T02:47:00.000Z",
    from: "Rooftop relay · stops at the next building",
    to: "Rooftop relay · reaching the next rooftop",
  },
] as const;

async function seedFirstShiftResult(page: Page) {
  await page.addInitScript(({ run, runId }) => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_first_shift_v1", JSON.stringify({
      v: 1,
      completed: [{ id: "studio", runId }],
    }));
    sessionStorage.setItem("bs_last_run", JSON.stringify(run));
  }, { run: firstShiftRun, runId: RUN_ID });
}

async function expectBefore(first: Locator, second: Locator) {
  await expect(first).toHaveCount(1);
  await expect(second).toHaveCount(1);
  expect(await first.evaluate((node, other) => Boolean(
    node.compareDocumentPosition(other as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
  ), await second.elementHandle())).toBe(true);
}

test.beforeEach(async ({ page }, info) => {
  if (info.title.includes("connected gamepad")) {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "getGamepads", {
        configurable: true,
        value: () => [{
          id: "BeatScape QA Controller",
          index: 0,
          connected: true,
          mapping: "standard",
          axes: [0, 0, 0, 0],
          buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
          timestamp: performance.now(),
        }],
      });
    });
  }
  if (info.title.includes("no-hit first run")) {
    await page.addInitScript((run) => {
      localStorage.setItem("bs_onboarded", "true");
      localStorage.setItem("bs_first_shift_v1", JSON.stringify({ v: 1, completed: [] }));
      sessionStorage.setItem("bs_last_run", JSON.stringify(run));
    }, noHitFirstShiftRun);
  } else {
    await seedFirstShiftResult(page);
  }
  await page.goto("/results");
});

test("the first result shows performance before the story reply", async ({ page }) => {
  await expectBefore(page.locator(".results-hero-card"), page.locator(".results-stats"));
  await expectBefore(page.locator(".results-stats"), page.locator(".shift-result"));
});

test("the next story run is offered before the circuit recap", async ({ page }, info) => {
  const story = page.locator(".shift-result");
  const nextRun = story.getByRole("link", { name: "Play Chrome Riff · 2/3", exact: true });
  const details = story.locator(".shift-result-details");
  await expect(nextRun).toHaveAttribute(
    "href",
    /\/play\/bs-s1-06\?tier=easy&mode=casual&shift=yard$/,
  );
  if (info.project.name === "mobile") {
    const fixedStoryRun = page.locator(".mobile-tabbar .tab-play");
    await expect(fixedStoryRun).toHaveText("Continue");
    await expect(fixedStoryRun).toHaveAccessibleName(
      "Continue First Shift · 2/3 · Chrome Riff · Easy Casual",
    );
    await expect(fixedStoryRun).toHaveAttribute(
      "href",
      "/play/bs-s1-06?tier=easy&mode=casual&shift=yard",
    );
  }
  await expectBefore(story.locator(".shift-next"), story.locator(".shift-circuit"));
  await expectBefore(story.locator(".shift-next"), page.locator(".results-share-panel"));
  await expect(details).not.toHaveAttribute("open", "");
  await expect(story.getByText("I nearly threw this desk out last week.", { exact: false })).toBeHidden();
  const nextBox = (await nextRun.boundingBox())!;
  const summaryBox = (await details.locator("summary").boundingBox())!;
  const tabbarBox = await page.locator(".mobile-tabbar").boundingBox();
  const foldBottom = tabbarBox?.y ?? page.viewportSize()!.height;
  expect(nextBox.height).toBeGreaterThanOrEqual(44);
  expect(nextBox.y + nextBox.height).toBeLessThanOrEqual(foldBottom - 8);
  expect(summaryBox.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
    const [compactNext, compactTabbar] = await Promise.all([
      nextRun.boundingBox(),
      page.locator(".mobile-tabbar").boundingBox(),
    ]);
    expect(compactNext).not.toBeNull();
    expect(compactTabbar).not.toBeNull();
    expect(compactNext!.y + compactNext!.height).toBeLessThanOrEqual(compactTabbar!.y - 8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.screenshot({
    path: info.outputPath("first-result-retention.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("every restored signal keeps its visible status readable in the compact result receipt", async ({ page }, info) => {
  const probe = await page.context().newPage();
  await probe.goto("/");
  for (const [index, signal] of shiftResultCases.entries()) {
    const run = {
      ...firstShiftRun,
      track_id: signal.track_id,
      title: signal.title,
      endedAt: signal.endedAt,
      shiftStep: signal.id,
    };
    const completed = shiftResultCases.slice(0, index + 1).map((entry) => ({
      id: entry.id,
      runId: `${entry.track_id}:${entry.endedAt}`,
    }));
    await probe.evaluate(({ nextRun, receipts }) => {
      localStorage.setItem("bs_first_shift_v1", JSON.stringify({ v: 1, completed: receipts }));
      sessionStorage.setItem("bs_last_run", JSON.stringify(nextRun));
    }, { nextRun: run, receipts: completed });
    await probe.goto("/results");

    const path = probe.getByRole("img", {
      name: `Signal path: ${signal.from} becomes ${signal.to}`,
    });
    await expect(path).toBeVisible();
    const clippedBy = await path.locator("strong").evaluateAll((nodes) => nodes.map(
      (node) => node.scrollWidth - node.clientWidth,
    ));
    expect(Math.max(...clippedBy), `${signal.id} clips a visible signal state`).toBeLessThanOrEqual(1);
    expect(await probe.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    if (index > 0) {
      await probe.screenshot({
        path: info.outputPath(`signal-${signal.id}.png`),
        animations: "disabled",
      });
    }
  }
  await probe.close();
});

test("a no-hit first run keeps one input-aware retry across the result and mobile action", async ({ page }, info) => {
  const story = page.locator(".shift-result");
  const retry = story.getByRole("link", { name: "Try this connection again", exact: true });
  const retryHref = "/play/bs-s1-05?tier=easy&mode=casual&shift=studio";
  await expect(story.getByText(
    info.project.name === "mobile"
      ? "tap a lane as the notes reach the line"
      : "press a lane key as the notes reach the line",
    { exact: false },
  )).toBeVisible();
  await expect(retry).toHaveAttribute("href", retryHref);
  await expect(page.locator(".results-share-panel")).toHaveCount(0);
  await expect(page.locator(".results-actions")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Replay", exact: true })).toHaveCount(0);

  const missReview = page.locator("#miss-review");
  await expect(missReview.locator("summary")).toHaveText("Miss review — 116 misses");
  await missReview.locator("summary").click();
  await expect(missReview.getByText("Detailed miss positions aren't available for this run.", { exact: true }))
    .toBeVisible();

  if (info.project.name === "mobile") {
    const fixedRetry = page.locator(".mobile-tabbar .tab-play");
    await expect(fixedRetry).toContainText("Retry");
    await expect(fixedRetry).toHaveAttribute("href", retryHref);
    await expect(fixedRetry).toHaveAccessibleName("Retry Voltage Drop · First Shift");
  }

  await page.screenshot({
    path: info.outputPath("first-run-no-hit-retry.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("a no-hit first run switches its recovery cue after external keyboard input", async ({ page }, info) => {
  const reply = page.locator(".shift-result .shift-line");
  await expect(reply).toContainText(info.project.name === "mobile" ? "tap a lane" : "press a lane key");
  await page.keyboard.press("a");
  await expect(reply).toContainText("press a lane key");
});

test("a no-hit first run with a connected gamepad names the lane button", async ({ page }) => {
  await expect(page.locator(".shift-result").getByText(
    "press a lane button as the notes reach the line",
    { exact: false },
  )).toBeVisible();
});
