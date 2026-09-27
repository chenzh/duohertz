import { readFileSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const stagedRoot = new URL("../candidates/duohertz/", import.meta.url);
const melodicHouseMasters = readdirSync(stagedRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^dh-\d{3}-/.test(entry.name))
  .sort((left, right) => left.name.localeCompare(right.name))
  .map((entry) => JSON.parse(readFileSync(new URL(`${entry.name}/manifest.json`, stagedRoot), "utf8")) as {
    title: string;
    subgenre: string;
    duration_sec: number;
    stream_duration_sec: number;
    files_sha256: Record<string, string>;
  })
  .filter((candidate) => candidate.subgenre === "Melodic House"
    && candidate.stream_duration_sec >= candidate.duration_sec * 1.8
    && candidate.files_sha256["stream.m4a"] !== candidate.files_sha256["audio.m4a"]);
const micaIndex = melodicHouseMasters.findIndex((candidate) => candidate.title === "Mica Bloomline");
if (micaIndex < 0 || melodicHouseMasters.length < 3) throw new Error("Missing Melodic House stream fixtures");
const nextTitle = melodicHouseMasters[(micaIndex + 1) % melodicHouseMasters.length]!.title;
const followingTitle = melodicHouseMasters[(micaIndex + 2) % melodicHouseMasters.length]!.title;

test("development station plays distinct long masters and follows the selected genre", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/beatscape/lab/duohertz/radio");
  await expect(page.getByRole("heading", { name: "Find your frequency." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" }).first().getByRole("link", { name: "Radio" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".site-nav").getByRole("link", { name: "Library" })).not.toHaveAttribute("aria-current", "page");

  const filters = page.getByRole("group", { name: "Filter candidate subgenre" });
  await filters.getByRole("button", { name: "Melodic House" }).click();
  await expect(page.locator(".dh-radio-lab__playlist li")).toHaveCount(melodicHouseMasters.length);
  await page.getByRole("button", { name: /Mica Bloomline.*Melodic House/ }).click();
  await expect(page.getByRole("heading", { name: "Mica Bloomline" })).toBeVisible();
  const cover = page.locator(".dh-radio-lab__player > img");
  await expect(cover).toHaveAttribute("src", /cover-art\.png/);
  await expect.poll(async () => cover.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThanOrEqual(512);

  const streamRequest = page.waitForResponse((response) => response.url().includes("dh-011-mica-bloomline/stream.m4a"));
  await page.getByRole("button", { name: "Play", exact: true }).click();
  expect([200, 206]).toContain((await streamRequest).status());
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect.poll(async () => page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0);

  const volume = page.getByRole("slider", { name: /Music volume/ });
  await volume.focus();
  await volume.press("Home");
  for (let step = 0; step < 7; step++) await volume.press("ArrowRight");
  await expect.poll(async () => page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.volume)).toBe(0.35);

  const nextStream = page.waitForResponse((response) => response.url().includes("stream.m4a")
    && !response.url().includes("dh-011-mica-bloomline"));
  await page.getByRole("button", { name: "Next candidate" }).click();
  expect([200, 206]).toContain((await nextStream).status());
  await expect(page.getByRole("heading", { name: nextTitle })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await page.locator("audio").evaluate((audio: HTMLAudioElement) => {
    audio.currentTime = audio.duration - 0.2;
  });
  await expect(page.getByRole("heading", { name: followingTitle })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("development station fits a narrow viewport and pauses when hidden", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/beatscape/lab/duohertz/radio");
  await expect(page.getByRole("link", { name: "Station" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".mobile-tabbar").getByRole("link", { name: "Play" })).not.toHaveAttribute("aria-current", "page");
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await page.evaluate(() => Object.defineProperty(document, "hidden", { configurable: true, value: true }));
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await expect.poll(async () => page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
});

test("filtering styles keeps the current track playing until the listener chooses another", async ({ page }) => {
  const streamRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/stream.m4a")) streamRequests.push(request.url());
  });
  await page.goto("/beatscape/lab/duohertz/radio");
  const currentTitle = await page.locator(".dh-radio-lab__player h2").textContent();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect.poll(async () => page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.currentTime))
    .toBeGreaterThan(0);
  const before = await page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.currentTime);
  await page.getByRole("group", { name: "Filter candidate subgenre" })
    .getByRole("button", { name: "Synthwave" }).click();
  await expect(page.locator(".dh-radio-lab__player h2")).toHaveText(currentTitle!);
  await expect(page.getByRole("status").filter({ hasText: "outside these results" }))
    .toContainText(`Now tuned to ${currentTitle}`);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect.poll(async () => page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.currentTime))
    .toBeGreaterThan(before);
  expect(streamRequests.length).toBeGreaterThan(0);
  expect(new Set(streamRequests).size).toBe(1);
});
