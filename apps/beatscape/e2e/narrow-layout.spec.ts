import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 320, height: 568 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test("primary routes remain horizontally contained at 320px", async ({ page }, info) => {
  const routes = [
    "/",
    "/library",
    "/track/bs-s1-05",
    "/characters",
    "/radio",
    "/leaderboard",
    "/profile",
    "/settings",
    "/calibrate",
    "/shift",
    "/play/bs-s1-05?tier=easy&mode=casual",
    "/duo/bs-s1-05?tier=easy&mode=casual",
  ];

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();

    if (route.startsWith("/track/")) {
      await expect(page.getByRole("heading", { name: "Voltage Drop", exact: true })).toBeVisible();
    } else if (route.startsWith("/play/")) {
      await expect(page.locator(".overlay-tap .unlock-btn")).toBeVisible();
    } else if (route.startsWith("/duo/")) {
      await expect(page.locator(".duo-start .unlock-btn")).toBeVisible();
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `${route} document width`,
    ).toBeLessThanOrEqual(320);

    if (route.startsWith("/track/")) {
      await page.screenshot({
        path: info.outputPath("track-320.png"),
        fullPage: true,
        animations: "disabled",
      });
    }
  }
});

test("Home opening actions stay fully above the fixed tab bar at 320px", async ({ page }, info) => {
  await page.goto("/");

  const secondaryActions = page.locator(".hero-copy .cta-row");
  const tabBar = page.locator(".mobile-tabbar");
  await expect(secondaryActions).toBeVisible();
  await expect(tabBar).toBeVisible();

  const [actionsBox, tabBarBox] = await Promise.all([
    secondaryActions.boundingBox(),
    tabBar.boundingBox(),
  ]);
  expect(actionsBox).not.toBeNull();
  expect(tabBarBox).not.toBeNull();
  expect(actionsBox!.y + actionsBox!.height, "Browse and Calibrate bottom edge").toBeLessThanOrEqual(
    tabBarBox!.y - 8,
  );

  await page.screenshot({
    path: info.outputPath("home-opening-actions-320.png"),
    animations: "disabled",
  });
});

for (const route of ["/", "/library"] as const) {
  test(`${route} keeps curated picks inside a 320px viewport`, async ({ page }, info) => {
    await page.goto(route);
    const cards = page.locator(".curated-card");
    await expect(cards.first()).toBeVisible();

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `${route} document width`,
    ).toBeLessThanOrEqual(320);

    for (const card of await cards.all()) {
      const cardBox = await card.boundingBox();
      expect(cardBox).not.toBeNull();
      expect(cardBox!.x).toBeGreaterThanOrEqual(0);
      expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(320);

      for (const action of await card.locator(".curated-actions .btn").all()) {
        const actionBox = await action.boundingBox();
        expect(actionBox).not.toBeNull();
        expect(actionBox!.height).toBeGreaterThanOrEqual(44);
        expect(actionBox!.x + actionBox!.width).toBeLessThanOrEqual(320);
      }
    }

    await page.screenshot({
      path: info.outputPath(route === "/" ? "home-320.png" : "library-320.png"),
      animations: "disabled",
    });
  });
}

test("Library reveals its first recommendation above the fixed tab bar at 320px", async ({ page }) => {
  await page.goto("/library");

  const firstRecommendation = page.locator(".curated-card").first();
  const firstRecommendationTitle = firstRecommendation.getByRole("heading", { level: 3 });
  const tabBar = page.locator(".mobile-tabbar");
  await expect(firstRecommendation).toBeVisible();
  await expect(firstRecommendationTitle).toBeVisible();
  await expect(tabBar).toBeVisible();

  const [titleBox, tabBarBox] = await Promise.all([
    firstRecommendationTitle.boundingBox(),
    tabBar.boundingBox(),
  ]);
  expect(titleBox).not.toBeNull();
  expect(tabBarBox).not.toBeNull();
  expect(titleBox!.y, "first recommendation title top edge").toBeLessThan(tabBarBox!.y);
});
