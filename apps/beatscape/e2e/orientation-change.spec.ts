import { expect, test, type Page } from "@playwright/test";

const PORTRAIT = { width: 390, height: 844 };
const SHORTER_PORTRAIT = { width: 390, height: 760 };
const LANDSCAPE = { width: 844, height: 390 };
const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.setViewportSize(PORTRAIT);
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    // Keep viewport changes under test control. A real start gesture may enter
    // browser fullscreen, whose native window cannot be resized by Playwright.
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(Element.prototype, "webkitRequestFullscreen", {
      configurable: true,
      value: undefined,
    });
  });
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function expectFieldGeometry(page: Page, expectedFields: number) {
  await expect.poll(() => page.evaluate((count) => {
    const canvases = [...document.querySelectorAll<HTMLCanvasElement>("canvas.play-canvas")];
    const dpr = Math.min(devicePixelRatio || 1, 2);
    return canvases.length === count
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1
      && canvases.every((canvas) => {
        const rect = canvas.getBoundingClientRect();
        return rect.width > 0
          && rect.height >= 180
          && rect.left >= -1
          && rect.top >= -1
          && rect.right <= innerWidth + 1
          && rect.bottom <= innerHeight + 1
          && Math.abs(canvas.width / dpr - rect.width) <= 2
          && Math.abs(canvas.height / dpr - rect.height) <= 2;
      });
  }, expectedFields)).toBe(true);
}

async function expectRotationPolicy(page: Page, mobile: boolean, pauseCount: number, resumeCount: number) {
  // Mobile browser chrome frequently changes only the usable height. That is
  // not a device rotation and must not interrupt play.
  await page.setViewportSize(SHORTER_PORTRAIT);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(pauseCount);
  await expect(page.getByRole("button", { name: "Resume", exact: true })).toHaveCount(0);
  await expectFieldGeometry(page, pauseCount);

  await page.setViewportSize(LANDSCAPE);
  await expectFieldGeometry(page, pauseCount);
  if (!mobile) {
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(pauseCount);
    await expect(page.getByRole("button", { name: "Resume", exact: true })).toHaveCount(0);
    return;
  }

  await expect(page.getByRole("button", { name: "Resume", exact: true })).toHaveCount(resumeCount);
}

test("single-player pauses only touch play when device orientation changes", async ({ page }, info) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();

  const mobile = info.project.name === "mobile";
  await expectRotationPolicy(page, mobile, 1, 1);
  if (mobile) {
    await page.screenshot({
      path: info.outputPath("single-orientation-paused.png"),
      animations: "disabled",
    });
    await page.setViewportSize(PORTRAIT);
    await expectFieldGeometry(page, 1);
    await expect(page.getByRole("button", { name: "Resume", exact: true })).toHaveCount(1);
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  }
});

test("Duo pauses both fields once when a touch device rotates", async ({ page }, info) => {
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);

  const mobile = info.project.name === "mobile";
  await expectRotationPolicy(page, mobile, 2, 1);
  if (mobile) {
    await page.screenshot({
      path: info.outputPath("duo-orientation-paused.png"),
      animations: "disabled",
    });
    await page.setViewportSize(PORTRAIT);
    await expectFieldGeometry(page, 2);
    await expect(page.getByRole("button", { name: "Resume", exact: true })).toHaveCount(1);
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);
  }
});
