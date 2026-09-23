import { expect, test, type Locator, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }, info) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    const state = window as typeof window & { __pauseVibrateCalls?: Array<number | number[]> };
    state.__pauseVibrateCalls = [];
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: (pattern: number | number[]) => {
        state.__pauseVibrateCalls!.push(pattern);
        return true;
      },
    });
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_settings", JSON.stringify({
      hitsound: true,
      haptics: true,
      fancyFx: true,
      backgroundDim: 0.25,
      scrollBias: 0,
      musicVolume: 0.7,
      sfxVolume: 0.55,
      chordAssist: true,
      reduceMotion: false,
    }));
  });
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function expectReachable(target: Locator, page: Page) {
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
}

async function expectInViewport(target: Locator, page: Page) {
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
}

async function averagePlayfieldLuma(page: Page): Promise<number> {
  return page.locator("canvas.play-canvas").first().evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0;
    let channels = 0;
    // Sampling every 16th pixel keeps the assertion cheap while covering the
    // whole canvas, including authored art and the base district wash.
    for (let index = 0; index + 2 < pixels.length; index += 64) {
      sum += pixels[index]! + pixels[index + 1]! + pixels[index + 2]!;
      channels += 3;
    }
    return sum / channels;
  });
}

async function expectStoredMix(page: Page, expected: {
  musicVolume: number;
  sfxVolume: number;
  backgroundDim: number;
  hitsound: boolean;
  haptics: boolean;
  reduceMotion: boolean;
  chordAssist: boolean;
}) {
  await expect.poll(() => page.evaluate(() => {
    const settings = JSON.parse(localStorage.getItem("bs_settings") ?? "null");
    return settings && {
      musicVolume: settings.musicVolume,
      sfxVolume: settings.sfxVolume,
      backgroundDim: settings.backgroundDim,
      hitsound: settings.hitsound,
      haptics: settings.haptics,
      reduceMotion: settings.reduceMotion,
      chordAssist: settings.chordAssist,
    };
  })).toEqual(expected);
}

async function revealQuickMix(dialog: Locator) {
  await expect(dialog).toBeVisible();
  const disclosure = dialog.getByRole("button", { name: "Quick controls", exact: true });
  if (await disclosure.count()) {
    if (await disclosure.getAttribute("aria-expanded") === "false") await disclosure.click();
    await expect(disclosure).toHaveAttribute("aria-expanded", "true");
  }
  const quickMix = dialog.getByRole("group", { name: "Quick controls", exact: true });
  await expect(quickMix).toBeVisible();
  return quickMix;
}

async function adjustQuickMix(dialog: Locator, page: Page) {
  const quickMix = await revealQuickMix(dialog);
  const music = quickMix.getByRole("slider", { name: "Music volume", exact: true });
  const sfx = quickMix.getByRole("slider", { name: "SFX volume", exact: true });
  const dim = quickMix.getByRole("slider", { name: "Background dim", exact: true });
  const noteSpeed = quickMix.getByRole("slider", { name: "Note speed", exact: true });
  const hitsounds = quickMix.getByRole("checkbox", { name: "Hitsounds", exact: true });
  const haptics = quickMix.getByRole("checkbox", { name: "Haptics", exact: true });
  const reduceMotion = quickMix.getByRole("checkbox", { name: "Reduce motion", exact: true });
  const thumbAssist = quickMix.getByRole("checkbox", { name: "Thumb chord assist", exact: true });
  const hasThumbAssist = await thumbAssist.count() === 1;

  await expect(music).toHaveValue("70");
  await expect(sfx).toHaveValue("55");
  await expect(dim).toHaveValue("25");
  await expect(noteSpeed).toHaveValue("1");
  await expect(dim).toHaveAttribute("aria-valuetext", "25% dim");
  await expect(hitsounds).toBeChecked();
  await expect(haptics).toBeChecked();
  await expect(reduceMotion).not.toBeChecked();
  if (hasThumbAssist) await expect(thumbAssist).toBeChecked();
  await music.fill("25");
  await sfx.fill("40");
  await dim.fill("80");
  await noteSpeed.fill("1.5");
  await hitsounds.uncheck();
  await haptics.uncheck();
  await reduceMotion.check();
  if (hasThumbAssist) await thumbAssist.uncheck();
  await expect(quickMix.getByText("25%", { exact: true })).toBeVisible();
  await expect(quickMix.getByText("40%", { exact: true })).toBeVisible();
  await expect(quickMix.getByText("80%", { exact: true })).toBeVisible();
  await expect(quickMix.getByText("1.50×", { exact: true })).toBeVisible();
  await expect(dim).toHaveAttribute("aria-valuetext", "80% dim");
  await expectStoredMix(page, {
    musicVolume: 0.25,
    sfxVolume: 0.4,
    backgroundDim: 0.8,
    hitsound: false,
    haptics: false,
    reduceMotion: true,
    chordAssist: !hasThumbAssist,
  });
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem("bs_settings") ?? "null")?.scrollBias
  ))).toBeCloseTo(1 / 1.5 - 1);
  await expectReachable(music, page);
  await expectReachable(sfx, page);
  await expectReachable(dim, page);
  await expectReachable(noteSpeed, page);
  await expectReachable(hitsounds.locator(".."), page);
  await expectReachable(haptics.locator(".."), page);
  await expectReachable(reduceMotion.locator(".."), page);
  if (hasThumbAssist) await expectReachable(thumbAssist.locator(".."), page);
}

test("single-player pause offers a live, persistent quick mix", async ({ page }, info) => {
  let audioRequests = 0;
  page.on("request", (request) => {
    if (/\.(mp3|m4a|wav|ogg)(?:\?|$)/i.test(request.url())) audioRequests++;
  });
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  if (info.project.name === "mobile") {
    const disclosure = dialog.getByRole("button", { name: "Quick controls", exact: true });
    await expect(disclosure).toHaveAttribute("aria-expanded", "false");
    await expect(dialog.locator(".pause-quick-mix")).toBeHidden();
    await expectInViewport(dialog.getByRole("button", { name: "Resume", exact: true }), page);
    await expectInViewport(dialog.getByRole("button", { name: "Restart track", exact: true }), page);
    await expectInViewport(dialog.getByRole("button", { name: "Leave track", exact: true }), page);
    await page.screenshot({ path: info.outputPath("single-pause-compact.png"), animations: "disabled" });
  }
  const requestsBeforeMix = audioRequests;
  const field = page.locator(".play-wrap");
  await expect(field).toHaveAttribute("data-background-dim", "25");
  const lumaBeforeDim = await averagePlayfieldLuma(page);
  await adjustQuickMix(dialog, page);
  await expect(field).toHaveAttribute("data-background-dim", "80");
  await expect(field).toHaveAttribute("data-note-speed", "1.50×");
  await expect(page.locator("body")).toHaveAttribute("data-reduce-motion", "1");
  await expect.poll(() => averagePlayfieldLuma(page)).toBeLessThan(lumaBeforeDim * 0.6);
  expect(audioRequests).toBe(requestsBeforeMix);

  const resume = dialog.getByRole("button", { name: "Resume", exact: true });
  const hitsounds = dialog.getByRole("checkbox", { name: "Hitsounds", exact: true });
  const haptics = dialog.getByRole("checkbox", { name: "Haptics", exact: true });
  const reduceMotion = dialog.getByRole("checkbox", { name: "Reduce motion", exact: true });
  const thumbAssist = dialog.getByRole("checkbox", { name: "Thumb chord assist", exact: true });
  await resume.focus();
  await page.keyboard.press("Shift+Tab");
  if (info.project.name === "mobile") {
    await expect(thumbAssist).toBeFocused();
    await page.keyboard.press("Shift+Tab");
  }
  await expect(reduceMotion).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(haptics).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(hitsounds).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(haptics).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(reduceMotion).toBeFocused();
  await page.keyboard.press("Tab");
  if (info.project.name === "mobile") {
    await expect(thumbAssist).toBeFocused();
    await page.keyboard.press("Tab");
  }
  await expect(resume).toBeFocused();

  await page.evaluate(() => {
    (window as typeof window & { __pauseVibrateCalls?: Array<number | number[]> })
      .__pauseVibrateCalls = [];
  });
  await resume.click();
  await expect(dialog).toBeHidden();
  if (info.project.name === "mobile") {
    await expect.poll(async () => {
      const progress = await field.locator(".hud-progress-count").textContent();
      return Number(progress?.split("/")[0] ?? 0);
    }, { timeout: 6_000 }).toBeGreaterThan(0);
    expect(await page.evaluate(() => (
      window as typeof window & { __pauseVibrateCalls?: Array<number | number[]> }
    ).__pauseVibrateCalls ?? [])).toEqual([]);
  }
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await revealQuickMix(dialog);
  await expect(dialog.getByRole("slider", { name: "Music volume", exact: true })).toHaveValue("25");
  await expect(dialog.getByRole("slider", { name: "SFX volume", exact: true })).toHaveValue("40");
  await expect(dialog.getByRole("slider", { name: "Background dim", exact: true })).toHaveValue("80");
  await expect(dialog.getByRole("slider", { name: "Note speed", exact: true })).toHaveValue("1.5");
  await expect(dialog.getByRole("checkbox", { name: "Hitsounds", exact: true })).not.toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "Haptics", exact: true })).not.toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "Reduce motion", exact: true })).toBeChecked();
  if (info.project.name === "mobile") {
    await expect(dialog.getByRole("checkbox", { name: "Thumb chord assist", exact: true }))
      .not.toBeChecked();
  }
  await page.screenshot({ path: info.outputPath("single-pause-quick-mix.png"), animations: "disabled" });
});

test("Duo exposes one shared quick mix without disturbing synchronized pause", async ({ page }, info) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const pauseButtons = page.getByRole("button", { name: "Pause", exact: true });
  await expect(pauseButtons).toHaveCount(2);
  await pauseButtons.first().click();

  const dialog = page.getByRole("dialog", { name: "Duo paused", exact: true });
  if (info.project.name === "mobile") {
    const disclosure = dialog.getByRole("button", { name: "Quick controls", exact: true });
    await expect(disclosure).toHaveAttribute("aria-expanded", "false");
    await expect(dialog.locator(".pause-quick-mix")).toBeHidden();
    await expectInViewport(dialog.getByRole("button", { name: "Resume", exact: true }), page);
    await expectInViewport(dialog.getByRole("button", { name: "Restart duel", exact: true }), page);
    await expectInViewport(dialog.getByRole("button", { name: "Leave duel", exact: true }), page);
    await page.screenshot({ path: info.outputPath("duo-pause-compact.png"), animations: "disabled" });
  }
  await adjustQuickMix(dialog, page);
  const fields = page.locator(".play-wrap-duo");
  await expect(fields).toHaveCount(2);
  for (let index = 0; index < 2; index++) {
    await expect(fields.nth(index)).toHaveAttribute("data-note-speed", "1.50×");
  }
  await expect(pauseButtons).toHaveCount(0);

  await dialog.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(pauseButtons).toHaveCount(2);
  await pauseButtons.last().click();
  await revealQuickMix(dialog);
  await expect(dialog.getByRole("slider", { name: "Music volume", exact: true })).toHaveValue("25");
  await expect(dialog.getByRole("slider", { name: "Background dim", exact: true })).toHaveValue("80");
  await expect(dialog.getByRole("checkbox", { name: "Hitsounds", exact: true })).not.toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "Haptics", exact: true })).not.toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "Reduce motion", exact: true })).toBeChecked();
  if (info.project.name === "mobile") {
    await expect(dialog.getByRole("checkbox", { name: "Thumb chord assist", exact: true }))
      .not.toBeChecked();
  }
  await page.screenshot({ path: info.outputPath("duo-pause-quick-mix.png"), animations: "disabled" });
});
