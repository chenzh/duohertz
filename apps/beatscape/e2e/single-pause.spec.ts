import { expect, test, type Locator, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function expectReachable(target: Locator, page: Page) {
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
}

test("single-player pause is a reachable modal that restores focus", async ({ page }, info) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const pause = page.getByRole("button", { name: "Pause", exact: true });
  await expect(pause).toBeVisible();
  await pause.click();

  const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  const resume = pauseDialog.getByRole("button", { name: "Resume", exact: true });
  const restart = pauseDialog.getByRole("button", { name: "Restart track", exact: true });
  const leaveTrack = pauseDialog.getByRole("button", { name: "Leave track", exact: true });
  const music = pauseDialog.getByRole("slider", { name: "Music volume", exact: true });
  const sfx = pauseDialog.getByRole("slider", { name: "SFX volume", exact: true });
  const dim = pauseDialog.getByRole("slider", { name: "Background dim", exact: true });
  const noteSpeed = pauseDialog.getByRole("slider", { name: "Note speed", exact: true });
  const hitsounds = pauseDialog.getByRole("checkbox", { name: "Hitsounds", exact: true });
  const haptics = pauseDialog.getByRole("checkbox", { name: "Haptics", exact: true });
  const reduceMotion = pauseDialog.getByRole("checkbox", { name: "Reduce motion", exact: true });
  const thumbAssist = pauseDialog.getByRole("checkbox", { name: "Thumb chord assist", exact: true });
  await expect(pauseDialog).toHaveAttribute("aria-modal", "true");
  await expect(resume).toBeFocused();
  await expectReachable(resume, page);
  await expectReachable(restart, page);
  await expectReachable(leaveTrack, page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const quickControls = pauseDialog.getByRole("button", { name: "Quick controls", exact: true });
  if (await quickControls.count()) {
    await quickControls.click();
    await expect(quickControls).toHaveAttribute("aria-expanded", "true");
    await resume.focus();
    await expect(resume).toBeFocused();
  }

  await page.keyboard.press("Shift+Tab");
  if (info.project.name === "mobile") {
    await expect(thumbAssist).toBeFocused();
    await page.keyboard.press("Shift+Tab");
  }
  await expect(reduceMotion).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(haptics).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(hitsounds).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(haptics).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(reduceMotion).toBeFocused();
  await page.keyboard.press("Tab");
  if (info.project.name === "mobile") {
    await expect(thumbAssist).toBeFocused();
    await page.keyboard.press("Tab");
  }
  await expect(resume).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(restart).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(leaveTrack).toBeFocused();
  await page.keyboard.press("Tab");
  if (await quickControls.count()) {
    await expect(quickControls).toBeFocused();
    await page.keyboard.press("Tab");
  }
  await expect(music).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(sfx).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dim).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(noteSpeed).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(hitsounds).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(haptics).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(reduceMotion).toBeFocused();
  await page.keyboard.press("Tab");
  if (info.project.name === "mobile") {
    await expect(thumbAssist).toBeFocused();
    await page.keyboard.press("Tab");
  }
  await expect(resume).toBeFocused();
  await page.screenshot({ path: info.outputPath("single-pause-modal.png"), animations: "disabled" });

  await leaveTrack.click();
  const exitDialog = page.getByRole("dialog", { name: "Leave the Scape?", exact: true });
  await expect(exitDialog).toBeVisible();
  await expect(exitDialog.getByRole("button", { name: "Keep playing", exact: true })).toBeFocused();
  await expect(pauseDialog).toBeHidden();

  await exitDialog.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect(exitDialog).toBeHidden();
  await expect(pauseDialog).toBeVisible();
  await expect(resume).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(pauseDialog).toBeHidden();
  await expect(pause).toBeFocused();

  await pause.click();
  await expect(resume).toBeFocused();
  await restart.click();
  await expect(pauseDialog).toBeHidden();
  await expect(pause).toBeFocused();
});

test("plain P and R keep their advertised actions while the pause dialog owns focus", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const pauseButton = page.getByRole("button", { name: "Pause", exact: true });
  const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  await expect(pauseButton).toBeVisible();
  await page.keyboard.press("KeyP");
  await expect(pauseDialog).toBeVisible();
  const browserOwned = await page.evaluate(() => {
    const target = document.activeElement ?? document.body;
    return [
      target.dispatchEvent(new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        code: "KeyP",
        key: "p",
        metaKey: true,
      })),
      target.dispatchEvent(new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        code: "KeyR",
        key: "r",
        ctrlKey: true,
      })),
    ];
  });
  expect(browserOwned).toEqual([true, true]);
  await expect(pauseDialog).toBeVisible();

  for (const shortcut of [
    { code: "KeyP", key: "p" },
    { code: "Escape", key: "Escape" },
    { code: "KeyR", key: "r" },
  ]) {
    await page.evaluate(({ code, key }) => {
      const target = document.activeElement ?? document.body;
      target.dispatchEvent(new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        code,
        key,
        repeat: true,
      }));
    }, shortcut);
    await expect(pauseDialog).toBeVisible();
  }

  await page.keyboard.press("KeyP");
  await expect(pauseDialog).toBeHidden();
  await expect(pauseButton).toBeFocused();

  await page.keyboard.press("KeyP");
  await expect(pauseDialog).toBeVisible();
  // A real P press is also the evidence of a physical keyboard on a touch
  // device, so the pause card should now advertise the available shortcut.
  await expect(pauseDialog).toContainText("Press P or Esc to resume.");
  await page.keyboard.press("KeyR");
  await expect(pauseDialog).toBeHidden();
  await expect(pauseButton).toBeFocused();
});

test("touch-only pause hides keyboard shortcuts until a physical key appears", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Touch-first pause guidance is mobile-only");
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  await expect(pauseDialog).toBeVisible();
  await expect(pauseDialog).not.toContainText("Press P or Esc to resume.");

  await page.keyboard.press("KeyA");
  await expect(pauseDialog).toContainText("Press P or Esc to resume.");
});

test("lane-bound P and R stay inert while the pause dialog owns focus", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem("bs_keys", JSON.stringify([
    "KeyP",
    "KeyR",
    "ArrowUp",
    "ArrowRight",
  ])));
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  const pauseDialog = page.getByRole("dialog", { name: "Scape paused", exact: true });
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(pauseDialog).toBeVisible();
  if (info.project.name === "mobile") {
    await expect(pauseDialog).not.toContainText("Press Esc to resume.");
  } else {
    await expect(pauseDialog).toContainText("Press Esc to resume.");
  }

  await page.keyboard.press("KeyP");
  await page.keyboard.press("KeyR");
  await expect(pauseDialog).toBeVisible();
  await expect(pauseDialog.getByRole("button", { name: "Resume", exact: true })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(pauseDialog).toBeHidden();
});
