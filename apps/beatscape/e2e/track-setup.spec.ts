import { expect, test, type Page } from "@playwright/test";

// Chart-error coverage must reach the route fixture instead of a previously
// installed worker's Cache Storage response.
test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test("desktop keeps the selected run action above the fold", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "desktop action-density contract");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/track/bs-s1-05");

  const details = page.getByRole("button", { name: "Show run details", exact: true });
  const play = page.getByRole("link", { name: "Play Easy · Casual", exact: true });
  const back = page.locator(".track-detail > .back-link");
  const cover = page.locator(".track-hero-cover");

  await expect(details).toBeVisible();
  await expect(details).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".run-guidance")).toBeHidden();
  await expect(page.locator(".run-chart-profile")).toBeHidden();
  await expect(play).toBeVisible();

  const [playBox, backBox, coverBox] = await Promise.all([
    play.boundingBox(),
    back.boundingBox(),
    cover.boundingBox(),
  ]);
  expect(playBox).not.toBeNull();
  expect(backBox).not.toBeNull();
  expect(coverBox).not.toBeNull();
  expect(playBox!.y + playBox!.height).toBeLessThanOrEqual(704);
  expect(Math.abs(backBox!.y - coverBox!.y)).toBeLessThanOrEqual(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("track-desktop-fold.png"), animations: "disabled" });

  await details.click();
  await expect(page.getByRole("button", { name: "Hide run details", exact: true }))
    .toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".run-guidance")).toBeVisible();
  await expect(page.locator(".run-chart-profile")).toBeVisible();
  await page.screenshot({ path: info.outputPath("track-desktop-details.png"), fullPage: true, animations: "disabled" });
});

test("run setup explains difficulty and rules before Play", async ({ page }, info) => {
  await page.goto("/track/bs-s1-01");

  const setup = page.getByRole("region", { name: "Selected run setup" });
  await expect(setup).toContainText("Easy · Casual");
  await expect(page.getByRole("radio", { name: "Easy", exact: true })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radio", { name: "Casual", exact: true })).toHaveAttribute("aria-checked", "true");
  await expect(setup).toContainText("114");
  await expect(setup).toContainText("1.5/sec");
  await expect(setup).toContainText("Taps + Holds");
  if (info.project.name === "desktop") {
    const details = page.getByRole("button", { name: "Show run details", exact: true });
    await expect(details).toBeVisible();
    await expect(details).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".run-guidance")).toBeHidden();
    await expect(page.locator(".run-chart-profile")).toBeHidden();
    await details.click();
    await expect(page.locator(".run-guidance")).toBeVisible();
    await expect(page.locator(".run-chart-profile")).toBeVisible();
    await expect(page.getByText("No fail · wider 28 / 55 / 90 ms timing", { exact: true })).toHaveCount(1);
  }

  const cover = await page.locator(".track-hero-cover").boundingBox();
  expect(cover).not.toBeNull();
  expect(Math.abs(cover!.width - cover!.height)).toBeLessThanOrEqual(1);

  await page.getByRole("radio", { name: "Hard", exact: true }).click();
  await page.getByRole("radio", { name: "Arcade", exact: true }).click();
  await expect(setup).toContainText("Hard · Arcade");
  await expect(setup).toContainText("Play for the board");
  await expect(setup).toContainText("339");
  await expect(setup).toContainText("4.5/sec");
  await expect(page.getByRole("link", { name: "Play Hard · Arcade", exact: true }))
    .toHaveAttribute("href", /\/play\/bs-s1-01\?tier=hard&mode=arcade$/);
  await expect(page.getByRole("link", { name: "Duo", exact: true }))
    .toHaveAttribute("href", /\/duo\/bs-s1-01\?tier=hard&mode=arcade$/);
  await expect(page.locator(".track-primary-actions ~ .stream-cta")).toBeVisible();

  const segmentTargets = await page.locator(".run-segments button").evaluateAll((buttons) =>
    buttons.map((button) => button.getBoundingClientRect().height),
  );
  expect(segmentTargets.every((height) => height >= 44)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await setup.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("track-run-setup.png"), fullPage: true, animations: "disabled" });

  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 360, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test("run setup keeps the selected Arcade personal best in view", async ({ page }, info) => {
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  await page.addInitScript(() => {
    localStorage.setItem("bs_scores", JSON.stringify([
      {
        track_id: "bs-s1-01",
        tier: "easy",
        mode: "arcade",
        score: 120000,
        accuracy: 90,
        at: "2026-09-12T12:00:00.000Z",
      },
      {
        track_id: "bs-s1-01",
        tier: "hard",
        mode: "arcade",
        score: 924000,
        accuracy: 92.4,
        at: "2026-09-13T12:00:00.000Z",
      },
      {
        track_id: "bs-s1-01",
        tier: "hard",
        mode: "arcade",
        score: 9999999,
        accuracy: 99,
        at: "not-a-date",
      },
    ]));
  });
  await page.goto("/track/bs-s1-01");

  const target = page.getByRole("status", { name: "Personal best target" });
  await expect(target).toContainText("Arcade scores only");
  await expect(target).toContainText("Switch to Arcade to chase your Personal Best.");

  await page.getByRole("radio", { name: "Arcade", exact: true }).click();
  await expect(target).toContainText("120,000 PTS");
  await expect(target).toContainText("90% ACC · Easy Arcade record");

  await page.getByRole("radio", { name: "Hard", exact: true }).click();
  await expect(target).toContainText("924,000 PTS");
  await expect(target).toContainText("92.4% ACC · Hard Arcade record");

  if (info.project.name === "mobile") {
    const action = page.locator(".track-mobile-action");
    await expect(action).toContainText("Hard · Arcade · PB 924K");
    const selectedRun = action.locator("small");
    expect(await selectedRun.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  }

  await target.evaluate((node) => node.scrollIntoView({ block: "center" }));
  if (info.project.name === "mobile") {
    const targetBox = await target.boundingBox();
    const actionBox = await page.locator(".track-mobile-action").boundingBox();
    expect(targetBox).not.toBeNull();
    expect(actionBox).not.toBeNull();
    expect(targetBox!.y).toBeGreaterThanOrEqual(0);
    expect(targetBox!.y + targetBox!.height).toBeLessThanOrEqual(actionBox!.y + 1);
  }
  await page.screenshot({ path: info.outputPath("track-personal-best-target.png"), animations: "disabled" });

  await page.getByRole("radio", { name: "Standard", exact: true }).click();
  await expect(target).toContainText("No score yet");
  await expect(target).toContainText("Clear this chart to set your first Personal Best.");

  await page.getByRole("radio", { name: "Practice", exact: true }).click();
  await expect(target).toContainText("Practice is unranked");
  await expect(target).toContainText("Practice runs never change your Personal Best.");

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("difficulty and mode are one-stop keyboard radio groups", async ({ page }) => {
  await page.goto("/track/bs-s1-01");

  const setup = page.getByRole("region", { name: "Selected run setup" });
  const difficulty = page.getByRole("radiogroup", { name: "Difficulty" });
  const mode = page.getByRole("radiogroup", { name: "Mode" });
  await expect(difficulty.getByRole("radio")).toHaveCount(3);
  await expect(mode.getByRole("radio")).toHaveCount(3);

  const easy = difficulty.getByRole("radio", { name: "Easy", exact: true });
  const standard = difficulty.getByRole("radio", { name: "Standard", exact: true });
  const hard = difficulty.getByRole("radio", { name: "Hard", exact: true });
  await expect(easy).toHaveAttribute("tabindex", "0");
  await expect(standard).toHaveAttribute("tabindex", "-1");
  await expect(hard).toHaveAttribute("tabindex", "-1");

  await easy.focus();
  await easy.press("ArrowRight");
  await expect(standard).toBeFocused();
  await expect(standard).toHaveAttribute("aria-checked", "true");
  await expect(setup).toContainText("Standard · Casual");

  await standard.press("End");
  await expect(hard).toBeFocused();
  await expect(hard).toHaveAttribute("aria-checked", "true");
  await hard.press("ArrowRight");
  await expect(easy).toBeFocused();
  await expect(easy).toHaveAttribute("aria-checked", "true");

  const casual = mode.getByRole("radio", { name: "Casual", exact: true });
  const practice = mode.getByRole("radio", { name: "Practice", exact: true });
  await casual.focus();
  await casual.press("End");
  await expect(practice).toBeFocused();
  await expect(practice).toHaveAttribute("aria-checked", "true");
  await expect(setup).toContainText("Easy · Practice");
  await practice.press("Home");
  await expect(casual).toBeFocused();
  await expect(casual).toHaveAttribute("aria-checked", "true");
});

test("an exact run setup survives Track entry, refresh, and later changes", async ({ page }) => {
  const libraryHref = "/library?q=voltage&sort=bpm-desc";
  await page.goto(
    `/track/bs-s1-01?tier=hard&mode=arcade&returnTo=${encodeURIComponent(libraryHref)}`,
  );

  const difficulty = page.getByRole("radiogroup", { name: "Difficulty" });
  const mode = page.getByRole("radiogroup", { name: "Mode" });
  await expect(difficulty.getByRole("radio", { name: "Hard", exact: true }))
    .toHaveAttribute("aria-checked", "true");
  await expect(mode.getByRole("radio", { name: "Arcade", exact: true }))
    .toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("link", { name: "Play Hard · Arcade", exact: true }))
    .toHaveAttribute(
      "href",
      `/play/bs-s1-01?tier=hard&mode=arcade&returnTo=${encodeURIComponent(libraryHref)}`,
    );

  await page.reload();
  await expect(difficulty.getByRole("radio", { name: "Hard", exact: true }))
    .toHaveAttribute("aria-checked", "true");
  await expect(mode.getByRole("radio", { name: "Arcade", exact: true }))
    .toHaveAttribute("aria-checked", "true");

  await difficulty.getByRole("radio", { name: "Standard", exact: true }).click();
  await mode.getByRole("radio", { name: "Practice", exact: true }).click();
  const updated = new URL(page.url());
  expect(updated.searchParams.get("tier")).toBe("standard");
  expect(updated.searchParams.get("mode")).toBe("practice");
  expect(updated.searchParams.get("returnTo")).toBe(libraryHref);

  await page.reload();
  await expect(difficulty.getByRole("radio", { name: "Standard", exact: true }))
    .toHaveAttribute("aria-checked", "true");
  await expect(mode.getByRole("radio", { name: "Practice", exact: true }))
    .toHaveAttribute("aria-checked", "true");
});

test("Practice starts from a chosen chart section on desktop and mobile", async ({ page }, info) => {
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  await page.goto("/track/bs-s1-01");

  await page.getByRole("radio", { name: "Practice", exact: true }).click();
  const sections = page.getByRole("radiogroup", { name: "Practice section" });
  const fullTrack = sections.getByRole("radio", { name: "Full track", exact: true });
  await expect(sections.getByRole("radio")).toHaveCount(6);
  await expect(fullTrack).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("link", { name: "Play Easy · Practice", exact: true }))
    .toHaveAttribute("href", /\/play\/bs-s1-01\?tier=easy&mode=practice$/);

  await fullTrack.focus();
  await fullTrack.press("ArrowRight");
  const intro = sections.getByRole("radio", { name: "Intro 0:00–0:02", exact: true });
  await expect(intro).toBeFocused();
  await expect(intro).toHaveAttribute("aria-checked", "true");
  await intro.press("End");
  const outro = sections.getByRole("radio", { name: "Outro 0:58–1:15", exact: true });
  await expect(outro).toBeFocused();
  await expect(outro).toHaveAttribute("aria-checked", "true");

  const drop = sections.getByRole("radio", { name: "Drop 0:06–0:24", exact: true });
  await drop.click();
  await expect(drop).toHaveAttribute("aria-checked", "true");
  const play = page.getByRole("link", { name: "Practice Drop · Easy", exact: true });
  await expect(play).toHaveAttribute(
    "href",
    /\/play\/bs-s1-01\?tier=easy&mode=practice&seek=6&until=24$/,
  );
  let setupUrl = new URL(page.url());
  expect(setupUrl.searchParams.get("seek")).toBe("6");
  expect(setupUrl.searchParams.get("until")).toBe("24");

  await page.reload();
  await expect(drop).toHaveAttribute("aria-checked", "true");
  await expect(play).toHaveAttribute(
    "href",
    /\/play\/bs-s1-01\?tier=easy&mode=practice&seek=6&until=24$/,
  );

  if (info.project.name === "desktop") {
    const playBox = await play.boundingBox();
    expect(playBox).not.toBeNull();
    expect(playBox!.y + playBox!.height).toBeLessThanOrEqual(704);
  }

  const targets = await sections.getByRole("radio").evaluateAll((buttons) =>
    buttons.map((button) => button.getBoundingClientRect().height),
  );
  expect(targets.every((height) => height >= 44)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  if (info.project.name === "mobile") {
    await expect(page.locator(".track-mobile-action")).toContainText("Easy · Practice · Drop");
  }

  await page.getByRole("radio", { name: "Hard", exact: true }).click();
  await expect(fullTrack).toHaveAttribute("aria-checked", "true");
  setupUrl = new URL(page.url());
  expect(setupUrl.searchParams.has("seek")).toBe(false);
  expect(setupUrl.searchParams.has("until")).toBe(false);
  await expect(page.getByRole("link", { name: "Play Hard · Practice", exact: true }))
    .toHaveAttribute("href", /\/play\/bs-s1-01\?tier=hard&mode=practice$/);
  await page.getByRole("radio", { name: "Easy", exact: true }).click();
  await drop.click();

  await sections.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("track-practice-section.png"), animations: "disabled" });
  await play.click();
  await expect(page.locator(".play-meta-tier")).toContainText("easy · practice · Drop · 0:06–0:24");
});

test("leaving section Practice before Start restores the same Track target", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=practice&seek=6&until=24");
  await page.getByRole("button", { name: "Exit the Scape", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Leave the Scape?" })).toHaveCount(0);
  await expect(page).toHaveURL("/track/bs-s1-01?tier=easy&mode=practice&seek=6&until=24");
  await expect(page.getByRole("radio", { name: "Drop 0:06–0:24", exact: true }))
    .toHaveAttribute("aria-checked", "true");
});

test("mobile track owns the bottom Play action for the selected run", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/track/bs-s1-01");

  const action = page.locator(".track-mobile-action");
  await expect(action).toBeVisible();
  await expect(page.locator(".mobile-tabbar")).toBeHidden();
  await expect(action).toContainText("Neon Pulse");
  await expect(action).toContainText("Easy · Casual");
  await expect(action.getByRole("link", { name: "Play Easy · Casual", exact: true }))
    .toHaveAttribute("href", /\/play\/bs-s1-01\?tier=easy&mode=casual$/);

  await page.getByRole("radio", { name: "Hard", exact: true }).click();
  await page.getByRole("radio", { name: "Arcade", exact: true }).click();
  await expect(action).toContainText("Hard · Arcade");
  const play = action.getByRole("link", { name: "Play Hard · Arcade", exact: true });
  await expect(play).toHaveAttribute("href", /\/play\/bs-s1-01\?tier=hard&mode=arcade$/);

  const actionBox = await action.boundingBox();
  const playBox = await play.boundingBox();
  expect(actionBox).not.toBeNull();
  expect(playBox).not.toBeNull();
  expect(playBox!.height).toBeGreaterThanOrEqual(44);
  expect(Math.abs(actionBox!.y + actionBox!.height - 568)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await page.screenshot({ path: info.outputPath("track-selected-run-action.png"), animations: "disabled" });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const actionAtBottom = await action.boundingBox();
  const finalContent = await page.locator(".stream-cta").boundingBox();
  expect(actionAtBottom).not.toBeNull();
  expect(finalContent).not.toBeNull();
  expect(finalContent!.y + finalContent!.height).toBeLessThanOrEqual(actionAtBottom!.y + 1);
});

test("mobile selected run opens its setup without a page hunt", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "The fixed selected-run action is phone-only.");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/track/bs-s1-01");

  const action = page.locator(".track-mobile-action");
  const changeSetup = action.getByRole("button", { name: "Change run setup", exact: true });
  const easy = page.getByRole("radio", { name: "Easy", exact: true });
  const difficulty = page.getByRole("radiogroup", { name: "Difficulty" });

  await expect(changeSetup).toBeVisible();
  const changeBox = await changeSetup.boundingBox();
  expect(changeBox).not.toBeNull();
  expect(changeBox!.height).toBeGreaterThanOrEqual(44);

  await changeSetup.click();
  await expect(easy).toBeFocused();
  await expect.poll(async () => {
    const [groupBox, actionBox] = await Promise.all([
      difficulty.boundingBox(),
      action.boundingBox(),
    ]);
    return Boolean(
      groupBox
      && actionBox
      && groupBox.y >= 0
      && groupBox.y + groupBox.height <= actionBox.y,
    );
  }).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("track-mobile-change-setup.png"), animations: "disabled" });
});

test("mobile run setup keeps the target visible and reveals optional details on demand", async ({ page }, info) => {
  test.skip(test.info().project.name !== "mobile", "Compact run details are a phone layout contract.");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/track/bs-s1-01");

  const setup = page.getByRole("region", { name: "Selected run setup" });
  const target = page.getByRole("status", { name: "Personal best target" });
  const guidance = page.locator(".run-guidance");
  const chartProfile = page.locator(".run-chart-profile");
  const toggle = page.getByRole("button", { name: "Show run details", exact: true });

  await expect(setup).toContainText("Easy · Casual");
  await expect(target).toBeVisible();
  await expect(target).toContainText("Arcade scores only");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(guidance).toBeHidden();
  await expect(chartProfile).toBeHidden();

  const toggleBox = await toggle.boundingBox();
  const collapsedBox = await setup.boundingBox();
  expect(toggleBox).not.toBeNull();
  expect(collapsedBox).not.toBeNull();
  expect(toggleBox!.height).toBeGreaterThanOrEqual(44);
  expect(collapsedBox!.height).toBeLessThanOrEqual(150);
  await setup.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("track-run-setup-collapsed.png"), animations: "disabled" });

  await toggle.click();
  await expect(page.getByRole("button", { name: "Hide run details", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(guidance).toBeVisible();
  await expect(chartProfile).toBeVisible();
  await expect(chartProfile).toContainText("114");
  await expect(chartProfile).toContainText("1.5/sec");
  await page.screenshot({ path: info.outputPath("track-run-setup-expanded.png"), animations: "disabled" });

  await page.getByRole("button", { name: "Hide run details", exact: true }).click();
  await expect(guidance).toBeHidden();
  await expect(chartProfile).toBeHidden();
  await expect(target).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("practice is clearly solo and chart facts retry in place", async ({ page }, info) => {
  await page.route("**/catalog/bs-s1-01/hard.json*", (route) =>
    route.fulfill({ status: 503, body: "Temporarily unavailable" }),
  );
  await page.goto("/track/bs-s1-01");

  await page.getByRole("radio", { name: "Practice", exact: true }).click();
  const setup = page.getByRole("region", { name: "Selected run setup" });
  await expect(setup).toContainText("Practice only · solo · no ranking");
  await expect(page.getByRole("button", { name: "Duo · Solo only", exact: true })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Play Easy · Practice", exact: true }))
    .toHaveAttribute("href", /\/play\/bs-s1-01\?tier=easy&mode=practice$/);

  await page.getByRole("radio", { name: "Hard", exact: true }).click();
  await expect(setup).toContainText("Chart details unavailable.");
  if (info.project.name === "mobile") {
    await expect(page.getByRole("button", { name: "Hide run details", exact: true })).toBeVisible();
  }
  await page.unroute("**/catalog/bs-s1-01/hard.json*");
  await page.getByRole("button", { name: "Retry details", exact: true }).click();
  await expect(setup).toContainText("339");
});

test("direct Practice Duo links preserve versus sync by falling back to Casual", async ({ page }) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=practice");
  await expect(page.getByText("DUO · easy · casual", { exact: true })).toBeVisible();
});
