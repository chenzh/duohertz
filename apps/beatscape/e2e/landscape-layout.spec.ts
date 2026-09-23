import { expect, test, type Locator, type Page } from "@playwright/test";

const LANDSCAPES = [
  { label: "wide", width: 844, height: 390 },
  { label: "compact", width: 667, height: 375 },
] as const;
const errors = new WeakMap<Page, string[]>();

async function expectInsideViewport(
  locator: Locator,
  viewport: (typeof LANDSCAPES)[number],
) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function expectNoViewportScroll(page: Page, viewport: (typeof LANDSCAPES)[number]) {
  expect(await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    viewportWidth: innerWidth,
    viewportHeight: innerHeight,
  }))).toEqual({
    width: viewport.width,
    height: viewport.height,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
  });
}

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

for (const viewport of LANDSCAPES) {
  test.describe(`${viewport.width}x${viewport.height} ${viewport.label} landscape`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewport);
    });

    test("single-player keeps its start and judgment line inside the viewport", async ({ page }, info) => {
      await page.goto("/play/bs-s1-01?tier=easy&mode=casual");

      const start = page.getByRole("button", { name: "Start playing", exact: true });
      await expect(start).toBeVisible();
      await expectInsideViewport(start, viewport);
      expect((await start.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await start.click();

      const field = page.locator(".play-wrap");
      await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
      await expectInsideViewport(page.locator(".play-meta"), viewport);
      await expectInsideViewport(field, viewport);
      await expect(field.locator(".hud-judges")).toBeHidden();
      await expectNoViewportScroll(page, viewport);
      expect((await page.getByRole("button", { name: "Pause", exact: true }).boundingBox())!.height)
        .toBeGreaterThanOrEqual(44);

      await page.screenshot({
        path: info.outputPath(`single-landscape-${viewport.label}.png`),
        animations: "disabled",
      });

      await page.getByRole("button", { name: "Pause", exact: true }).click();
      const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
      const resume = pauseDialog.getByRole("button", { name: "Resume", exact: true });
      const restart = pauseDialog.getByRole("button", { name: "Restart track", exact: true });
      const leave = pauseDialog.getByRole("button", { name: "Leave track", exact: true });
      const music = pauseDialog.getByRole("slider", { name: "Music volume", exact: true });
      const sfx = pauseDialog.getByRole("slider", { name: "SFX volume", exact: true });
      const dim = pauseDialog.getByRole("slider", { name: "Background dim", exact: true });
      const noteSpeed = pauseDialog.getByRole("slider", { name: "Note speed", exact: true });
      const hitsounds = pauseDialog.getByRole("checkbox", { name: "Hitsounds", exact: true });
      const haptics = pauseDialog.getByRole("checkbox", { name: "Haptics", exact: true });
      const reduceMotion = pauseDialog.getByRole("checkbox", { name: "Reduce motion", exact: true });
      const thumbAssist = pauseDialog.getByRole("checkbox", { name: "Thumb chord assist", exact: true });
      await expect(resume).toBeVisible();
      await expect(restart).toBeVisible();
      await expect(leave).toBeVisible();
      await expectInsideViewport(music, viewport);
      await expectInsideViewport(sfx, viewport);
      await expectInsideViewport(dim, viewport);
      await expectInsideViewport(noteSpeed, viewport);
      for (const slider of [music, sfx, dim, noteSpeed]) {
        const sliderBox = await slider.boundingBox();
        expect(sliderBox, "pause slider should have measurable geometry").not.toBeNull();
        expect(sliderBox!.width, "pause slider should remain draggable").toBeGreaterThanOrEqual(44);
        expect(sliderBox!.height, "pause slider should keep a touch-safe target").toBeGreaterThanOrEqual(44);
      }
      await expectInsideViewport(hitsounds, viewport);
      await expectInsideViewport(haptics, viewport);
      await expectInsideViewport(reduceMotion, viewport);
      if (info.project.name === "mobile") {
        const thumbAssistTarget = thumbAssist.locator("..");
        await expectInsideViewport(thumbAssistTarget, viewport);
        expect((await thumbAssistTarget.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      await expectInsideViewport(resume, viewport);
      await expectInsideViewport(restart, viewport);
      await expectInsideViewport(leave, viewport);
      await expectNoViewportScroll(page, viewport);
      await page.screenshot({
        path: info.outputPath(`single-pause-landscape-${viewport.label}.png`),
        animations: "disabled",
      });
    });

    test("Practice keeps tempo and quick controls usable in the pause card", async ({ page }, info) => {
      await page.goto("/play/bs-s1-01?tier=easy&mode=practice");
      await page.getByRole("button", { name: "Start playing", exact: true }).click();
      await page.getByRole("button", { name: "Pause", exact: true }).click();

      const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
      const tempo = pauseDialog.getByRole("group", { name: "Practice tempo", exact: true });
      const music = pauseDialog.getByRole("slider", { name: "Music volume", exact: true });
      const sfx = pauseDialog.getByRole("slider", { name: "SFX volume", exact: true });
      const dim = pauseDialog.getByRole("slider", { name: "Background dim", exact: true });
      const noteSpeed = pauseDialog.getByRole("slider", { name: "Note speed", exact: true });
      const hitsounds = pauseDialog.getByRole("checkbox", { name: "Hitsounds", exact: true });
      const haptics = pauseDialog.getByRole("checkbox", { name: "Haptics", exact: true });
      const reduceMotion = pauseDialog.getByRole("checkbox", { name: "Reduce motion", exact: true });
      const thumbAssist = pauseDialog.getByRole("checkbox", { name: "Thumb chord assist", exact: true });

      await expectInsideViewport(tempo, viewport);
      for (const slider of [music, sfx, dim, noteSpeed]) {
        await expectInsideViewport(slider, viewport);
        const sliderBox = await slider.boundingBox();
        expect(sliderBox!.width, "Practice pause slider should remain draggable")
          .toBeGreaterThanOrEqual(44);
      }
      await expectInsideViewport(hitsounds, viewport);
      await expectInsideViewport(haptics, viewport);
      await expectInsideViewport(reduceMotion, viewport);
      if (info.project.name === "mobile") {
        const thumbAssistTarget = thumbAssist.locator("..");
        await expectInsideViewport(thumbAssistTarget, viewport);
        expect((await thumbAssistTarget.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      await expectNoViewportScroll(page, viewport);
      await page.screenshot({
        path: info.outputPath(`practice-pause-landscape-${viewport.label}.png`),
        animations: "disabled",
      });
    });

    test("Arcade keeps HP inside the compact card and clear of SIGNAL", async ({ page }, info) => {
      await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");
      await page.getByRole("button", { name: "Start playing", exact: true }).click();

      const field = page.locator(".play-wrap");
      const card = field.locator(".hud-chip");
      const hp = field.locator(".hud-hp");
      const signal = field.locator(".hud-signal");
      await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
      await expect(hp).toBeVisible();
      await expectInsideViewport(card, viewport);
      await expectInsideViewport(hp, viewport);
      await expectInsideViewport(signal, viewport);

      const cardBox = (await card.boundingBox())!;
      const hpBox = (await hp.boundingBox())!;
      const signalBox = (await signal.boundingBox())!;
      expect(hpBox.x).toBeGreaterThanOrEqual(cardBox.x);
      expect(hpBox.x + hpBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
      expect(hpBox.y + hpBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height + 1);
      expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(signalBox.x + 1);
      expect(cardBox.height).toBeLessThanOrEqual(96);
      await expectNoViewportScroll(page, viewport);

      await page.screenshot({
        path: info.outputPath(`arcade-landscape-${viewport.label}.png`),
        animations: "disabled",
      });
    });

    test("Duo keeps both fields playable side by side inside the viewport", async ({ page }, info) => {
      await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");

      const start = page.getByRole("button", { name: "Start", exact: true });
      await expect(start).toBeVisible();
      await expectInsideViewport(start, viewport);
      expect((await start.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await start.click();

      const fields = page.locator(".play-wrap-duo");
      await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);
      await expectInsideViewport(page.locator(".play-meta"), viewport);
      await expectInsideViewport(page.locator(".play-meta .play-exit"), viewport);
      await expectInsideViewport(page.locator(".play-meta > strong"), viewport);
      await expectInsideViewport(page.locator(".duo-stage"), viewport);
      for (let index = 0; index < 2; index++) {
        await expectInsideViewport(fields.nth(index), viewport);
        await expect(fields.nth(index).locator(".hud-judges")).toBeHidden();
        const scoreCard = (await fields.nth(index).locator(".hud-chip").boundingBox())!;
        const signal = (await fields.nth(index).locator(".hud-signal").boundingBox())!;
        const pause = (await fields.nth(index).getByRole("button", { name: "Pause", exact: true }).boundingBox())!;
        expect(scoreCard.x + scoreCard.width + 4, "Duo score must not be covered by SIGNAL")
          .toBeLessThanOrEqual(signal.x);
        expect(signal.x + signal.width + 4, "Duo SIGNAL must not cover Pause")
          .toBeLessThanOrEqual(pause.x);
        expect(pause.height)
          .toBeGreaterThanOrEqual(44);
      }
      await expectNoViewportScroll(page, viewport);

      await page.screenshot({
        path: info.outputPath(`duo-landscape-${viewport.label}.png`),
        animations: "disabled",
      });

      await fields.first().getByRole("button", { name: "Pause", exact: true }).click();
      const pauseDialog = page.getByRole("dialog", { name: "Duo paused", exact: true });
      await expect(pauseDialog).toBeVisible();
      await expectInsideViewport(pauseDialog.getByRole("button", { name: "Resume", exact: true }), viewport);
      await expectInsideViewport(pauseDialog.getByRole("button", { name: "Restart duel", exact: true }), viewport);
      await expect(page.locator(".play-wrap-duo").getByRole("button", { name: "Resume", exact: true })).toHaveCount(0);
    });
  });
}
