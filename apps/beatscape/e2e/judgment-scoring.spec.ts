import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __scoringSong?: {
      context: BaseAudioContext;
      when: number;
      offset: number;
    };
    __scorePopTexts?: string[];
    __scorePopDraws?: Array<{ text: string; y: number }>;
    __comboBreakTexts?: string[];
    __comboMilestoneTexts?: string[];
    __scoringVibrations?: Array<number | number[]>;
    __judgmentTextBounds?: Array<{
      text: string;
      at: number;
      centerX: number;
      centerY: number;
      left: number;
      right: number;
      top: number;
      bottom: number;
      canvasWidth: number;
    }>;
    __motionParticleRects?: number;
    __gameplayPaintOps?: Array<{
      frame: number;
      order: number;
      kind: "combo" | "countdown" | "note";
      left: number;
      right: number;
      top: number;
      bottom: number;
    }>;
  }
}

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    // Hit at the stable pre-note poll point while the real gameplay offset
    // shifts the effective clock +70ms into Casual's Good-only band.
    localStorage.setItem("bs_offset_ms", "-70");
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
    window.__scoringVibrations = [];
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: (pattern: number | number[]) => {
        window.__scoringVibrations!.push(pattern);
        return true;
      },
    });

    const fillText = CanvasRenderingContext2D.prototype.fillText;
    const milestoneTextByCanvas = new WeakMap<HTMLCanvasElement, string>();
    let gameplayPaintFrame = 0;
    let gameplayPaintOrder = 0;
    const recordGameplayPaint = (paint: Omit<NonNullable<Window["__gameplayPaintOps"]>[number], "frame" | "order">) => {
      const paints = window.__gameplayPaintOps!;
      paints.push({ ...paint, frame: gameplayPaintFrame, order: gameplayPaintOrder++ });
      if (paints.length > 4_000) paints.splice(0, paints.length - 4_000);
    };
    window.__scorePopTexts = [];
    window.__scorePopDraws = [];
    window.__comboBreakTexts = [];
    window.__comboMilestoneTexts = [];
    window.__judgmentTextBounds = [];
    window.__gameplayPaintOps = [];
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fillText", {
      configurable: true,
      writable: true,
      value: function (this: CanvasRenderingContext2D, text: string, ...args: Parameters<CanvasRenderingContext2D["fillText"]> extends [string, ...infer Rest] ? Rest : never) {
        if (/^\+\d/.test(String(text))) {
          window.__scorePopTexts!.push(String(text));
          window.__scorePopDraws!.push({ text: String(text), y: Number(args[1]) });
        }
        if (String(text) === "COMBO BREAK") window.__comboBreakTexts!.push(String(text));
        if (/^\d+ COMBO!$/.test(String(text))) {
          milestoneTextByCanvas.set(this.canvas, String(text));
        }
        if (
          this.canvas.classList.contains("play-canvas")
          && /^(PERFECT|GREAT|GOOD|MISS)$/.test(String(text))
        ) {
          const transform = this.getTransform();
          const center = new DOMPoint(Number(args[0]), Number(args[1])).matrixTransform(transform);
          const scaleX = Math.hypot(transform.a, transform.b);
          const scaleY = Math.hypot(transform.c, transform.d);
          const metrics = this.measureText(String(text));
          const halfWidth = (metrics.width + this.lineWidth) * scaleX / 2;
          const strokeHalf = this.lineWidth / 2;
          window.__judgmentTextBounds!.push({
            text: String(text),
            at: performance.now(),
            centerX: center.x,
            centerY: center.y,
            left: center.x - halfWidth,
            right: center.x + halfWidth,
            top: center.y - (metrics.actualBoundingBoxAscent + strokeHalf) * scaleY,
            bottom: center.y + (metrics.actualBoundingBoxDescent + strokeHalf) * scaleY,
            canvasWidth: this.canvas.width,
          });
        }
        if (this.canvas.classList.contains("play-canvas") && String(text) === "10") {
          const transform = this.getTransform();
          const center = new DOMPoint(Number(args[0]), Number(args[1])).matrixTransform(transform);
          const scaleX = Math.hypot(transform.a, transform.b);
          const scaleY = Math.hypot(transform.c, transform.d);
          const metrics = this.measureText(String(text));
          const strokeHalf = this.lineWidth / 2;
          const halfWidth = (metrics.width + this.lineWidth) * scaleX / 2;
          recordGameplayPaint({
            kind: "combo",
            left: center.x - halfWidth,
            right: center.x + halfWidth,
            top: center.y - (metrics.actualBoundingBoxAscent + strokeHalf) * scaleY,
            bottom: center.y + (metrics.actualBoundingBoxDescent + strokeHalf) * scaleY,
          });
        }
        if (
          this.canvas.classList.contains("play-canvas")
          && String(text) === "3"
          && this.font.includes("96px")
        ) {
          const transform = this.getTransform();
          const center = new DOMPoint(Number(args[0]), Number(args[1])).matrixTransform(transform);
          const scaleX = Math.hypot(transform.a, transform.b);
          const scaleY = Math.hypot(transform.c, transform.d);
          const metrics = this.measureText(String(text));
          const strokeHalf = this.lineWidth / 2;
          const halfWidth = (metrics.width + this.lineWidth) * scaleX / 2;
          recordGameplayPaint({
            kind: "countdown",
            left: center.x - halfWidth,
            right: center.x + halfWidth,
            top: center.y - (metrics.actualBoundingBoxAscent + strokeHalf) * scaleY,
            bottom: center.y + (metrics.actualBoundingBoxDescent + strokeHalf) * scaleY,
          });
        }
        return Reflect.apply(fillText, this, [text, ...args]);
      },
    });

    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    Object.defineProperty(CanvasRenderingContext2D.prototype, "drawImage", {
      configurable: true,
      writable: true,
      value: function (this: CanvasRenderingContext2D, image: CanvasImageSource, ...args: unknown[]) {
        if (image instanceof HTMLCanvasElement) {
          const milestoneText = milestoneTextByCanvas.get(image);
          if (milestoneText) window.__comboMilestoneTexts!.push(milestoneText);
        }
        if (
          this.canvas.classList.contains("play-canvas")
          && image instanceof HTMLCanvasElement
          && image.width === 120
          && image.height === 120
          && args.length >= 4
        ) {
          const left = Number(args[0]);
          const top = Number(args[1]);
          const width = Number(args[2]);
          const height = Number(args[3]);
          const transform = this.getTransform();
          const corners = [
            new DOMPoint(left, top).matrixTransform(transform),
            new DOMPoint(left + width, top).matrixTransform(transform),
            new DOMPoint(left, top + height).matrixTransform(transform),
            new DOMPoint(left + width, top + height).matrixTransform(transform),
          ];
          recordGameplayPaint({
            kind: "note",
            left: Math.min(...corners.map((point) => point.x)),
            right: Math.max(...corners.map((point) => point.x)),
            top: Math.min(...corners.map((point) => point.y)),
            bottom: Math.max(...corners.map((point) => point.y)),
          });
        }
        return Reflect.apply(drawImage, this, [image, ...args]);
      },
    });

    const fillRect = CanvasRenderingContext2D.prototype.fillRect;
    window.__motionParticleRects = 0;
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fillRect", {
      configurable: true,
      writable: true,
      value: function (this: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        const color = String(this.fillStyle).toLowerCase().replaceAll(" ", "");
        if (
          this.canvas.classList.contains("play-canvas")
          && color === "#12100f"
          && x === 0
          && y === 0
        ) {
          gameplayPaintFrame++;
          gameplayPaintOrder = 0;
        }
        if ((color === "#5b8def" || color === "rgb(91,141,239)") && w > 0 && h > 0 && w <= 12 && h <= 12) {
          window.__motionParticleRects = (window.__motionParticleRects ?? 0) + 1;
        }
        return fillRect.call(this, x, y, w, h);
      },
    });

    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) {
        window.__scoringSong = {
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
      sections: [{ id: "score", t0: 0, t1: 3 }],
      notes: [{ id: "good-1", type: "tap", lane: 0, t: 1 }],
    },
  }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function tapLaneAtSongTime(page: Page, seconds: number, lanePosition: number) {
  await page.evaluate(({ target, laneX }) => new Promise<void>((resolve) => {
    const poll = () => {
      const song = window.__scoringSong;
      if (!song || song.context.currentTime - song.when + song.offset < target) {
        requestAnimationFrame(poll);
        return;
      }
      const canvas = document.querySelector<HTMLCanvasElement>("canvas.play-canvas")!;
      const box = canvas.getBoundingClientRect();
      canvas.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true,
        clientX: box.x + box.width * laneX,
        clientY: box.y + box.height * 0.82,
        pointerId: 41,
        pointerType: "touch",
        isPrimary: true,
        buttons: 1,
      }));
      resolve();
    };
    poll();
  }), { target: seconds, laneX: lanePosition });
}

async function tapLaneSequence(
  page: Page,
  events: Array<{ seconds: number; lanePosition: number }>,
) {
  await page.evaluate((scheduled) => new Promise<void>((resolve) => {
    let index = 0;
    const poll = () => {
      const song = window.__scoringSong;
      if (!song) {
        requestAnimationFrame(poll);
        return;
      }
      const songSeconds = song.context.currentTime - song.when + song.offset;
      const canvas = document.querySelector<HTMLCanvasElement>("canvas.play-canvas")!;
      const box = canvas.getBoundingClientRect();
      while (index < scheduled.length && songSeconds >= scheduled[index].seconds) {
        const event = scheduled[index];
        const pointerId = 100 + index;
        const clientX = box.x + box.width * event.lanePosition;
        const clientY = box.y + box.height * 0.82;
        canvas.dispatchEvent(new PointerEvent("pointerdown", {
          bubbles: true,
          clientX,
          clientY,
          pointerId,
          pointerType: "touch",
          isPrimary: true,
          buttons: 1,
        }));
        canvas.dispatchEvent(new PointerEvent("pointerup", {
          bubbles: true,
          clientX,
          clientY,
          pointerId,
          pointerType: "touch",
          isPrimary: true,
          buttons: 0,
        }));
        index++;
      }
      if (index >= scheduled.length) resolve();
      else requestAnimationFrame(poll);
    };
    poll();
  }), events);
}

async function pressKeyAtSongTime(
  page: Page,
  seconds: number,
  code: string,
  key: string,
) {
  await page.evaluate(({ target, keyCode, keyValue }) => new Promise<void>((resolve) => {
    const poll = () => {
      const song = window.__scoringSong;
      if (!song || song.context.currentTime - song.when + song.offset < target) {
        requestAnimationFrame(poll);
        return;
      }
      window.dispatchEvent(new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        code: keyCode,
        key: keyValue,
      }));
      window.dispatchEvent(new KeyboardEvent("keyup", {
        bubbles: true,
        code: keyCode,
        key: keyValue,
      }));
      resolve();
    };
    poll();
  }), { target: seconds, keyCode: code, keyValue: key });
}

test("a real Good hit earns 100 points and breaks combo", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await tapLaneAtSongTime(page, 0.99, 0.125);

  await expect.poll(() => page.evaluate(() => window.__scorePopTexts ?? [])).toContain("+100");

  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({
    score: 100,
    accuracy: 40,
    maxCombo: 0,
    fc: false,
    ap: false,
    counts: { perfect: 0, great: 0, good: 1, miss: 0 },
    totalNotes: 1,
  });
  await expect(page.locator(".results-stats")).toContainText("40%");
  await expect(page.getByText("FULL COMBO", { exact: true })).toHaveCount(0);
});

test("a Good visibly explains that the active Combo was broken", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.unroute("**/catalog/bs-s1-01/easy.json*");
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 4,
      sections: [{ id: "combo-break", t0: 0, t1: 6 }],
      notes: [
        { id: "combo-1", type: "tap", lane: 0, t: 1 },
        { id: "combo-2", type: "tap", lane: 1, t: 1.5 },
        { id: "combo-break", type: "tap", lane: 2, t: 2 },
        { id: "finish", type: "tap", lane: 3, t: 4 },
      ],
    },
  }));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  // The test profile applies +70ms effective offset. The first two presses
  // land centered; the third lands +60ms in Casual's Good band.
  await tapLaneSequence(page, [
    { seconds: 0.93, lanePosition: 0.125 },
    { seconds: 1.43, lanePosition: 0.375 },
  ]);
  await page.evaluate(() => { window.__comboBreakTexts = []; });
  await tapLaneSequence(page, [{ seconds: 1.99, lanePosition: 0.625 }]);

  await expect.poll(() => page.evaluate(() => window.__comboBreakTexts ?? []))
    .toContain("COMBO BREAK");
  await page.locator("canvas.play-canvas").screenshot({
    path: info.outputPath("combo-break.png"),
    animations: "disabled",
  });
});

test("a same-frame recovery cannot hide the Combo break", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.unroute("**/catalog/bs-s1-01/easy.json*");
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 5,
      sections: [{ id: "same-frame-break", t0: 0, t1: 10 }],
      notes: [
        { id: "warmup-1", type: "tap", lane: 0, t: 1 },
        { id: "warmup-2", type: "tap", lane: 1, t: 1.5 },
        { id: "break", type: "tap", lane: 2, t: 2 },
        { id: "recover", type: "tap", lane: 3, t: 2.06 },
        { id: "finish", type: "tap", lane: 0, t: 8 },
      ],
    },
  }));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await tapLaneSequence(page, [
    { seconds: 0.93, lanePosition: 0.125 },
    { seconds: 1.43, lanePosition: 0.375 },
  ]);
  await page.evaluate(() => {
    window.__comboBreakTexts = [];
    window.__scorePopTexts = [];
  });
  // Both transitions are dispatched inside one rAF poll: the first lands Good
  // at +60ms and breaks Combo 2; the second is centered on its 2.06s note and
  // immediately rebuilds the final session Combo to 1.
  await tapLaneSequence(page, [
    { seconds: 1.99, lanePosition: 0.625 },
    { seconds: 1.99, lanePosition: 0.875 },
  ]);

  await expect.poll(() => page.evaluate(() => window.__scorePopTexts ?? []), { timeout: 700 })
    .toEqual(expect.arrayContaining(["+100", "+300"]));
  await expect.poll(() => page.evaluate(() => window.__comboBreakTexts ?? []), { timeout: 700 })
    .toContain("COMBO BREAK");
  await page.locator("canvas.play-canvas").screenshot({
    path: info.outputPath("same-frame-combo-break.png"),
    animations: "disabled",
  });
});

test("a same-frame chord cannot skip a crossed Combo milestone", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.unroute("**/catalog/bs-s1-01/easy.json*");
  const warmup = Array.from({ length: 9 }, (_, index) => ({
    id: `warmup-${index + 1}`,
    type: "tap",
    lane: 1,
    t: 1 + index * 0.22,
  }));
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 12,
      sections: [{ id: "crossed-milestone", t0: 0, t1: 10 }],
      notes: [
        ...warmup,
        { id: "combo-10-11", type: "chord", lanes: [0, 3], t: 3.2 },
        { id: "finish", type: "tap", lane: 2, t: 8 },
      ],
    },
  }));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  // Nine centered hits establish Combo 9. Both chord lanes then dispatch in
  // one rAF poll, so the engine legitimately advances straight from 9 to 11.
  await tapLaneSequence(page, warmup.map((note) => ({
    seconds: note.t - 0.07,
    lanePosition: 0.375,
  })));
  await page.evaluate(() => {
    window.__comboMilestoneTexts = [];
    window.__scoringVibrations = [];
  });
  await tapLaneSequence(page, [
    { seconds: 3.13, lanePosition: 0.125 },
    { seconds: 3.13, lanePosition: 0.875 },
  ]);

  await expect.poll(
    () => page.evaluate(() => window.__comboMilestoneTexts ?? []),
    { timeout: 700 },
  ).toContain("10 COMBO!");
  if (info.project.name === "mobile") {
    await expect.poll(
      () => page.evaluate(() => window.__scoringVibrations ?? []),
      { timeout: 700 },
    ).toContain(18);
  }
  await page.locator("canvas.play-canvas").screenshot({
    path: info.outputPath("crossed-combo-milestone.png"),
    animations: "disabled",
  });
});

test("incoming notes retain paint priority over the live Combo readout", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.unroute("**/catalog/bs-s1-01/easy.json*");
  const warmup = Array.from({ length: 10 }, (_, index) => ({
    id: `layering-warmup-${index + 1}`,
    type: "tap",
    lane: index % 4,
    t: 0.5 + index * 0.1,
  }));
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 240,
      audio_offset_ms: 0,
      ar: 32,
      total_notes: 13,
      sections: [{ id: "combo-layering", t0: 0, t1: 4 }],
      notes: [
        ...warmup,
        { id: "center-chord", type: "chord", lanes: [1, 2], t: 2.2 },
        { id: "finish", type: "tap", lane: 0, t: 3.2 },
      ],
    },
  }));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await tapLaneSequence(page, warmup.map((note) => ({
    seconds: note.t - 0.07,
    lanePosition: (note.lane + 0.5) / 4,
  })));

  const readOverlapFrame = () => page.evaluate(() => {
    const frames = new Map<number, NonNullable<Window["__gameplayPaintOps"]>>();
    for (const paint of window.__gameplayPaintOps ?? []) {
      const frame = frames.get(paint.frame) ?? [];
      frame.push(paint);
      frames.set(paint.frame, frame);
    }
    for (const frameNumber of [...frames.keys()].sort((a, b) => b - a)) {
      const paints = frames.get(frameNumber)!;
      const combo = paints.find((paint) => paint.kind === "combo");
      if (!combo) continue;
      const overlappingNotes = paints.filter((paint) => (
        paint.kind === "note"
        && Math.min(combo.right, paint.right) > Math.max(combo.left, paint.left)
        && Math.min(combo.bottom, paint.bottom) > Math.max(combo.top, paint.top)
      ));
      if (overlappingNotes.length === 0) continue;
      return {
        found: true,
        overlapCount: overlappingNotes.length,
        notesAfterCombo: overlappingNotes.every((paint) => paint.order > combo.order),
      };
    }
    return { found: false, overlapCount: 0, notesAfterCombo: false };
  });

  await expect.poll(readOverlapFrame).toMatchObject({ found: true });
  const layering = await readOverlapFrame();
  await page.locator("canvas.play-canvas").screenshot({
    path: info.outputPath("combo-behind-incoming-notes.png"),
    animations: "disabled",
  });
  expect(layering.overlapCount).toBeGreaterThan(0);
  expect(layering.notesAfterCombo).toBe(true);
});

test("pre-rolled notes retain paint priority over the count-in", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.unroute("**/catalog/bs-s1-01/easy.json*");
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 3,
      sections: [{ id: "count-in-layering", t0: 0, t1: 6 }],
      notes: [
        { id: "center-count-in-chord", type: "chord", lanes: [1, 2], t: 1 },
        { id: "finish", type: "tap", lane: 0, t: 5 },
      ],
    },
  }));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const readOverlapFrame = () => page.evaluate(() => {
    const frames = new Map<number, NonNullable<Window["__gameplayPaintOps"]>>();
    for (const paint of window.__gameplayPaintOps ?? []) {
      const frame = frames.get(paint.frame) ?? [];
      frame.push(paint);
      frames.set(paint.frame, frame);
    }
    for (const frameNumber of [...frames.keys()].sort((a, b) => b - a)) {
      const paints = frames.get(frameNumber)!;
      const countdown = paints.find((paint) => paint.kind === "countdown");
      if (!countdown) continue;
      const overlappingNotes = paints.filter((paint) => (
        paint.kind === "note"
        && Math.min(countdown.right, paint.right) > Math.max(countdown.left, paint.left)
        && Math.min(countdown.bottom, paint.bottom) > Math.max(countdown.top, paint.top)
      ));
      if (overlappingNotes.length === 0) continue;
      return {
        found: true,
        overlapCount: overlappingNotes.length,
        notesAfterCountdown: overlappingNotes.every((paint) => paint.order > countdown.order),
      };
    }
    return { found: false, overlapCount: 0, notesAfterCountdown: false };
  });

  await expect.poll(readOverlapFrame).toMatchObject({ found: true });
  const layering = await readOverlapFrame();
  await page.locator("canvas.play-canvas").screenshot({
    path: info.outputPath("count-in-behind-pre-rolled-notes.png"),
    animations: "disabled",
  });
  expect(layering.overlapCount).toBeGreaterThan(0);
  expect(layering.notesAfterCountdown).toBe(true);
});

test("outer-lane judgment text remains fully inside the play canvas", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
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
      sections: [{ id: "outer-judgment", t0: 0, t1: 6 }],
      notes: [
        { id: "outer-perfect", type: "tap", lane: 3, t: 1 },
        { id: "finish", type: "tap", lane: 0, t: 5 },
      ],
    },
  }));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await page.evaluate(() => { window.__judgmentTextBounds = []; });
  // The exact valid tier may move between Perfect and Great under a loaded
  // mobile worker. This contract owns edge containment, so require a scored
  // hit and validate every rendered judgment instead of coupling geometry to
  // one timing tier. The positive timing lean still points toward the edge.
  await tapLaneSequence(page, [{ seconds: 0.94, lanePosition: 0.875 }]);
  await expect.poll(() => page.evaluate(() => window.__judgmentTextBounds?.length ?? 0))
    .toBeGreaterThan(0);
  await page.waitForTimeout(120);

  const bounds = await page.evaluate(() => window.__judgmentTextBounds ?? []);
  expect(bounds.some((draw) => ["PERFECT", "GREAT", "GOOD"].includes(draw.text))).toBe(true);
  for (const draw of bounds) {
    expect(draw.left).toBeGreaterThanOrEqual(0);
    expect(draw.right).toBeLessThanOrEqual(draw.canvasWidth);
  }
  await page.locator("canvas.play-canvas").screenshot({
    path: info.outputPath("outer-judgment-contained.png"),
    animations: "disabled",
  });
});

test("adjacent chord judgments remain individually readable", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.unroute("**/catalog/bs-s1-01/easy.json*");
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 4,
      sections: [{ id: "adjacent-feedback", t0: 0, t1: 6 }],
      notes: [
        { id: "three-lane-chord", type: "chord", lanes: [0, 1, 2], t: 1 },
        { id: "finish", type: "tap", lane: 3, t: 5 },
      ],
    },
  }));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await page.evaluate(() => { window.__judgmentTextBounds = []; });
  await tapLaneSequence(page, [
    { seconds: 0.93, lanePosition: 0.125 },
    { seconds: 0.93, lanePosition: 0.375 },
    { seconds: 0.93, lanePosition: 0.625 },
  ]);
  await expect.poll(() => page.evaluate(() => window.__judgmentTextBounds?.length ?? 0))
    .toBeGreaterThanOrEqual(3);
  await page.waitForTimeout(120);

  const collision = await page.evaluate(() => {
    const draws = window.__judgmentTextBounds ?? [];
    let worstArea = 0;
    let worstPair: [string, string] | null = null;
    for (let leftIndex = 0; leftIndex < draws.length; leftIndex++) {
      for (let rightIndex = leftIndex + 1; rightIndex < draws.length; rightIndex++) {
        const first = draws[leftIndex]!;
        const second = draws[rightIndex]!;
        if (Math.abs(first.at - second.at) > 2 || Math.abs(first.centerX - second.centerX) < 2) continue;
        const overlapX = Math.min(first.right, second.right) - Math.max(first.left, second.left);
        const overlapY = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
        const area = Math.max(0, overlapX) * Math.max(0, overlapY);
        if (area > worstArea) {
          worstArea = area;
          worstPair = [first.text, second.text];
        }
      }
    }
    return { worstArea, worstPair };
  });
  expect(collision).toEqual({ worstArea: 0, worstPair: null });
  await page.locator("canvas.play-canvas").screenshot({
    path: info.outputPath("adjacent-chord-judgments.png"),
    animations: "disabled",
  });
});

test("batched chord assist feedback keeps the gain awarded before a later miss", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Thumb chord assist is touch-only.");
  await page.unroute("**/catalog/bs-s1-01/easy.json*");
  const warmup = Array.from({ length: 49 }, (_, index) => ({
    id: `warmup-${index}`,
    type: "tap",
    lane: 2,
    t: 1 + index * 0.09,
  }));
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 52,
      sections: [{ id: "score", t0: 0, t1: 7 }],
      notes: [
        ...warmup,
        { id: "assisted", type: "chord", lanes: [0, 1], t: 5.6 },
        { id: "same-frame-miss", type: "tap", lane: 3, t: 5.6 },
      ],
    },
  }));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  // The test profile carries a +70ms effective offset. Schedule each physical
  // press 70ms early so all warmups and the played chord lane land Perfect.
  await tapLaneSequence(page, warmup.map((note) => ({
    seconds: note.t - 0.07,
    lanePosition: 0.625,
  })));
  await page.evaluate(() => { window.__scorePopTexts = []; });
  await tapLaneSequence(page, [{ seconds: 5.53, lanePosition: 0.125 }]);

  // The banked Great crosses combo 50 and really earns 400. The unplayed lane
  // then misses in the same tick and resets combo; feedback must not recompute
  // the earlier event from that final zero-combo state.
  await expect.poll(() => page.evaluate(() => window.__scorePopTexts ?? [])).toContain("+400");
  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({
    score: 15_700,
    maxCombo: 51,
    counts: { perfect: 50, great: 1, good: 0, miss: 1 },
    totalNotes: 52,
  });
});

test("a keyboard press on a touch-capable device never receives two-thumb chord assist", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Hybrid-device scoring needs a coarse-pointer profile.");
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
      sections: [{ id: "hybrid-input", t0: 0, t1: 2 }],
      notes: [{ id: "keyboard-chord", type: "chord", lanes: [0, 1], t: 1 }],
    },
  }));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  // The device advertises touch, but this hit is an external-keyboard event.
  // The +70ms effective offset makes a 0.93s physical press land dead center.
  await pressKeyAtSongTime(page, 0.93, "ArrowLeft", "ArrowLeft");

  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({
    score: 300,
    counts: { perfect: 1, great: 0, miss: 1 },
    totalNotes: 2,
  });
});

test("Reduce motion keeps essential score feedback still and removes hit particles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/settings");
  await page.getByRole("checkbox", { name: "Reduce motion (screen shake, moving backgrounds)" }).check();
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await page.evaluate(() => {
    window.__scorePopDraws = [];
    window.__motionParticleRects = 0;
  });
  await tapLaneAtSongTime(page, 0.99, 0.125);
  await expect.poll(() => page.evaluate(() => window.__scorePopDraws?.length ?? 0)).toBeGreaterThan(1);

  const feedback = await page.evaluate(() => ({
    ys: (window.__scorePopDraws ?? []).map((draw) => draw.y),
    particles: window.__motionParticleRects ?? 0,
  }));
  expect(Math.max(...feedback.ys) - Math.min(...feedback.ys)).toBeLessThanOrEqual(1);
  expect(feedback.particles).toBe(0);
});

test("pause Quick controls apply Reduce motion to the active run", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();

  const pause = page.getByRole("dialog", { name: "Scape paused", exact: true });
  const disclosure = pause.getByRole("button", { name: "Quick controls", exact: true });
  if (await disclosure.count()) {
    await disclosure.click();
  }
  await pause.getByRole("checkbox", { name: "Reduce motion", exact: true }).check();
  await expect(page.locator("body")).toHaveAttribute("data-reduce-motion", "1");
  await pause.getByRole("button", { name: "Resume", exact: true }).click();

  await page.evaluate(() => {
    window.__scorePopDraws = [];
    window.__motionParticleRects = 0;
  });
  await tapLaneAtSongTime(page, 0.99, 0.125);
  await expect.poll(() => page.evaluate(() => window.__scorePopDraws?.length ?? 0)).toBeGreaterThan(1);

  const feedback = await page.evaluate(() => ({
    ys: (window.__scorePopDraws ?? []).map((draw) => draw.y),
    particles: window.__motionParticleRects ?? 0,
  }));
  expect(Math.max(...feedback.ys) - Math.min(...feedback.ys)).toBeLessThanOrEqual(1);
  expect(feedback.particles).toBe(0);
});

test("a live system reduce-motion change reaches the active playfield", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    window.__scorePopDraws = [];
    window.__motionParticleRects = 0;
  });
  await tapLaneAtSongTime(page, 0.99, 0.125);
  await expect.poll(() => page.evaluate(() => window.__scorePopDraws?.length ?? 0)).toBeGreaterThan(1);

  const feedback = await page.evaluate(() => ({
    ys: (window.__scorePopDraws ?? []).map((draw) => draw.y),
    particles: window.__motionParticleRects ?? 0,
  }));
  expect(Math.max(...feedback.ys) - Math.min(...feedback.ys)).toBeLessThanOrEqual(1);
  expect(feedback.particles).toBe(0);
});
