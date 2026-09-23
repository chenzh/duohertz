import { expect, test, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function expectFullscreen(page: Page, touchExitControl: boolean): Promise<void> {
  await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(true);
  await expect(page.getByRole("button", { name: "Fullscreen", exact: true })).toHaveCount(0);
  const exitFullscreen = page.getByRole("button", { name: "Exit fullscreen", exact: true });
  if (touchExitControl) {
    await expect(exitFullscreen).toBeVisible();
    const box = (await exitFullscreen.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  } else {
    await expect(exitFullscreen).toHaveCount(0);
  }
}

test("single-player start uses the same gesture for audio and fullscreen", async ({ page }, info) => {
  await page.goto("/play/bs-s1-05?tier=easy&mode=casual");
  const fullscreenButton = page.getByRole("button", { name: "Fullscreen", exact: true });
  if (info.project.name === "mobile") await expect(fullscreenButton).toBeVisible();
  else await expect(fullscreenButton).toHaveCount(0);

  await page.locator(".overlay-tap .unlock-btn").click();
  await expectFullscreen(page, info.project.name === "mobile");
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("single-fullscreen.png"), animations: "disabled" });

  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
  } else {
    await page.evaluate(() => document.exitFullscreen());
  }
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
  await expect(page.getByRole("button", { name: "Resume", exact: true })).toBeVisible();
  if (info.project.name === "mobile") await expect(fullscreenButton).toBeVisible();
});

test("Duo gets the same automatic and manual fullscreen path", async ({ page }, info) => {
  await page.addInitScript(() => {
    const nativeRequestFullscreen = Element.prototype.requestFullscreen;
    Object.assign(window, { __fullscreenRequestCount: 0 });
    if (typeof nativeRequestFullscreen !== "function") return;
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      configurable: true,
      value(this: Element) {
        const probe = window as typeof window & { __fullscreenRequestCount: number };
        probe.__fullscreenRequestCount++;
        return nativeRequestFullscreen.call(this);
      },
    });
  });
  await page.goto("/duo/bs-s1-05?tier=easy&mode=casual");
  const start = page.getByRole("button", { name: "Start", exact: true });
  await expect(start).toBeVisible();
  const fullscreenButton = page.getByRole("button", { name: "Fullscreen", exact: true });
  if (info.project.name === "mobile") await expect(fullscreenButton).toBeVisible();
  else await expect(fullscreenButton).toHaveCount(0);

  await start.click();
  await expectFullscreen(page, info.project.name === "mobile");
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __fullscreenRequestCount: number }
  ).__fullscreenRequestCount)).toBe(1);
  await expect(page.locator(".duo-stage")).toBeVisible();
  await page.screenshot({ path: info.outputPath("duo-fullscreen.png"), animations: "disabled" });

  await page.evaluate(() => document.exitFullscreen());
  await expect(page.getByRole("button", { name: "Resume", exact: true })).toHaveCount(1);
});

test("phone-width run headers keep fullscreen compact without losing its accessible name", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Touch fallback only");
  const viewportWidth = page.viewportSize()!.width;
  expect(viewportWidth).toBeGreaterThan(340);
  expect(viewportWidth).toBeLessThanOrEqual(520);

  for (const route of [
    "/play/bs-s1-05?tier=easy&mode=casual",
    "/duo/bs-s1-05?tier=easy&mode=casual",
  ]) {
    await page.goto(route);
    const fullscreen = page.getByRole("button", { name: "Fullscreen", exact: true });
    await expect(fullscreen).toBeVisible();
    await expect(fullscreen.locator(".play-fullscreen-label")).toBeHidden();
    await expect(fullscreen.locator(".play-fullscreen-icon")).toBeVisible();
    const box = (await fullscreen.boundingBox())!;
    expect(box.width).toBe(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator(".play-meta > strong")).toHaveText("Voltage Drop");
  }

  await page.screenshot({
    path: info.outputPath("compact-fullscreen-fallback.png"),
    animations: "disabled",
  });
});

test("unsupported touch browsers do not show a dead fullscreen button", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Touch fallback only");
  await page.addInitScript(() => {
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(HTMLElement.prototype, "webkitRequestFullscreen", {
      configurable: true,
      value: undefined,
    });
  });

  await page.goto("/play/bs-s1-05?tier=easy&mode=casual");
  await expect(page.getByRole("button", { name: "Fullscreen", exact: true })).toHaveCount(0);
  await page.locator(".overlay-tap .unlock-btn").click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
});
