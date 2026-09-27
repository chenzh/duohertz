import { existsSync, readFileSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const candidateRoot = new URL("../candidates/duohertz/dh-001-first-frequency/", import.meta.url);
const firstManifest = JSON.parse(readFileSync(new URL("manifest.json", candidateRoot), "utf8"));
const firstId = firstManifest.track_id as string;
const genres = ["Melodic House", "Synthwave", "Future Bass", "Drum & Bass", "Trance"] as const;
const hash = "a".repeat(64);
const artifactRoot = new URL("../dist-duohertz/", import.meta.url);

test.beforeEach(async ({ page }) => {
  await page.route(/\/catalog\/dh-\d{3}-[^/]+\/cover-thumb\.webp$/, (route) => route.fulfill({
    path: new URL("../thumbnails/dh-001-first-frequency.webp", candidateRoot).pathname,
    contentType: "image/webp",
  }));
});

test("review artifact contains only the new brand entry and no legacy public catalog", () => {
  const html = readFileSync(new URL("index.html", artifactRoot), "utf8");
  const assets = readdirSync(new URL("assets/", artifactRoot))
    .filter((name) => name.endsWith(".js"))
    .map((name) => readFileSync(new URL(`assets/${name}`, artifactRoot), "utf8")).join("\n");
  expect(html).toContain("noindex, nofollow");
  expect(html).toContain("duohertz");
  expect(html).not.toContain("BeatScape");
  expect(html).not.toContain("manifest.webmanifest");
  expect(assets).not.toContain("BeatScape");
  expect(assets).not.toContain("NIGHTSHIFT");
  expect(assets).not.toContain("RHYVORI");
  expect(assets).not.toContain("NIVAREO");
  expect(assets).not.toContain("ZORYMELA");
  expect(assets).not.toContain("bs-s1-01");
  expect(existsSync(new URL("catalog.json", artifactRoot))).toBe(false);
  expect(existsSync(new URL("manifest.webmanifest", artifactRoot))).toBe(false);
});

test("the independent review build visibly identifies itself as unreleased on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const notice = page.getByRole("note", { name: "Preview status" });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("Internal preview");
  await expect(notice).toContainText("not released");
  await page.goto("/library");
  await expect(notice).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

function fixtureCatalog() {
  return {
    version: 2, brand: "duohertz",
    source_observations_sha256: hash,
    source_catalog_signoff_sha256: hash,
    site_and_deployment_approval: true,
    tracks: Array.from({ length: 105 }, (_, index) => {
      const id = index === 0 ? firstId : `dh-${String(index + 1).padStart(3, "0")}-fixture`;
      const base = `/catalog/${id}`;
      return {
        track_id: id, title: index === 0 ? firstManifest.title : `Fixture ${index + 1}`,
        artist: "duohertz test fixture", genre: genres[Math.floor(index / 21)],
        bpm: index === 0 ? firstManifest.bpm : 120,
        duration_sec: index === 0 ? firstManifest.duration_sec : 60,
        stream_duration_sec: index === 0 ? firstManifest.stream_duration_sec : 120,
        theme: "duohertz", chart_format: 2, rights: "signed_catalog_candidate",
        audio: `${base}/audio.m4a`, stream_audio: `${base}/stream.m4a`,
        preview: `${base}/preview_48s.m4a`, cover: `${base}/cover-art.png`,
        cover_thumb: `${base}/cover-thumb.webp`, cover_thumb_sha256: hash, og: `${base}/og.png`,
        charts: { easy: `${base}/easy.json`, standard: `${base}/standard.json`, hard: `${base}/hard.json` },
        manifest_sha256: hash,
      };
    }),
  };
}

function fixtureCharacters(approved = true) {
  return {
    version: 1, brand: "duohertz", source_character_signoff_sha256: hash,
    site_and_deployment_approval: approved,
    characters: (["Attacker", "Support", "Buffer"] as const).map((role, index) => {
      const id = `dh-char-${index + 1}`;
      return {
        id, name: `Fixture ${index + 1}`, title: `The ${role} Wave`, role,
        region: "The Soundfield", height: `${165 + index} cm`,
        identity: "Makes a shared rhythm easier to hear.", traits: "Curious · kind",
        quote: "Make room for every beat.",
        story: Array.from({ length: 8 }, () => "A new rhythm begins in the soundfield and invites another player to answer with a bright wave of their own.").join(" "),
        art: `/characters/${id}/front.png`, side_art: `/characters/${id}/side.png`,
        art_sha256: hash, side_art_sha256: hash,
        alt: `Front of Fixture ${index + 1}`, side_alt: `Side of Fixture ${index + 1}`,
      };
    }),
  };
}

test("approved characters render in the isolated brand shell while the mobile navigation remains usable", async ({ page }) => {
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.route("**/duohertz-v2/characters.json", (route) => route.fulfill({ json: fixtureCharacters() }));
  await page.route(/\/characters\/dh-char-\d+\/(front|side)\.png$/, (route) => route.fulfill({
    path: new URL("cover-art.png", candidateRoot).pathname, contentType: "image/png",
  }));
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/characters");
  await expect(page.getByRole("heading", { name: /Meet the voices/ })).toBeVisible();
  await expect(page.locator(".dh-characters__card")).toHaveCount(3);
  const first = page.locator(".dh-characters__card").first();
  await expect(first.getByRole("img", { name: "Front of Fixture 1" })).toBeVisible();
  await first.getByRole("button", { name: "Side" }).click();
  await expect(first.getByRole("img", { name: "Side of Fixture 1" })).toBeVisible();
  const story = first.locator(".dh-characters__story-details");
  const storyAction = story.locator("summary");
  await expect(storyAction).toBeVisible();
  await expect(story).not.toHaveAttribute("open", "");
  const secondCardTop = await page.locator(".dh-characters__card").nth(1)
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  expect(secondCardTop).toBeLessThan(1900);
  const collapsedHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await storyAction.focus();
  await page.keyboard.press("Enter");
  await expect(story).toHaveAttribute("open", "");
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(collapsedHeight + 200);
  await storyAction.click();
  const nav = page.getByRole("navigation", { name: "duohertz mobile navigation" });
  const links = nav.getByRole("link");
  await expect(links).toHaveCount(5);
  for (const link of await links.all()) {
    const box = await link.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await nav.getByRole("link", { name: "Library" }).click();
  await expect(page).toHaveURL(/\/library$/);
  await nav.getByRole("link", { name: "People" }).click();
  await expect(page).toHaveURL(/\/characters$/);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(first.locator(".dh-characters__story--desktop")).toBeVisible();
  await expect(storyAction).toBeHidden();
});

test("character route stays closed without both site and character approval", async ({ page }) => {
  let characterRequests = 0;
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({
    json: { ...fixtureCatalog(), site_and_deployment_approval: false },
  }));
  await page.route("**/duohertz-v2/characters.json", (route) => {
    characterRequests++;
    return route.fulfill({ json: fixtureCharacters() });
  });
  await page.goto("/characters");
  await expect(page.getByRole("alert")).toContainText("characters are not available yet");
  expect(characterRequests).toBe(0);

  await page.unroute("**/duohertz-v2/catalog.json");
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.unroute("**/duohertz-v2/characters.json");
  await page.route("**/duohertz-v2/characters.json", (route) => route.fulfill({ json: fixtureCharacters(false) }));
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("characters are not available yet");
  await expect(page.locator(".dh-characters__card")).toHaveCount(0);
});

test("isolated brand artifact opens its own complete player journey", async ({ page }) => {
  const errors: string[] = [];
  let oldCatalogRequests = 0;
  let approvedCatalogRequests = 0;
  let streamRequests = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(/\/beatscape\/catalog\.json(?:\?|$)/, (route) => {
    oldCatalogRequests++;
    return route.abort();
  });
  await page.route("**/duohertz-v2/catalog.json", (route) => {
    approvedCatalogRequests++;
    return route.fulfill({ json: fixtureCatalog() });
  });
  await page.route(/\/catalog\/dh-\d{3}-[^/]+\/stream\.m4a$/, (route) => {
    streamRequests++;
    return route.abort();
  });
  await page.route(/\/catalog\/dh-\d{3}-[^/]+\/cover-art\.png$/, (route) => route.fulfill({
    path: new URL("cover-art.png", candidateRoot).pathname, contentType: "image/png",
  }));
  await page.route(/\/catalog\/dh-001-first-frequency\/(easy|standard|hard)\.json$/, (route) => {
    const filename = route.request().url().split("/").at(-1)!;
    return route.fulfill({ path: new URL(filename, candidateRoot).pathname, contentType: "application/json" });
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await expect(page).toHaveTitle("duohertz — Music for you. Be your true hertz.");
  await expect(page.getByRole("heading", { name: /Feel the beat/ })).toBeVisible();
  await expect(page.getByText("Music for you. Be your true hertz.")).toBeVisible();
  await expect(page.locator(".dh-hub__brand-zh[lang='zh-CN']")).toContainText("音你、真我赫兹");
  await expect(page.locator(".dh-hub__track")).toHaveCount(9);
  const homeStart = page.getByRole("link", { name: "Start with one key" });
  const homeStartBox = await homeStart.boundingBox();
  const homeNavigationBox = await page.getByRole("navigation", { name: "duohertz mobile navigation" }).boundingBox();
  if (!homeStartBox || !homeNavigationBox) throw new Error("Missing home start action or mobile navigation");
  expect(homeStartBox.y).toBeGreaterThanOrEqual(0);
  expect(homeStartBox.y + homeStartBox.height).toBeLessThanOrEqual(homeNavigationBox.y - 8);
  const firstAction = page.getByRole("link", { name: `Try ${firstManifest.title} in the rhythm game` });
  expect(await firstAction.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(11, 18, 50)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator("link[rel=manifest], link[href*='catalog.json']").count()).toBe(0);

  await page.getByRole("navigation", { name: "duohertz mobile navigation" }).getByRole("link", { name: "Library" }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.locator(".dh-hub__track")).toHaveCount(15);
  const librarySearch = page.getByRole("searchbox", { name: "Find a beat" });
  await librarySearch.fill("fIxTuRe 90");
  await expect(page.locator(".dh-hub__track")).toHaveCount(1);
  await expect(page.locator(".dh-hub__result-count")).toHaveText("Showing 1 of 1 match · 105 total");
  const styles = page.getByRole("group", { name: "Filter music style" });
  await styles.getByRole("button", { name: "Synthwave" }).click();
  await expect(page.locator(".dh-hub__track")).toHaveCount(0);
  await expect(page.locator(".dh-hub__empty")).toContainText("No tracks match");
  await styles.getByRole("button", { name: "All sounds" }).click();
  await librarySearch.fill("DH-090");
  await expect(page.locator(".dh-hub__track")).toHaveCount(1);
  await librarySearch.fill(firstManifest.title);
  await styles.getByRole("button", { name: "Melodic House" }).click();
  await page.getByRole("link", { name: `Try ${firstManifest.title} in the rhythm game` }).click();
  await expect(page).toHaveURL(new RegExp(`/play/${firstId}`));
  await page.goBack();
  await expect(page).toHaveURL(/\/library\?/);
  await expect(librarySearch).toHaveValue(firstManifest.title);
  await expect(styles.getByRole("button", { name: "Melodic House" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".dh-hub__track")).toHaveCount(1);
  await styles.getByRole("button", { name: "All sounds" }).click();
  await librarySearch.fill("");
  await expect(page.locator(".dh-hub__track")).toHaveCount(15);
  const listenAction = page.getByRole("link", { name: `Listen to ${firstManifest.title} in the music station` });
  expect((await listenAction.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await listenAction.click();
  await expect(page).toHaveURL(new RegExp(`/radio\\?track=${firstId}$`));
  await expect(page.locator(".dh-radio-lab__player h2")).toHaveText(firstManifest.title);
  await page.getByRole("navigation", { name: "duohertz mobile navigation" }).getByRole("link", { name: "Library" }).click();
  await expect(page.locator(".dh-hub__track")).toHaveCount(15);
  await page.getByRole("link", { name: `Try ${firstManifest.title} in the rhythm game` }).click();
  await expect(page).toHaveURL(new RegExp(`/play/${firstId}$`));
  await expect(page.getByRole("button", { name: "Start one-key beat" })).toBeVisible();
  await page.getByRole("navigation", { name: "duohertz mobile navigation" }).getByRole("link", { name: "Station" }).click();
  await expect(page).toHaveURL(/\/radio$/);
  await expect(page.locator(".dh-radio-lab__playlist li")).toHaveCount(105);
  expect(streamRequests).toBe(0);
  expect(oldCatalogRequests).toBe(0);
  expect(approvedCatalogRequests).toBe(1);
  expect(errors).toEqual([]);
});

test("approved library reveals the full catalog in batches and restores the browsing depth", async ({ page }) => {
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.route(/\/catalog\/dh-001-first-frequency\/(easy|standard|hard)\.json$/, (route) => {
    const filename = route.request().url().split("/").at(-1)!;
    return route.fulfill({ path: new URL(filename, candidateRoot).pathname, contentType: "application/json" });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/library");
  await expect(page.locator(".dh-hub__track")).toHaveCount(15);
  await expect(page.locator(".dh-hub__result-count")).toHaveText("Showing 15 of 105 matches · 105 total");
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(5500);
  await page.getByRole("button", { name: "Show 15 more tracks" }).click();
  await expect(page).toHaveURL(/\/library\?show=30$/);
  await expect(page.locator(".dh-hub__track")).toHaveCount(30);
  await page.reload();
  await expect(page.locator(".dh-hub__track")).toHaveCount(30);
  await page.getByRole("link", { name: `Try ${firstManifest.title} in the rhythm game` }).click();
  await expect(page).toHaveURL(new RegExp(`/play/${firstId}\\?show=30$`));
  await page.goBack();
  await expect(page.locator(".dh-hub__track")).toHaveCount(30);
  await page.goto("/play/dh-999-missing?show=30");
  await page.getByRole("link", { name: "Choose another beat" }).click();
  await expect(page).toHaveURL(/\/library\?show=30$/);
  await expect(page.locator(".dh-hub__track")).toHaveCount(30);
  await page.getByRole("searchbox", { name: "Find a beat" }).fill("Fixture 90");
  await expect(page).not.toHaveURL(/show=/);
  await expect(page.locator(".dh-hub__track")).toHaveCount(1);
  await expect(page.locator(".dh-hub__result-count")).toHaveText("Showing 1 of 1 match · 105 total");
  await page.getByRole("searchbox", { name: "Find a beat" }).fill("");
  await expect(page.locator(".dh-hub__track")).toHaveCount(15);
  for (const count of [30, 45, 60, 75, 90, 105]) {
    await page.getByRole("button", { name: "Show 15 more tracks" }).click();
    await expect(page.locator(".dh-hub__track")).toHaveCount(count);
  }
  await expect(page.getByRole("button", { name: /Show \d+ more tracks/ })).toHaveCount(0);
});

test("cold game setup uses the small approved cover and does not fetch full artwork", async ({ page }) => {
  let fullCoverRequests = 0;
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.route(/\/catalog\/dh-001-first-frequency\/(easy|standard|hard)\.json$/, (route) => {
    const filename = route.request().url().split("/").at(-1)!;
    return route.fulfill({ path: new URL(filename, candidateRoot).pathname, contentType: "application/json" });
  });
  await page.route(/\/catalog\/dh-001-first-frequency\/cover-art\.png$/, (route) => {
    fullCoverRequests++;
    return route.abort();
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`/play/${firstId}`);
  await expect(page.getByRole("button", { name: "Start one-key beat" })).toBeVisible();
  const cover = page.locator(".dh-lab__candidate-art img");
  await expect(cover).toHaveAttribute("src", `/catalog/${firstId}/cover-thumb.webp`);
  await expect.poll(() => cover.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(240);
  expect(fullCoverRequests).toBe(0);
});

test("approved play names the chosen beat before the start action on a narrow screen", async ({ page }) => {
  const catalog = fixtureCatalog();
  catalog.tracks[0]!.title = "Opaline Counterpulse";
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: catalog }));
  await page.route(/\/catalog\/dh-001-first-frequency\/(easy|standard|hard)\.json$/, (route) => {
    const filename = route.request().url().split("/").at(-1)!;
    return route.fulfill({ path: new URL(filename, candidateRoot).pathname, contentType: "application/json" });
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`/play/${firstId}`);
  const title = page.getByRole("heading", { level: 1, name: "Opaline Counterpulse" });
  const start = page.getByRole("button", { name: "Start one-key beat" });
  await expect(title).toBeVisible();
  await expect(start).toBeVisible();
  const titleBox = await title.boundingBox();
  const startBox = await start.boundingBox();
  const navBox = await page.getByRole("navigation", { name: "duohertz mobile navigation" }).boundingBox();
  if (!titleBox || !startBox || !navBox) throw new Error("Missing chosen beat, start action or mobile navigation");
  expect(titleBox.x).toBeGreaterThanOrEqual(0);
  expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(320);
  expect(startBox.y + startBox.height).toBeLessThanOrEqual(navBox.y - 8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("a play-page return link restores the exact approved-library view", async ({ page }) => {
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/play/dh-999-missing?q=Fixture%2090&style=Trance");
  await expect(page.getByRole("alert")).toContainText("This track is not available");
  await page.getByRole("link", { name: "Choose another beat" }).click();
  await expect(page).toHaveURL(/\/library\?q=Fixture\+90&style=Trance$/);
  await expect(page.getByRole("searchbox", { name: "Find a beat" })).toHaveValue("Fixture 90");
  await expect(page.getByRole("group", { name: "Filter music style" })
    .getByRole("button", { name: "Trance" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".dh-hub__track")).toHaveCount(1);
});

test("one-key and Duo play stay reachable across narrow and desktop review paths", async ({ page }) => {
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.route(/\/catalog\/dh-001-first-frequency\/(easy|standard|hard)\.json$/, (route) => {
    const filename = route.request().url().split("/").at(-1)!;
    return route.fulfill({ path: new URL(filename, candidateRoot).pathname, contentType: "application/json" });
  });
  await page.route(`/catalog/${firstId}/audio.m4a`, (route) => route.fulfill({
    path: new URL("audio.m4a", candidateRoot).pathname, contentType: "audio/mp4",
  }));
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`/play/${firstId}`);
  const start = page.getByRole("button", { name: "Start one-key beat" });
  await expect(start).toBeVisible();
  const startBox = await start.boundingBox();
  const navigationBox = await page.getByRole("navigation", { name: "duohertz mobile navigation" }).boundingBox();
  if (!startBox || !navigationBox) throw new Error("Missing start action or mobile navigation");
  expect(startBox.y + startBox.height).toBeLessThanOrEqual(navigationBox.y - 8);
  const keyChoices = page.getByRole("group", { name: "Choose key count" });
  const keyChoicesBox = await keyChoices.boundingBox();
  if (!keyChoicesBox) throw new Error("Missing one-key and two-key choices");
  expect(keyChoicesBox.y).toBeGreaterThanOrEqual(0);
  expect(keyChoicesBox.y + keyChoicesBox.height).toBeLessThanOrEqual(navigationBox.y - 8);
  await keyChoices.getByRole("button", { name: "2 keys · Standard" }).click();
  await expect(page.getByRole("button", { name: "Start two-key beat" })).toBeVisible();
  await keyChoices.getByRole("button", { name: "1 key · Easy" }).click();
  await expect(start).toBeVisible();
  await start.click();
  const pause = page.getByRole("button", { name: "Pause" });
  await expect(pause).toBeVisible();
  const pauseBox = await pause.boundingBox();
  if (!pauseBox) throw new Error("Missing pause action");
  expect(pauseBox.y).toBeGreaterThanOrEqual(0);
  expect(pauseBox.y + pauseBox.height).toBeLessThanOrEqual(navigationBox.y - 8);
  const pad = page.getByRole("button", { name: "Tap or hold the beat" });
  await expect(pad).toBeEnabled();
  const padBox = await pad.boundingBox();
  if (!padBox) throw new Error("Missing one-key play pad");
  expect(padBox.y).toBeGreaterThanOrEqual(0);
  expect(padBox.y + padBox.height).toBeLessThanOrEqual(navigationBox.y - 8);

  await page.getByRole("button", { name: "Stop" }).click();
  await page.getByRole("button", { name: "Duo · two players" }).click();
  const duoStart = page.getByRole("button", { name: "Start Duo beat" });
  await expect.poll(async () => (await duoStart.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(0);
  const duoStartBox = await duoStart.boundingBox();
  if (!duoStartBox) throw new Error("Missing Duo start action");
  expect(duoStartBox.y).toBeGreaterThanOrEqual(0);
  expect(duoStartBox.y + duoStartBox.height).toBeLessThanOrEqual(navigationBox.y - 8);
  await duoStart.click();
  const duoPause = page.getByRole("button", { name: "Pause" });
  await expect(duoPause).toBeVisible();
  const duoPauseBox = await duoPause.boundingBox();
  if (!duoPauseBox) throw new Error("Missing Duo pause action");
  expect(duoPauseBox.y).toBeGreaterThanOrEqual(0);
  expect(duoPauseBox.y + duoPauseBox.height).toBeLessThanOrEqual(navigationBox.y - 8);
  for (const player of [1, 2]) {
    const playerPad = page.getByRole("button", { name: `Player ${player} beat` });
    await expect(playerPad).toBeEnabled();
    await expect.poll(async () => {
      const box = await playerPad.boundingBox();
      return box ? box.y + box.height : Number.POSITIVE_INFINITY;
    }).toBeLessThanOrEqual(navigationBox.y - 8);
    const playerBox = await playerPad.boundingBox();
    if (!playerBox) throw new Error(`Missing Player ${player} pad`);
    expect(playerBox.y).toBeGreaterThanOrEqual(0);
    expect(playerBox.y + playerBox.height).toBeLessThanOrEqual(navigationBox.y - 8);
  }
  await page.getByRole("button", { name: "Stop" }).click();
  await page.getByRole("button", { name: "Solo · one player" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Start two-key beat" })).toBeFocused();

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole("button", { name: "Duo · two players" }).click();
  const desktopDuoStart = page.getByRole("button", { name: "Start Duo beat" });
  await expect.poll(async () => (await desktopDuoStart.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(0);
  const desktopBox = await desktopDuoStart.boundingBox();
  if (!desktopBox) throw new Error("Missing desktop Duo start action");
  expect(desktopBox.y + desktopBox.height).toBeLessThanOrEqual(720);
});

test("two-key input creates distinct frequency ripples and respects reduced motion", async ({ page }) => {
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.route(/\/catalog\/dh-001-first-frequency\/(easy|standard|hard)\.json$/, (route) => {
    const filename = route.request().url().split("/").at(-1)!;
    return route.fulfill({ path: new URL(filename, candidateRoot).pathname, contentType: "application/json" });
  });
  await page.route(`/catalog/${firstId}/audio.m4a`, (route) => route.fulfill({
    path: new URL("audio.m4a", candidateRoot).pathname, contentType: "audio/mp4",
  }));
  await page.goto(`/play/${firstId}`);
  await page.getByRole("button", { name: "2 keys · Standard" }).click();
  await page.getByRole("button", { name: "Start two-key beat" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await page.keyboard.down("f");
  await page.keyboard.down("j");
  const left = page.locator(".dh-lab__lane").first().locator(".dh-lab__ripple").first();
  const right = page.locator(".dh-lab__lane").nth(1).locator(".dh-lab__ripple").first();
  await expect(left).toBeVisible();
  await expect(right).toBeVisible();
  const leftColor = await left.evaluate((element) => getComputedStyle(element).borderTopColor);
  const rightColor = await right.evaluate((element) => getComputedStyle(element).borderTopColor);
  expect(rightColor).not.toBe(leftColor);
  await page.keyboard.up("f");
  await page.keyboard.up("j");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.keyboard.down("f");
  await expect(page.locator(".dh-lab__lane").first().locator(".dh-lab__ripple").last())
    .toHaveCSS("animation-name", "dh-still-fade");
  await page.keyboard.up("f");
});

test("the standalone review play page exposes the saved duohertz keymap", async ({ page }) => {
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.route(/\/catalog\/dh-001-first-frequency\/(easy|standard|hard)\.json$/, (route) => {
    const filename = route.request().url().split("/").at(-1)!;
    return route.fulfill({ path: new URL(filename, candidateRoot).pathname, contentType: "application/json" });
  });
  await page.route(`/catalog/${firstId}/audio.m4a`, (route) => route.fulfill({
    path: new URL("audio.m4a", candidateRoot).pathname, contentType: "audio/mp4",
  }));
  await page.goto(`/play/${firstId}`);
  await page.locator(".dh-lab__keymap summary").click();
  await page.getByRole("button", { name: "One key: Space" }).click();
  await page.keyboard.press("k");
  await expect(page.getByRole("button", { name: "Tap or hold the beat" })).toContainText("K");
  await page.reload();
  await expect(page.getByRole("button", { name: "Tap or hold the beat" })).toContainText("K");
});

test("a staged catalog cannot make the standalone brand artifact look released", async ({ page }) => {
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({
    json: { ...fixtureCatalog(), site_and_deployment_approval: false },
  }));
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("home is not available yet");
  await expect(page.locator(".dh-hub__track")).toHaveCount(0);
});

test("an unavailable catalog is reloaded when the player retries", async ({ page }) => {
  let approved = false;
  let requests = 0;
  await page.route("**/duohertz-v2/catalog.json", (route) => {
    requests++;
    return route.fulfill({ json: { ...fixtureCatalog(), site_and_deployment_approval: approved } });
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("home is not available yet");
  approved = true;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: /Feel the beat/ })).toBeVisible();
  expect(requests).toBe(2);
});

test("old track, play and duo links explain the transition without fetching a catalog", async ({ page }) => {
  let catalogs = 0;
  await page.route("**/duohertz-v2/catalog.json", (route) => {
    catalogs++;
    return route.abort();
  });
  await page.setViewportSize({ width: 320, height: 568 });
  for (const route of [
    "/track/bs-s1-01?src=share", "/play/bs-s1-01", "/duo/bs-s1-01",
    "/beatscape/track/bs-s1-01?tier=easy",
    "/beatscape/play/bs-s1-01?tier=standard&mode=arcade&challenge=1",
    "/beatscape/duo/bs-s1-01?tier=hard",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "This song belongs to the previous game." })).toBeVisible();
    await expect(page.getByText("This old song has no direct replacement", { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore the new music library" })).toHaveAttribute("href", "/library");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(catalogs).toBe(0);
});

test("old ScapeMusic hash shares open the legacy transition without loading a new catalog", async ({ page }) => {
  let catalogs = 0;
  await page.route("**/duohertz-v2/catalog.json", (route) => {
    catalogs++;
    return route.abort();
  });
  await page.goto("/#/track/bs-s1-01?src=share");
  await expect(page.getByRole("heading", { name: "This song belongs to the previous game." })).toBeVisible();
  await expect(page.getByText("This old song has no direct replacement", { exact: false })).toBeVisible();
  expect(catalogs).toBe(0);
  await page.getByRole("link", { name: "Back to duohertz home" }).click();
  await expect(page.getByRole("alert")).toContainText("home is not available yet");
  const requestsAfterHome = catalogs;
  await page.evaluate(() => { window.location.hash = "#/track/bs-s1-02?src=share"; });
  await expect(page.getByRole("heading", { name: "This song belongs to the previous game." })).toBeVisible();
  expect(catalogs).toBe(requestsAfterHome);
  await page.getByRole("link", { name: "Explore the new music library" }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.locator(".dh-hub__track")).toHaveCount(0);
});

test("music station keeps mobile copy readable and filters its full catalog without audio prefetch", async ({ page }) => {
  let streamRequests = 0;
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.route(/\/catalog\/dh-\d{3}-[^/]+\/stream\.m4a$/, (route) => {
    streamRequests++;
    return route.abort();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/radio");
  await expect(page.locator(".dh-radio-lab__playlist li")).toHaveCount(105);
  expect(await page.locator(".dh-radio-lab__header p:not(.dh-radio-lab__eyebrow)").evaluate((element) => getComputedStyle(element).color))
    .toBe("rgb(48, 55, 72)");
  const firstStyle = await page.getByRole("button", { name: "All sounds", exact: true }).boundingBox();
  const lastStyle = await page.getByRole("button", { name: "Trance", exact: true }).boundingBox();
  expect(firstStyle?.y).toBe(lastStyle?.y);
  expect((await page.locator(".dh-radio-lab__player").boundingBox())?.y).toBeLessThan(500);

  await page.getByRole("searchbox", { name: "Find a track" }).fill("Fixture 90");
  await expect(page.locator(".dh-radio-lab__playlist li")).toHaveCount(1);
  await expect(page.locator(".dh-radio-lab__player h2")).toHaveText(firstManifest.title);
  await expect(page.getByRole("status").filter({ hasText: "outside these results" }))
    .toContainText(`Now tuned to ${firstManifest.title}`);
  await page.locator(".dh-radio-lab__playlist li button").click();
  await expect(page.locator(".dh-radio-lab__player h2")).toHaveText("Fixture 90");
  await expect(page.getByRole("status").filter({ hasText: "outside these results" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Play Fixture 90 in the rhythm game/ }))
    .toHaveAttribute("href", "/play/dh-090-fixture");
  await page.getByRole("button", { name: "Melodic House", exact: true }).click();
  await expect(page.locator(".dh-radio-lab__empty")).toContainText("No tracks match");
  await page.getByRole("searchbox", { name: "Find a track" }).fill("");
  await expect(page.locator(".dh-radio-lab__playlist li")).toHaveCount(21);
  await expect(page.locator(".dh-radio-lab__player h2")).toHaveText("Fixture 90");
  await expect(page.getByRole("status").filter({ hasText: "outside these results" }))
    .toContainText("Now tuned to Fixture 90");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(streamRequests).toBe(0);
});

test("approved station renders 240px cover art without requesting a full-size cover", async ({ page }) => {
  let fullCoverRequests = 0;
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.route(/\/catalog\/dh-\d{3}-[^/]+\/cover-art\.png$/, (route) => {
    fullCoverRequests++;
    return route.abort();
  });
  await page.goto("/radio");
  const cover = page.locator(".dh-radio-lab__player img");
  await expect(cover).toHaveAttribute("src", `/catalog/${firstId}/cover-thumb.webp`);
  await expect.poll(() => cover.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(240);
  expect(fullCoverRequests).toBe(0);
});

test("music station starts the rhythm game with the selected track", async ({ page }) => {
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.route(/\/catalog\/dh-001-first-frequency\/(easy|standard|hard)\.json$/, (route) => {
    const filename = route.request().url().split("/").at(-1)!;
    return route.fulfill({ path: new URL(filename, candidateRoot).pathname, contentType: "application/json" });
  });
  await page.goto(`/radio?track=${firstId}`);
  await expect(page.locator(".dh-radio-lab__player h2")).toHaveText(firstManifest.title);
  await page.getByRole("link", { name: `Play ${firstManifest.title} in the rhythm game` }).click();
  await expect(page).toHaveURL(new RegExp(`/play/${firstId}$`));
  await expect(page.getByRole("heading", { name: firstManifest.title, exact: true })).toBeVisible();
});

test("a completed beat returns to the same track in the music station", async ({ page }) => {
  const catalog = fixtureCatalog();
  catalog.tracks[0]!.duration_sec = 3;
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: catalog }));
  await page.route(/\/catalog\/dh-001-first-frequency\/(easy|standard|hard)\.json$/, (route) => {
    const tier = route.request().url().split("/").at(-1)!.replace(".json", "");
    const notes = tier === "easy"
      ? [{ id: "tap-1", type: "tap", t: 0.5, key: 0 }]
      : tier === "standard"
        ? [{ id: "left", type: "tap", t: 0.5, key: 0 }, { id: "right", type: "tap", t: 1.5, key: 1 }]
        : [{ id: "both", type: "chord", t: 0.5, keys: [0, 1] }];
    return route.fulfill({ json: {
      format: 2, theme: "duohertz", track_id: firstId, tier,
      input_count: tier === "easy" ? 1 : 2, bpm: firstManifest.bpm,
      audio_offset_ms: 0, total_notes: tier === "easy" ? 1 : 2, notes,
    } });
  });
  await page.route(`/catalog/${firstId}/audio.m4a`, (route) => route.fulfill({
    path: new URL("audio.m4a", candidateRoot).pathname, contentType: "audio/mp4",
  }));
  await page.goto(`/play/${firstId}`);
  await page.getByRole("button", { name: "Start one-key beat" }).click();
  await expect(page.getByRole("heading", { name: "Your frequency" })).toBeVisible({ timeout: 12_000 });
  const station = page.locator(".dh-result").getByRole("link", { name: "Music station" });
  await expect(station).toHaveAttribute("href", `/radio?track=${firstId}`);
  await station.click();
  await expect(page.locator(".dh-radio-lab__player h2")).toHaveText(firstManifest.title);
});

test("approved station opens and shares the exact new track while rejecting old IDs", async ({ page }) => {
  let streamRequests = 0;
  await page.addInitScript(() => {
    const copied = { value: "" };
    Object.defineProperty(window, "__duohertzCopiedLink", { value: copied });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true, value: { writeText: async (value: string) => { copied.value = value; } },
    });
  });
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.route(/\/catalog\/dh-\d{3}-[^/]+\/stream\.m4a$/, (route) => {
    streamRequests++;
    return route.abort();
  });

  await page.goto("/radio?track=dh-090-fixture");
  await expect(page.locator(".dh-radio-lab__player h2")).toHaveText("Fixture 90");
  await page.locator(".dh-radio-lab__playlist li button").filter({ hasText: "Fixture 91" }).click();
  await expect(page).toHaveURL(/\/radio\?track=dh-091-fixture$/);
  await expect(page.locator(".dh-radio-lab__player h2")).toHaveText("Fixture 91");
  await expect(page.getByRole("link", { name: "Play Fixture 91 in the rhythm game" }))
    .toHaveAttribute("href", "/play/dh-091-fixture");
  await page.getByRole("button", { name: "Copy track link" }).click();
  await expect(page.locator(".dh-radio-lab__share [role='status']")).toContainText("Track link copied");
  expect(await page.evaluate(() => (window as typeof window & { __duohertzCopiedLink: { value: string } })
    .__duohertzCopiedLink.value)).toMatch(/\/radio\?track=dh-091-fixture$/);
  expect(streamRequests).toBe(0);

  await page.goto("/radio?track=bs-s1-01");
  await expect(page.getByRole("alert")).toContainText("previous music library");
  await expect(page.locator(".dh-radio-lab__player")).toHaveCount(0);
  await page.getByRole("button", { name: "Browse new music" }).click();
  await expect(page).toHaveURL(/\/radio$/);
  await expect(page.locator(".dh-radio-lab__playlist li")).toHaveCount(105);
  expect(streamRequests).toBe(0);
});
