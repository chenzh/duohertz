import { expect, test } from '@playwright/test';

test('a direct track response exposes crawlable metadata without JavaScript', async ({ request }) => {
  const response = await request.get('/track/bs-s1-01/');
  expect(response.status()).toBe(200);
  const html = await response.text();

  expect(html).toContain('<title>Neon Pulse — BeatScape AI Original</title>');
  expect(html).toContain('rel="canonical" href="https://beatscape.pages.dev/track/bs-s1-01"');
  expect(html).toContain('property="og:title" content="Neon Pulse — BeatScape AI Original"');
  expect(html).toContain('property="og:url" content="https://beatscape.pages.dev/track/bs-s1-01"');
  expect(html).toContain('name="twitter:title" content="Neon Pulse — BeatScape AI Original"');
  const image = html.match(/property="og:image" content="(https:\/\/beatscape\.pages\.dev\/catalog\/bs-s1-01\/og\.png\?v=[a-f0-9]{16})"/)?.[1];
  expect(image).toBeTruthy();
  expect(html).toContain(`name="twitter:image" content="${image}"`);
  expect(html).toContain('"@type":"MusicRecording"');
  expect(html).toContain('"name":"Neon Pulse"');
  expect(html).toContain('<script id="beatscape-early-audio"></script>');
  expect(html).not.toContain('__beatscapeEarlyAudio');
  expect(html).toMatch(/<link rel="modulepreload" crossorigin href="\/assets\/Track-[A-Za-z0-9_-]+\.js" data-beatscape-route-preload="track" \/>/);

  const imageUrl = new URL(image!);
  const imageResponse = await request.get(`${imageUrl.pathname}${imageUrl.search}`);
  expect(imageResponse.status()).toBe(200);
  expect(imageResponse.headers()['content-type']).toContain('image/png');
  const png = await imageResponse.body();
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test('a direct track starts its route chunk before the application entry executes', async ({ page }) => {
  let releaseEntry!: () => void;
  const entryGate = new Promise<void>((resolve) => {
    releaseEntry = resolve;
  });
  let markTrackRequested!: () => void;
  const trackRequested = new Promise<void>((resolve) => {
    markTrackRequested = resolve;
  });
  let trackRequests = 0;

  await page.route('**/assets/index-*.js', async (route) => {
    await entryGate;
    await route.continue();
  });
  await page.route('**/assets/Track-*.js', async (route) => {
    trackRequests += 1;
    markTrackRequested();
    await route.continue();
  });

  const navigation = page.goto('/track/bs-s1-01/');
  try {
    // The HTML parser must discover this request while the application entry
    // remains blocked; otherwise the direct route still has a JS waterfall.
    await trackRequested;
  } finally {
    releaseEntry();
  }
  await navigation;
  await expect(page.getByRole('heading', { name: 'Neon Pulse', exact: true })).toBeVisible();
  expect(trackRequests).toBe(1);
  await expect(page.locator('link[data-beatscape-route-preload="track"]')).toHaveCount(1);
});

test('a direct Duo starts its route chunk before the application entry executes', async ({ page }) => {
  let releaseEntry!: () => void;
  const entryGate = new Promise<void>((resolve) => {
    releaseEntry = resolve;
  });
  let markDuoRequested!: () => void;
  const duoRequested = new Promise<void>((resolve) => {
    markDuoRequested = resolve;
  });
  let duoRequests = 0;

  await page.route('**/assets/index-*.js', async (route) => {
    await entryGate;
    await route.continue();
  });
  await page.route('**/assets/Duo-*.js', async (route) => {
    duoRequests += 1;
    markDuoRequested();
    await route.continue();
  });

  const navigation = page.goto('/duo/bs-s1-01?tier=easy&mode=casual');
  try {
    await duoRequested;
  } finally {
    releaseEntry();
  }
  await navigation;
  await expect(page.locator('.duo-page')).toBeVisible();
  expect(duoRequests).toBe(1);
  await expect(page.locator('link[data-beatscape-route-preload="duo"]')).toHaveCount(1);
});

test('the production sitemap exposes every catalog track exactly once', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const sitemap = await response.text();
  const tracks = [...sitemap.matchAll(/<loc>https:\/\/beatscape\.pages\.dev\/track\/([^<]+)<\/loc>/g)]
    .map((match) => match[1]);

  expect(tracks).toHaveLength(105);
  expect(new Set(tracks).size).toBe(105);
  expect(tracks).toContain('bs-s1-01');
  expect(tracks).toContain('bs-p4-10');
});
