import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ viewport: { width: 320, height: 568 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

type TargetSize = {
  label: string;
  width: number;
  height: number;
};

async function visibleTargetSizes(locator: Locator, label: string): Promise<TargetSize[]> {
  const sizes: TargetSize[] = [];
  for (let index = 0; index < await locator.count(); index += 1) {
    const target = locator.nth(index);
    if (!(await target.isVisible())) continue;
    const box = await target.boundingBox();
    expect(box, `${label} ${index + 1} should have a layout box`).not.toBeNull();
    sizes.push({
      label: `${label} ${index + 1}`,
      width: Math.round(box!.width * 10) / 10,
      height: Math.round(box!.height * 10) / 10,
    });
  }
  return sizes;
}

async function collect(page: Page, targets: Array<[string, string]>): Promise<TargetSize[]> {
  const groups = await Promise.all(
    targets.map(([selector, label]) => visibleTargetSizes(page.locator(selector), label)),
  );
  return groups.flat();
}

function expectMinimumTouchTargets(sizes: TargetSize[]) {
  expect(sizes.length, "the audit should find visible controls").toBeGreaterThan(0);
  expect(
    sizes.filter(({ width, height }) => width < 44 || height < 44),
    "visible pre-game controls smaller than 44×44px",
  ).toEqual([]);
}

test("Home and Library navigation and filters keep 44px touch targets", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.locator(".section-link").first()).toBeVisible();
  const sizes = await collect(page, [
    [".header-avatar", "profile avatar"],
    [".mobile-tabbar .tab-item", "mobile tab"],
    [".section-link", "home section link"],
  ]);

  await page.goto("/library");
  const moreFilters = page.locator(".library-more-filters > summary");
  await expect(moreFilters).toBeVisible();
  await moreFilters.click();
  await expect(page.locator(".filter-chip").first()).toBeVisible();
  sizes.push(...await collect(page, [
    [".header-avatar", "library profile avatar"],
    [".chip-link", "showcase track"],
    [".library-more-filters > summary", "library more filters"],
    [".filter-chip", "library filter"],
    [".filters-bar input", "library search"],
    [".filters-bar select", "library genre"],
  ]));

  await page.locator(".filter-chips").first().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("library-controls-320.png"),
    animations: "disabled",
  });
  expectMinimumTouchTargets(sizes);
});

test("Track setup and pre-game utilities keep 44px touch targets", async ({ page }, info) => {
  await page.goto("/track/bs-s1-05");
  await expect(page.getByRole("heading", { name: "Voltage Drop", exact: true })).toBeVisible();
  const sizes = await collect(page, [
    [".header-avatar", "track profile avatar"],
    [".back-link", "track back link"],
    [".audiobar-toggle", "track preview toggle"],
    [".run-segments button", "run choice"],
    [".run-speed-stepper button", "note-speed stepper"],
    [".track-primary-actions .btn", "track primary action"],
    [".track-secondary-actions .btn", "track secondary action"],
  ]);

  await page.goto("/play/bs-s1-05?tier=easy&mode=casual");
  await expect(page.getByRole("button", { name: "Start playing", exact: true })).toBeVisible();
  sizes.push(...await collect(page, [
    [".play-exit", "pre-game exit"],
    [".unlock-btn", "start playing"],
    [".unlock-sound", "sound check"],
    [".unlock-link", "adjust timing"],
    [".unlock-nosound > summary", "no-sound help"],
    [".play-fullscreen", "fullscreen"],
  ]));

  await page.locator(".unlock-nosound > summary").click();
  sizes.push(...await collect(page, [
    [".unlock-nosound a", "no-sound settings link"],
  ]));

  await page.screenshot({
    path: info.outputPath("pregame-controls-320.png"),
    animations: "disabled",
  });
  expectMinimumTouchTargets(sizes);
});

test("Settings keyboard controls keep 44px touch targets", async ({ page }, info) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  const sizes = await collect(page, [
    [".header-avatar", "settings profile avatar"],
    [".mobile-tabbar .tab-item", "settings mobile tab"],
    [".settings-calibrate", "calibration link"],
    [".settings-keymap-summary", "keyboard controls disclosure"],
  ]);

  const disclosure = page.locator(".settings-keymap-summary");
  if (await disclosure.isVisible()) await disclosure.click();
  await expect(page.locator(".preset-row .btn.compact").first()).toBeVisible();
  sizes.push(...await collect(page, [
    [".preset-row .btn.compact", "keyboard preset"],
    [".keys-grid .keycap", "lane key binding"],
  ]));

  await page.locator(".settings-keymap").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("settings-keyboard-controls-320.png"),
    animations: "disabled",
  });
  expectMinimumTouchTargets(sizes);
});
