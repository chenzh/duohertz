import { expect, test, type Locator, type Page } from "@playwright/test";

declare global {
  interface Window {
    __holdHpSong?: {
      context: BaseAudioContext;
      when: number;
      offset: number;
    };
    __holdFeedbackTexts?: string[];
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

    const fillText = CanvasRenderingContext2D.prototype.fillText;
    window.__holdFeedbackTexts = [];
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fillText", {
      configurable: true,
      writable: true,
      value: function (this: CanvasRenderingContext2D, text: string, ...args: Parameters<CanvasRenderingContext2D["fillText"]> extends [string, ...infer Rest] ? Rest : never) {
        if (/RELEASE$/.test(String(text))) window.__holdFeedbackTexts!.push(String(text));
        return Reflect.apply(fillText, this, [text, ...args]);
      },
    });

    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) {
        window.__holdHpSong = {
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
      total_notes: 3,
      sections: [{ id: "hold-hp", t0: 0, t1: 10 }],
      notes: [
        { id: "hold-1", type: "hold", lane: 0, t: 1, end: 2 },
        { id: "finish", type: "tap", lane: 3, t: 9 },
      ],
    },
  }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function waitForSongTime(page: Page, seconds: number) {
  await page.waitForFunction((target) => {
    const song = window.__holdHpSong;
    return !!song && song.context.currentTime - song.when + song.offset >= target;
  }, seconds);
}

async function dispatchTouch(
  canvas: Locator,
  type: "pointerdown" | "pointerup",
  pointerId: number,
) {
  const box = (await canvas.boundingBox())!;
  await canvas.dispatchEvent(type, {
    bubbles: true,
    clientX: box.x + box.width * 0.125,
    clientY: box.y + box.height * 0.82,
    pointerId,
    pointerType: "touch",
    isPrimary: true,
    buttons: type === "pointerdown" ? 1 : 0,
  });
}

test("an early Hold release applies the lighter tail penalty in the live HUD", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const field = page.locator(".play-wrap");
  const canvas = field.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchTouch(canvas, "pointerdown", 71);
  await waitForSongTime(page, 1.2);
  await dispatchTouch(canvas, "pointerup", 71);

  await expect(field.locator(".hud-progress-count")).toHaveText("2/3");
  await expect(field.locator(".hud-hp-value")).toHaveText("95");
  await expect(field.locator(".hud-hp-fill")).toHaveAttribute("style", /width: 95%/);
  await expect(field.locator(".hud-hp-damage")).toHaveText("−5");
  await expect(field.locator(".hud-hp-damage")).toHaveAttribute("data-show", "1");
  await expect.poll(() => page.evaluate(() => window.__holdFeedbackTexts ?? []))
    .toContain("EARLY RELEASE");
  await page.screenshot({ path: info.outputPath("hold-tail-hp-damage.png"), animations: "disabled" });
  await expect(page).toHaveURL(/\/play\/bs-s1-01/);
});

test("an untouched Hold reports its combined head and tail HP loss", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const field = page.locator(".play-wrap");
  await expect(field.locator(".hud-hp-value")).toHaveText("88", { timeout: 6_000 });
  await expect(field.locator(".hud-hp-damage")).toHaveText("−12");
  await expect(field.locator(".hud-hp-damage")).toHaveAttribute("data-show", "1");
  expect(await page.evaluate(() => window.__holdFeedbackTexts ?? [])).not.toContain("LATE RELEASE");
});

test("holding past the tail explains that the release was late", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const field = page.locator(".play-wrap");
  const canvas = field.locator("canvas.play-canvas");
  await waitForSongTime(page, 0.99);
  await dispatchTouch(canvas, "pointerdown", 72);

  await expect(field.locator(".hud-hp-value")).toHaveText("95", { timeout: 3_000 });
  await expect.poll(() => page.evaluate(() => window.__holdFeedbackTexts ?? []))
    .toContain("LATE RELEASE");
  await dispatchTouch(canvas, "pointerup", 72);
});
