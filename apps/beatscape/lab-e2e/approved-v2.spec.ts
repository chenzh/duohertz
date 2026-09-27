import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const candidateRoot = new URL("../candidates/duohertz/dh-001-first-frequency/", import.meta.url);
const firstManifest = JSON.parse(readFileSync(new URL("manifest.json", candidateRoot), "utf8"));
const firstId = firstManifest.track_id as string;
const genres = ["Melodic House", "Synthwave", "Future Bass", "Drum & Bass", "Trance"] as const;
const hash = "a".repeat(64);

test.beforeEach(async ({ page }) => {
  await page.route(/\/catalog\/dh-\d{3}-[^/]+\/cover-thumb\.webp$/, (route) => route.fulfill({
    path: new URL("../thumbnails/dh-001-first-frequency.webp", candidateRoot).pathname,
    contentType: "image/webp",
  }));
});

function catalog(approved: boolean) {
  return {
    version: 2, brand: "duohertz",
    source_observations_sha256: hash,
    source_catalog_signoff_sha256: hash,
    site_and_deployment_approval: approved,
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

test("v2 home uses its own brand shell and never requests the BeatScape catalog", async ({ page }) => {
  let legacyCatalogRequests = 0;
  await page.route(/\/beatscape\/catalog\.json(?:\?|$)/, (route) => {
    legacyCatalogRequests++;
    return route.abort();
  });
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: catalog(true) }));
  await page.route(/\/catalog\/dh-\d{3}-[^/]+\/cover-art\.png$/, (route) => route.fulfill({
    path: new URL("cover-art.png", candidateRoot).pathname, contentType: "image/png",
  }));

  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/beatscape/lab/duohertz/v2/home");
  await expect(page.getByRole("heading", { name: /Feel the beat/ })).toBeVisible();
  await expect(page.locator(".dh-hub__catalog--featured .dh-hub__track")).toHaveCount(3);
  await expect(page.locator(".dh-hub__track")).toHaveCount(9);
  const firstCardCover = page.locator(".dh-hub__track img").first();
  await expect(firstCardCover).toHaveAttribute("src", `/beatscape/catalog/${firstId}/cover-thumb.webp`);
  await expect.poll(() => firstCardCover.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(240);
  await expect(page.getByRole("link", { name: "Start with one key" })).toHaveAttribute("href", new RegExp(`/v2/play/${firstId}$`));
  await expect(page.getByRole("navigation", { name: "duohertz mobile navigation" }).getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  const stationLink = page.getByRole("navigation", { name: "duohertz mobile navigation" }).getByRole("link", { name: "Station" });
  expect((await stationLink.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await stationLink.click();
  await expect(page.getByRole("heading", { name: "Find your frequency." })).toBeVisible();
  await expect(stationLink).toHaveAttribute("aria-current", "page");
  await page.getByRole("navigation", { name: "duohertz mobile navigation" }).getByRole("link", { name: "Library" }).click();
  await expect(page.locator(".dh-hub__track")).toHaveCount(15);
  expect(legacyCatalogRequests).toBe(0);
});

test("staged v2 catalog cannot open the future-brand home", async ({ page }) => {
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: catalog(false) }));
  await page.goto("/beatscape/lab/duohertz/v2/home");
  await expect(page.getByRole("alert")).toContainText("home is not available yet");
  await expect(page.locator(".dh-hub__hero")).toHaveCount(0);
});

test("staged v2 catalog cannot open the approved library or game", async ({ page }) => {
  let chartRequests = 0;
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: catalog(false) }));
  await page.route(/\/catalog\/dh-001-first-frequency\/(easy|standard|hard)\.json$/, (route) => {
    chartRequests++;
    return route.abort();
  });
  await page.goto("/beatscape/lab/duohertz/v2/library");
  await expect(page.getByRole("alert")).toContainText("not available yet");
  await expect(page.locator(".dh-hub__track")).toHaveCount(0);
  await page.goto(`/beatscape/lab/duohertz/v2/play/${firstId}`);
  await expect(page.getByRole("alert")).toContainText("This track is not available");
  expect(chartRequests).toBe(0);
});

test("v2 character route uses its own catalog and rejects unsigned character copy", async ({ page }) => {
  const characters = {
    version: 1, brand: "duohertz", source_character_signoff_sha256: hash,
    site_and_deployment_approval: true,
    characters: (["Attacker", "Support", "Buffer"] as const).map((role, index) => {
      const id = `dh-char-${index + 1}`;
      return {
        id, name: `Fixture ${index + 1}`, title: "A new frequency", role,
        region: "The Soundfield", height: "165 cm", identity: "Shares a beat.",
        traits: "Kind · curious", quote: "Find your own rhythm.", story: "A new friend joins the music.",
        art: `/characters/${id}/front.png`, side_art: `/characters/${id}/side.png`,
        art_sha256: hash, side_art_sha256: hash,
        alt: `Front of Fixture ${index + 1}`, side_alt: `Side of Fixture ${index + 1}`,
      };
    }),
  };
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: catalog(true) }));
  await page.route("**/duohertz-v2/characters.json", (route) => route.fulfill({
    json: { ...characters, site_and_deployment_approval: false },
  }));
  await page.route(/\/characters\/dh-char-\d+\/(front|side)\.png$/, (route) => route.fulfill({
    path: new URL("cover-art.png", candidateRoot).pathname, contentType: "image/png",
  }));
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/beatscape/lab/duohertz/v2/characters");
  await expect(page.getByRole("alert")).toContainText("characters are not available yet");
  await page.unroute("**/duohertz-v2/characters.json");
  await page.route("**/duohertz-v2/characters.json", (route) => route.fulfill({ json: characters }));
  await page.reload();
  await expect(page.locator(".dh-characters__card")).toHaveCount(3);
  await expect(page.getByRole("navigation", { name: "duohertz mobile navigation" })
    .getByRole("link", { name: "People" })).toHaveAttribute("aria-current", "page");
});

test("an approved v2 fixture opens one real-format track without candidate imports", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: catalog(true) }));
  await page.route(/\/catalog\/dh-001-first-frequency\/(easy|standard|hard)\.json$/, (route) => {
    const filename = route.request().url().split("/").at(-1)!;
    return route.fulfill({ path: new URL(filename, candidateRoot).pathname, contentType: "application/json" });
  });
  await page.route(`**/catalog/${firstId}/audio.m4a`, (route) => route.fulfill({
    path: new URL("audio.m4a", candidateRoot).pathname, contentType: "audio/mp4",
  }));
  await page.route(`**/catalog/${firstId}/cover-art.png`, (route) => route.fulfill({
    path: new URL("cover-art.png", candidateRoot).pathname, contentType: "image/png",
  }));

  await page.goto("/beatscape/lab/duohertz/v2/library");
  await expect(page.locator(".dh-hub__track")).toHaveCount(15);
  await page.getByRole("button", { name: "Future Bass" }).click();
  await expect(page.locator(".dh-hub__track")).toHaveCount(15);
  await page.getByRole("button", { name: "All sounds" }).click();
  await page.setViewportSize({ width: 320, height: 568 });
  const firstAction = page.getByRole("link", { name: `Try ${firstManifest.title} in the rhythm game` });
  await firstAction.scrollIntoViewIfNeeded();
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewport);
  expect((await firstAction.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await firstAction.click();
  await expect(page).toHaveURL(new RegExp(`/v2/play/${firstId}$`));
  await expect(page.getByRole("button", { name: "Start one-key beat" })).toBeVisible();
  await expect(page.getByText("Internal audio and chart candidates.")).toHaveCount(0);
  await page.getByRole("button", { name: "2 keys · Standard" }).click();
  await expect(page.getByRole("button", { name: "Start two-key beat" })).toBeVisible();
  await page.getByRole("button", { name: "Duo · two players" }).click();
  await expect(page.getByRole("button", { name: "Start Duo beat" })).toBeVisible();
  await page.getByRole("button", { name: "Solo · one player" }).click();
  await page.getByRole("button", { name: "1 key · Easy" }).click();
  await page.getByRole("button", { name: "Start one-key beat" }).click();
  await expect.poll(async () => page.locator(".dh-lab__readout span").first().textContent()).toMatch(/^([1-9]|[1-5]\d)\./);
  expect(errors).toEqual([]);
});

test("staged v2 catalog cannot open the music station or request a stream", async ({ page }) => {
  let streamRequests = 0;
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: catalog(false) }));
  await page.route(/\/catalog\/dh-\d{3}-[^/]+\/stream\.m4a$/, (route) => {
    streamRequests++;
    return route.abort();
  });
  await page.goto("/beatscape/lab/duohertz/v2/radio");
  await expect(page.getByRole("alert")).toContainText("music station is not available yet");
  await expect(page.locator(".dh-radio-lab__playlist li")).toHaveCount(0);
  expect(streamRequests).toBe(0);
});

test("approved v2 fixture plays its own long stream and queues the next track", async ({ page }) => {
  const errors: string[] = [];
  let streamRequests = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: catalog(true) }));
  for (const id of [firstId, "dh-002-fixture"]) {
    await page.route(`**/catalog/${id}/stream.m4a`, (route) => {
      streamRequests++;
      return route.fulfill({ path: new URL("stream.m4a", candidateRoot).pathname, contentType: "audio/mp4" });
    });
    await page.route(`**/catalog/${id}/cover-art.png`, (route) => route.fulfill({
      path: new URL("cover-art.png", candidateRoot).pathname, contentType: "image/png",
    }));
  }

  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/beatscape/lab/duohertz/v2/radio");
  await expect(page.locator(".dh-radio-lab__playlist li")).toHaveCount(105);
  await expect(page.getByText("Internal stream-master candidates only.", { exact: false })).toHaveCount(0);
  const styles = page.getByRole("group", { name: "Filter music style" });
  await styles.getByRole("button", { name: "Drum & Bass" }).click();
  await expect(page.locator(".dh-radio-lab__playlist li")).toHaveCount(21);
  await styles.getByRole("button", { name: "All sounds" }).click();
  await page.locator(".dh-radio-lab__playlist li").first().getByRole("button").click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(streamRequests).toBe(0);

  const firstStream = page.waitForResponse((response) => response.url().includes(`${firstId}/stream.m4a`));
  await page.getByRole("button", { name: "Play", exact: true }).click();
  expect([200, 206]).toContain((await firstStream).status());
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect.poll(async () => page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0);
  const secondStream = page.waitForResponse((response) => response.url().includes("dh-002-fixture/stream.m4a"));
  await page.getByRole("button", { name: "Next track" }).click();
  expect([200, 206]).toContain((await secondStream).status());
  await expect(page.getByRole("heading", { name: "Fixture 2" })).toBeVisible();
  expect(errors).toEqual([]);
});
