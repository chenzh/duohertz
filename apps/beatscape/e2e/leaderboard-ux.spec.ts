import { expect, test, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on('pageerror', (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('bs_onboarded', 'true');
    localStorage.setItem('bs_display_name', 'Riley West');
    localStorage.setItem('bs_board', JSON.stringify([
      {
        track_id: 'bs-s1-01',
        title: 'Neon Pulse',
        tier: 'hard',
        score: 123456,
        accuracy: 98.76,
        name: 'Riley West',
        at: '2026-09-13T12:00:00.000Z',
      },
      {
        track_id: 'bs-s1-05',
        title: 'Voltage Drop',
        tier: 'standard',
        score: 98765,
        accuracy: 91.2,
        name: 'Riley West',
        at: '2026-09-12T12:00:00.000Z',
      },
      {
        track_id: 'corrupt-missing-score',
        tier: 'hard',
        accuracy: 95,
        name: 'Broken save',
        at: '2026-09-11T12:00:00.000Z',
      },
      {
        track_id: 'corrupt-accuracy',
        tier: 'hard',
        score: 50000,
        accuracy: 140,
        name: 'Broken save',
        at: '2026-09-10T12:00:00.000Z',
      },
    ]));
    localStorage.setItem('bs_daily_board', '[]');
  });
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test('board heading and browser title follow the selected view', async ({ page }) => {
  await page.goto('/leaderboard?view=daily');

  const heading = page.getByRole('heading', { level: 1 });
  const allTime = page.getByRole('tab', { name: 'All-time local' });
  const daily = page.getByRole('tab', { name: 'Daily challenge' });
  await expect(daily).toHaveAttribute('aria-selected', 'true');
  await expect(heading).toHaveText('Daily Challenge Board');
  await expect(page).toHaveTitle('Daily Challenge Board — BeatScape');

  await allTime.click();
  await expect(heading).toHaveText('Local Board');
  await expect(page).toHaveTitle('Local Leaderboard — BeatScape');

  await daily.click();
  await expect(heading).toHaveText('Daily Challenge Board');
  await expect(page).toHaveTitle('Daily Challenge Board — BeatScape');
});

test('board views expose complete tab semantics and an immediate daily next action', async ({ page }) => {
  await page.goto('/leaderboard');

  await expect(page.locator('.leaderboard .tagline')).not.toContainText('Stage 1–3');
  await expect(page.locator('.leaderboard .tagline')).toContainText('Nothing is uploaded');

  const tablist = page.getByRole('tablist', { name: 'Scoreboard view' });
  const allTime = tablist.getByRole('tab', { name: 'All-time local' });
  const daily = tablist.getByRole('tab', { name: 'Daily challenge' });
  await expect(allTime).toHaveAttribute('aria-selected', 'true');
  await expect(daily).toHaveAttribute('aria-selected', 'false');
  await expect(page.getByRole('list', { name: 'All-time local scores' })).toBeVisible();
  await expect(page.locator('.board-row')).toHaveCount(2);
  await expect(page.getByRole('listitem', { name: /Rank 1.*Neon Pulse.*123,456 points.*98.76% accuracy/i })).toBeVisible();

  const replayTopScore = page.getByRole('link', { name: 'Replay Neon Pulse — hard Arcade', exact: true });
  await expect(replayTopScore).toBeVisible();
  await expect(replayTopScore).toHaveAttribute('href', '/play/bs-s1-01?tier=hard&mode=arcade');
  await expect(page.locator('.board-row').first()).toContainText('Replay');
  expect((await replayTopScore.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await replayTopScore.focus();
  await expect(replayTopScore).toBeFocused();
  expect(await replayTopScore.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none');

  await allTime.focus();
  await allTime.press('ArrowRight');
  await expect(daily).toBeFocused();
  await expect(daily).toHaveAttribute('aria-selected', 'true');
  await daily.press('ArrowRight');
  await expect(allTime).toBeFocused();
  await expect(allTime).toHaveAttribute('aria-selected', 'true');
  await allTime.press('End');
  await expect(daily).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('Set the first signal');

  const playDaily = page.getByRole('link', { name: 'Play today’s challenge', exact: true });
  await expect(playDaily).toBeVisible();
  expect((await playDaily.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(playDaily).toHaveAttribute('href', /\/play\/[^?]+\?tier=standard&mode=arcade&date=\d{4}-\d{2}-\d{2}&daily=1$/);
  const dailyHref = (await playDaily.getAttribute('href'))!;
  const dailyUrl = new URL(dailyHref, page.url());
  const dailyTrackId = dailyUrl.pathname.split('/').pop()!;
  const dailyDateKey = dailyUrl.searchParams.get('date')!;
  await page.evaluate(({ dailyTrackId, dailyDateKey }) => {
    localStorage.setItem('bs_daily_board', JSON.stringify([{
      track_id: dailyTrackId,
      title: 'Today Track',
      tier: 'standard',
      score: 76543,
      accuracy: 94.2,
      name: 'Riley West',
      at: `${dailyDateKey}T12:00:00.000Z`,
      dateKey: dailyDateKey,
      scoringVersion: 2,
    }]));
  }, { dailyTrackId, dailyDateKey });
  await allTime.click();
  await daily.click();

  const replayDaily = page.getByRole('link', { name: 'Play today Today Track — standard Arcade', exact: true });
  await expect(replayDaily).toBeVisible();
  await expect(replayDaily).toHaveAttribute('href', dailyHref);
  await expect(replayDaily).toContainText('Play today');
  await replayDaily.click();
  await expect(page).toHaveURL(/\/play\/[^?]+\?tier=standard&mode=arcade&date=\d{4}-\d{2}-\d{2}&daily=1$/);
  await expect(page.getByRole('button', { name: 'Start playing', exact: true })).toBeVisible();
});

test('320px board rows keep score and accuracy in one scannable metric line', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/leaderboard');

  const firstRow = page.locator('.board-row').first();
  const profileLink = page.getByRole('link', { name: 'View your profile →', exact: true });
  await expect(profileLink).toBeVisible();
  expect((await profileLink.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const score = await firstRow.locator('.board-score').boundingBox();
  const accuracy = await firstRow.locator('.board-acc').boundingBox();
  expect(score).not.toBeNull();
  expect(accuracy).not.toBeNull();
  expect(Math.abs(score!.y - accuracy!.y)).toBeLessThanOrEqual(3);
  await expect(firstRow).toContainText('PTS');
  await expect(firstRow).toContainText('ACC');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const lastRow = await page.locator('.board-row').last().boundingBox();
  const tabbar = await page.locator('.mobile-tabbar').boundingBox();
  expect(lastRow).not.toBeNull();
  expect(tabbar).not.toBeNull();
  expect(lastRow!.y + lastRow!.height).toBeLessThanOrEqual(tabbar!.y - 8);
  await page.screenshot({ path: info.outputPath('leaderboard-320.png'), fullPage: true, animations: 'disabled' });
});
