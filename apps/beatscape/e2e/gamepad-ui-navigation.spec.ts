import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __siteGamepadButtons?: Set<number>;
    __siteGamepadAxes?: number[];
  }
}

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }, info) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    // A carried navigation press must not move or activate the next screen.
    window.__siteGamepadButtons = new Set([15]);
    window.__siteGamepadAxes = [0.85, 0, 0, 0];
    const gamepad = {
      id: "BeatScape Site Navigation QA Controller",
      index: 0,
      connected: true,
      mapping: "standard",
      get axes() { return window.__siteGamepadAxes!; },
      buttons: Array.from({ length: 17 }, (_, button) => ({
        get pressed() { return window.__siteGamepadButtons!.has(button); },
        get touched() { return window.__siteGamepadButtons!.has(button); },
        get value() { return window.__siteGamepadButtons!.has(button) ? 1 : 0; },
      })),
      get timestamp() { return performance.now(); },
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [gamepad],
    });
  });
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

async function releaseCarriedPress(page: Page) {
  await page.evaluate(() => {
    window.__siteGamepadButtons!.delete(15);
    window.__siteGamepadAxes = [0, 0, 0, 0];
  });
  await page.waitForTimeout(50);
}

async function tapGamepadButton(page: Page, button: number) {
  await page.evaluate((input) => { window.__siteGamepadButtons!.add(input); }, button);
  await page.waitForTimeout(34);
  await page.evaluate((input) => { window.__siteGamepadButtons!.delete(input); }, button);
  await page.waitForTimeout(34);
}

async function flickLeftStick(page: Page, x: number, y: number) {
  await page.evaluate(([nextX, nextY]) => {
    window.__siteGamepadAxes = [nextX, nextY, 0, 0];
  }, [x, y]);
  await page.waitForTimeout(34);
  await page.evaluate(() => { window.__siteGamepadAxes = [0, 0, 0, 0]; });
  await page.waitForTimeout(34);
}

test("Track configuration is operable with left stick, D-pad, and bottom face", async ({ page }, info) => {
  await page.goto("/track/bs-s1-01");
  await expect(page.getByRole("heading", { name: "Neon Pulse", exact: true })).toBeVisible();

  const hint = page.getByRole("note", {
    name: "Controller navigation. Use the D-pad or left stick to move, bottom face to select, and right face to go back or Home.",
  });
  await expect(hint).toBeVisible();
  await expect(hint).toContainText("D-pad / stick · Move");
  await page.waitForTimeout(150);
  await expect(page.locator("body")).not.toHaveClass(/gamepad-ui-active/);

  await releaseCarriedPress(page);
  await flickLeftStick(page, 0.85, 0);
  const easy = page.getByRole("radio", { name: "Easy", exact: true });
  await expect(easy).toBeFocused();
  await tapGamepadButton(page, 15);
  const standard = page.getByRole("radio", { name: "Standard", exact: true });
  await expect(standard).toBeFocused();
  await expect(standard).toHaveAttribute("aria-checked", "false");
  await tapGamepadButton(page, 0);
  await expect(standard).toHaveAttribute("aria-checked", "true");
  await expect(page.locator(".track-play-btn")).toContainText("Play Standard · Casual");

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({
    path: info.outputPath("track-gamepad-navigation.png"),
    animations: "disabled",
  });
});

test("right face returns a Track to its exact Library discovery state", async ({ page }) => {
  await page.goto("/track/bs-s1-01?returnTo=%2Flibrary%3Fq%3Dneon%26sort%3Dbpm-desc");
  await expect(page.getByRole("heading", { name: "Neon Pulse", exact: true })).toBeVisible();
  await releaseCarriedPress(page);
  await tapGamepadButton(page, 1);
  await expect(page).toHaveURL(/\/library\?q=neon&sort=bpm-desc$/);
  await expect(page.getByRole("searchbox", { name: "Search tracks" })).toHaveValue("neon");
});

test("Radio channels remain reachable with a controller after roving Tab is applied", async ({ page }) => {
  await page.goto("/radio");
  const channels = page.getByRole("radiogroup", { name: "Receiver channels", exact: true });
  const channel1 = channels.getByRole("radio", { name: /CH 1.*Call-in/i });
  const channel2 = channels.getByRole("radio", { name: /CH 2.*Cold Blocks/i });
  await expect(channel1).toHaveAttribute("aria-checked", "true");

  await releaseCarriedPress(page);
  await channel1.focus();
  await flickLeftStick(page, 0.85, 0);
  await expect(channel2).toBeFocused();
  await expect(channel2).toHaveAttribute("aria-checked", "false");
  await tapGamepadButton(page, 0);
  await expect(channel2).toHaveAttribute("aria-checked", "true");
  await expect(page.locator(".radio-readout-freq")).toHaveText("90.0");
});

test("Library vibe radios remain reachable with a controller after roving Tab is applied", async ({ page }) => {
  await page.goto("/library");
  const disclosure = page.locator(".library-more-filters > summary");
  if (await disclosure.isVisible()) await disclosure.click();
  const vibes = page.getByRole("radiogroup", { name: "Vibe", exact: true });
  const all = vibes.getByRole("radio", { name: "All", exact: true });
  const nightDrive = vibes.getByRole("radio", { name: "Night Drive", exact: true });
  await expect(all).toHaveAttribute("aria-checked", "true");

  await releaseCarriedPress(page);
  await all.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await all.focus();
  await flickLeftStick(page, 0.85, 0);
  await expect(nightDrive).toBeFocused();
  await expect(nightDrive).toHaveAttribute("aria-checked", "false");
  await tapGamepadButton(page, 0);
  await expect(nightDrive).toHaveAttribute("aria-checked", "true");
  await expect(page).toHaveURL(/\/library\?vibe=night-drive$/);
});

test("left stick adjusts a focused Settings range without pointer input", async ({ page }) => {
  await page.goto("/settings");
  const speed = page.getByRole("slider", { name: "Note speed", exact: true });
  await expect(speed).toBeVisible();
  await releaseCarriedPress(page);
  await speed.focus();
  const before = Number(await speed.inputValue());
  await flickLeftStick(page, 0.85, 0);
  await expect.poll(async () => Number(await speed.inputValue())).toBeGreaterThan(before);
  await expect(page.getByRole("status")).toContainText(/Saved|save automatically/);
});
