import { expect, test, type Locator, type Page } from "@playwright/test";

declare global {
  interface Window {
    __gestureSong?: {
      context: BaseAudioContext;
      when: number;
      offset: number;
    };
  }
}

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(Element.prototype, "webkitRequestFullscreen", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(Element.prototype, "setPointerCapture", {
      configurable: true,
      value: () => {},
    });

    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) {
        window.__gestureSong = {
          context: this.context,
          when: args[0] ?? this.context.currentTime,
          offset: args[1] ?? 0,
        };
      }
      return start.apply(this, args);
    };
  });
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 1,
      sections: [{ id: "gesture", t0: 0, t1: 2 }],
      notes: [{ id: "tap-1", type: "tap", lane: 0, t: 1 }],
    },
  }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function dispatchContextMenu(target: Locator): Promise<boolean> {
  return target.evaluate((element) => element.dispatchEvent(new MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    button: 2,
  })));
}

async function waitForSongTime(page: Page, seconds: number) {
  await page.waitForFunction((target) => {
    const song = window.__gestureSong;
    return !!song && song.context.currentTime - song.when + song.offset >= target;
  }, seconds);
}

test("the live play surface owns browser gestures without locking normal pages", async ({ page }) => {
  await page.goto("/library");
  const libraryMain = page.locator("main");
  await expect(libraryMain).toBeVisible();

  expect(await libraryMain.evaluate((element) => getComputedStyle(element).userSelect)).not.toBe("none");
  expect(await dispatchContextMenu(libraryMain)).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.body).overscrollBehavior)).not.toBe("none");

  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  const field = page.locator(".play-wrap");
  const canvas = page.locator("canvas.play-canvas");
  const readyOverlay = page.locator(".overlay-tap");
  await expect(canvas).toBeVisible();

  expect(await field.evaluate((element) => getComputedStyle(element).touchAction)).toBe("auto");
  expect(await field.evaluate((element) => getComputedStyle(element).userSelect)).toBe("none");
  expect(await canvas.evaluate((element) => getComputedStyle(element).touchAction)).toBe("none");
  expect(await readyOverlay.evaluate((element) => getComputedStyle(element).touchAction)).toBe("auto");
  expect(await dispatchContextMenu(canvas)).toBe(false);
  expect(await page.evaluate(() => getComputedStyle(document.body).overscrollBehavior)).toBe("none");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overscrollBehavior)).toBe("none");

  await page.getByRole("button", { name: "Exit the Scape", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Leave the Scape?" })).toHaveCount(0);
  await expect(page).toHaveURL(/\/track\/bs-s1-01/);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overscrollBehavior)).not.toBe("none");
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overscrollBehavior)).not.toBe("none");
});

test("secondary mouse input cannot score a lane", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Secondary mouse input is a desktop regression.");
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  const box = (await canvas.boundingBox())!;
  await waitForSongTime(page, 0.99);
  await page.mouse.click(box.x + box.width * 0.125, box.y + box.height * 0.82, { button: "right" });

  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({ score: 0, counts: { miss: 1 } });
});
