import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test("ordinary Casual switches from preparing to ready only after audio is decoded", async ({ page }, info) => {
  let releaseAudio!: () => void;
  const heldAudio = new Promise<void>((resolve) => { releaseAudio = resolve; });
  await page.route("**/audio.m4a*", async (route) => {
    await heldAudio;
    await route.continue();
  });

  try {
    if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/play/bs-s1-05?tier=easy&mode=casual");
    const card = page.locator(".overlay-tap");
    await expect(card.locator(".overlay-kicker")).toHaveText("Preparing your run");
    await expect(card.locator(".overlay-kicker")).toHaveAttribute("aria-live", "polite");
    await expect(card.getByRole("button", { name: "Loading song…", exact: true })).toBeDisabled();
    if (info.project.name === "mobile") {
      await page.screenshot({ path: info.outputPath("casual-preparing-320.png"), animations: "disabled" });
    }
    releaseAudio();
    await expect(card.getByRole("button", { name: "Start playing", exact: true })).toBeEnabled();
    await expect(card.locator(".overlay-kicker")).toHaveText("Ready to play");
    if (info.project.name === "mobile") {
      await page.screenshot({ path: info.outputPath("casual-ready-320.png"), animations: "disabled" });
    }
  } finally {
    releaseAudio();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("a cold formal run teaches its controls while audio loads, then enables Start", async ({ page }, info) => {
  let releaseAudio!: () => void;
  const heldAudio = new Promise<void>((resolve) => { releaseAudio = resolve; });
  await page.route("**/audio.m4a*", async (route) => {
    await heldAudio;
    await route.continue();
  });

  try {
    await page.goto("/play/bs-s1-05?tier=easy&mode=casual&shift=studio");

    const ready = page.locator(".overlay-tap");
    await expect(ready).toBeVisible();
    await expect(ready.getByRole("button", { name: "Loading song…", exact: true })).toBeDisabled();
    await expect(ready.locator(".unlock-mechanics")).toContainText("Hold");
    await expect(ready.locator(".unlock-hint")).toHaveText(
      info.project.name === "mobile" ? "Tap notes on the line" : "Hit the line",
    );
    expect(await page.evaluate(() => sessionStorage.getItem("bs_last_run"))).toBeNull();
    if (info.project.name === "mobile") {
      await page.setViewportSize({ width: 320, height: 568 });
      const startBox = await ready.getByRole("button", { name: "Loading song…", exact: true }).boundingBox();
      expect(startBox).not.toBeNull();
      expect(startBox!.y + startBox!.height).toBeLessThanOrEqual(552);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    }
    await page.screenshot({ path: info.outputPath("cold-run-learning.png"), animations: "disabled" });

    releaseAudio();
    await expect(ready.getByRole("button", { name: "Start playing", exact: true })).toBeEnabled();
    await expect(ready.getByRole("button", { name: "Loading song…", exact: true })).toHaveCount(0);
  } finally {
    releaseAudio();
    await page.unrouteAll({ behavior: "wait" });
  }
});
