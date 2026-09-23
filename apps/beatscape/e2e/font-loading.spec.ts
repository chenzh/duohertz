import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const fontSamples = [
  { font: "400 32px Anton", text: "BEATSCAPE Žółć" },
  { font: "800 32px Sora", text: "RESONANCE Žółć" },
  { font: "400 18px 'IBM Plex Sans'", text: "First shift Žółć" },
  { font: "italic 400 18px 'IBM Plex Sans'", text: "On air Žółć" },
  { font: "600 16px 'IBM Plex Mono'", text: "PERFECT Žółć" },
  { font: "700 16px 'IBM Plex Mono'", text: "COMBO Žółć" },
];

test("production fonts load from the app with no external font dependency", async ({ page }) => {
  const externalFontRequests: string[] = [];
  page.on("request", (request) => {
    if (/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//.test(request.url())) {
      externalFontRequests.push(request.url());
    }
  });
  await page.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, (route) => route.abort());

  await page.goto("/shift");
  const result = await page.evaluate(async (samples) => {
    const loaded = await Promise.all(samples.map(async ({ font, text }) => ({
      font,
      count: (await document.fonts.load(font, text)).length,
      ready: document.fonts.check(font, text),
    })));
    const fontResources = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((url) => url.endsWith(".woff2"));
    return { loaded, fontResources, origin: location.origin };
  }, fontSamples);

  expect(externalFontRequests).toEqual([]);
  expect(result.loaded.every(({ count, ready }) => count > 0 && ready)).toBe(true);
  expect(new Set(result.fontResources).size).toBe(12);
  expect(result.fontResources.every((url) => (
    new URL(url).origin === result.origin && new URL(url).pathname.startsWith("/assets/")
  ))).toBe(true);
});
