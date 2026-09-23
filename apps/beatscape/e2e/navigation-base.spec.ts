import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("keyboard entry can skip repeated navigation while SPA routes still focus main", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
  await page.goto("/");

  const skip = page.getByRole("link", { name: "Skip to main content", exact: true });
  const main = page.locator("#main-content");
  if (info.project.name === "mobile") {
    const logoBox = await page.locator(".site-header .logo").boundingBox();
    expect(logoBox).not.toBeNull();
    expect(logoBox!.height, "mobile header Home target").toBeGreaterThanOrEqual(44);
  }
  await expect(skip).toBeAttached();
  await expect(skip).not.toBeInViewport();
  await expect(main).not.toBeFocused();

  await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  const skipBox = (await skip.boundingBox())!;
  expect(skipBox.height).toBeGreaterThanOrEqual(44);
  expect(skipBox.x).toBeGreaterThanOrEqual(0);
  expect(skipBox.y).toBeGreaterThanOrEqual(0);

  await page.keyboard.press("Enter");
  await expect(main).toBeFocused();

  const primaryNav = page.locator(info.project.name === "mobile" ? ".mobile-tabbar" : ".site-nav");
  await primaryNav.getByRole("link", { name: "Library", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.locator("#main-content")).toBeFocused();
});

test("root releases render canonical links and keep legacy deep links playable", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
  await page.goto("/");

  const libraryNav = page
    .locator(info.project.name === "mobile" ? ".mobile-tabbar" : ".site-nav")
    .getByRole("link", { name: "Library", exact: true });
  await expect(libraryNav).toHaveAttribute("href", "/library");
  await libraryNav.click();
  await expect(page).toHaveURL(/\/library$/);

  await page.goto("/beatscape/track/bs-s1-01");
  await expect(page.getByRole("heading", { name: "Neon Pulse", exact: true })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/track\/bs-s1-01$/,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    /\/track\/bs-s1-01$/,
  );
  expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") as string).pathname).toBe(
    "/track/bs-s1-01",
  );
  const canonicalExit = page.locator(".track-detail .back-link");
  await expect(canonicalExit).toHaveAttribute("href", "/library");
  await canonicalExit.click();
  await expect(page).toHaveURL(/\/library$/);
  expect(new URL(page.url()).pathname).toBe("/library");
});

test("navigation exposes the current page and preserves native modified clicks", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
  await page.goto("/library");

  const nav = page.locator(info.project.name === "mobile" ? ".mobile-tabbar" : ".site-nav");
  const library = nav.getByRole("link", { name: "Library", exact: true });
  const settings = nav.getByRole("link", { name: "Settings", exact: true });
  await expect(library).toHaveAttribute("aria-current", "page");

  if (info.project.name === "desktop") {
    const openedPage = page.context().waitForEvent("page");
    await settings.click({ modifiers: ["ControlOrMeta"] });
    const newTab = await openedPage;
    await expect(newTab).toHaveURL(/\/settings$/);
    await expect(page).toHaveURL(/\/library$/);
    await newTab.close();
  }

  const modifiedClicks = await settings.evaluate((anchor) => {
    const probe = (init: MouseEventInit) => {
      let preventedByApp: boolean | undefined;
      const preventNativeNavigation = (event: MouseEvent) => {
        preventedByApp = event.defaultPrevented;
        event.preventDefault();
      };
      document.addEventListener("click", preventNativeNavigation, { once: true });
      anchor.dispatchEvent(new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
        ...init,
      }));
      return preventedByApp;
    };
    return [
      probe({ ctrlKey: true }),
      probe({ metaKey: true }),
      probe({ shiftKey: true }),
      probe({ altKey: true }),
      probe({ button: 1 }),
    ];
  });
  expect(modifiedClicks).toEqual([false, false, false, false, false]);
  await expect(page).toHaveURL(/\/library$/);

  const documentMarker = await page.evaluate(() => {
    const marker = crypto.randomUUID();
    (window as typeof window & { __navigationDocumentMarker?: string }).__navigationDocumentMarker = marker;
    return marker;
  });
  const plainClickPrevented = await settings.evaluate((anchor) => {
    let preventedByApp: boolean | undefined;
    document.addEventListener("click", (event) => {
      preventedByApp = event.defaultPrevented;
      event.preventDefault();
    }, { once: true });
    anchor.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    }));
    return preventedByApp;
  });
  expect(plainClickPrevented).toBe(true);
  await expect(page).toHaveURL(/\/settings$/);
  expect(await page.evaluate(() => (
    window as typeof window & { __navigationDocumentMarker?: string }
  ).__navigationDocumentMarker)).toBe(documentMarker);
  await expect(nav.getByRole("link", { name: "Settings", exact: true })).toHaveAttribute("aria-current", "page");
});

test("calibration remains inside the Settings navigation location", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
  await page.goto("/calibrate?return=%2Fsettings");

  const nav = page.locator(info.project.name === "mobile" ? ".mobile-tabbar" : ".site-nav");
  const settings = nav.getByRole("link", { name: "Settings", exact: true });
  await expect(page.getByRole("heading", { name: "Tap with the pulse", exact: true })).toBeVisible();
  await expect(settings).toHaveAttribute("aria-current", "page");
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
});

test("track details remain inside the Library navigation location", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
  await page.goto("/track/bs-s1-05");
  await expect(page.getByRole("heading", { name: "Voltage Drop", exact: true })).toBeVisible();

  if (info.project.name === "mobile") {
    await expect(page.locator(".mobile-tabbar-track")).toBeHidden();
    await expect(page.locator(".track-mobile-action")).toBeVisible();
    return;
  }

  const nav = page.locator(".site-nav");
  const library = nav.getByRole("link", { name: "Library", exact: true });
  await expect(library).toHaveAttribute("aria-current", "page");
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
});

test("lazy navigation keeps the app shell stable while the destination loads", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));

  let releaseSettingsChunk!: () => void;
  const settingsChunkGate = new Promise<void>((resolve) => {
    releaseSettingsChunk = resolve;
  });
  await page.route("**/assets/Settings-*.js", async (route) => {
    await settingsChunkGate;
    await route.continue();
  });

  await page.goto("/library");
  const shell = page.locator(".app-shell");
  const header = shell.locator(".site-header");
  const primaryNav = shell.locator(info.project.name === "mobile" ? ".mobile-tabbar" : ".site-nav");
  const settings = primaryNav.getByRole("link", { name: "Settings", exact: true });

  await settings.click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(shell.locator(".loading-state")).toBeVisible();
  await expect(header).toBeVisible();
  await expect(primaryNav).toBeVisible();
  await expect(settings).toHaveAttribute("aria-current", "page");

  const mainBox = (await shell.locator(".site-main").boundingBox())!;
  const loadingBox = (await shell.locator(".loading-state").boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(mainBox.height).toBeGreaterThanOrEqual(viewport.height - 182);
  expect(loadingBox.y).toBeGreaterThanOrEqual(mainBox.y);
  expect(loadingBox.y + loadingBox.height).toBeLessThanOrEqual(mainBox.y + mainBox.height + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({
    path: info.outputPath("stable-lazy-navigation.png"),
    animations: "disabled",
  });

  releaseSettingsChunk();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await expect(header).toBeVisible();
  await expect(primaryNav).toBeVisible();
});

test("navigation intent starts lazy route loading before activation", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));

  let settingsRequests = 0;
  let profileRequests = 0;
  await page.route("**/assets/Settings-*.js", async (route) => {
    settingsRequests += 1;
    await route.continue();
  });
  await page.route("**/assets/Profile-*.js", async (route) => {
    profileRequests += 1;
    await route.continue();
  });

  await page.goto("/library");
  expect(settingsRequests).toBe(0);
  expect(profileRequests).toBe(0);

  const primaryNav = page.locator(info.project.name === "mobile" ? ".mobile-tabbar" : ".site-nav");
  const settings = primaryNav.getByRole("link", { name: "Settings", exact: true });
  await settings.focus();
  await expect.poll(() => settingsRequests).toBe(1);

  const profile = page.locator(".site-header").getByRole("link", { name: "Player profile", exact: true });
  if (info.project.name === "mobile") {
    await profile.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", isPrimary: true });
  } else {
    await profile.hover();
  }
  await expect.poll(() => profileRequests).toBe(1);

  // Repeated intent events share the same successful module request.
  await settings.hover();
  await settings.focus();
  expect(settingsRequests).toBe(1);
});

test("the profile shortcut has a concise name for default and custom players", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
  await page.goto("/");
  await expect(page.locator(".site-header").getByRole("link", { name: "Player profile", exact: true })).toBeVisible();

  await page.evaluate(() => localStorage.setItem("bs_display_name", "Night Rider"));
  await page.reload();
  await expect(page.locator(".site-header").getByRole("link", { name: "Night Rider profile", exact: true })).toBeVisible();
});
