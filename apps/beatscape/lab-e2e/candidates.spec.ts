import { readFileSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const stagedRoot = new URL("../candidates/duohertz/", import.meta.url);
const directories = readdirSync(stagedRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^dh-\d{3}-/.test(entry.name))
  .map((entry) => entry.name).sort();
const latestDirectory = directories.at(-1);
if (!latestDirectory) throw new Error("No duohertz development candidates");
const latestRoot = new URL(`${latestDirectory}/`, stagedRoot);
const latestManifest = JSON.parse(readFileSync(new URL("manifest.json", latestRoot), "utf8"));
const latest = {
  title: latestManifest.title as string,
  directory: latestDirectory,
  seconds: latestManifest.duration_sec as number,
  counts: (["easy", "standard", "hard"] as const).map((tier) =>
    JSON.parse(readFileSync(new URL(`${tier}.json`, latestRoot), "utf8")).total_notes as number),
};

test("development selector lists every staged candidate manifest", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  const chooser = page.getByRole("group", { name: "Choose development audio" });
  await expect(chooser.getByRole("button")).toHaveCount(directories.length + 1);
  for (const directory of directories) {
    const manifest = JSON.parse(readFileSync(new URL(`${directory}/manifest.json`, stagedRoot), "utf8"));
    await expect(chooser.getByRole("button", { name: `${manifest.title} · ${manifest.duration_sec}s candidate` })).toBeVisible();
  }
});

test("candidate search keeps a long review list usable without a long page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/beatscape/lab/duohertz");
  const chooser = page.getByRole("group", { name: "Choose development audio" });
  const search = chooser.getByRole("searchbox", { name: "Find candidate" });
  expect(await chooser.evaluate((node) => node.clientHeight)).toBeLessThanOrEqual(230);
  expect(await chooser.evaluate((node) => node.scrollHeight)).toBeGreaterThan(230);

  await search.fill("dh-010");
  await expect(chooser.getByRole("button", { name: "Prism Current · 60s candidate" })).toBeVisible();
  await expect(chooser.getByRole("button")).toHaveCount(2); // sketch + matching track
  await expect(chooser.getByRole("status")).toHaveText(`1 of ${directories.length} tracks`);
  await search.fill("no such beat");
  await expect(chooser.getByText("No matching tracks. Try another title or ID.")).toBeVisible();
  await search.fill("");
  await expect(chooser.getByRole("button")).toHaveCount(directories.length + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("replaying one duohertz track reuses its decoded audio instead of downloading it again", async ({ page }) => {
  let audioRequests = 0;
  await page.route(/\/dh-001-first-frequency\/audio\.m4a$/, (route) => {
    audioRequests++;
    return route.continue();
  });
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "First Frequency · 64s candidate" }).click();
  await page.getByRole("button", { name: "Play track with sound" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await page.getByRole("button", { name: "Stop" }).click();
  await page.getByRole("button", { name: "Play track with sound" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  expect(audioRequests).toBe(1);
  await page.getByRole("button", { name: "Stop" }).click();
});

test("a failed duohertz audio load can be retried without keeping a bad cache entry", async ({ page }) => {
  let audioRequests = 0;
  await page.route(/\/dh-001-first-frequency\/audio\.m4a$/, (route) => {
    audioRequests++;
    return audioRequests === 1 ? route.fulfill({ status: 404 }) : route.continue();
  });
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "First Frequency · 64s candidate" }).click();
  await page.getByRole("button", { name: "Play track with sound" }).click();
  await expect(page.getByRole("alert")).toContainText("Audio could not start");
  await page.getByRole("button", { name: "Play track with sound" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  expect(audioRequests).toBe(2);
  await page.getByRole("button", { name: "Stop" }).click();
});

for (const candidate of [
  { title: "Aurora Skipline", directory: "dh-003-aurora-skipline", seconds: 60, counts: [60, 120, 247] },
  { title: "Kitewire Sprint", directory: "dh-004-kitewire-sprint", seconds: 60, counts: [74, 139, 289] },
  { title: "Dawnwave Helix", directory: "dh-005-dawnwave-helix", seconds: 64, counts: [69, 138, 284] },
  { title: "Fractal Footwork", directory: "dh-020-fractal-footwork", seconds: 64, counts: [77, 144, 305] },
  { title: "Confetti Switch", directory: "dh-033-confetti-switch", seconds: 64, counts: [64, 127, 262] },
  latest,
]) {
  test(`${candidate.title} serves real audio and its three new charts`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/beatscape/lab/duohertz");
    await page.getByRole("button", { name: `${candidate.title} · ${candidate.seconds}s candidate` }).click();

    for (const [button, count] of [["1 key · Easy", candidate.counts[0]], ["2 keys · Standard", candidate.counts[1]],
      ["2 keys · Hard", candidate.counts[2]]] as const) {
      await page.getByRole("button", { name: button }).click();
      await expect(page.locator(".dh-lab__readout")).toContainText(`${count} notes`);
    }

    await page.getByRole("button", { name: "1 key · Easy" }).click();
    const audioRequest = page.waitForResponse((response) => response.url().includes(`${candidate.directory}/audio.m4a`));
    await page.getByRole("button", { name: "Play track with sound" }).click();
    expect((await audioRequest).status()).toBe(200);
    await expect.poll(async () => page.locator(".dh-lab__candidate-art img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    await expect.poll(async () => page.locator(".dh-lab__readout span").first().textContent()).toMatch(/^([1-9]|[1-5]\d)\./);
    expect(errors).toEqual([]);
  });
}
