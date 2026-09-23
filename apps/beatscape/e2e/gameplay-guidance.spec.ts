import { expect, test, type Page } from "@playwright/test";

// The slowdown scenario depends on a four-note chart fixture; block the PWA
// worker so it cannot serve the production chart before page.route observes it.
test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("the first run explains its Hold before asking the player to start", async ({ page }, info) => {
  await page.goto("/play/bs-s1-05?tier=easy&mode=casual&shift=studio");
  const overlay = page.locator(".overlay-tap");
  await expect(overlay.locator(".overlay-kicker")).toHaveText("First Shift · Studio return");
  await expect(overlay.locator(".unlock-rights")).toHaveText("AI Original · Owned Rights");
  await expect(overlay.locator(".overlay-kicker")).not.toContainText("AI");
  const rightsFollowStart = await overlay.evaluate((node) => {
    const start = node.querySelector(".unlock-btn");
    const rights = node.querySelector(".unlock-rights");
    return !!start && !!rights && !!(start.compareDocumentPosition(rights) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(rightsFollowStart).toBe(true);
  await expect(overlay.getByText("Chart moves", { exact: true })).toBeVisible();
  await expect(overlay.getByText("Hold", { exact: true })).toBeVisible();
  const holdGuide = info.project.name === "mobile"
    ? "Touch and hold on the line. Lift at the end."
    : "Press when it lands. Release at the end.";
  const wrongSurfaceGuide = info.project.name === "mobile"
    ? "Press when it lands. Release at the end."
    : "Touch and hold on the line. Lift at the end.";
  await expect(overlay.getByText(holdGuide, { exact: true })).toBeVisible();
  await expect(overlay.getByText(wrongSurfaceGuide, { exact: true })).toHaveCount(0);
  await expect(overlay.getByText("Chord", { exact: true })).toHaveCount(0);
  await expect(overlay.getByText("Slide", { exact: true })).toHaveCount(0);

  const guidanceLeadsStart = await overlay.evaluate((node) => {
    const start = node.querySelector(".unlock-btn");
    const guides = [
      node.querySelector(".unlock-hint"),
      node.querySelector(".unlock-mechanics"),
    ];
    return !!start && guides.every((guide) =>
      !!guide && !!(guide.compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(guidanceLeadsStart).toBe(true);
  const mechanicsBox = (await overlay.locator(".unlock-mechanics").boundingBox())!;
  const startBox = (await overlay.locator(".unlock-btn").boundingBox())!;
  expect(mechanicsBox.y + mechanicsBox.height).toBeLessThanOrEqual(startBox.y + 1);

  if (info.project.name === "mobile") {
    await expect(overlay.locator(".unlock-touch-lanes span")).toHaveCount(4);
    await expect(overlay.locator(".unlock-hint")).toHaveText("Tap notes on the line");
    await expect(overlay.getByText("Demo · no progress saved", { exact: true })).toHaveCount(0);
    await expect(overlay.locator(".unlock-keys")).toHaveCount(0);
    await expect(overlay.locator(".unlock-shortcuts")).toHaveCount(0);
  } else {
    await expect(overlay.locator(".unlock-keys")).toBeVisible();
    await expect(overlay.locator(".unlock-touch-lanes")).toHaveCount(0);
    await expect(overlay.locator(".unlock-shortcuts")).toBeVisible();
    await expect(overlay.locator(".unlock-shortcuts")).toHaveAttribute(
      "aria-label",
      "Keyboard shortcuts. P or Escape pauses. R restarts.",
    );
  }

  const card = (await overlay.locator(".overlay-card").boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(card.y).toBeGreaterThanOrEqual(0);
  expect(card.y + card.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("first-run-hold-guide.png"), animations: "disabled" });
});

test("a 320px touch player can start with the lane and chart guides in view", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "This is the minimum touch viewport contract.");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/play/bs-s1-05?tier=easy&mode=casual&shift=studio");

  const overlay = page.locator(".overlay-tap");
  const essentials = [
    overlay.getByRole("button", { name: "Start playing", exact: true }),
    overlay.locator(".unlock-touch-lanes"),
    overlay.locator(".unlock-hint"),
    overlay.locator(".unlock-mechanics"),
  ];
  const viewport = page.viewportSize()!;

  for (const essential of essentials) {
    await expect(essential).toBeVisible();
    const box = (await essential.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  }

  await expect(overlay.locator(".unlock-touch-lanes span")).toHaveCount(4);
  await expect(overlay.locator(".unlock-hint")).toHaveText("Tap notes on the line");
  await expect(overlay.getByText(
    "Touch and hold on the line. Lift at the end.",
    { exact: true },
  )).toBeVisible();
  const holdPreview = overlay.locator('[data-mechanic-preview="hold"]');
  await expect(holdPreview).toBeVisible();
  await expect(holdPreview).toHaveAttribute("aria-hidden", "true");
  await expect(holdPreview.locator(".unlock-mechanic-note")).toHaveCount(2);
  await expect(holdPreview.locator(".unlock-mechanic-path")).toHaveCount(1);
  const holdPreviewBox = (await holdPreview.boundingBox())!;
  expect(holdPreviewBox.y).toBeGreaterThanOrEqual(0);
  expect(holdPreviewBox.y + holdPreviewBox.height).toBeLessThanOrEqual(viewport.height + 1);
  const startBox = (await essentials[0].boundingBox())!;
  expect(startBox.height).toBeGreaterThanOrEqual(44);
  expect(startBox.height).toBeLessThanOrEqual(64);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("first-run-320-touch-guide.png"), animations: "disabled" });

  const rights = overlay.locator(".unlock-rights");
  await rights.scrollIntoViewIfNeeded();
  await expect(rights).toBeVisible();
  const rightsBox = (await rights.boundingBox())!;
  expect(rightsBox.y).toBeGreaterThanOrEqual(0);
  expect(rightsBox.y + rightsBox.height).toBeLessThanOrEqual(viewport.height + 1);
});

test("the ready card never advertises P or R after either key becomes a lane", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "Touch ready cards do not advertise keyboard shortcuts.");
  await page.addInitScript(() => localStorage.setItem("bs_keys", JSON.stringify([
    "KeyP",
    "KeyR",
    "ArrowUp",
    "ArrowRight",
  ])));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");

  const shortcuts = page.locator(".overlay-tap .unlock-shortcuts");
  await expect(shortcuts).toBeVisible();
  await expect(shortcuts).toHaveAttribute(
    "aria-label",
    "Keyboard shortcuts. Escape pauses.",
  );
  await expect(shortcuts.locator("kbd")).toHaveText(["Esc"]);
  await expect(shortcuts.getByText("Restart", { exact: true })).toHaveCount(0);
});

test("the ready card previews every advanced chart move before play", async ({ page }, info) => {
  await page.route("**/catalog/bs-s1-05/easy.json*", (route) => route.fulfill({ json: {
    track_id: "bs-s1-05",
    tier: "easy",
    format: 1,
    bpm: 120,
    audio_offset_ms: 0,
    ar: 4,
    total_notes: 6,
    sections: [{ id: "moves", t0: 0, t1: 8 }],
    notes: [
      { id: "tap", type: "tap", lane: 0, t: 1 },
      { id: "hold", type: "hold", lane: 1, t: 2, end: 3 },
      { id: "chord", type: "chord", lanes: [0, 3], t: 4 },
      { id: "slide", type: "slide", lane: 1, to: 2, t: 5, end: 6 },
    ],
  } }));
  await page.goto("/play/bs-s1-05?tier=easy&mode=casual");

  const overlay = page.locator(".overlay-tap");
  for (const type of ["hold", "chord", "slide"] as const) {
    const guide = overlay.locator(`.unlock-mechanic-${type}`);
    const preview = guide.locator(`[data-mechanic-preview="${type}"]`);
    await expect(guide).toBeVisible();
    await expect(preview).toBeVisible();
    await expect(preview).toHaveAttribute("aria-hidden", "true");
    await expect(preview.locator(".unlock-mechanic-note")).toHaveCount(2);
    await expect(preview.locator(".unlock-mechanic-path")).toHaveCount(1);
  }

  await overlay.locator(".unlock-mechanics").screenshot({
    path: info.outputPath("chart-move-previews.png"),
    animations: "disabled",
  });
});

test("formal ready cards name Arcade and Practice before product provenance", async ({ page }) => {
  for (const run of [
    { route: "/play/bs-s1-05?tier=easy&mode=arcade", label: "Arcade run" },
    { route: "/play/bs-s1-05?tier=easy&mode=practice", label: "Practice run" },
  ]) {
    await page.goto(run.route);
    const overlay = page.locator(".overlay-tap");
    await expect(overlay.locator(".overlay-kicker")).toHaveText(run.label);
    await expect(overlay.locator(".unlock-rights")).toHaveText("AI Original · Owned Rights");
    const fastStartStillLeadsGuidance = await overlay.evaluate((node) => {
      const start = node.querySelector(".unlock-btn");
      const mechanics = node.querySelector(".unlock-mechanics");
      return !!start && !!mechanics
        && !!(start.compareDocumentPosition(mechanics) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(fastStartStillLeadsGuidance).toBe(true);
  }
});

async function stubOpeningRescueChart(page: Page) {
  await page.route("**/catalog/bs-s1-05/easy.json*", (route) => route.fulfill({ json: {
    track_id: "bs-s1-05",
    tier: "easy",
    format: 1,
    bpm: 120,
    audio_offset_ms: 0,
    ar: 4,
    total_notes: 5,
    notes: [
      { id: "miss-1", type: "tap", lane: 0, t: 0.1 },
      { id: "miss-2", type: "tap", lane: 1, t: 0.2 },
      { id: "miss-3", type: "tap", lane: 2, t: 0.3 },
      { id: "recover", type: "tap", lane: 3, t: 1.5 },
      { id: "keep-open", type: "tap", lane: 3, t: 12 },
    ],
  } }));
}

test("First Shift rescues a listener who misses the opening notes", async ({ page }, info) => {
  await stubOpeningRescueChart(page);

  await page.goto("/play/bs-s1-05?tier=easy&mode=casual&shift=studio");
  const coach = page.locator('.hud-opening-coach[data-show="1"]');
  await expect(page.locator(".hud-opening-coach")).toHaveAttribute("aria-hidden", "true");
  await page.locator(".overlay-tap .unlock-btn").click();

  await expect(coach).toBeVisible({ timeout: 5_000 });
  await expect(coach.getByText("Find the line", { exact: true })).toBeVisible();
  await expect(coach.getByText(
    info.project.name === "mobile"
      ? "Tap notes at the line"
      : "Press keys at the line",
    { exact: true },
  )).toBeVisible();
  expect(await coach.locator("span").evaluate((node) => parseFloat(getComputedStyle(node).fontSize)))
    .toBeGreaterThanOrEqual(12);
  expect(await coach.locator(".hud-opening-progress").evaluate((node) => parseFloat(getComputedStyle(node).fontSize)))
    .toBeGreaterThanOrEqual(9);
  await expect(coach.locator(".hud-opening-progress")).toHaveText("3 / 5 notes");
  await expect(coach.locator(".hud-opening-progress")).toHaveAttribute("aria-hidden", "true");
  await expect(coach).toHaveAttribute("aria-hidden", "false");

  const coachBox = (await coach.boundingBox())!;
  const performanceCard = (await page.locator(".hud-chip").boundingBox())!;
  const viewport = page.viewportSize()!;
  // Live help must replace the zero-score card's footprint instead of laying
  // another opaque panel across the note highway the player is trying to read.
  expect(Math.abs(coachBox.x - performanceCard.x)).toBeLessThanOrEqual(3);
  expect(Math.abs(coachBox.y - performanceCard.y)).toBeLessThanOrEqual(3);
  expect(Math.abs(coachBox.width - performanceCard.width)).toBeLessThanOrEqual(4);
  expect(coachBox.y + coachBox.height)
    .toBeLessThanOrEqual(performanceCard.y + performanceCard.height + 6);
  expect(coachBox.y + coachBox.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("opening-timing-coach.png"), animations: "disabled" });

  await expect.poll(async () => {
    await page.keyboard.press("ArrowRight");
    const landed = await page.locator(
      ".hud-judge-perfect .hud-judge-count, .hud-judge-great .hud-judge-count, .hud-judge-good .hud-judge-count",
    ).allTextContents();
    return landed.reduce((sum, value) => sum + Number(value), 0);
  }, { timeout: 3_000, intervals: [20] }).toBeGreaterThan(0);
  await expect(page.locator(".hud-opening-coach")).toHaveAttribute("aria-hidden", "true");
});

for (const { width, height } of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
  test(`opening rescue stays readable without covering extra notes at ${width}px`, async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "This is a touch viewport contract.");
    await page.setViewportSize({ width, height });
    await stubOpeningRescueChart(page);
    await page.goto("/play/bs-s1-05?tier=easy&mode=casual&shift=studio");
    await page.locator(".overlay-tap .unlock-btn").click();

    const coach = page.locator('.hud-opening-coach[data-show="1"]');
    await expect(coach).toBeVisible({ timeout: 5_000 });
    await expect(coach.getByText("Tap notes at the line", { exact: true })).toBeVisible();
    const coachBox = (await coach.boundingBox())!;
    const performanceCard = (await page.locator(".hud-chip").boundingBox())!;
    const title = (await coach.locator("strong").boundingBox())!;
    expect(title.height).toBeLessThanOrEqual(10);
    if (width > 360) {
      expect(Math.abs(coachBox.width - performanceCard.width)).toBeLessThanOrEqual(4);
    }
    expect(coachBox.y + coachBox.height)
      .toBeLessThanOrEqual(performanceCard.y + performanceCard.height + 6);
    expect(coachBox.y + coachBox.height).toBeLessThanOrEqual(height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath(`opening-timing-coach-${width}.png`), animations: "disabled" });
  });
}

test("a completed First Shift replay does not bring back the opening rescue", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_first_shift_v1", JSON.stringify({
    v: 1,
    completed: [{ id: "studio", runId: "bs-s1-05:2026-09-14T00:00:00.000Z" }],
  })));
  await page.route("**/catalog/bs-s1-05/easy.json*", (route) => route.fulfill({ json: {
    track_id: "bs-s1-05",
    tier: "easy",
    format: 1,
    bpm: 120,
    audio_offset_ms: 0,
    ar: 4,
    total_notes: 4,
    notes: [
      { id: "miss-1", type: "tap", lane: 0, t: 0.1 },
      { id: "miss-2", type: "tap", lane: 1, t: 0.2 },
      { id: "miss-3", type: "tap", lane: 2, t: 0.3 },
      { id: "keep-open", type: "tap", lane: 3, t: 12 },
    ],
  } }));

  await page.goto("/play/bs-s1-05?tier=easy&mode=casual&shift=studio");
  await expect(page.locator(".hud-opening-coach")).toHaveCount(0);
  await page.locator(".overlay-tap .unlock-btn").click();
  await expect(page.locator(".hud-progress-count")).toHaveText("3/4", { timeout: 5_000 });
  await expect(page.locator(".hud-opening-coach")).toHaveCount(0);
});

test("Practice slowdown announces its rate and clears after five seconds", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.route("**/catalog/bs-s1-05/easy.json*", (route) => route.fulfill({ json: {
    track_id: "bs-s1-05",
    tier: "easy",
    format: 1,
    bpm: 120,
    audio_offset_ms: 0,
    ar: 4,
    total_notes: 4,
    notes: [
      { id: "miss-1", type: "tap", lane: 0, t: 0.1 },
      { id: "miss-2", type: "tap", lane: 1, t: 0.2 },
      { id: "miss-3", type: "tap", lane: 2, t: 0.3 },
      { id: "keep-open", type: "tap", lane: 3, t: 12 },
    ],
  } }));

  await page.goto("/play/bs-s1-05?tier=easy&mode=practice");
  await page.locator(".overlay-tap .unlock-btn").click();

  const assist = page.locator('.hud-practice-assist[data-show="1"]');
  await expect(assist).toBeVisible({ timeout: 5_000 });
  await expect(assist).toContainText("Practice assist");
  await expect(assist).toContainText(/0\.5× · [1-5]s/);
  await expect(assist).toHaveAttribute("aria-hidden", "false");

  const assistBox = (await assist.boundingBox())!;
  const performanceCard = (await page.locator(".hud-chip").boundingBox())!;
  const signal = page.locator(".hud-signal");
  const signalBox = (await signal.boundingBox())!;
  const pauseBox = (await page.getByRole("button", { name: "Pause", exact: true }).boundingBox())!;
  // A slowdown is meant to make notes easier to read. Reuse the decorative
  // SIGNAL slot instead of laying an opaque banner across the note highway.
  expect(Math.abs(assistBox.y - signalBox.y)).toBeLessThanOrEqual(3);
  expect(assistBox.height).toBeLessThanOrEqual(signalBox.height + 8);
  expect(assistBox.y + assistBox.height).toBeLessThanOrEqual(
    Math.max(
      performanceCard.y + performanceCard.height,
      pauseBox.y + pauseBox.height,
    ) + 3,
  );
  expect(assistBox.x).toBeGreaterThanOrEqual(performanceCard.x + performanceCard.width + 2);
  expect(assistBox.x + assistBox.width).toBeLessThanOrEqual(pauseBox.x - 2);
  await expect(signal).toHaveAttribute("data-assist", "1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("practice-assist.png"), animations: "disabled" });

  await expect(assist).toBeHidden({ timeout: 6_500 });
  await expect(page.locator(".hud-practice-assist")).toHaveAttribute("aria-hidden", "true");
  await expect(signal).toHaveAttribute("data-assist", "0");
});
