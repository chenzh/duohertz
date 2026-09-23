import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_keys", JSON.stringify(["KeyA", "KeyS", "KeyW", "KeyD"]));
    localStorage.setItem("bs_settings", JSON.stringify({ keyLabelLayout: "azerty" }));
    Object.defineProperty(navigator, "keyboard", { configurable: true, value: undefined });
  });
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function observeLiveKeyHints(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    Object.defineProperty(CanvasRenderingContext2D.prototype, "drawImage", {
      configurable: true,
      value: function drawImage(
        this: CanvasRenderingContext2D,
        source: CanvasImageSource,
        ...dimensions: number[]
      ) {
        const [, , width, height] = dimensions;
        if (
          this.canvas.classList.contains("play-canvas")
          && source instanceof HTMLCanvasElement
          && dimensions.length === 4
          && Number(width) > 0
          && Number(width) <= 48
          && Number(height) > 0
          && Number(height) <= 32
        ) {
          const debugWindow = window as Window & { __bsLiveKeyHintDraws?: number };
          debugWindow.__bsLiveKeyHintDraws = (debugWindow.__bsLiveKeyHintDraws ?? 0) + 1;
          (debugWindow as Window & { __bsLastLiveKeyHintDraw?: number }).__bsLastLiveKeyHintDraw = performance.now();
        }
        Reflect.apply(originalDrawImage, this, [source, ...dimensions]);
      },
    });
  });
}

const keyHintDraws = (page: Page) => page.evaluate(() =>
  (window as Window & { __bsLiveKeyHintDraws?: number }).__bsLiveKeyHintDraws ?? 0);

const keyHintDrawAge = (page: Page) => page.evaluate(() => {
  const lastDraw = (window as Window & { __bsLastLiveKeyHintDraw?: number }).__bsLastLiveKeyHintDraw ?? 0;
  return lastDraw > 0 ? performance.now() - lastDraw : Number.POSITIVE_INFINITY;
});

test("a touch device reveals its physical keyboard controls after a non-editing key press", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Touch-first control legend is mobile-only");
  await page.setViewportSize({ width: 320, height: 568 });

  await page.goto("/");
  await expect(page.locator(".home-hero-demo-mask .unlock-touch-lanes")).toBeVisible();
  await page.keyboard.press("a");
  await expect(page.locator(".hero-copy .eyebrow"))
    .toHaveText("4-lane rhythm game · keyboard + touch");
  await expect(page.locator(".home-hero-demo-mask .unlock-keys .key-chip"))
    .toHaveText(["Q", "S", "Z", "D"]);
  await expect(page.locator(".home-hero-demo-mask .unlock-hint"))
    .toContainText("Demo · no progress saved · keyboard + touch");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({
    path: info.outputPath("touch-with-external-keyboard-home.png"),
    animations: "disabled",
  });

  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await expect(page.locator(".overlay-tap .unlock-touch-lanes")).toBeVisible();
  await page.keyboard.press("a");
  await expect(page.locator(".overlay-tap .unlock-keys .key-chip"))
    .toHaveText(["Q", "S", "Z", "D"]);
  const startButton = page.getByRole("button", { name: "Start playing", exact: true });
  await expect(startButton).toBeVisible();
  const startBounds = await startButton.boundingBox();
  expect(startBounds).not.toBeNull();
  expect(startBounds!.height).toBeGreaterThanOrEqual(44);
  expect(startBounds!.y + startBounds!.height).toBeLessThanOrEqual(568);
  const speedControlFits = await page.locator(".overlay-tap .unlock-note-speed-control")
    .evaluate((control) => {
      const label = control.querySelector("output small")!;
      const increase = control.querySelector("button:last-child")!;
      const bounds = control.getBoundingClientRect();
      return label.getBoundingClientRect().bottom <= bounds.bottom - 2
        && increase.getBoundingClientRect().right <= bounds.right - 2;
    });
  expect(speedControlFits).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({
    path: info.outputPath("touch-with-external-keyboard-play.png"),
    animations: "disabled",
  });

  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");
  await expect(page.locator(".duo-seat-hint")).toContainText("P1 Tap 4 lanes");
  await page.keyboard.press("a");
  await expect(page.locator(".duo-seat-hint")).toContainText("P1 Q · S · Z · D");
  await expect(page.locator(".duo-seat-hint")).toContainText("P2 ← · ↓ · ↑ · →");
  await expect(page.locator(".duo-seat-hint")).toContainText("Top");
  await expect(page.locator(".duo-seat-hint")).toContainText("Bottom");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("bs_keys") ?? "null")))
    .toEqual(["KeyA", "KeyS", "KeyW", "KeyD"]);
  await page.screenshot({
    path: info.outputPath("touch-with-external-keyboard-duo.png"),
    animations: "disabled",
  });
});

test("keyboard hints carry through in-app navigation but reset on reload", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Touch-first control legend is mobile-only");
  await page.goto("/");
  await expect(page.locator(".home-hero-demo-mask .unlock-touch-lanes")).toBeVisible();
  await page.keyboard.press("a");
  await expect(page.locator(".home-hero-demo-mask .unlock-keys .key-chip"))
    .toHaveText(["Q", "S", "Z", "D"]);
  await page.locator(".mobile-tabbar").getByRole("link", { name: "Library" }).click();
  await page.locator(".curated-card").first()
    .getByRole("link", { name: /^Play / }).click();

  await expect(page.locator(".overlay-tap .unlock-keys .key-chip"))
    .toHaveText(["Q", "S", "Z", "D"]);
  await page.reload();
  await expect(page.locator(".overlay-tap .unlock-touch-lanes"))
    .toBeVisible();
});

test("touch play reveals live lane keycaps when keyboard input arrives after Start", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Touch-first live keycaps are mobile-only");
  await observeLiveKeyHints(page);

  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await expect(page.locator(".overlay-tap")).toBeHidden();
  await page.waitForTimeout(400);
  expect(await keyHintDraws(page)).toBe(0);

  await page.keyboard.press("a");
  await expect.poll(() => keyHintDraws(page)).toBeGreaterThan(0);
  await expect(page.locator(".overlay-tap")).toBeHidden();
});

test("a late external keyboard briefly restores keycaps after an experienced run's fade", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Touch-first live keycaps are mobile-only");
  await page.addInitScript(() => {
    localStorage.setItem("bs_runs", JSON.stringify(Array.from({ length: 3 }, (_, index) => ({
      track_id: "bs-s1-01",
      district: "Pulse Core",
      tier: "easy",
      mode: "casual",
      score: 0,
      accuracy: 0,
      maxCombo: 0,
      fc: false,
      ap: false,
      failed: false,
      durationMs: 1_000,
      endedAt: `2026-09-${String(10 + index).padStart(2, "0")}T12:00:00.000Z`,
      dateKey: `2026-09-${String(10 + index).padStart(2, "0")}`,
    }))));
  });
  await observeLiveKeyHints(page);

  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await expect(page.locator(".overlay-tap")).toBeHidden();
  await page.waitForTimeout(4_200);
  expect(await keyHintDraws(page)).toBe(0);

  await page.keyboard.press("a");
  await expect.poll(() => keyHintDraws(page), { timeout: 2_000 }).toBeGreaterThan(0);
  await expect(page.locator(".overlay-tap")).toBeHidden();
  await page.waitForTimeout(1_900);
  expect(await keyHintDrawAge(page)).toBeLessThan(250);
  await page.waitForTimeout(1_900);
  expect(await keyHintDrawAge(page)).toBeGreaterThan(400);
});
