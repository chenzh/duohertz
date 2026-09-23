import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }, info) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    const state = window as typeof window & { __musicStartRates?: number[] };
    state.__musicStartRates = [];
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) {
        state.__musicStartRates?.push(this.playbackRate.value);
      }
      return start.apply(this, args);
    };
  });
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({ json: {
    track_id: "bs-s1-01",
    tier: "easy",
    format: 1,
    bpm: 120,
    audio_offset_ms: 0,
    ar: 4,
    total_notes: 2,
    sections: [{ id: "intro", t0: 0, t1: 1.2 }],
    notes: [
      { id: "tempo-1", t: 0.4, lane: 0, type: "tap" },
      { id: "tempo-2", t: 0.8, lane: 1, type: "tap" },
    ],
  } }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

function musicStartRates(page: Page) {
  return page.evaluate(() => (
    window as typeof window & { __musicStartRates?: number[] }
  ).__musicStartRates ?? []);
}

test("Practice pause owns a persistent music-and-chart tempo", async ({ page }, info) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=practice");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await expect.poll(() => musicStartRates(page)).toEqual([1]);
  await page.getByRole("button", { name: "Pause", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  const tempo = dialog.getByRole("group", { name: "Practice tempo", exact: true });
  const fifty = tempo.getByRole("radio", { name: "50% tempo", exact: true });
  const seventyFive = tempo.getByRole("radio", { name: "75% tempo", exact: true });
  const full = tempo.getByRole("radio", { name: "100% tempo", exact: true });

  await expect(tempo).toContainText("Music + chart");
  await expect(full).toBeChecked();
  for (const control of [fifty, seventyFive, full]) {
    const box = await control.locator("..").boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  await seventyFive.check();
  await expect(seventyFive).toBeChecked();
  await dialog.getByRole("button", { name: "Resume", exact: true }).click();
  await expect.poll(() => musicStartRates(page)).toEqual([1, 0.75]);
  const liveTempo = page.getByRole("status").filter({ hasText: "Practice tempo" });
  await expect(liveTempo).toContainText("0.75×");

  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(seventyFive).toBeChecked();
  await dialog.getByRole("button", { name: "Restart track", exact: true }).click();
  await expect.poll(() => musicStartRates(page)).toEqual([1, 0.75, 0.75]);
  await expect(liveTempo).toContainText("0.75×");

  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.screenshot({ path: info.outputPath("practice-tempo-pause.png"), animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("ranked and Casual runs do not expose Practice tempo", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("group", { name: "Practice tempo", exact: true })).toHaveCount(0);
});

test("Practice tempo can be chosen before the first note", async ({ page }, info) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=practice");

  const ready = page.locator(".overlay-tap");
  const tempo = ready.getByRole("group", { name: "Practice tempo", exact: true });
  const fifty = tempo.getByRole("radio", { name: "50% tempo", exact: true });
  const seventyFive = tempo.getByRole("radio", { name: "75% tempo", exact: true });
  const full = tempo.getByRole("radio", { name: "100% tempo", exact: true });
  const start = ready.getByRole("button", { name: "Start playing", exact: true });

  await expect(tempo).toContainText("Music + chart");
  await expect(full).toBeChecked();
  for (const control of [fifty, seventyFive, full]) {
    const box = await control.locator("..").boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  if (info.project.name === "mobile") {
    const tempoBox = await tempo.boundingBox();
    const startBox = await start.boundingBox();
    expect(tempoBox).not.toBeNull();
    expect(startBox).not.toBeNull();
    expect(tempoBox!.y + tempoBox!.height).toBeLessThanOrEqual(568);
    expect(startBox!.y + startBox!.height).toBeLessThanOrEqual(568);
  }

  await seventyFive.check();
  await expect(seventyFive).toBeChecked();
  await page.screenshot({ path: info.outputPath("practice-tempo-ready.png"), animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await start.click();
  await expect.poll(() => musicStartRates(page)).toEqual([0.75]);
  await expect(page.getByRole("status").filter({ hasText: "Practice tempo" })).toContainText("0.75×");
});

test("selected tempo survives every automatic drill repetition", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=practice&seek=0&until=1.2&reps=2");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  await dialog.getByRole("radio", { name: "75% tempo", exact: true }).check();
  await dialog.getByRole("button", { name: "Resume", exact: true }).click();

  await expect(page).toHaveURL(/\/results$/, { timeout: 20_000 });
  await expect.poll(() => musicStartRates(page)).toEqual([1, 0.75, 0.75]);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run") ?? "null"));
  expect(run).toMatchObject({
    mode: "practice",
    seekedFrom: 0,
    seekedUntil: 1.2,
    practiceRepetitions: 2,
  });
  expect(run.practiceAttempts).toHaveLength(2);
});
