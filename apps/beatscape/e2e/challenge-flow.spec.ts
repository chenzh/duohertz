import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const challengeQuery = "tier=standard&mode=arcade&challenge=1&target=82400&acc=82.4&grade=B";

test("a shared score becomes a visible target before the run", async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_scores", JSON.stringify([{
      track_id: "bs-s1-01",
      tier: "standard",
      mode: "arcade",
      score: 924_000,
      accuracy: 92.4,
      at: "2026-09-13T12:00:00.000Z",
    }]));
  });
  await page.goto(`/play/bs-s1-01?${challengeQuery}`);

  const target = page.locator(".challenge-target");
  await expect(target).toBeVisible();
  await expect(target).toContainText("Shared challenge");
  await expect(target).toContainText("Beat 82,400 pts");
  await expect(target).toContainText("82.4% accuracy · Grade B");
  await expect(page.locator(".play-meta-tier")).toContainText("target 82,400");
  await expect(page.locator(".personal-best-target")).toHaveCount(0);
  await expect(page.locator(".overlay-tap .unlock-btn")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("challenge-ready.png"), animations: "disabled" });

  await page.locator(".overlay-tap .unlock-btn").click();
  const liveTarget = page.locator(".hud-score-target");
  await expect(liveTarget).toBeVisible();
  await expect(liveTarget).toHaveAttribute("data-kind", "challenge");
  await expect(liveTarget).toHaveText("GOAL −82.4K");

  await page.goto("/play/bs-s1-01?tier=standard&mode=arcade&challenge=1&target=-10&acc=999&grade=Z");
  await expect(page.locator(".challenge-target")).toHaveCount(0);
  await expect(page.locator(".play-meta-tier")).not.toContainText("target");
});

test("results compare the finished score with the shared target", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    sessionStorage.setItem("bs_last_run", JSON.stringify({
      v: 1,
      track_id: "bs-s1-01",
      title: "Neon Pulse",
      artist: "Pulse Atlas",
      tier: "standard",
      mode: "arcade",
      score: 90_000,
      accuracy: 86.7,
      maxCombo: 58,
      grade: "A",
      fc: false,
      ap: false,
      failed: false,
      counts: { perfect: 90, great: 14, good: 6, miss: 4 },
      totalNotes: 114,
      durationMs: 75_000,
      endedAt: "2026-09-13T04:50:00.000Z",
      challenge: { score: 82_400, accuracy: 82.4, grade: "B" },
    }));
  });
  await page.goto("/results");

  const result = page.locator(".challenge-result");
  await expect(result).toBeVisible();
  await expect(page.locator(".results-stats").getByText("90,000", { exact: true })).toBeVisible();
  await expect(result).toHaveAttribute("data-outcome", "cleared");
  await expect(result).toContainText("Challenge cleared");
  await expect(result).toContainText("+7,600 pts");
  await expect(result).toContainText("Target 82,400 · 82.4% · Grade B");
  const retry = result.locator("a.challenge-result-retry");
  await expect(retry).toHaveAttribute(
    "href",
    `/play/bs-s1-01?${challengeQuery}`,
  );
  if (info.project.name === "desktop") {
    await expect(retry).toBeVisible();
    expect(await retry.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  } else {
    await expect(retry).toBeHidden();
    const mobileRetry = page.getByRole("link", { name: "Retry challenge target 82,400", exact: true });
    await expect(mobileRetry).toHaveAttribute(
      "href",
      `/play/bs-s1-01?${challengeQuery}`,
    );
    expect(await mobileRetry.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("challenge-cleared.png"), animations: "disabled" });

  const activeRetry = info.project.name === "desktop"
    ? retry
    : page.getByRole("link", { name: "Retry challenge target 82,400", exact: true });
  await activeRetry.click();
  await expect(page.locator(".challenge-target")).toContainText("Beat 82,400 pts");
  const landed = new URL(page.url());
  expect(landed.pathname).toBe("/play/bs-s1-01");
  expect(landed.searchParams.toString()).toBe(challengeQuery);
});

test("the challenge target remains usable on a 320px phone", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Narrow-phone geometry is covered once in the mobile project.");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
  await page.goto(`/play/bs-s1-01?${challengeQuery}`);

  const overlay = page.locator(".overlay-tap");
  const target = page.locator(".challenge-target");
  const start = overlay.locator(".unlock-btn");
  await expect(overlay.locator(".overlay-kicker")).toBeVisible();
  await expect(target).toBeVisible();
  await expect(start).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await page.evaluate(() => {
    const overlayBox = document.querySelector(".overlay-tap")?.getBoundingClientRect();
    const kickerBox = document.querySelector(".overlay-tap .overlay-kicker")?.getBoundingClientRect();
    return Boolean(overlayBox && kickerBox && kickerBox.top >= overlayBox.top && kickerBox.bottom <= overlayBox.bottom);
  })).toBe(true);
  expect(await start.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: info.outputPath("challenge-ready-320.png"), animations: "disabled" });
});
