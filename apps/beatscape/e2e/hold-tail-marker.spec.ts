import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __holdNoteDraws?: Array<{ at: number; x: number; y: number; width: number; height: number }>;
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

    const original = CanvasRenderingContext2D.prototype.drawImage;
    window.__holdNoteDraws = [];
    Object.defineProperty(CanvasRenderingContext2D.prototype, "drawImage", {
      configurable: true,
      writable: true,
      value: function (this: CanvasRenderingContext2D, ...args: unknown[]) {
        const source = args[0] as { width?: unknown; height?: unknown } | undefined;
        const values = args.slice(1).map(Number);
        if (source?.width === 120 && source.height === 120 && values.length === 4) {
          window.__holdNoteDraws!.push({
            at: performance.now(),
            x: values[0]!,
            y: values[1]!,
            width: values[2]!,
            height: values[3]!,
          });
          if (window.__holdNoteDraws!.length > 2_000) window.__holdNoteDraws!.splice(0, 1_000);
        }
        return Reflect.apply(original, this, args);
      },
    });
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
      sections: [{ id: "hold-readability", t0: 0, t1: 10 }],
      notes: [
        { id: "hold-1", type: "hold", lane: 0, t: 2, end: 4 },
        { id: "finish", type: "tap", lane: 3, t: 9 },
      ],
    },
  }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("Hold draws separate head and release markers on desktop and mobile", async ({ page }, info) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await page.waitForTimeout(3_350);

  const markerGeometry = await page.evaluate(() => {
    const recent = (window.__holdNoteDraws ?? []).filter((draw) => performance.now() - draw.at < 120);
    const laneZero = recent.filter((draw) => draw.x + draw.width / 2 < innerWidth * 0.25);
    const centers = laneZero
      .map((draw) => draw.y + draw.height / 2)
      .sort((a, b) => a - b)
      .reduce<number[]>((distinct, center) => {
        if (distinct.every((value) => Math.abs(value - center) > 12)) distinct.push(center);
        return distinct;
      }, []);
    return { drawCount: laneZero.length, centers };
  });

  expect(markerGeometry.drawCount).toBeGreaterThan(0);
  expect(markerGeometry.centers).toHaveLength(2);
  expect(markerGeometry.centers[1]! - markerGeometry.centers[0]!).toBeGreaterThan(40);
  await page.locator("canvas.play-canvas").screenshot({
    path: info.outputPath("hold-head-and-tail.png"),
    animations: "disabled",
  });
});
