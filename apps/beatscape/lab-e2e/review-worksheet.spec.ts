import { readFileSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const stagedRoot = new URL("../candidates/duohertz/", import.meta.url);
const worksheet = new URL("review-worksheet.html", stagedRoot).href;
const contactSheet = new URL("cover-contact-sheet.html", stagedRoot).href;
const similarityQueue = new URL("similarity-listening.html", stagedRoot).href;
const similarity = JSON.parse(readFileSync(new URL("similarity-prescreen.json", stagedRoot), "utf8"));
const loudnessPage = new URL("loudness-review.html", stagedRoot).href;
const loudness = JSON.parse(readFileSync(new URL("loudness-review.json", stagedRoot), "utf8"));
const braidedStudy = new URL("style-studies/dh-081-braided-pulse-motion-study.html", stagedRoot).href;
const manifests = readdirSync(stagedRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^dh-\d{3}-/.test(entry.name))
  .map((entry) => JSON.parse(readFileSync(new URL(`${entry.name}/manifest.json`, stagedRoot), "utf8")))
  .sort((first, second) => first.track_id.localeCompare(second.track_id));

test("offline cover board shows every current candidate at card size and opens its exact review row", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(contactSheet);
  await expect(page.locator(".card")).toHaveCount(manifests.length);
  await expect(page.locator("section")).toHaveCount(5);
  for (const group of await page.locator("section").all()) await expect(group.locator(".card")).toHaveCount(21);
  const first = page.locator(".card").first();
  await expect(first.locator("img")).toHaveCount(2);
  await expect.poll(async () => first.locator("img").first()
    .evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await first.click();
  await expect(page).toHaveURL(new RegExp(`review-worksheet\\.html#${manifests[0].track_id}$`));
  await expect(page.locator(`#${manifests[0].track_id}`)).toBeVisible();
});

test("offline similarity queue masks identities until reveal and links exact hash-bound rows", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(similarityQueue);
  expect(similarity.releaseApproval).toBe(false);
  expect(similarity.distinctnessApproved).toBe(false);
  expect(similarity.tracks).toHaveLength(manifests.length);
  expect(similarity.pairs_considered).toBe(manifests.length * (manifests.length - 1) / 2);
  await expect(page.locator("article")).toHaveCount(similarity.pairs.length);
  const first = page.locator("article").first();
  await expect(first.locator("audio")).toHaveCount(2);
  await expect(first.locator("audio").first()).toHaveAttribute("src", `${similarity.pairs[0].a}/preview_48s.m4a`);
  await expect(first.locator("details a").first()).not.toBeVisible();
  await first.getByText("Reveal identities and technical rank").click();
  await expect(first.locator("details a").first()).toBeVisible();
  await expect(first.locator("details code").first()).toContainText(
    similarity.tracks.find((track: { track_id: string }) => track.track_id === similarity.pairs[0].a).preview_sha256,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await first.locator("details a").first().click();
  await expect(page).toHaveURL(new RegExp(`review-worksheet\\.html#${similarity.pairs[0].a}$`));
});

test("offline loudness queue ranks all current assets and links to the matching listening row", async ({ page }) => {
  expect(loudness.releaseApproval).toBe(false);
  expect(loudness.tracks).toHaveLength(manifests.length);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(loudnessPage);
  await expect(page.locator("tbody tr")).toHaveCount(manifests.length);
  const first = page.locator("tbody tr").first();
  await expect(first).toContainText(loudness.tracks[0].title);
  await first.getByText("Hashes").click();
  await expect(first.locator("code")).toContainText(loudness.tracks[0].manifest_sha256);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await first.locator("a").click();
  await expect(page).toHaveURL(new RegExp(`review-worksheet\\.html#${loudness.tracks[0].track_id}$`));
  await expect(page.locator(`#${loudness.tracks[0].track_id}`)).toBeVisible();
});

test("Braided Pulse motion study stays separate from the current signed-asset path", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(braidedStudy);
  await expect(page.getByRole("heading", { name: "Braided Pulse · cover motion study" })).toBeVisible();
  await expect(page.locator(".options article")).toHaveCount(2);
  await expect.poll(async () => page.locator(".options img").evaluateAll((images) =>
    images.filter((image) => (image as HTMLImageElement).naturalWidth > 0).length)).toBe(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("local review worksheet keeps observations hash-bound and never grants release approval", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(worksheet);
  await expect(page.locator(".candidate")).toHaveCount(manifests.length);
  await expect(page.locator("#progress")).toContainText(`Reviewed: 0 / ${manifests.length}`);

  const first = page.locator(".candidate").first();
  await expect(first.getByRole("img")).toHaveAttribute("src", `${manifests[0].track_id}/cover-art.png`);
  await expect.poll(async () => first.getByRole("img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(first.locator("audio")).toHaveCount(3);
  await first.locator("audio").first().evaluate((audio: HTMLAudioElement) => audio.load());
  await expect.poll(async () => first.locator("audio").first().evaluate((audio: HTMLAudioElement) => Math.round(audio.duration)))
    .toBe(manifests[0].stream_duration_sec);
  await first.locator("audio").nth(1).evaluate((audio: HTMLAudioElement) => audio.load());
  await expect.poll(async () => first.locator("audio").nth(1).evaluate((audio: HTMLAudioElement) => Math.round(audio.duration)))
    .toBe(manifests[0].duration_sec);
  await first.getByRole("radio", { name: "Revise" }).first().check();
  await first.getByRole("textbox", { name: "Reviewer notes" }).fill("Fixture only: verify export behavior.");
  await page.getByRole("textbox", { name: "Reviewer", exact: true }).fill("Automated fixture");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export hash-bound JSON" }).click();
  const download = await downloadPromise;
  const report = JSON.parse(readFileSync(await download.path(), "utf8"));

  expect(report.releaseApproval).toBe(false);
  expect(report.tracks).toHaveLength(manifests.length);
  expect(report.tracks.map((track: { track_id: string }) => track.track_id)).toEqual(manifests.map((item) => item.track_id));
  expect(report.tracks[0].assets_sha256["stream.m4a"]).toBe(manifests[0].files_sha256["stream.m4a"]);
  expect(report.tracks[0].verdicts.audioQuality).toBe("revise");
  expect(report.tracks[1].verdicts).toEqual({});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("review progress matches audit rules and imports only the current asset set", async ({ page }) => {
  await page.goto(worksheet);
  const first = page.locator(".candidate").first();
  await page.getByRole("searchbox", { name: "Find track" }).fill(manifests[0].title);
  await expect(page.locator(".candidate:visible")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "Find track" }).fill("");

  await first.locator(".question").first().getByRole("radio", { name: "Revise" }).check();
  for (const question of await first.locator(".question").all()) {
    if (question === undefined) continue;
    if (await question.getByRole("radio", { name: "Revise" }).isChecked()) continue;
    await question.getByRole("radio", { name: "Pass" }).check();
  }
  await expect(page.locator("#progress")).toContainText(`Reviewed: 0 / ${manifests.length}`);
  await first.getByRole("textbox", { name: "Reviewer notes" }).fill("Ending needs another listen at 01:20.");
  await expect(page.locator("#progress")).toContainText(`Reviewed: 1 / ${manifests.length}`);

  await page.getByLabel("Show").selectOption("revise");
  await expect(page.locator(".candidate:visible")).toHaveCount(1);
  await page.getByLabel("Show").selectOption("complete");
  await expect(page.locator(".candidate:visible")).toHaveCount(0);
  await page.getByLabel("Show").selectOption("all");

  await page.getByRole("textbox", { name: "Reviewer", exact: true }).fill("Local reviewer");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export hash-bound JSON" }).click();
  const report = JSON.parse(readFileSync(await (await downloadPromise).path(), "utf8"));
  expect(report.releaseApproval).toBe(false);

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("#progress")).toContainText(`Reviewed: 0 / ${manifests.length}`);
  await page.getByLabel("Import saved observations").setInputFiles({
    name: "local-observations.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(report)),
  });
  await expect(page.locator("#progress")).toContainText(`Reviewed: 1 / ${manifests.length}`);
  await expect(first.getByRole("textbox", { name: "Reviewer notes" })).toHaveValue("Ending needs another listen at 01:20.");

  const stale = structuredClone(report);
  stale.tracks[0].assets_sha256["audio.m4a"] = "0".repeat(64);
  await page.getByLabel("Import saved observations").setInputFiles({
    name: "stale-observations.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(stale)),
  });
  await expect(page.locator("#message")).toContainText("Import rejected");
  await expect(page.locator("#progress")).toContainText(`Reviewed: 1 / ${manifests.length}`);
});
