import { expect, test, type Locator, type Page } from "@playwright/test";

declare global {
  interface Window {
    __chordSong?: {
      context: BaseAudioContext;
      when: number;
      offset: number;
    };
    __chordConnectorStrokes?: Array<{
      lineWidth: number;
      strokeStyle: string;
    }>;
    __chordFeedbackDraws?: Array<{ text: string; x: number }>;
  }
}

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_settings", JSON.stringify({ chordAssist: true }));
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
    window.__chordFeedbackDraws = [];
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fillText", {
      configurable: true,
      writable: true,
      value: function (this: CanvasRenderingContext2D, value: string, ...args: Parameters<CanvasRenderingContext2D["fillText"]> extends [string, ...infer Rest] ? Rest : never) {
        const text = String(value);
        if (text === "ASSIST" || text === "LATE") {
          const transform = this.getTransform();
          const localX = Number(args[0]);
          const localY = Number(args[1]);
          const cssScale = this.canvas.clientWidth > 0
            ? this.canvas.width / this.canvas.clientWidth
            : 1;
          window.__chordFeedbackDraws!.push({
            text,
            x: (transform.a * localX + transform.c * localY + transform.e) / cssScale,
          });
        }
        return Reflect.apply(fillText, this, [value, ...args]);
      },
    });

    const paths = new WeakMap<CanvasRenderingContext2D, {
      from?: { x: number; y: number };
      to?: { x: number; y: number };
    }>();
    const beginPath = CanvasRenderingContext2D.prototype.beginPath;
    const moveTo = CanvasRenderingContext2D.prototype.moveTo;
    const lineTo = CanvasRenderingContext2D.prototype.lineTo;
    const stroke = CanvasRenderingContext2D.prototype.stroke;
    window.__chordConnectorStrokes = [];
    CanvasRenderingContext2D.prototype.beginPath = function (...args) {
      paths.set(this, {});
      return beginPath.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.moveTo = function (x, y) {
      const path = paths.get(this) ?? {};
      path.from = { x, y };
      paths.set(this, path);
      return moveTo.call(this, x, y);
    };
    CanvasRenderingContext2D.prototype.lineTo = function (x, y) {
      const path = paths.get(this) ?? {};
      path.to = { x, y };
      paths.set(this, path);
      return lineTo.call(this, x, y);
    };
    CanvasRenderingContext2D.prototype.stroke = function (...args) {
      const path = paths.get(this);
      const width = this.canvas.clientWidth;
      if (
        this.canvas.classList.contains("play-canvas")
        && path?.from
        && path.to
        && Math.abs(path.from.x - width * 0.125) < 2
        && Math.abs(path.to.x - width * 0.375) < 2
        && Math.abs(path.from.y - path.to.y) < 0.5
      ) {
        window.__chordConnectorStrokes!.push({
          lineWidth: this.lineWidth,
          strokeStyle: String(this.strokeStyle),
        });
        if (window.__chordConnectorStrokes!.length > 500) {
          window.__chordConnectorStrokes!.splice(0, 250);
        }
      }
      return stroke.apply(this, args);
    };

    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) {
        window.__chordSong = {
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
      sections: [{ id: "chord-feedback", t0: 0, t1: 6 }],
      notes: [
        { id: "chord", type: "chord", lanes: [0, 1], t: 1 },
        { id: "finish", type: "tap", lane: 3, t: 4 },
      ],
    },
  }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function waitForSongTime(page: Page, seconds: number) {
  await page.waitForFunction((target) => {
    const song = window.__chordSong;
    return !!song && song.context.currentTime - song.when + song.offset >= target;
  }, seconds);
}

async function touchLane(canvas: Locator, lanePosition: number) {
  const box = (await canvas.boundingBox())!;
  await canvas.dispatchEvent("pointerdown", {
    bubbles: true,
    clientX: box.x + box.width * lanePosition,
    clientY: box.y + box.height * 0.82,
    pointerId: 81,
    pointerType: "touch",
    isPrimary: true,
    buttons: 1,
  });
}

test("Chord grouping stays visible and a banked touch lane says ASSIST", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const canvas = page.locator("canvas.play-canvas");
  await expect.poll(() => page.evaluate(() => window.__chordConnectorStrokes ?? []))
    .toEqual(expect.arrayContaining([
      expect.objectContaining({ lineWidth: expect.any(Number), strokeStyle: "#000000" }),
      expect.objectContaining({ lineWidth: expect.any(Number), strokeStyle: "#f5efe6" }),
    ]));
  await canvas.screenshot({
    path: info.outputPath("chord-connector.png"),
    animations: "disabled",
  });

  await waitForSongTime(page, 0.99);
  await page.evaluate(() => { window.__chordFeedbackDraws = []; });
  await touchLane(canvas, 0.125);

  await expect.poll(() => page.evaluate(() => {
    const width = document.querySelector<HTMLCanvasElement>("canvas.play-canvas")!.clientWidth;
    const targetX = width * 0.375;
    return (window.__chordFeedbackDraws ?? []).some((draw) => (
      draw.text === "ASSIST" && Math.abs(draw.x - targetX) < 2
    ));
  })).toBe(true);
  const laneFeedback = await page.evaluate(() => {
    const width = document.querySelector<HTMLCanvasElement>("canvas.play-canvas")!.clientWidth;
    const targetX = width * 0.375;
    return (window.__chordFeedbackDraws ?? []).filter((draw) => Math.abs(draw.x - targetX) < 2);
  });
  expect(laneFeedback.some((draw) => draw.text === "ASSIST")).toBe(true);
  expect(laneFeedback.some((draw) => draw.text === "LATE")).toBe(false);
});

test("mobile pause can enable Thumb chord assist for the active run", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Thumb chord assist is only shown on touch-capable surfaces");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    localStorage.setItem("bs_settings", JSON.stringify({ chordAssist: false }));
  });
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();

  const pause = page.getByRole("dialog", { name: "Scape paused", exact: true });
  const disclosure = pause.getByRole("button", { name: "Quick controls", exact: true });
  if (await disclosure.count()) await disclosure.click();
  const assist = pause.getByRole("checkbox", { name: "Thumb chord assist", exact: true });
  await expect(assist).not.toBeChecked();
  await assist.check();
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem("bs_settings") ?? "null")?.chordAssist
  ))).toBe(true);

  await pause.getByRole("button", { name: "Resume", exact: true }).click();
  await waitForSongTime(page, 0.99);
  await page.evaluate(() => { window.__chordFeedbackDraws = []; });
  const canvas = page.locator("canvas.play-canvas");
  await touchLane(canvas, 0.125);

  await expect.poll(() => page.evaluate(() => (
    window.__chordFeedbackDraws ?? []
  ))).toEqual(expect.arrayContaining([
    expect.objectContaining({ text: "ASSIST" }),
  ]));
});
