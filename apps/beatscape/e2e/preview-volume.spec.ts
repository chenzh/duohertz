import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_settings", JSON.stringify({ musicVolume: 0.25 }));
    const gains: GainNode[] = [];
    (window as typeof window & { __previewGains: GainNode[] }).__previewGains = gains;
    const createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      const node = createGain.call(this);
      gains.push(node);
      return node;
    };
  });
});

test("Track and discovery previews respect device music volume, including live mute", async ({ page }) => {
  await page.goto("/track/bs-s1-05");
  const trackPreview = page.locator(".track-preview .audiobar");
  await expect(trackPreview.locator("audio")).toHaveAttribute("src", /preview_48s\.m4a/);
  await expect.poll(() => trackPreview.locator("audio").evaluate((audio: HTMLAudioElement) => audio.volume)).toBe(0.25);

  await page.goto("/");
  const homePreview = page.locator(".curated-preview").first();
  await expect(homePreview).toBeVisible();
  await expect.poll(() => homePreview.locator("audio").evaluate((audio: HTMLAudioElement) => audio.volume)).toBe(0.25);

  await page.goto("/library");
  const libraryPreview = page.locator(".track-card-preview").first();
  await expect(libraryPreview).toBeVisible();
  await expect.poll(() => libraryPreview.locator("audio").evaluate((audio: HTMLAudioElement) => audio.volume)).toBe(0.25);
  const toggle = libraryPreview.locator(".audiobar-toggle");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-label", /^Pause preview/);
  await expect.poll(() => libraryPreview.locator("audio").evaluate((audio: HTMLAudioElement) => audio.volume)).toBe(1);
  await expect.poll(() => page.evaluate(() =>
    (window as typeof window & { __previewGains: GainNode[] }).__previewGains.at(-1)?.gain.value,
  )).toBe(0.25);

  await page.evaluate(() => {
    localStorage.setItem("bs_settings", JSON.stringify({ musicVolume: 0 }));
    window.dispatchEvent(new Event("beatscape:settings-change"));
  });
  await expect.poll(() => page.evaluate(() =>
    (window as typeof window & { __previewGains: GainNode[] }).__previewGains.at(-1)?.gain.value,
  )).toBe(0);
  await expect.poll(() => libraryPreview.locator("audio").evaluate((audio: HTMLAudioElement) => audio.muted)).toBe(true);
  await expect.poll(() => libraryPreview.locator("audio").evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
  await expect(toggle).toBeDisabled();
  await expect(toggle).toContainText("Muted");
  await expect(toggle).toHaveAttribute("aria-label", /Music muted in Settings/);

  await page.evaluate(() => {
    localStorage.setItem("bs_settings", JSON.stringify({ musicVolume: 0.65 }));
    window.dispatchEvent(new Event("beatscape:settings-change"));
  });
  await expect.poll(() => page.evaluate(() =>
    (window as typeof window & { __previewGains: GainNode[] }).__previewGains.at(-1)?.gain.value,
  )).toBeCloseTo(0.65, 5);
  await expect.poll(() => libraryPreview.locator("audio").evaluate((audio: HTMLAudioElement) => audio.muted)).toBe(false);
  await expect(toggle).toBeEnabled();
  await expect(toggle).toContainText("Preview");
});

test("muted previews do not start a speculative media download", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_settings", JSON.stringify({ musicVolume: 0 })));
  const previewRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/preview_48s.m4a")) previewRequests.push(request.url());
  });
  await page.goto("/library");
  const toggle = page.locator(".track-card-preview .audiobar-toggle").first();
  await expect(toggle).toBeDisabled();
  await expect(toggle).toContainText("Muted");
  expect(previewRequests).toEqual([]);
  expect(await page.evaluate(() =>
    (window as typeof window & { __previewGains: GainNode[] }).__previewGains.length,
  )).toBe(0);
});

test("unsupported Web Audio fails closed instead of playing an unexpectedly loud preview", async ({ page }) => {
  await page.addInitScript(() => {
    AudioContext.prototype.createMediaElementSource = () => { throw new Error("unsupported"); };
  });
  await page.goto("/library");
  const preview = page.locator(".track-card-preview").first();
  const toggle = preview.locator(".audiobar-toggle");
  await toggle.click();
  await expect(toggle).toBeDisabled();
  await expect(toggle).toContainText("Unavailable");
  await expect.poll(() => preview.locator("audio").evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
});

test("an interrupted audio context leaves the preview retryable", async ({ page }) => {
  await page.addInitScript(() => {
    const createSource = AudioContext.prototype.createMediaElementSource;
    AudioContext.prototype.createMediaElementSource = function (element) {
      (window as typeof window & { __previewContext: AudioContext }).__previewContext = this;
      return createSource.call(this, element);
    };
  });
  await page.goto("/library");
  const toggle = page.locator(".track-card-preview .audiobar-toggle").first();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-label", /^Pause preview/);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-label", /^Play preview/);

  await page.evaluate(async () => {
    const context = (window as typeof window & { __previewContext: AudioContext }).__previewContext;
    await context.suspend();
    const resume = context.resume.bind(context);
    let failOnce = true;
    context.resume = () => {
      if (failOnce) {
        failOnce = false;
        return Promise.reject(new Error("audio interrupted"));
      }
      return resume();
    };
  });
  await toggle.click();
  await expect(toggle).toContainText("Retry");
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-label", /^Pause preview/);
});
