import { expect, test } from "@playwright/test";

const SHORT_FAILURE_CHART = {
  track_id: "bs-s1-01",
  tier: "easy",
  format: 1,
  bpm: 120,
  audio_offset_ms: 0,
  ar: 5,
  total_notes: 15,
  sections: [{ id: "intro", t0: 0, t1: 4 }],
  notes: Array.from({ length: 15 }, (_, index) => ({
    id: `miss-${index}`,
    t: 0.5 + index * 0.12,
    lane: index % 4,
    type: "tap",
  })),
};

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    const nativeNow = performance.now.bind(performance);
    (window as typeof window & { __pregameOffsetMs: number }).__pregameOffsetMs = 0;
    Object.defineProperty(performance, "now", {
      configurable: true,
      value: () => nativeNow() + (window as typeof window & { __pregameOffsetMs: number }).__pregameOffsetMs,
    });
  });
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(SHORT_FAILURE_CHART),
  }));
});

async function waitOutPregame(page: import("@playwright/test").Page) {
  const before = await page.evaluate(() => performance.now());
  const after = await page.evaluate(() => {
    (window as typeof window & { __pregameOffsetMs: number }).__pregameOffsetMs = 120_000;
    return performance.now();
  });
  expect(after - before).toBeGreaterThan(119_000);
}

test("solo progress counts the run, not time spent waiting at Start", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");
  const start = page.getByRole("button", { name: "Start playing", exact: true });
  await expect(start).toBeEnabled();
  await waitOutPregame(page);
  await start.click();
  await expect(page).toHaveURL(/\/results$/, { timeout: 12_000 });

  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run.durationMs).toBeGreaterThan(0);
  expect(run.durationMs).toBeLessThan(20_000);
  await page.goto("/profile");
  await expect(page.locator(".stat-pill").filter({ hasText: "Time in the Scape" })).toContainText("0 min");
});

test("solo time excludes a paused panel and exit confirmation", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  await expect(pauseDialog).toBeVisible();
  await waitOutPregame(page);
  await pauseDialog.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(pauseDialog).toBeHidden();

  await page.getByRole("button", { name: "Exit the Scape", exact: true }).click();
  const exitDialog = page.getByRole("dialog", { name: "Leave the Scape?", exact: true });
  await expect(exitDialog).toBeVisible();
  await page.evaluate(() => {
    (window as typeof window & { __pregameOffsetMs: number }).__pregameOffsetMs += 120_000;
  });
  await exitDialog.getByRole("button", { name: "Keep playing", exact: true }).click();

  await expect(page).toHaveURL(/\/results$/, { timeout: 12_000 });
  const durationMs = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!).durationMs as number);
  expect(durationMs).toBeGreaterThan(0);
  expect(durationMs).toBeLessThan(20_000);
});

test("solo time excludes a paused panel without an exit confirmation", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  await expect(pauseDialog).toBeVisible();
  await waitOutPregame(page);
  await pauseDialog.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page).toHaveURL(/\/results$/, { timeout: 12_000 });

  const durationMs = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!).durationMs as number);
  expect(durationMs).toBeGreaterThan(0);
  expect(durationMs).toBeLessThan(20_000);
});

test("Duo finish and rematch each exclude the old setup wait", async ({ page }) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=arcade");
  const start = page.locator(".duo-start .unlock-btn");
  await expect(start).toBeEnabled();
  await waitOutPregame(page);
  await start.click();
  const result = page.getByRole("dialog", { name: "Duo results" });
  await expect(result).toBeVisible({ timeout: 12_000 });
  await result.getByRole("button", { name: "Rematch" }).click();
  await expect(start).toBeEnabled();
  await start.click();
  await expect(result).toBeVisible({ timeout: 12_000 });

  const durations = await page.evaluate(() =>
    (JSON.parse(localStorage.getItem("bs_analytics") ?? "[]") as Array<{
      event: string;
      props?: { durationMs?: number };
    }>).filter((entry) => entry.event === "duo_finish").map((entry) => entry.props?.durationMs),
  );
  expect(durations).toHaveLength(2);
  for (const duration of durations) {
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(20_000);
  }
});

test("Duo time excludes the exit confirmation hold", async ({ page }) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=arcade");
  await page.locator(".duo-start .unlock-btn").click();
  await page.getByRole("button", { name: "Exit the Scape", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Leave the Scape?", exact: true });
  await expect(dialog).toBeVisible();
  await page.evaluate(() => {
    (window as typeof window & { __pregameOffsetMs: number }).__pregameOffsetMs += 120_000;
  });
  await dialog.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Duo results" })).toBeVisible({ timeout: 12_000 });

  const durations = await page.evaluate(() =>
    (JSON.parse(localStorage.getItem("bs_analytics") ?? "[]") as Array<{
      event: string;
      props?: { durationMs?: number };
    }>).filter((entry) => entry.event === "duo_finish").map((entry) => entry.props?.durationMs),
  );
  expect(durations).toHaveLength(1);
  expect(durations[0]).toBeGreaterThan(0);
  expect(durations[0]).toBeLessThan(20_000);
});
