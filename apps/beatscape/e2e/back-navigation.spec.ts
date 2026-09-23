import { expect, test, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function openFromTrack(page: Page, kind: "play" | "duo") {
  await page.goto("/track/bs-s1-01");
  if (kind === "play") {
    await page.getByRole("link", { name: "Play Easy · Casual", exact: true }).click();
    await page.locator(".overlay-tap .unlock-btn").click();
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  } else {
    await page.getByRole("link", { name: "Duo", exact: true }).click();
    await page.locator(".duo-start button").click();
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);
  }

  // Chromium may consume the first browser Back only to leave Fullscreen.
  // Exercise that safety path, resume, then isolate the history gesture.
  const wasFullscreen = await page.evaluate(async () => {
    if (!document.fullscreenElement) return false;
    await document.exitFullscreen();
    return true;
  });
  if (wasFullscreen) {
    const resumes = page.getByRole("button", { name: "Resume", exact: true });
    await expect(resumes).toHaveCount(1);
    await resumes.click();
  }
}

for (const kind of ["play", "duo"] as const) {
  test(`${kind}: browser Back uses the in-game exit panel and can continue or leave`, async ({ page }) => {
    await openFromTrack(page, kind);
    const routePattern = kind === "play" ? /\/play\/bs-s1-01/ : /\/duo\/bs-s1-01/;

    const beforeUnloadBlocked = await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      return !window.dispatchEvent(event) && event.defaultPrevented;
    });
    expect(beforeUnloadBlocked).toBe(true);

    await page.evaluate(() => window.history.back());
    const dialog = page.getByRole("dialog", { name: "Leave the Scape?" });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(routePattern);
    await dialog.getByRole("button", { name: "Keep playing", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Pause", exact: true }))
      .toHaveCount(kind === "duo" ? 2 : 1);

    await page.evaluate(() => window.history.back());
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Leave", exact: true }).click();
    await expect(page).toHaveURL(/\/track\/bs-s1-01$/);
  });
}

test("Back before a run starts remains immediate", async ({ page }) => {
  await page.goto("/track/bs-s1-01");
  await page.getByRole("link", { name: "Play Easy · Casual", exact: true }).click();
  await expect(page.locator(".overlay-tap .unlock-btn")).toBeVisible();

  const beforeUnloadBlocked = await page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    return !window.dispatchEvent(event) && event.defaultPrevented;
  });
  expect(beforeUnloadBlocked).toBe(false);
  await page.evaluate(() => window.history.back());
  await expect(page).toHaveURL(/\/track\/bs-s1-01$/);
  await expect(page.getByRole("dialog", { name: "Leave the Scape?" })).toHaveCount(0);
});
