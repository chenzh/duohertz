import { expect, test, type Locator, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function expectClearTopHud(field: Locator) {
  const card = (await field.locator(".hud-chip").boundingBox())!;
  const signal = (await field.locator(".hud-signal").boundingBox())!;
  const pause = (await field.getByRole("button", { name: "Pause", exact: true }).boundingBox())!;
  expect(card.x + card.width).toBeLessThanOrEqual(signal.x + 1);
  expect(signal.x + signal.width).toBeLessThanOrEqual(pause.x + 1);
  expect(card.height).toBeLessThanOrEqual(82);
}

async function expectClearArcadeTopHud(field: Locator) {
  const card = (await field.locator(".hud-chip").boundingBox())!;
  const signal = (await field.locator(".hud-signal").boundingBox())!;
  const pause = (await field.getByRole("button", { name: "Pause", exact: true }).boundingBox())!;
  expect(card.x + card.width).toBeLessThanOrEqual(signal.x + 1);
  expect(signal.x + signal.width).toBeLessThanOrEqual(pause.x + 1);
  expect(card.height).toBeLessThanOrEqual(96);
}

test("single-player HUD keeps accuracy and progress without duplicated chrome", async ({ page }, info) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.locator(".overlay-tap .unlock-btn").click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();

  const field = page.locator(".play-wrap");
  await expect(field.locator(".hud-track-score")).toBeVisible();
  await expect(field.locator(".hud-track-accuracy")).toContainText("ACC —");
  await expect(field.locator(".hud-progress-count")).toHaveText(/^0\/\d+$/);
  await expect(field.locator(".hud-track-title, .hud-track-tier, .hud-combo")).toHaveCount(0);
  await expect(field.locator(".hud-hp")).toHaveCount(0);
  await expect(field.locator(".hud-judges")).toBeHidden();
  await expect(page.locator(".play-meta")).toContainText("Neon Pulse");
  await expectClearTopHud(field);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  if (info.project.name === "mobile") {
    const fieldBox = (await field.boundingBox())!;
    const cardBox = (await field.locator(".hud-chip").boundingBox())!;
    // On a portrait phone the live card sits over the note highway. Keep it
    // well short of the old one-third footprint so lane two exposes incoming
    // notes earlier without dropping any of the live performance values.
    expect(cardBox.width / fieldBox.width).toBeLessThanOrEqual(0.31);
    expect(cardBox.height).toBeLessThanOrEqual(72);
  }

  // The first real note is at 1.018s after the countdown. Let it pass so the
  // test proves the ref-driven DOM updates, not only the static initial copy.
  await expect.poll(() => field.locator(".hud-progress-count").textContent(), { timeout: 6_000 })
    .toMatch(/^[1-9]\d*\/114$/);
  await expect(field.locator(".hud-track-accuracy")).toContainText("ACC 0.00%");
  expect(await field.locator(".hud-progress-fill").evaluate((node) => parseFloat(getComputedStyle(node).width)))
    .toBeGreaterThan(0);

  const metaBox = await page.locator(".play-meta").boundingBox();
  const exitBox = await page.getByRole("button", { name: "Exit the Scape", exact: true }).boundingBox();
  expect(metaBox).not.toBeNull();
  expect(exitBox).not.toBeNull();
  expect(metaBox!.y).toBeGreaterThanOrEqual(0);
  expect(exitBox!.y).toBeGreaterThanOrEqual(0);
  expect(await page.evaluate(() => scrollY)).toBe(0);

  await page.screenshot({ path: info.outputPath("single-hud.png"), animations: "disabled" });
});

test("Arcade keeps one compact HP readout inside the performance card", async ({ page }, info) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");
  await page.locator(".overlay-tap .unlock-btn").click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();

  const field = page.locator(".play-wrap");
  await page.screenshot({ path: info.outputPath("arcade-hud-baseline.png"), animations: "disabled" });
  await expect(field.locator(".hud-hp")).toBeVisible();
  await expect(field.locator(".hud-hp-value")).toHaveText("100");
  await expect.poll(() => field.locator(".hud-hp-value").textContent(), { timeout: 6_000 })
    .not.toBe("100");
  await expect(field.locator(".hud-hp-fill")).toHaveAttribute("style", /width: \d+%/);
  await expectClearArcadeTopHud(field);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("an Arcade PB stays visible from the ready card into the live HUD", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    localStorage.setItem("bs_scores", JSON.stringify([{
      track_id: "bs-s1-01",
      tier: "easy",
      mode: "arcade",
      score: 924_000,
      accuracy: 92.4,
      at: "2026-09-13T12:00:00.000Z",
    }]));
  });
  await page.goto("/play/bs-s1-01?tier=easy&mode=arcade");

  const readyTarget = page.locator(".personal-best-target");
  await expect(readyTarget).toBeVisible();
  await expect(readyTarget).toContainText("Personal best");
  await expect(readyTarget).toContainText("Beat 924,000 pts");
  await expect(readyTarget).toContainText("92.4% accuracy · Arcade record");
  if (info.project.name === "mobile") {
    const meta = page.locator(".play-meta");
    const title = meta.locator(":scope > strong");
    const tier = meta.locator(".play-meta-tier");
    const fullscreen = meta.getByRole("button", { name: "Fullscreen", exact: true });
    await expect(title).toHaveText("Neon Pulse");
    await expect(tier).toContainText("easy · arcade");
    const canFullscreen = await page.evaluate(() => typeof document.documentElement.requestFullscreen === "function"
      || typeof (document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen === "function");
    if (canFullscreen) {
      await expect(fullscreen.locator(".play-fullscreen-label")).toBeHidden();
      await expect(fullscreen.locator(".play-fullscreen-icon")).toBeVisible();
    } else {
      await expect(fullscreen).toHaveCount(0);
    }
    const [metaBox, titleBox, tierBox, fullscreenBox] = await Promise.all([
      meta.boundingBox(), title.boundingBox(), tier.boundingBox(), canFullscreen ? fullscreen.boundingBox() : Promise.resolve(null),
    ]);
    expect(metaBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(tierBox).not.toBeNull();
    expect(metaBox!.height).toBeLessThanOrEqual(60);
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(tierBox!.x + 1);
    expect(tierBox!.x + tierBox!.width).toBeLessThanOrEqual(fullscreenBox?.x ?? metaBox!.x + metaBox!.width + 1);
    if (canFullscreen) expect(fullscreenBox!.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: info.outputPath("arcade-pb-ready.png"), animations: "disabled" });

  await page.locator(".overlay-tap .unlock-btn").click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();

  const field = page.locator(".play-wrap");
  const liveTarget = field.locator(".hud-score-target");
  await expect(liveTarget).toBeVisible();
  await expect(liveTarget).toHaveAttribute("data-kind", "personal-best");
  await expect(liveTarget).toHaveAttribute("data-state", "behind");
  await expect(liveTarget).toHaveText("PB −924K");
  expect(await liveTarget.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await expectClearArcadeTopHud(field);
  if (info.project.name === "mobile") {
    const fieldBox = (await field.boundingBox())!;
    const cardBox = (await field.locator(".hud-chip").boundingBox())!;
    expect(cardBox.width / fieldBox.width).toBeLessThanOrEqual(0.31);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await page.screenshot({ path: info.outputPath("arcade-pb-chase.png"), animations: "disabled" });
});

test("Duo uses compact independent performance cards in both layouts", async ({ page }, info) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");
  await page.locator(".duo-start button").click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);

  const fields = page.locator(".play-wrap-duo");
  await expect(fields).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    const field = fields.nth(i);
    await expect(field.locator(".hud-track-accuracy")).toContainText("ACC —");
    await expect(field.locator(".hud-track-accuracy b")).toBeVisible();
    await expect(field.locator(".hud-progress-count")).toHaveText(/^0\/\d+$/);
    expect(await field.locator(".hud-performance-meta").evaluate(
      (node) => node.scrollWidth <= node.clientWidth + 1,
    )).toBe(true);
    await expect(field.locator(".hud-player")).toBeVisible();
    await expectClearTopHud(field);
  }
  await expect(page.locator(".hud-track-title, .hud-track-tier, .hud-combo")).toHaveCount(0);
  await expect(fields.locator(".hud-hp")).toHaveCount(0);
  await expect(fields.locator(".hud-judges")).toHaveCount(2);
  for (let i = 0; i < 2; i++) await expect(fields.nth(i).locator(".hud-judges")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await page.screenshot({ path: info.outputPath("duo-hud.png"), animations: "disabled" });
});

test("Duo Arcade keeps each HP reserve inside its own compact card", async ({ page }, info) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=arcade");
  await page.locator(".duo-start button").click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);

  const fields = page.locator(".play-wrap-duo");
  for (let i = 0; i < 2; i++) {
    const field = fields.nth(i);
    await expect(field.locator(".hud-hp")).toBeVisible();
    await expect(field.locator(".hud-hp-value")).toHaveText("100");
    await expectClearArcadeTopHud(field);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await page.screenshot({ path: info.outputPath("duo-arcade-hud.png"), animations: "disabled" });
});

test("district character art stays behind gameplay in the canvas layer", async ({ page }) => {
  await page.addInitScript(() => {
    const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    const originalFillRect = CanvasRenderingContext2D.prototype.fillRect;
    const characterSeenInFrame = new WeakMap<CanvasRenderingContext2D, boolean>();
    CanvasRenderingContext2D.prototype.fillRect = function (
      this: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
    ) {
      if (x === 0 && y === 0 && width > 100 && height > 100 && this.fillStyle === "#12100f") {
        characterSeenInFrame.set(this, false);
      }
      return Reflect.apply(originalFillRect, this, [x, y, width, height]);
    };
    CanvasRenderingContext2D.prototype.drawImage = function (
      this: CanvasRenderingContext2D,
      image: CanvasImageSource,
      ...rest: number[]
    ) {
      if (image instanceof HTMLImageElement && image.src.includes("/characters/")) {
        document.documentElement.dataset.characterCanvasDrawn = "true";
        characterSeenInFrame.set(this, true);
      } else if (
        image instanceof HTMLCanvasElement
        && image.width === 120
        && image.height === 120
        && characterSeenInFrame.get(this)
      ) {
        document.documentElement.dataset.characterBeforeNote = "true";
      }
      return Reflect.apply(originalDrawImage, this, [image, ...rest]);
    } as CanvasRenderingContext2D["drawImage"];
  });

  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.locator(".overlay-tap .unlock-btn").click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();

  await expect(page.locator(".play-char-watermark")).toHaveCount(0);
  await expect.poll(
    () => page.locator("html").getAttribute("data-character-canvas-drawn"),
    { timeout: 6_000 },
  ).toBe("true");
  await expect.poll(
    () => page.locator("html").getAttribute("data-character-before-note"),
    { timeout: 6_000 },
  ).toBe("true");
});
