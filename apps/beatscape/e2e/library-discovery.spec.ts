import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 320, height: 568 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

async function openSecondaryFilters(page: Page) {
  const filters = page.locator(".library-more-filters");
  const disclosure = filters.locator("summary").first();
  if (await disclosure.isVisible() && !await filters.evaluate((element) =>
    (element as HTMLDetailsElement).open)) {
    await disclosure.click();
  }
}

test("search leads the library and active filters replace generic recommendations", async ({ page }, info) => {
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Library", exact: true })).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Search tracks", exact: true });
  const firstRecommendation = page.locator(".curated-card").first();
  await expect(search).toBeVisible();
  await expect(firstRecommendation).toBeVisible();

  const searchBox = await search.boundingBox();
  const recommendationBox = await firstRecommendation.boundingBox();
  expect(searchBox).not.toBeNull();
  expect(recommendationBox).not.toBeNull();
  expect(searchBox!.y + searchBox!.height).toBeLessThan(recommendationBox!.y);
  await page.screenshot({ path: info.outputPath("library-find-first.png"), animations: "disabled" });

  await search.fill("  chrome riff  ");
  await expect(page.locator(".curated-section")).toBeHidden();
  await expect(page.locator(".showcase-chips")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Matches", exact: true })).toBeVisible();
  await expect(page.locator("#library-filter-status")).toHaveText("1 match");
  await expect(page.locator(".track-card")).toHaveCount(1);
  await expect(page.locator(".track-card")).toContainText("Chrome Riff");
  const resultBox = await page.locator(".track-card").boundingBox();
  const tabBarBox = await page.locator(".mobile-tabbar").boundingBox();
  expect(resultBox).not.toBeNull();
  expect(tabBarBox).not.toBeNull();
  expect(resultBox!.y).toBeLessThan(tabBarBox!.y);
  await page.screenshot({ path: info.outputPath("library-filtered.png"), animations: "disabled" });

  await search.press("Escape");
  await expect(search).toHaveValue("");
  await expect(page.locator(".curated-section")).toBeVisible();

  const moreFilters = page.locator(".library-more-filters > summary");
  if (await moreFilters.isVisible()) await moreFilters.click();
  await page.getByRole("button", { name: "Beginner", exact: true }).click();
  const beginnerCards = page.locator(".track-card");
  await expect(page.locator(".curated-section")).toBeHidden();
  expect(await beginnerCards.count()).toBeGreaterThan(0);
  expect(await page.locator(".track-card .chip-beginner").count()).toBe(await beginnerCards.count());

  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(page.locator(".curated-section")).toBeVisible();
  await expect(page.getByRole("heading", { name: "All tracks", exact: true })).toBeVisible();
  await expect(page.locator("#library-filter-status")).toHaveText("Showing 24 of 105 tracks");
});

test("genre search accepts common English spellings without catalog punctuation", async ({ page }) => {
  await page.goto("/library");
  const search = page.getByRole("searchbox", { name: "Search tracks", exact: true });
  const status = page.locator("#library-filter-status");

  for (const [query, count] of [
    ["hip hop", 20],
    ["hiphop", 20],
    ["rnb", 21],
    ["r and b", 21],
    ["r'n'b", 21],
    ["rhythm and blues", 21],
    ["electronic dance music", 25],
  ] as const) {
    await search.fill(query);
    const visible = Math.min(count, 24);
    await expect(status).toHaveText(
      count > visible ? `Showing ${visible} of ${count} matches` : `${count} matches`,
    );
    await expect(page.locator(".track-card")).toHaveCount(visible);
    if (count > visible) {
      await page.getByRole("button", { name: `Show ${count - visible} more match`, exact: true }).click();
      await expect(page.locator(".track-card")).toHaveCount(count);
    }
    await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe(query);
  }
});

test("combined search terms work in either order and BPM must match exactly", async ({ page }) => {
  await page.goto("/library");
  const search = page.getByRole("searchbox", { name: "Search tracks", exact: true });
  const status = page.locator("#library-filter-status");

  for (const query of ["edm 160", "160 edm", "scarlet 160", "scarlet edm"]) {
    await search.fill(query);
    await expect(status).toHaveText("1 match");
    await expect(page.locator(".track-card")).toContainText("Scarlet Hour");
    await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe(query);
  }

  await search.fill("60 bpm");
  await expect(status).toHaveText("0 matches");
  await expect(page.locator(".track-card")).toHaveCount(0);
});

test("phone exposes a playable recommendation before secondary filters", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Phone-only first-viewport contract");
  await page.goto("/library");

  const filters = page.locator(".library-more-filters");
  const disclosure = filters.locator("summary").first();
  const firstPlay = page.locator(".curated-card").first()
    .getByRole("link", { name: /^Play / });
  const tabBar = page.locator(".mobile-tabbar");

  await expect(disclosure).toBeVisible();
  await expect(filters.getByRole("combobox", { name: "Genre", exact: true })).toBeHidden();
  await expect(filters.getByRole("button", { name: /^Favorites,/ })).toBeHidden();
  await expect(firstPlay).toBeVisible();

  const playBox = await firstPlay.boundingBox();
  const tabBarBox = await tabBar.boundingBox();
  expect(playBox).not.toBeNull();
  expect(tabBarBox).not.toBeNull();
  expect(
    playBox!.y + playBox!.height,
    "the first recommendation action should clear the fixed tab bar by 8px",
  ).toBeLessThanOrEqual(tabBarBox!.y - 8);
  await page.screenshot({
    path: info.outputPath("library-mobile-first-play.png"),
    animations: "disabled",
  });

  await disclosure.click();
  await expect(filters.getByRole("combobox", { name: "Genre", exact: true })).toBeVisible();
  await expect(filters.getByRole("button", { name: /^Favorites,/ })).toBeVisible();
  await page.screenshot({
    path: info.outputPath("library-mobile-filter-drawer.png"),
    animations: "disabled",
  });

  await filters.getByRole("button", { name: "Beginner", exact: true }).click();
  const viewMatches = filters.getByRole("button", { name: /^View \d+ matches$/ });
  await expect(viewMatches).toBeVisible();
  await viewMatches.evaluate((element) => element.scrollIntoView({ block: "center" }));
  const viewMatchesBox = await viewMatches.boundingBox();
  const openTabBarBox = await tabBar.boundingBox();
  expect(viewMatchesBox).not.toBeNull();
  expect(openTabBarBox).not.toBeNull();
  expect(viewMatchesBox!.height).toBeGreaterThanOrEqual(44);
  expect(viewMatchesBox!.y).toBeGreaterThanOrEqual(8);
  expect(viewMatchesBox!.y + viewMatchesBox!.height).toBeLessThanOrEqual(openTabBarBox!.y - 8);
  await page.screenshot({
    path: info.outputPath("library-mobile-filter-ready.png"),
    animations: "disabled",
  });
  await viewMatches.click();

  await expect(filters).not.toHaveAttribute("open", "");
  const resultsHeading = page.getByRole("heading", { name: "Matches", exact: true });
  await expect(resultsHeading).toBeFocused();
  const resultsHeadingBox = await resultsHeading.boundingBox();
  const closedTabBarBox = await tabBar.boundingBox();
  expect(resultsHeadingBox).not.toBeNull();
  expect(closedTabBarBox).not.toBeNull();
  expect(resultsHeadingBox!.y).toBeGreaterThanOrEqual(8);
  expect(resultsHeadingBox!.y + resultsHeadingBox!.height).toBeLessThanOrEqual(
    closedTabBarBox!.y - 8,
  );
  await page.screenshot({
    path: info.outputPath("library-mobile-filter-results.png"),
    animations: "disabled",
  });
});

test("Library previews a match in place and gives audio to only one track", async ({ page }, info) => {
  const previewRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/preview_48s.m4a")) {
      previewRequests.push(request.url());
    }
  });
  await page.goto("/library?q=neon");

  const cards = page.locator(".track-card");
  await expect(cards).toHaveCount(15);
  const first = cards.nth(0);
  const second = cards.nth(1);
  const firstTitle = await first.locator(".track-card-copy strong").innerText();
  const secondTitle = await second.locator(".track-card-copy strong").innerText();
  const firstPreview = first.locator(".track-card-preview .audiobar-toggle");
  const secondPreview = second.locator(".track-card-preview .audiobar-toggle");

  await expect(firstPreview).toHaveAttribute("aria-label", `Play preview — ${firstTitle}`);
  await expect(secondPreview).toHaveAttribute("aria-label", `Play preview — ${secondTitle}`);
  expect(previewRequests).toEqual([]);

  await firstPreview.click();
  await expect(firstPreview).toHaveAttribute("aria-label", `Pause preview — ${firstTitle}`);
  await expect.poll(() => first.locator("audio").evaluate((audio) => !(audio as HTMLAudioElement).paused))
    .toBe(true);

  await secondPreview.click();
  await expect(secondPreview).toHaveAttribute("aria-label", `Pause preview — ${secondTitle}`);
  await expect(firstPreview).toHaveAttribute("aria-label", `Play preview — ${firstTitle}`);
  await expect.poll(() => cards.locator("audio").evaluateAll((audios) =>
    audios.filter((audio) => !(audio as HTMLAudioElement).paused).length,
  )).toBe(1);
  await expect.poll(() => new Set(previewRequests.map((url) => new URL(url).pathname)).size).toBe(2);
  await expect(page).toHaveURL(/\/library\?q=neon$/);

  for (const control of [firstPreview, secondPreview]) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  for (const card of [first, second]) {
    const cardBox = await card.boundingBox();
    const previewBox = await card.locator(".track-card-preview").boundingBox();
    expect(cardBox).not.toBeNull();
    expect(previewBox).not.toBeNull();
    expect(previewBox!.y).toBeGreaterThanOrEqual(cardBox!.y);
    expect(previewBox!.y + previewBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await secondPreview.evaluate((element) => element.scrollIntoView({ block: "center" }));
  if (info.project.name === "mobile") {
    const previewBox = await secondPreview.boundingBox();
    const tabBarBox = await page.locator(".mobile-tabbar").boundingBox();
    expect(previewBox).not.toBeNull();
    expect(tabBarBox).not.toBeNull();
    expect(previewBox!.y).toBeGreaterThanOrEqual(8);
    expect(previewBox!.y + previewBox!.height).toBeLessThanOrEqual(tabBarBox!.y - 8);
  }
  await page.screenshot({
    path: info.outputPath("library-inline-preview.png"),
    animations: "disabled",
  });

  await second.locator("audio").evaluate((audio) => {
    (window as Window & { __libraryPreviewAudio?: HTMLAudioElement }).__libraryPreviewAudio = audio;
  });
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() =>
    (window as Window & { __libraryPreviewAudio?: HTMLAudioElement }).__libraryPreviewAudio?.paused,
  )).toBe(true);
});

test("a Library match exposes its exact default run without losing discovery context", async ({ page }, info) => {
  if (info.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/library?q=chrome%20riff&sort=bpm-desc");

  const card = page.locator(".track-card").filter({ hasText: "Chrome Riff" });
  await expect(card).toHaveCount(1);
  const play = card.getByRole("link", { name: "Play Chrome Riff · Easy Casual", exact: true });
  const libraryHref = "/library?q=chrome+riff&sort=bpm-desc";
  const playHref = `/play/bs-s1-06?tier=easy&mode=casual&returnTo=${encodeURIComponent(libraryHref)}`;

  await expect(play).toBeVisible();
  await expect(play).toHaveAttribute("href", playHref);
  await expect(play).toContainText("Play");
  await expect(play).toContainText("Easy · Casual");
  await play.evaluate((element) => element.scrollIntoView({ block: "center" }));
  const playBox = await play.boundingBox();
  expect(playBox).not.toBeNull();
  expect(playBox!.height).toBeGreaterThanOrEqual(44);
  expect(playBox!.y).toBeGreaterThanOrEqual(8);
  if (info.project.name === "mobile") {
    const tabBarBox = await page.locator(".mobile-tabbar").boundingBox();
    expect(tabBarBox).not.toBeNull();
    expect(playBox!.y + playBox!.height).toBeLessThanOrEqual(tabBarBox!.y - 8);
  } else {
    expect(playBox!.y + playBox!.height).toBeLessThanOrEqual(712);
  }
  await expect(card).toHaveCSS("opacity", "1");
  expect(await card.locator("a a, a button, button a").count()).toBe(0);

  await page.screenshot({ path: info.outputPath("library-direct-play.png"), animations: "disabled" });
  await play.click();
  await expect.poll(() => page.evaluate(() => `${location.pathname}${location.search}`)).toBe(playHref);
  await expect(page.getByRole("button", { name: "Start playing", exact: true })).toBeVisible();
});

test("the 105-track catalog is progressively disclosed without weakening search", async ({ page }, info) => {
  await page.goto("/library");

  const cards = page.locator(".track-card");
  const status = page.locator("#library-filter-status");
  const showMore = page.getByRole("button", { name: "Show 24 more tracks", exact: true });

  await expect(cards).toHaveCount(24);
  await expect(status).toHaveText("Showing 24 of 105 tracks");
  await expect(showMore).toBeVisible();

  await showMore.evaluate((element) => element.scrollIntoView({ block: "center" }));
  const showMoreBox = await showMore.boundingBox();
  expect(showMoreBox).not.toBeNull();
  expect(showMoreBox!.height).toBeGreaterThanOrEqual(44);
  if (info.project.name === "mobile") {
    const tabBarBox = await page.locator(".mobile-tabbar").boundingBox();
    expect(tabBarBox).not.toBeNull();
    expect(showMoreBox!.y + showMoreBox!.height).toBeLessThanOrEqual(tabBarBox!.y - 8);
  }
  await page.screenshot({ path: info.outputPath("library-progressive-list.png"), animations: "disabled" });

  await showMore.click();
  await expect(cards).toHaveCount(48);
  await expect(status).toHaveText("Showing 48 of 105 tracks");
  const firstNewTrack = page.locator(".track-card-link").nth(24);
  await expect(firstNewTrack).toBeFocused();
  if (info.project.name === "mobile") {
    const firstNewTrackBox = await firstNewTrack.boundingBox();
    const tabBarBox = await page.locator(".mobile-tabbar").boundingBox();
    expect(firstNewTrackBox).not.toBeNull();
    expect(tabBarBox).not.toBeNull();
    expect(firstNewTrackBox!.y).toBeGreaterThanOrEqual(8);
    expect(firstNewTrackBox!.y + firstNewTrackBox!.height).toBeLessThanOrEqual(tabBarBox!.y - 8);
  }
  await page.screenshot({ path: info.outputPath("library-next-batch.png"), animations: "disabled" });

  const search = page.getByRole("searchbox", { name: "Search tracks", exact: true });
  await search.fill("chrome riff");
  await expect(cards).toHaveCount(1);
  await expect(status).toHaveText("1 match");
  await expect(page.getByRole("button", { name: /Show .* more/ })).toHaveCount(0);

  await search.press("Escape");
  await expect(cards).toHaveCount(24);
  await expect(status).toHaveText("Showing 24 of 105 tracks");
});

test("all tracks have predictable title and tempo ordering", async ({ page }, info) => {
  await page.goto("/library");

  const disclosure = page.locator(".library-more-filters > summary");
  if (await disclosure.isVisible()) await disclosure.click();
  const sort = page.getByRole("combobox", { name: "Sort tracks", exact: true });
  const cards = page.locator(".track-card");
  const titles = page.locator(".track-card strong");
  const cardBpms = async () => {
    const rows = await page.locator(".track-card-copy > span").allTextContents();
    return rows.map((row) => Number(row.match(/(\d+) BPM/)?.[1] ?? Number.NaN));
  };

  await expect(sort).toHaveValue("title");
  await expect(titles.nth(0)).toHaveText("808 Horizon");
  await expect(titles.nth(1)).toHaveText("Afterglow Scape");

  await page.getByRole("button", { name: "Show 24 more tracks", exact: true }).click();
  await expect(cards).toHaveCount(48);

  await sort.selectOption("bpm-desc");
  await expect(cards).toHaveCount(24);
  const fastFirst = await cardBpms();
  expect(fastFirst.every((bpm, index) => index === 0 || fastFirst[index - 1] >= bpm)).toBe(true);

  await sort.selectOption("bpm-asc");
  await expect(cards).toHaveCount(24);
  const slowFirst = await cardBpms();
  expect(slowFirst.every((bpm, index) => index === 0 || slowFirst[index - 1] <= bpm)).toBe(true);

  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  const sortBox = await sort.boundingBox();
  const genreBox = await page.getByRole("combobox", { name: "Genre", exact: true }).boundingBox();
  expect(sortBox).not.toBeNull();
  expect(genreBox).not.toBeNull();
  expect(sortBox!.height).toBeGreaterThanOrEqual(44);
  expect(genreBox!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("library-tempo-sort.png"), animations: "disabled" });
});

test("track details and reload preserve the library discovery intent", async ({ page }, info) => {
  await page.goto("/library");

  await page.getByRole("searchbox", { name: "Search tracks", exact: true }).fill("chrome riff");
  await openSecondaryFilters(page);
  await page.getByRole("combobox", { name: "Genre", exact: true }).selectOption("Rock");
  const disclosure = page.locator(".library-more-filters > summary");
  await page.getByRole("combobox", { name: "Sort tracks", exact: true }).selectOption("bpm-desc");
  await page.getByRole("radio", { name: "Battle", exact: true }).click();
  await page.getByRole("button", { name: "Beginner", exact: true }).click();
  await expect(page.locator(".track-card")).toHaveCount(1);

  const expectedIntent = {
    q: "chrome riff",
    genre: "Rock",
    vibe: "battle",
    beginner: "1",
    sort: "bpm-desc",
  };
  await expect.poll(() => page.evaluate(() =>
    Object.fromEntries(new URLSearchParams(window.location.search)),
  )).toEqual(expectedIntent);

  await page.getByRole("link", { name: "Open Chrome Riff", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Chrome Riff", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Library", exact: true })).toBeVisible();

  const assertRestoredIntent = async () => {
    await expect.poll(() => page.evaluate(() =>
      Object.fromEntries(new URLSearchParams(window.location.search)),
    )).toEqual(expectedIntent);
    await expect(page.getByRole("searchbox", { name: "Search tracks", exact: true }))
      .toHaveValue("chrome riff");
    await expect(disclosure.locator(".library-filter-count"))
      .toHaveAttribute("aria-label", "4 active filters");
    await expect(disclosure.locator(".library-filter-count")).toHaveText("4");
    if (await disclosure.isVisible()) {
      await expect(page.locator(".library-filter-options")).toBeHidden();
    }
    await openSecondaryFilters(page);
    await expect(page.getByRole("combobox", { name: "Genre", exact: true })).toHaveValue("Rock");
    await expect(page.getByRole("combobox", { name: "Sort tracks", exact: true }))
      .toHaveValue("bpm-desc");
    await expect(page.getByRole("radio", { name: "Battle", exact: true }))
      .toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("button", { name: "Beginner", exact: true }))
      .toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".track-card")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Open Chrome Riff", exact: true })).toBeVisible();
  };

  await assertRestoredIntent();
  await page.reload();
  await assertRestoredIntent();
  if (await disclosure.isVisible()) await disclosure.click();
  await page.screenshot({ path: info.outputPath("library-restored-intent.png"), animations: "disabled" });
});

test("the visible Track return preserves the filtered Library context", async ({ page }) => {
  await page.goto("/library");
  await page.getByRole("searchbox", { name: "Search tracks", exact: true }).fill("chrome riff");
  await openSecondaryFilters(page);
  await page.getByRole("combobox", { name: "Genre", exact: true }).selectOption("Rock");

  const libraryHref = "/library?q=chrome+riff&genre=Rock";
  const trackHref = `/track/bs-s1-06?returnTo=${encodeURIComponent(libraryHref)}`;
  const openTrack = page.getByRole("link", { name: "Open Chrome Riff", exact: true });
  await expect(openTrack).toHaveAttribute("href", trackHref);
  await openTrack.click();

  const visibleReturn = page.locator(".track-detail .back-link");
  await expect(visibleReturn).toHaveAttribute("href", libraryHref);
  await expect(page.locator(".track-play-btn")).toHaveAttribute(
    "href",
    `/play/bs-s1-06?tier=easy&mode=casual&returnTo=${encodeURIComponent(libraryHref)}`,
  );
  await expect(page.getByRole("link", { name: "Duo", exact: true })).toHaveAttribute(
    "href",
    `/duo/bs-s1-06?tier=easy&mode=casual&returnTo=${encodeURIComponent(libraryHref)}`,
  );
  await visibleReturn.click();
  await expect.poll(() => page.evaluate(() => `${window.location.pathname}${window.location.search}`))
    .toBe(libraryHref);
  await expect(page.getByRole("searchbox", { name: "Search tracks", exact: true }))
    .toHaveValue("chrome riff");
  await openSecondaryFilters(page);
  await expect(page.getByRole("combobox", { name: "Genre", exact: true })).toHaveValue("Rock");
  await expect(page.locator(".track-card")).toHaveCount(1);
});

test("single and Duo exits keep the Library return chain", async ({ page }) => {
  const libraryHref = "/library?q=chrome+riff&genre=Rock";
  const encodedReturn = encodeURIComponent(libraryHref);
  const routes = [
    `/play/bs-s1-06?tier=easy&mode=casual&returnTo=${encodedReturn}`,
    `/duo/bs-s1-06?tier=easy&mode=casual&returnTo=${encodedReturn}`,
  ];

  for (const route of routes) {
    await page.goto(route);
    await page.getByRole("button", { name: "Exit the Scape", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Leave the Scape?" })).toHaveCount(0);

    await expect(page).toHaveURL(
      new RegExp(`/track/bs-s1-06\\?tier=easy&mode=casual&returnTo=${encodedReturn}$`),
    );
    await page.locator(".track-detail .back-link").click();
    await expect.poll(() => page.evaluate(() => `${window.location.pathname}${window.location.search}`))
      .toBe(libraryHref);
    await expect(page.getByRole("searchbox", { name: "Search tracks", exact: true }))
      .toHaveValue("chrome riff");
    await expect(page.locator(".track-card")).toHaveCount(1);
  }
});

test("desktop keeps the complete filter set open above recommendations", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Desktop-only layout contract");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/library");

  const search = page.getByRole("searchbox", { name: "Search tracks", exact: true });
  const vibe = page.getByRole("radio", { name: "Night Drive", exact: true });
  const firstRecommendation = page.locator(".curated-card").first();
  await expect(search).toBeVisible();
  await expect(vibe).toBeVisible();
  await expect(page.locator(".library-more-filters > summary")).toBeHidden();

  const searchBox = await search.boundingBox();
  const recommendationBox = await firstRecommendation.boundingBox();
  expect(searchBox).not.toBeNull();
  expect(recommendationBox).not.toBeNull();
  expect(searchBox!.y + searchBox!.height).toBeLessThan(recommendationBox!.y);
  await page.screenshot({ path: info.outputPath("library-desktop.png"), animations: "disabled" });
});

test("filter disclosure follows phone-to-desktop viewport changes", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Responsive transition contract");
  await page.goto("/library");

  const disclosure = page.locator(".library-more-filters > summary");
  const vibe = page.getByRole("radio", { name: "Night Drive", exact: true });
  await expect(disclosure).toBeVisible();
  await expect(vibe).toBeHidden();

  await page.setViewportSize({ width: 800, height: 700 });
  await expect(disclosure).toBeHidden();
  await expect(vibe).toBeVisible();

  await page.setViewportSize({ width: 320, height: 568 });
  await expect(disclosure).toBeVisible();
  await expect(vibe).toBeHidden();

  await disclosure.click();
  await vibe.click();
  await page.getByRole("combobox", { name: "Sort tracks", exact: true }).selectOption("bpm-desc");
  await expect(disclosure.locator(".library-filter-count"))
    .toHaveAttribute("aria-label", "2 active filters");

  await page.setViewportSize({ width: 800, height: 700 });
  await page.setViewportSize({ width: 320, height: 568 });
  await expect(vibe).toBeHidden();
  await expect(disclosure.locator(".library-filter-count"))
    .toHaveAttribute("aria-label", "2 active filters");

  await disclosure.click();
  await expect(vibe).toBeVisible();
});

test("vibe filters expose one roving radio selection", async ({ page }) => {
  await page.goto("/library");
  await openSecondaryFilters(page);

  const vibes = page.getByRole("radiogroup", { name: "Vibe", exact: true });
  const all = vibes.getByRole("radio", { name: "All", exact: true });
  const nightDrive = vibes.getByRole("radio", { name: "Night Drive", exact: true });
  const chill = vibes.getByRole("radio", { name: "Chill", exact: true });
  await expect(vibes.getByRole("radio")).toHaveCount(5);
  await expect(all).toHaveAttribute("aria-checked", "true");
  await expect(all).toHaveAttribute("tabindex", "0");
  await expect(nightDrive).toHaveAttribute("aria-checked", "false");
  await expect(nightDrive).toHaveAttribute("tabindex", "-1");

  await all.focus();
  await all.press("ArrowRight");
  await expect(nightDrive).toBeFocused();
  await expect(nightDrive).toHaveAttribute("aria-checked", "true");
  await expect(nightDrive).toHaveAttribute("tabindex", "0");
  await expect(page).toHaveURL(/\/library\?vibe=night-drive$/);

  await nightDrive.click();
  await expect(nightDrive).toHaveAttribute("aria-checked", "true");
  await expect(page).toHaveURL(/\/library\?vibe=night-drive$/);

  await nightDrive.press("End");
  await expect(chill).toBeFocused();
  await expect(chill).toHaveAttribute("aria-checked", "true");
  await expect(page).toHaveURL(/\/library\?vibe=chill$/);
  await chill.press("Home");
  await expect(all).toBeFocused();
  await expect(all).toHaveAttribute("aria-checked", "true");
  await expect(page).toHaveURL(/\/library$/);
});

test("favorites are saved, recalled, and removed directly from the library", async ({ page }, info) => {
  if (info.project.name === "desktop") {
    await page.setViewportSize({ width: 1280, height: 720 });
  }
  await page.goto("/library");
  await page.getByRole("searchbox", { name: "Search tracks", exact: true }).fill("chrome riff");

  const chromeRiff = page.locator(".track-card").filter({ hasText: "Chrome Riff" });
  const addFavorite = chromeRiff.getByRole("button", { name: "Add Chrome Riff to favorites" });
  await expect(addFavorite).toBeVisible();
  await expect(addFavorite).toHaveAttribute("aria-pressed", "false");

  const target = await addFavorite.boundingBox();
  expect(target).not.toBeNull();
  expect(target!.width).toBeGreaterThanOrEqual(44);
  expect(target!.height).toBeGreaterThanOrEqual(44);
  await expect(chromeRiff.locator("a button, button a")).toHaveCount(0);

  await addFavorite.click();
  await expect(chromeRiff.getByRole("button", { name: "Remove Chrome Riff from favorites" }))
    .toHaveAttribute("aria-pressed", "true");
  await openSecondaryFilters(page);
  await expect(page.getByRole("button", { name: "Favorites, 1 saved" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("bs_favorites") ?? "[]")))
    .toEqual(["bs-s1-06"]);

  await chromeRiff.getByRole("link", { name: "Open Chrome Riff" }).click();
  await expect(page.getByRole("button", { name: /Favorited/ })).toHaveAttribute("aria-pressed", "true");
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Library", exact: true })).toBeVisible();

  await page.reload();
  await openSecondaryFilters(page);
  const favorites = page.getByRole("button", { name: "Favorites, 1 saved" });
  await expect(favorites).toBeVisible();
  await favorites.click();
  await expect(page.locator(".library-saved-toggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".track-card")).toHaveCount(1);
  await expect(page.locator(".track-card")).toContainText("Chrome Riff");
  await expect(page.locator(".curated-section")).toBeHidden();

  if (info.project.name === "mobile") {
    await expect(page.locator(".library-more-filters")).not.toHaveAttribute("open", "");
    await expect(page.locator(".library-more-filters .library-filter-count"))
      .toHaveAttribute("aria-label", "1 active filter");
    const cardBox = await page.locator(".track-card").boundingBox();
    const favoriteBox = await page
      .getByRole("button", { name: "Remove Chrome Riff from favorites" })
      .boundingBox();
    const tabBarBox = await page.locator(".mobile-tabbar").boundingBox();
    expect(cardBox).not.toBeNull();
    expect(favoriteBox).not.toBeNull();
    expect(tabBarBox).not.toBeNull();
    expect(cardBox!.y + 44).toBeLessThanOrEqual(tabBarBox!.y);
    expect(favoriteBox!.y + favoriteBox!.height).toBeLessThanOrEqual(tabBarBox!.y);
  }
  await page.screenshot({ path: info.outputPath("library-favorites.png"), animations: "disabled" });

  await page.getByRole("button", { name: "Remove Chrome Riff from favorites" }).click();
  await expect(page.locator(".track-card")).toHaveCount(0);
  await expect(page.getByText("No favorites yet — use ☆ on any track.")).toBeVisible();
  const browseAll = page.getByRole("button", { name: "Browse all tracks" });
  await expect(browseAll).toBeVisible();
  await browseAll.click();
  await expect(page.locator(".track-card")).toHaveCount(24);
  await expect(page.locator("#library-filter-status")).toHaveText("Showing 24 of 105 tracks");
  await expect(page.locator(".library-saved-toggle")).toHaveAttribute("aria-pressed", "false");
});

test("returning players can replay their latest run before generic picks", async ({ page }, info) => {
  if (info.project.name === "desktop") {
    await page.setViewportSize({ width: 1280, height: 720 });
  }
  await page.addInitScript(() => {
    localStorage.setItem("bs_runs", JSON.stringify([
      {
        track_id: "bs-s1-01",
        district: "Pulse Core",
        tier: "easy",
        mode: "casual",
        score: 86500,
        accuracy: 86.5,
        maxCombo: 82,
        fc: false,
        ap: false,
        failed: false,
        durationMs: 60000,
        endedAt: "2026-09-12T20:00:00.000Z",
        dateKey: "2026-09-12",
      },
      {
        track_id: "bs-s1-06",
        district: "Chrome Yard",
        tier: "hard",
        mode: "arcade",
        score: 924000,
        accuracy: 92.4,
        maxCombo: 184,
        fc: false,
        ap: false,
        failed: false,
        durationMs: 75000,
        endedAt: "2026-09-13T12:30:00.000Z",
        dateKey: "2026-09-13",
      },
    ]));
  });
  await page.goto("/library");

  const returnSection = page.getByRole("region", { name: "Your latest run", exact: true });
  const playAgain = returnSection.getByRole("link", { name: "Play again", exact: true });
  const changeSetup = returnSection.getByRole("link", { name: "Change setup", exact: true });
  await expect(returnSection).toBeVisible();
  await expect(returnSection.getByRole("heading", { name: "Chrome Riff", exact: true })).toBeVisible();
  await expect(returnSection.getByText("92.4% ACC", { exact: true })).toBeVisible();
  await expect(returnSection.getByText("Hard · Arcade", { exact: true })).toBeVisible();
  await expect(playAgain).toHaveAttribute("href", "/play/bs-s1-06?tier=hard&mode=arcade");
  await expect(changeSetup).toHaveAttribute("href", "/track/bs-s1-06?tier=hard&mode=arcade");

  const discoveryBox = await page.locator(".library-discovery").boundingBox();
  const returnBox = await returnSection.boundingBox();
  const firstPickBox = await page.locator(".curated-card").first().boundingBox();
  expect(discoveryBox).not.toBeNull();
  expect(returnBox).not.toBeNull();
  expect(firstPickBox).not.toBeNull();
  expect(discoveryBox!.y + discoveryBox!.height).toBeLessThanOrEqual(returnBox!.y);
  expect(returnBox!.y + returnBox!.height).toBeLessThanOrEqual(firstPickBox!.y);

  for (const action of [playAgain, changeSetup]) {
    const box = await action.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  const pageWidth = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(pageWidth.content).toBeLessThanOrEqual(pageWidth.viewport);

  if (info.project.name === "mobile") {
    await playAgain.evaluate((element) => element.scrollIntoView({ block: "center" }));
    const actionBox = await playAgain.boundingBox();
    const tabBarBox = await page.locator(".mobile-tabbar").boundingBox();
    expect(actionBox).not.toBeNull();
    expect(tabBarBox).not.toBeNull();
    expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(tabBarBox!.y);
  }
  await page.screenshot({ path: info.outputPath("library-latest-run.png"), animations: "disabled" });

  await page.getByRole("searchbox", { name: "Search tracks", exact: true }).fill("skyline hook");
  await expect(returnSection).toBeHidden();
  await expect(page.getByRole("heading", { name: "Matches", exact: true })).toBeVisible();
});

test("a zero-hit latest run is named as a retry instead of a completed replay", async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_runs", JSON.stringify([{
      track_id: "bs-s1-05",
      district: "Pulse Core",
      tier: "easy",
      mode: "casual",
      score: 0,
      accuracy: 0,
      maxCombo: 0,
      fc: false,
      ap: false,
      failed: false,
      durationMs: 60000,
      endedAt: "2026-09-13T13:00:00.000Z",
      dateKey: "2026-09-13",
    }]));
  });
  await page.goto("/library");

  const returnSection = page.getByRole("region", { name: "Your latest run", exact: true });
  const retry = returnSection.getByRole("link", { name: "Retry", exact: true });
  await expect(returnSection.getByText("No notes hit", { exact: true })).toBeVisible();
  await expect(retry).toHaveAttribute("href", "/play/bs-s1-05?tier=easy&mode=casual");
  await expect(returnSection.getByRole("link", { name: "Play again", exact: true })).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("library-zero-hit-retry.png"),
    animations: "disabled",
  });
});
