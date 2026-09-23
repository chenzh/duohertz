import { expect, test, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

const FAILURE_CHART = {
  track_id: "bs-s1-01",
  tier: "easy",
  format: 1,
  bpm: 120,
  audio_offset_ms: 0,
  ar: 5,
  total_notes: 15,
  sections: [{ id: "intro", t0: 0, t1: 4 }],
  notes: Array.from({ length: 15 }, (_, index) => ({
    id: `fail-${index}`,
    t: 0.8 + index * 0.12,
    lane: index % 4,
    type: "tap",
  })),
};

const BATCH_FAILURE_CHART = {
  ...FAILURE_CHART,
  total_notes: 20,
  notes: [
    ...Array.from({ length: 14 }, (_, index) => ({
      id: `warmup-${index}`,
      t: 0.5 + index * 0.12,
      lane: index % 4,
      type: "tap",
    })),
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `pileup-${index}`,
      t: 2.2,
      lane: index % 4,
      type: "tap",
    })),
  ],
};

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(FAILURE_CHART),
  }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("HP depletion gets an in-field beat before an explicit failed result", async ({ page }, info) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");
  // PlayField is a lazy gameplay chunk; wait for its failure layer before
  // installing the one-shot observer, especially after a cold production load.
  await expect(page.locator(".play-failure")).toHaveCount(1);
  await page.evaluate(() => {
    const failure = document.querySelector<HTMLElement>(".play-failure");
    if (!failure) throw new Error("Failure overlay was not mounted");
    const state = () => ({
      ariaHidden: failure.getAttribute("aria-hidden"),
      text: failure.textContent?.replace(/\s+/g, " ").trim(),
      visibility: getComputedStyle(failure).visibility,
    });
    (window as typeof window & { __failureSeen?: Promise<ReturnType<typeof state>> }).__failureSeen =
      new Promise((resolve) => {
        const observer = new MutationObserver(() => {
          if (failure.dataset.show !== "1") return;
          observer.disconnect();
          resolve(state());
        });
        observer.observe(failure, { attributes: true, attributeFilter: ["data-show"] });
      });
  });
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const failureState = await page.evaluate(() =>
    (window as typeof window & { __failureSeen?: Promise<unknown> }).__failureSeen,
  );
  expect(failureState).toEqual({
    ariaHidden: "false",
    text: "ARCADE RUNSIGNAL LOSTHP DEPLETED",
    visibility: "visible",
  });

  await expect(page).toHaveURL(/\/results$/, { timeout: 2_000 });
  await expect(page.locator(".badge.failed")).toHaveText("ARCADE FAILED");
  const note = page.locator(".failed-run-note");
  await expect(note).toContainText("HP depleted");
  await expect(note).toContainText("not added to your Personal Best or Local Board");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("bs_scores") ?? "[]"))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await page.screenshot({ path: info.outputPath("arcade-failure-results.png"), animations: "disabled" });
});

test("HP depletion stops an overdue batch on the failing judgment", async ({ page }) => {
  await page.unroute("**/catalog/bs-s1-01/easy.json*");
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(BATCH_FAILURE_CHART),
  }));
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await expect(page).toHaveURL(/\/results$/, { timeout: 9_000 });
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({
    failed: true,
    counts: { perfect: 0, great: 0, good: 0, miss: 15 },
    totalNotes: 20,
  });
});

test("Duo Arcade result names both failed runs without inflating accuracy", async ({ page }, info) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=arcade");
  await page.locator(".duo-start .unlock-btn").click();

  const result = page.getByRole("dialog", { name: "Duo results" });
  await expect(result).toBeVisible({ timeout: 9_000 });
  await expect(result).toHaveAttribute("aria-modal", "true");
  const rematch = result.getByRole("button", { name: "Rematch" });
  const exit = result.getByRole("button", { name: "Exit" });
  await expect(rematch).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(exit).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(rematch).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(exit).toBeFocused();
  await expect(result.locator(".overlay-title")).toHaveText("DEAD HEAT");
  await expect(result.locator(".duo-scorecol-status.failed")).toHaveCount(2);
  await expect(result.locator(".duo-scorecol-status.failed")).toHaveText(["HP DEPLETED", "HP DEPLETED"]);
  await expect(result.locator(".duo-scorecol-stats > span"))
    .toHaveText(["ACC 0.00%", "MAX x0", "ACC 0.00%", "MAX x0"]);
  await expect(result.locator(".duo-scorecol-judgments > strong"))
    .toHaveText(["0/0/0/15", "0/0/0/15"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await page.screenshot({ path: info.outputPath("duo-arcade-failure-results.png"), animations: "disabled" });
  await rematch.click();
  const start = page.locator(".duo-start .unlock-btn");
  await expect(start).toBeVisible();
  await expect(start).toBeFocused();
});

test("Duo result stats remain legible with seven-digit scores on narrow phones", async ({ page }, info) => {
  await page.addInitScript(() => {
    // Keep the test viewport resizable after the touch Start gesture.
    Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, value: undefined });
    Object.defineProperty(Element.prototype, "webkitRequestFullscreen", { configurable: true, value: undefined });
  });
  await page.goto("/duo/bs-s1-01?tier=easy&mode=arcade");
  await page.locator(".duo-start .unlock-btn").click();
  const result = page.getByRole("dialog", { name: "Duo results" });
  await expect(result).toBeVisible({ timeout: 9_000 });
  expect(await result.locator(".duo-scorecol-who").allTextContents())
    .toEqual(await page.locator(".duo-stage .hud-player").allTextContents());

  // Stress the actual result component with a full-chart score and combo;
  // the short failure chart above keeps this layout check fast and deterministic.
  await page.evaluate(() => {
    for (const col of document.querySelectorAll(".duo-scorecol")) {
      const score = col.querySelector(".duo-scorecol-score");
      if (score?.lastChild) score.lastChild.textContent = "1,010,700";
      const stats = col.querySelectorAll(".duo-scorecol-stats strong");
      if (stats[0]) stats[0].textContent = "100.00%";
      if (stats[1]) stats[1].textContent = "x929";
      const judgments = col.querySelector(".duo-scorecol-judgments > strong");
      if (judgments) judgments.textContent = "929/0/0/0";
    }
  });

  for (const width of info.project.name === "mobile" ? [320, 412] : [1280]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : width === 412 ? 915 : 720 });
    const geometry = await page.evaluate(() => {
      const cards = [...document.querySelectorAll<HTMLElement>(".duo-scorecol")];
      const overflow = cards.flatMap((card, player) => {
        const bounds = card.getBoundingClientRect();
        return [...card.querySelectorAll<HTMLElement>(
          ".duo-scorecol-score, .duo-scorecol-stats > span, .duo-scorecol-judgments > span, .duo-scorecol-judgments > strong",
        )].filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left < bounds.left - 1 || rect.right > bounds.right + 1
            || element.scrollWidth > element.clientWidth + 1;
        }).map((element) => `${player + 1}:${element.className || element.textContent}`);
      });
      const actions = document.querySelector<HTMLElement>(".duo-result-actions")?.getBoundingClientRect();
      return { overflow, pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        actionsVisible: Boolean(actions && actions.top >= 0 && actions.bottom <= innerHeight) };
    });
    expect(geometry, `Duo result at ${width}px`).toEqual({ overflow: [], pageOverflow: false, actionsVisible: true });
    await page.screenshot({ path: info.outputPath(`duo-result-${width}.png`), animations: "disabled" });
  }
});
