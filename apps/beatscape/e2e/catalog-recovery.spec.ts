import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function makeCatalogRecoverable(page: Page): Promise<() => void> {
  let offline = true;
  await page.route("**/catalog.json*", (route) => {
    if (offline) return route.fulfill({ status: 503, body: "Temporarily unavailable" });
    return route.continue();
  });
  return () => { offline = false; };
}

test("Home replaces its broken play link with a reconnect action during an outage", async ({ page }) => {
  const restore = await makeCatalogRecoverable(page);
  await page.goto("/");

  const alert = page.getByRole("alert");
  await expect(alert).toHaveCount(1);
  await expect(alert).toContainText("Track list unavailable");
  await expect(page.getByText("Demo offline", { exact: true })).toBeVisible();
  await expect(page.getByText("Failed to load catalog", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open full play", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Start first run", exact: true })).toHaveCount(0);
  const reconnect = page.getByRole("button", { name: "Reconnect tracks", exact: true });
  expect((await reconnect.boundingBox())!.height).toBeGreaterThanOrEqual(44);

  restore();
  await reconnect.click();
  await expect(alert).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Start first run", exact: true })).toBeVisible();
  await expect(page.locator(".hero-entry-meta")).toContainText("Voltage Drop");
  await expect(page.getByText("Demo offline", { exact: true })).toHaveCount(0);
  await expect(page.locator(".home-hero-play-meta")).toContainText("Voltage Drop");
  await expect(page.getByRole("button", { name: "Try it here", exact: true })).toBeVisible();
});

test("Library explains a catalog outage and retries without a reload", async ({ page }, info) => {
  const restore = await makeCatalogRecoverable(page);
  await page.goto("/library");

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Track list unavailable");
  await expect(alert).toContainText("Your local scores are safe");
  await expect(page.getByText("No tracks match your filters.", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  const retry = alert.getByRole("button", { name: "Try again", exact: true });
  expect((await retry.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: info.outputPath("catalog-outage.png"), fullPage: true, animations: "disabled" });

  restore();
  await retry.click();
  await expect(alert).toHaveCount(0);
  await expect(page.locator(".track-card").first()).toBeVisible();
});

test("legacy Library rejects a duohertz v2 catalog and recovers when v1 returns", async ({ page }) => {
  let swapped = true;
  await page.route("**/catalog.json*", (route) => swapped
    ? route.fulfill({ json: { version: 2, brand: "duohertz", tracks: [] } })
    : route.continue());
  await page.goto("/library");

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Track list unavailable");
  await expect(page.locator(".track-card")).toHaveCount(0);

  swapped = false;
  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(alert).toHaveCount(0);
  await expect(page.locator(".track-card").first()).toBeVisible();
});

test("Track distinguishes an outage from a missing ID and recovers in place", async ({ page }, info) => {
  const restore = await makeCatalogRecoverable(page);
  await page.goto("/track/bs-s1-01");

  const alert = page.getByRole("alert");
  await expect(alert.getByRole("heading", { name: "Signal interrupted" })).toBeVisible();
  const retry = alert.getByRole("button", { name: "Try again", exact: true });
  expect((await retry.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: info.outputPath("track-outage.png"), fullPage: true, animations: "disabled" });

  restore();
  await retry.click();
  await expect(page.getByRole("heading", { name: "Neon Pulse", exact: true })).toBeVisible();

  await page.goto("/track/not-a-real-track");
  await expect(page.getByRole("heading", { name: "Track not found" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Browse Library", exact: true })).toBeVisible();
});

for (const run of [
  {
    label: "Play",
    trackId: "bs-s1-01",
    path: "/play/bs-s1-01?tier=easy&mode=casual&returnTo=%2Flibrary%3Fgenre%3DElectronic",
    readyName: "Start playing",
  },
  {
    label: "Duo",
    trackId: "bs-s1-02",
    path: "/duo/bs-s1-02?tier=easy&mode=casual&returnTo=%2Flibrary%3Fgenre%3DElectronic",
    readyName: "Start",
  },
] as const) {
  test(`${run.label} preserves the selected run and retries a transient chart failure`, async ({ page }, info) => {
    let unavailable = true;
    await page.route(new RegExp(`/catalog/${run.trackId}/easy\\.json(?:\\?.*)?$`), async (route) => {
      if (unavailable) await route.fulfill({ status: 503, body: "Temporarily unavailable" });
      else await route.continue();
    });
    await page.goto(run.path);

    const alert = page.getByRole("alert");
    await expect(alert.getByRole("heading", { name: "Run could not load", exact: true })).toBeVisible();
    await expect(alert).toContainText("Your selected track, difficulty, and mode are still here");
    await expect(alert).not.toContainText(`Chart easy missing for ${run.trackId}`);
    const retry = alert.getByRole("button", { name: "Try again", exact: true });
    expect((await retry.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const back = alert.getByRole("link", { name: "Back to track", exact: true });
    expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(back).toHaveAttribute(
      "href",
      new RegExp(`/track/${run.trackId}\\?tier=easy&mode=casual&returnTo=%2Flibrary%3Fgenre%3DElectronic$`),
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({
      path: info.outputPath(`${run.label.toLowerCase()}-run-load-recovery.png`),
      fullPage: true,
      animations: "disabled",
    });
    await expect(page).toHaveURL(new RegExp(`${run.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));

    unavailable = false;
    await retry.click();
    await expect(page.getByRole("button", { name: run.readyName, exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${run.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
  });
}

test("a missing Play track has a Library exit but no pointless retry", async ({ page }) => {
  await page.goto("/play/not-a-real-track?tier=easy&mode=casual");

  const alert = page.getByRole("alert");
  await expect(alert.getByRole("heading", { name: "Track not found", exact: true })).toBeVisible();
  await expect(alert.getByRole("button", { name: "Try again", exact: true })).toHaveCount(0);
  await expect(alert.getByRole("link", { name: "Browse Library", exact: true })).toBeVisible();
});
