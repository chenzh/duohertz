import { expect, test, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on('pageerror', (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    Date.now = () => new Date('2026-09-13T12:00:00+08:00').getTime();
    localStorage.setItem('bs_onboarded', 'true');
  });
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test('mobile radio keeps one transcript open and preserves episode deep links', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/radio');

  const seasonToggle = page.locator('#season-1 > .radio-season-title');
  await expect(seasonToggle).toBeVisible();
  expect((await seasonToggle.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const longestSeasonCount = page.locator('#season-3 .radio-season-count');
  await expect(longestSeasonCount).toBeVisible();
  expect(await longestSeasonCount.evaluate((node) => getComputedStyle(node).whiteSpace)).toBe('nowrap');

  const current = page.getByRole('button', { name: /EP 3.*The Quiet Block/i });
  const first = page.getByRole('button', { name: /EP 1.*First Light, First Static/i });
  await expect(current).toHaveAttribute('aria-expanded', 'true');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.radio-dialogue:visible')).toHaveCount(1);
  expect((await first.boundingBox())!.height).toBeGreaterThanOrEqual(44);

  await first.click();
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await expect(current).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#ep-1 .radio-dialogue')).toBeVisible();
  await expect(page.locator('#ep-3 .radio-dialogue')).toBeHidden();
  await expect(page).toHaveURL(/#ep-1$/);

  await page.goto('/radio#ep-2');
  await expect(page.getByRole('button', { name: /EP 2.*House Rules/i })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#ep-2 .radio-dialogue')).toBeVisible();
  await expect(page.locator('.radio-dialogue:visible')).toHaveCount(1);

  await page.goto('/radio#ep-9');
  await expect(page.locator('#season-2')).toHaveAttribute('open', '');
  await expect(page.locator('#ep-9')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await page.goto('/radio');
  await expect(page.locator('.radio-dialogue:visible')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(3000);
  await page.screenshot({ path: info.outputPath('radio-program-mobile.png'), fullPage: true, animations: 'disabled' });
});

test('desktop radio keeps the full aired program visible', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/radio');

  await expect(page.locator('#season-1')).toHaveAttribute('open', '');
  await expect(page.locator('#season-2')).not.toHaveAttribute('open', '');
  await expect(page.locator('.radio-dialogue:visible')).toHaveCount(3);
  await expect(page.locator('.radio-episode-toggle')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('receiver tuning follows the selected channel without moving the live marker', async ({ page }, info) => {
  await page.goto('/radio');

  const channels = page.getByRole('radiogroup', { name: 'Receiver channels', exact: true });
  const channel1 = channels.getByRole('radio', { name: /CH 1.*Call-in/i });
  const channel2 = channels.getByRole('radio', { name: /CH 2.*Cold Blocks/i });
  const channel3 = channels.getByRole('radio', { name: /CH 3.*The Drop Wars/i });
  await expect(channels.getByRole('radio')).toHaveCount(3);
  await expect(channel1).toHaveAttribute('aria-checked', 'true');
  await expect(channel1).toHaveAttribute('tabindex', '0');
  await expect(channel2).toHaveAttribute('aria-checked', 'false');
  await expect(channel2).toHaveAttribute('tabindex', '-1');
  await expect(channel1).toContainText(/live/i);
  await expect(channel2).not.toContainText(/live/i);
  await expect(page.locator('.radio-readout-freq')).toHaveText('88.6');

  await channel1.focus();
  await channel1.press('ArrowRight');
  await expect(channel2).toBeFocused();
  await expect(channel1).toHaveAttribute('aria-checked', 'false');
  await expect(channel1).toHaveAttribute('tabindex', '-1');
  await expect(channel2).toHaveAttribute('aria-checked', 'true');
  await expect(channel2).toHaveAttribute('tabindex', '0');
  await expect(page.locator('.radio-readout-freq')).toHaveText('90.0');
  await expect(page.locator('#season-1')).not.toHaveAttribute('open', '');
  await expect(page.locator('#season-2')).toHaveAttribute('open', '');
  await expect(page.locator('#season-2 > .radio-season-title')).not.toContainText('on air');
  await expect(channel1).toContainText(/live/i);
  await page.locator('.radio-deck').screenshot({ path: info.outputPath('receiver-ch2.png'), animations: 'disabled' });

  await channel2.press('ArrowLeft');
  await expect(channel1).toBeFocused();
  await expect(channel1).toHaveAttribute('aria-checked', 'true');
  await channel1.press('End');
  await expect(channel3).toBeFocused();
  await expect(channel3).toHaveAttribute('aria-checked', 'true');
  await channel3.press('Home');
  await expect(channel1).toBeFocused();
  await expect(channel1).toHaveAttribute('aria-checked', 'true');

  await page.locator('#season-3 > .radio-season-title').click();
  await expect(channel3).toHaveAttribute('aria-checked', 'true');
  await expect(channel3).toHaveAttribute('tabindex', '0');
  await expect(page.locator('.radio-readout-freq')).toHaveText('91.4');
});
