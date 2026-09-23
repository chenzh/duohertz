import { expect, test } from "@playwright/test";

const resultRun = {
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

test("mobile navigation uses stable icons and mirrors play versus replay intent", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "The desktop header is intentionally text-first.");
  await page.addInitScript((run) => {
    localStorage.removeItem("bs_onboarded");
    localStorage.removeItem("bs_first_shift_v1");
    sessionStorage.setItem("bs_last_run", JSON.stringify(run));
  }, resultRun);

  await page.goto("/");
  const nav = page.locator(".mobile-tabbar");
  const icons = {
    Home: "home",
    Library: "library",
    Board: "board",
    Settings: "settings",
  } as const;
  for (const [label, icon] of Object.entries(icons)) {
    await expect(nav.getByRole("link", { name: label, exact: true }).locator(`svg[data-icon="${icon}"]`))
      .toHaveCount(1);
  }
  await expect(nav.getByRole("link", {
    name: "Start first run · Voltage Drop · Easy Casual",
    exact: true,
  }).locator('svg[data-icon="play"]'))
    .toHaveCount(1);

  await page.goto("/results");
  const replay = nav.getByRole("link", { name: "Replay Neon Pulse on Easy Arcade", exact: true });
  await expect(replay).toHaveAttribute("href", "/play/bs-s1-01?tier=easy&mode=arcade");
  await expect(replay.locator('svg[data-icon="replay"]')).toHaveCount(1);

  const tabItems = await nav.locator(".tab-item").evaluateAll((items) => items.map((item) => ({
    width: item.getBoundingClientRect().width,
    height: item.getBoundingClientRect().height,
  })));
  expect(tabItems).toHaveLength(5);
  for (const item of tabItems) {
    expect(item.width).toBeGreaterThanOrEqual(44);
    expect(item.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("mobile-nav-replay.png"), animations: "disabled" });
});
