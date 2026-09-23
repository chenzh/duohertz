import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __eventTimingSong?: {
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
    localStorage.setItem("bs_offset_ms", "0");
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
        window.__eventTimingSong = {
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
      sections: [{ id: "timing", t0: 0, t1: 3 }],
      notes: [{ id: "queued-hit", type: "tap", lane: 0, t: 1 }],
    },
  }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function queueLaneEventAtSongTime(
  page: Page,
  touch: boolean,
  phase: "down" | "up",
  targetSeconds: number,
): Promise<number> {
  return page.evaluate(({ touch: useTouch, phase: inputPhase, target }) => new Promise<number>((resolve) => {
    const poll = () => {
      const song = window.__eventTimingSong;
      if (!song || song.context.currentTime - song.when + song.offset < target) {
        requestAnimationFrame(poll);
        return;
      }

      const canvas = document.querySelector<HTMLCanvasElement>("canvas.play-canvas")!;
      const box = canvas.getBoundingClientRect();
      const down = inputPhase === "down";
      const event = useTouch
        ? new PointerEvent(down ? "pointerdown" : "pointerup", {
            bubbles: true,
            clientX: box.x + box.width * 0.125,
            clientY: box.y + box.height * 0.82,
            pointerId: 71,
            pointerType: "touch",
            isPrimary: true,
            buttons: down ? 1 : 0,
          })
        : new KeyboardEvent(down ? "keydown" : "keyup", {
            bubbles: true,
            cancelable: down,
            code: "ArrowLeft",
            key: "ArrowLeft",
          });

      window.setTimeout(() => {
        const age = performance.now() - event.timeStamp;
        if (useTouch) canvas.dispatchEvent(event);
        else window.dispatchEvent(event);
        resolve(age);
      }, 65);
    };
    poll();
  }), { touch, phase, target: targetSeconds });
}

test("queued keyboard and touch input use physical event time, not delayed handler time", async ({
  page,
}, testInfo) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const queuedAgeMs = await queueLaneEventAtSongTime(
    page,
    testInfo.project.name === "mobile",
    "down",
    1,
  );

  expect(queuedAgeMs).toBeGreaterThanOrEqual(50);
  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({
    score: 300,
    accuracy: 100,
    counts: { perfect: 1, great: 0, good: 0, miss: 0 },
    totalNotes: 1,
  });
});

test("queued Hold release keeps its physical tail timing", async ({ page }, testInfo) => {
  await page.unroute("**/catalog/bs-s1-01/easy.json*");
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 2,
      sections: [{ id: "timing", t0: 0, t1: 4 }],
      notes: [{ id: "queued-hold", type: "hold", lane: 0, t: 1, end: 2 }],
    },
  }));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const touch = testInfo.project.name === "mobile";
  expect(await queueLaneEventAtSongTime(page, touch, "down", 1)).toBeGreaterThanOrEqual(50);
  expect(await queueLaneEventAtSongTime(page, touch, "up", 2)).toBeGreaterThanOrEqual(50);

  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({
    score: 600,
    accuracy: 100,
    counts: { perfect: 2, great: 0, good: 0, miss: 0 },
    totalNotes: 2,
  });
});
