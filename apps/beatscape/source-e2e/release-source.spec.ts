import { existsSync, readFileSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const root = new URL("../dist-duohertz-source/", import.meta.url);
const genres = ["Melodic House", "Synthwave", "Future Bass", "Drum & Bass", "Trance"] as const;
const hash = "a".repeat(64);

function fixtureCatalog() {
  return {
    version: 2, brand: "duohertz", source_observations_sha256: hash,
    source_catalog_signoff_sha256: hash, site_and_deployment_approval: true,
    tracks: Array.from({ length: 105 }, (_, index) => {
      const id = `dh-${String(index + 1).padStart(3, "0")}-fixture`;
      const base = `/catalog/${id}`;
      return {
        track_id: id, title: `Fixture ${index + 1}`, artist: "Fixture Artist",
        genre: genres[Math.floor(index / 21)], bpm: 120,
        duration_sec: 60, stream_duration_sec: 120, theme: "duohertz",
        chart_format: 2, rights: "signed_catalog_candidate",
        audio: `${base}/audio.m4a`, stream_audio: `${base}/stream.m4a`,
        preview: `${base}/preview_48s.m4a`, cover: `${base}/cover-art.png`,
        cover_thumb: `${base}/cover-thumb.webp`, cover_thumb_sha256: hash,
        og: `${base}/og.png`, manifest_sha256: hash,
        charts: { easy: `${base}/easy.json`, standard: `${base}/standard.json`, hard: `${base}/hard.json` },
      };
    }),
  };
}

test("release source remains noindex and excludes legacy and unsigned content", () => {
  const html = readFileSync(new URL("index.html", root), "utf8");
  const js = readdirSync(new URL("assets/", root)).filter((name) => name.endsWith(".js"))
    .map((name) => readFileSync(new URL(`assets/${name}`, root), "utf8")).join("\n");
  expect(html).toContain("noindex, nofollow");
  expect(html).toContain("duohertz");
  expect(html).not.toContain("BeatScape");
  expect(js).not.toContain("BeatScape");
  expect(js).not.toContain("NIGHTSHIFT");
  expect(existsSync(new URL("catalog.json", root))).toBe(false);
  expect(existsSync(new URL("duohertz-v2/catalog.json", root))).toBe(false);
  expect(existsSync(new URL("manifest.webmanifest", root))).toBe(false);
});

test("release source uses the new-brand player path but refuses real unsigned content", async ({ page }) => {
  let oldCatalogRequests = 0;
  await page.route("**/beatscape/catalog.json", (route) => { oldCatalogRequests++; return route.abort(); });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("home is not available yet");
  await expect(page.getByRole("note", { name: "Preview status" })).toHaveCount(0);
  expect(oldCatalogRequests).toBe(0);

  await page.route("**/duohertz-v2/catalog.json", (route) => route.fulfill({ json: fixtureCatalog() }));
  await page.reload();
  await expect(page.getByRole("heading", { name: /Feel the beat/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start with one key/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(oldCatalogRequests).toBe(0);
});
