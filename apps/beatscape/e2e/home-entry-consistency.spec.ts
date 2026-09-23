import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

type HomeAudioProbe = {
  attempts: number;
  release: null | (() => void);
};

declare global {
  interface Window {
    __homeAudioProbe: HomeAudioProbe;
  }
}

async function installHomeAudioProbe(page: Page) {
  await page.addInitScript(() => {
    const probe: HomeAudioProbe = { attempts: 0, release: null };
    window.__homeAudioProbe = probe;
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = new Proxy(NativeAudioContext, {
      construct(target, args) {
        const context = Reflect.construct(target, args) as AudioContext;
        Object.defineProperty(context, "state", { configurable: true, value: "suspended" });
        return context;
      },
    });
    AudioContext.prototype.resume = function (this: AudioContext) {
      probe.attempts++;
      if (probe.attempts === 1) {
        return Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
      }
      return new Promise<void>((resolve) => {
        probe.release = () => {
          Object.defineProperty(this, "state", { configurable: true, value: "running" });
          resolve();
        };
      });
    };
  });
}

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test("Home names the primary input surface in its capability line", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await expect(page.locator(".hero-copy > .eyebrow").first()).toHaveText(
    info.project.name === "mobile"
      ? "4-lane rhythm game · touch ready"
      : "4-lane rhythm game · keyboard + controller",
  );
  await page.screenshot({
    path: info.outputPath("home-input-capability.png"),
    animations: "disabled",
  });
});

test("Home keeps Explore the city as a usable horizontal track rail", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");

  const rail = page.locator(".trending-scroll");
  await rail.scrollIntoViewIfNeeded();
  const cards = rail.locator(".trend-card");
  expect(await cards.count()).toBeGreaterThanOrEqual(3);

  const geometry = await rail.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
    cardWidths: Array.from(node.querySelectorAll<HTMLElement>(".trend-card"), (card) =>
      card.getBoundingClientRect().width),
    documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  }));
  expect(geometry.cardWidths.every((width) => width >= 180)).toBe(true);
  expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth + 16);
  expect(geometry.documentFits).toBe(true);

  await page.screenshot({
    path: info.outputPath("home-explore-track-rail.png"),
    animations: "disabled",
  });
});

test("Home promotes a connected standard controller", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [{
        id: "BeatScape QA Controller",
        index: 0,
        connected: true,
        mapping: "standard",
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
        timestamp: performance.now(),
      }],
    });
  });
  await page.goto("/");

  await expect(page.locator(".hero-copy > .eyebrow").first()).toHaveText(
    "4-lane rhythm game · controller ready",
  );
  const demo = page.getByRole("region", { name: "Interactive demo. Progress is not saved." });
  const controllerReady = demo.getByRole("note", {
    name: "Controller ready. Use the D-pad or four face buttons.",
  });
  await expect(controllerReady).toBeVisible();
  await expect(demo.locator(".unlock-hint")).toHaveText(
    info.project.name === "mobile"
      ? "Controller connected · touch lanes stay active"
      : "Controller connected · keyboard stays active",
  );
  if (info.project.name === "mobile") {
    await demo.evaluate((node) => {
      window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 8 });
    });
  }
  const maskBox = (await demo.locator(".home-hero-demo-mask").boundingBox())!;
  const controllerBox = (await controllerReady.boundingBox())!;
  expect(controllerBox.y).toBeGreaterThanOrEqual(maskBox.y);
  expect(controllerBox.y + controllerBox.height).toBeLessThanOrEqual(maskBox.y + maskBox.height + 1);
  expect(await demo.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  if (info.project.name === "mobile") {
    const tabBarBox = (await page.locator(".mobile-tabbar").boundingBox())!;
    const actionBox = (await demo.getByRole("button", { name: "Try it here", exact: true }).boundingBox())!;
    const onAirBox = await demo.locator(".home-hero-onair").boundingBox();
    expect(controllerBox.y + controllerBox.height, "controller card clears fixed navigation").toBeLessThanOrEqual(
      tabBarBox.y - 8,
    );
    if (onAirBox) {
      expect(onAirBox.y + onAirBox.height, "ON AIR label clears the demo action").toBeLessThanOrEqual(
        actionBox.y - 4,
      );
    }
  }
  await page.screenshot({
    path: info.outputPath("home-controller-ready.png"),
    animations: "disabled",
  });
  await demo.screenshot({
    path: info.outputPath("home-controller-demo.png"),
    animations: "disabled",
  });
});

async function expectPrimaryEntry(
  page: Page,
  expected: {
    cta: string;
    title: string;
    href: RegExp;
    mobileLabel: string;
    mobileName: string;
  },
) {
  const mainEntry = page.locator(".hero-play");
  const tabEntry = page.locator(".mobile-tabbar .tab-play");
  await expect(mainEntry).toHaveText(expected.cta);
  await expect(mainEntry).toHaveAttribute("href", expected.href);
  await expect(tabEntry).toHaveAttribute("href", expected.href);
  await expect(tabEntry).toHaveText(expected.mobileLabel);
  await expect(tabEntry).toHaveAttribute("aria-label", expected.mobileName);
  expect(await tabEntry.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await expect(page.locator(".home-hero-play-meta strong")).toHaveText(expected.title);
  await expect(page.locator(".home-hero-demo .overlay-kicker")).toHaveText("Try the beat");
  const demo = page.getByRole("region", { name: "Interactive demo. Progress is not saved." });
  await expect(demo.getByRole("button", { name: "Try it here", exact: true })).toBeVisible();
  await expect(demo.locator(".unlock-hint")).toHaveText("Demo · no progress saved");
  await expect(page.getByText("Strike Vector", { exact: true })).toHaveCount(0);
}

test("a new visitor gets one coherent first run across Home entry points", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    localStorage.removeItem("bs_onboarded");
    localStorage.removeItem("bs_first_shift_v1");
  });
  await page.goto("/");

  await expectPrimaryEntry(page, {
    cta: "Start first run",
    title: "Voltage Drop",
    href: /\/play\/bs-s1-05\?tier=easy&mode=casual&shift=studio$/,
    mobileLabel: "Start",
    mobileName: "Start first run · Voltage Drop · Easy Casual",
  });
  const meta = await page.locator(".hero-entry-meta").boundingBox();
  const tabbar = await page.locator(".mobile-tabbar").boundingBox();
  expect(meta).not.toBeNull();
  expect(tabbar).not.toBeNull();
  expect(meta!.y + meta!.height).toBeLessThanOrEqual(tabbar!.y);
  await page.screenshot({ path: info.outputPath("first-run-entry.png"), animations: "disabled" });
});

test("a returning player who skipped the story is invited into First Shift", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("bs_first_shift_v1", JSON.stringify({ v: 1, completed: [] }));
    localStorage.setItem("bs_runs", JSON.stringify([{
      track_id: "bs-s1-01",
      district: "Pulse Core",
      tier: "easy",
      mode: "casual",
      score: 12000,
      accuracy: 82.5,
      maxCombo: 24,
      fc: false,
      ap: false,
      failed: false,
      durationMs: 75000,
      endedAt: "2026-09-14T12:00:00.000Z",
      dateKey: "2026-09-14",
    }]));
  });
  await page.reload();

  await expectPrimaryEntry(page, {
    cta: "Start First Shift",
    title: "Voltage Drop",
    href: /\/play\/bs-s1-05\?tier=easy&mode=casual&shift=studio$/,
    mobileLabel: "Start",
    mobileName: "Start First Shift · Voltage Drop · Easy Casual",
  });
  await expect(page.getByText("Start first run", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("returning-first-shift-entry.png"), animations: "disabled" });
});

test("the mobile demo discloses no-save status before its action and focuses above the tab bar", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "The fixed tab bar and touch lanes are mobile-only");
  for (const viewport of [{ width: 390, height: 664 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const demo = page.getByRole("region", { name: "Interactive demo. Progress is not saved." });
    const action = demo.getByRole("button", { name: "Try it here", exact: true });
    const disclosure = demo.locator(".unlock-hint");
    const lanes = demo.locator(".unlock-touch-lanes");
    const tabBar = page.locator(".mobile-tabbar");
    await action.focus();
    const [actionBox, disclosureBox, lanesBox, tabBarBox] = await Promise.all([
      action.boundingBox(),
      disclosure.boundingBox(),
      lanes.boundingBox(),
      tabBar.boundingBox(),
    ]);

    expect(actionBox).not.toBeNull();
    expect(disclosureBox).not.toBeNull();
    expect(lanesBox).not.toBeNull();
    expect(tabBarBox).not.toBeNull();
    expect(disclosureBox!.y, "no-save status stays inside the visible viewport")
      .toBeGreaterThanOrEqual(0);
    expect(disclosureBox!.y + disclosureBox!.height, "no-save status precedes the demo action")
      .toBeLessThanOrEqual(actionBox!.y);
    expect(actionBox!.y + actionBox!.height, "demo action clears the fixed navigation")
      .toBeLessThanOrEqual(tabBarBox!.y - 8);
    expect(disclosureBox!.y + disclosureBox!.height, "no-save status clears the fixed navigation")
      .toBeLessThanOrEqual(tabBarBox!.y - 8);
    expect(actionBox!.y + actionBox!.height, "demo action precedes the decorative lanes")
      .toBeLessThanOrEqual(lanesBox!.y);
  }
});

test("Home Play and Sound keeps the demo retryable after audio denial", async ({ page }) => {
  await installHomeAudioProbe(page);
  await page.goto("/");

  const play = page.locator(".home-play-sound-btn");
  await expect(play).toBeEnabled();
  await play.click();
  await expect(page.getByRole("alert")).toContainText("Audio could not start");
  await expect(play).toBeEnabled();
  await expect(page.locator(".home-hero-demo")).toBeVisible();
  expect(await page.evaluate(() => window.__homeAudioProbe.attempts)).toBe(1);

  // The state update cannot disable the button between two same-turn DOM
  // clicks, so a synchronous guard must admit only one recovery attempt.
  await play.evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(play).toBeDisabled();
  await expect(play).toContainText("Starting…");
  expect(await page.evaluate(() => window.__homeAudioProbe.attempts)).toBe(2);

  await page.evaluate(() => window.__homeAudioProbe.release?.());
  await expect(page.locator(".home-hero-demo")).toHaveCount(0);
  await expect(page.locator(".play-wrap-hero canvas.play-canvas")).toBeVisible();
  expect(await page.evaluate(() => window.__homeAudioProbe.attempts)).toBe(2);
});

test("Home Play and Sound retries gameplay assets without replacing the demo", async ({ page }) => {
  let allowChart = false;
  await page.route(/\/catalog\/bs-s1-05\/easy\.json(?:\?.*)?$/, async (route) => {
    if (allowChart) await route.continue();
    else await route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
  });
  await page.goto("/");

  const play = page.locator(".home-play-sound-btn");
  await play.click();
  await expect(page.getByRole("alert")).toContainText("Demo could not load");
  await expect(play).toBeEnabled();
  await expect(page.locator(".home-hero-demo")).toBeVisible();
  await expect(page.locator(".home-hero-play-error")).toHaveCount(0);

  allowChart = true;
  await play.click();
  await expect(page.locator(".home-hero-demo")).toHaveCount(0);
  await expect(page.locator(".play-wrap-hero canvas.play-canvas")).toBeVisible();
});

test("Home demo ends with a result and exact full-run handoff instead of silently looping", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
  await page.route(/\/catalog\/bs-s1-05\/easy\.json(?:\?.*)?$/, (route) => route.fulfill({
    json: {
      track_id: "bs-s1-05",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 1,
      sections: [{ id: "demo-result", t0: 0, t1: 1 }],
      notes: [{ id: "demo-result-note", type: "tap", lane: 0, t: 0.2 }],
    },
  }));
  await page.goto("/");

  const demo = page.getByRole("region", { name: "Interactive demo. Progress is not saved." });
  await demo.getByRole("button", { name: "Try it here", exact: true }).click();
  const result = demo.getByRole("region", { name: "Demo result" });
  await expect(result).toBeVisible({ timeout: 15_000 });
  await expect(result).toContainText("Demo complete");
  await expect(result).toContainText("No notes hit");
  await expect(result).toContainText("Progress was not saved");
  await expect(result.getByRole("link", { name: "Start first run", exact: true })).toHaveAttribute(
    "href",
    /\/play\/bs-s1-05\?tier=easy&mode=casual&shift=studio$/,
  );
  await expect(result.getByRole("button", { name: "Try demo again", exact: true })).toBeVisible();
  await expect(demo.locator("canvas.play-canvas")).toHaveCount(0);

  if (info.project.name === "mobile") {
    await demo.evaluate((node) => {
      window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 8 });
    });
    const [resultBox, tabBarBox] = await Promise.all([
      result.boundingBox(),
      page.locator(".mobile-tabbar").boundingBox(),
    ]);
    expect(resultBox).not.toBeNull();
    expect(tabBarBox).not.toBeNull();
    expect(resultBox!.y + resultBox!.height).toBeLessThanOrEqual(tabBarBox!.y - 8);
  }
  await result.screenshot({ path: info.outputPath("home-demo-result.png"), animations: "disabled" });
  await result.getByRole("button", { name: "Try demo again", exact: true }).click();
  await expect(demo.locator("canvas.play-canvas")).toBeVisible();
  await expect(result).toHaveCount(0);
});

test("the fixed Play tab and Home demo follow the next unfinished shift", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_first_shift_v1", JSON.stringify({
      v: 1,
      completed: [{ id: "studio", runId: "seed-studio" }],
    }));
  });
  await page.goto("/");

  await expectPrimaryEntry(page, {
    cta: "Continue First Shift · 2/3",
    title: "Chrome Riff",
    href: /\/play\/bs-s1-06\?tier=easy&mode=casual&shift=yard$/,
    mobileLabel: "Continue",
    mobileName: "Continue First Shift · 2/3 · Chrome Riff · Easy Casual",
  });
  await page.screenshot({ path: info.outputPath("continued-run-entry.png"), animations: "disabled" });

  const chartRequested = page.waitForRequest((request) =>
    new URL(request.url()).pathname.endsWith("/catalog/bs-s1-06/easy.json"),
  );
  await page.locator(".home-play-sound-btn").click();
  await chartRequested;
  await expect(page.locator(".home-hero-demo")).toHaveCount(0);
  await expect(page.locator(".play-wrap-hero canvas.play-canvas")).toBeVisible();
});

test("a completed First Shift falls back to the curated next run without history", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_first_shift_v1", JSON.stringify({
      v: 1,
      completed: [
        { id: "studio", runId: "seed-studio" },
        { id: "yard", runId: "seed-yard" },
        { id: "rooftop", runId: "seed-rooftop" },
      ],
    }));
  });
  await page.goto("/");

  await expectPrimaryEntry(page, {
    cta: "Play Neon Pulse",
    title: "Neon Pulse",
    href: /\/play\/bs-s1-01\?tier=easy&mode=casual$/,
    mobileLabel: "Play",
    mobileName: "Play Neon Pulse · Easy Casual",
  });
});

test("a successful returning player continues the set from every Home entry", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_first_shift_v1", JSON.stringify({
      v: 1,
      completed: [
        { id: "studio", runId: "seed-studio" },
        { id: "yard", runId: "seed-yard" },
        { id: "rooftop", runId: "seed-rooftop" },
      ],
    }));
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
  await page.goto("/");

  const mainEntry = page.locator(".hero-play");
  const tabEntry = page.locator(".mobile-tabbar .tab-play");
  const demoTitle = page.locator(".home-hero-play-meta strong");
  await expect(mainEntry).toHaveText("Continue the set");
  const href = await mainEntry.getAttribute("href");
  expect(href).not.toBeNull();
  const nextRun = new URL(href!, "https://beatscape.test");
  expect(nextRun.pathname).toMatch(/^\/play\/[^/]+$/);
  expect(nextRun.pathname).not.toBe("/play/bs-s1-06");
  expect(nextRun.searchParams.get("tier")).toBe("hard");
  expect(nextRun.searchParams.get("mode")).toBe("arcade");
  const title = await demoTitle.textContent();
  expect(title).toBeTruthy();
  await expect(tabEntry).toHaveAttribute("href", href!);
  await expect(tabEntry).toHaveText("Play");
  await expect(tabEntry).toHaveAttribute("aria-label", `Play ${title} · Hard Arcade`);
  await expect(page.locator(".hero-entry-meta")).toContainText(`${title} ·`);
  await expect(page.locator(".hero-entry-meta")).toContainText("Hard Arcade");
  await expect(page.locator(".home-hero-play-meta span")).toContainText("Hard · Arcade");

  const browse = page.locator(".home-browse-link");
  const duo = page.getByRole("link", { name: "Duo", exact: true });
  const calibrate = page.getByRole("link", { name: "Calibrate", exact: true });
  await expect(browse).toBeHidden();
  await expect(page.locator(".hero-rights")).toBeHidden();
  await expect(page.locator(".hero-copy > .key-chips")).toBeHidden();
  await expect(duo).toBeVisible();
  await expect(calibrate).toBeVisible();
  const [duoBox, calibrateBox, mobileBarBox] = await Promise.all([
    duo.boundingBox(),
    calibrate.boundingBox(),
    page.locator(".mobile-tabbar").boundingBox(),
  ]);
  expect(duoBox).not.toBeNull();
  expect(calibrateBox).not.toBeNull();
  expect(mobileBarBox).not.toBeNull();
  expect(duoBox!.height).toBeGreaterThanOrEqual(44);
  expect(calibrateBox!.height).toBeGreaterThanOrEqual(44);
  expect(Math.max(duoBox!.y + duoBox!.height, calibrateBox!.y + calibrateBox!.height))
    .toBeLessThanOrEqual(mobileBarBox!.y - 8);

  const hero = await page.locator(".hero-entry").boundingBox();
  const tabbar = await page.locator(".mobile-tabbar").boundingBox();
  expect(hero).not.toBeNull();
  expect(tabbar).not.toBeNull();
  expect(hero!.y + hero!.height).toBeLessThanOrEqual(tabbar!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: info.outputPath("returning-next-entry.png"), animations: "disabled" });
});

test("a failed latest run becomes one exact retry", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_first_shift_v1", JSON.stringify({
      v: 1,
      completed: [
        { id: "studio", runId: "seed-studio" },
        { id: "yard", runId: "seed-yard" },
        { id: "rooftop", runId: "seed-rooftop" },
      ],
    }));
    localStorage.setItem("bs_runs", JSON.stringify([{
      track_id: "bs-s1-06",
      district: "Chrome Yard",
      tier: "standard",
      mode: "casual",
      score: 41800,
      accuracy: 41.8,
      maxCombo: 32,
      fc: false,
      ap: false,
      failed: true,
      durationMs: 25000,
      endedAt: "2026-09-13T12:30:00.000Z",
      dateKey: "2026-09-13",
    }]));
  });
  await page.goto("/");

  await expectPrimaryEntry(page, {
    cta: "Retry last run",
    title: "Chrome Riff",
    href: /\/play\/bs-s1-06\?tier=standard&mode=casual$/,
    mobileLabel: "Retry",
    mobileName: "Retry Chrome Riff · Standard Casual",
  });
  await expect(page.locator(".hero-entry-meta")).toContainText("41.8% ACC");
});

test("a zero-hit latest run becomes a supportive retry", async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_first_shift_v1", JSON.stringify({
      v: 1,
      completed: [
        { id: "studio", runId: "seed-studio" },
        { id: "yard", runId: "seed-yard" },
        { id: "rooftop", runId: "seed-rooftop" },
      ],
    }));
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
  await page.goto("/");

  await expectPrimaryEntry(page, {
    cta: "Retry last run",
    title: "Voltage Drop",
    href: /\/play\/bs-s1-05\?tier=easy&mode=casual$/,
    mobileLabel: "Retry",
    mobileName: "Retry Voltage Drop · Easy Casual",
  });
  await expect(page.locator(".hero-entry-meta")).toContainText("0% ACC");
  await page.screenshot({
    path: info.outputPath("home-zero-hit-retry.png"),
    animations: "disabled",
  });
});
