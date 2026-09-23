import { expect, test, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function textContrast(target: ReturnType<Page["locator"]>): Promise<number> {
  return target.evaluate((element) => {
    const parse = (value: string): [number, number, number, number] => {
      const parts = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1];
    };
    const luminance = ([red, green, blue]: [number, number, number, number]) => {
      const normalize = (channel: number) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * normalize(red) + 0.7152 * normalize(green) + 0.0722 * normalize(blue);
    };
    const foreground = parse(getComputedStyle(element).color);
    let backgroundNode: Element | null = element;
    let background: [number, number, number, number] = [18, 16, 15, 1];
    while (backgroundNode) {
      const candidate = parse(getComputedStyle(backgroundNode).backgroundColor);
      if (candidate[3] >= 0.9) {
        background = candidate;
        break;
      }
      backgroundNode = backgroundNode.parentElement;
    }
    const foregroundLuminance = luminance(foreground);
    const backgroundLuminance = luminance(background);
    return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
      / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  });
}

test("valid settings save immediately and survive navigation", async ({ page }, info) => {
  await page.goto("/settings");

  const header = page.locator(".site-header");
  await expect(header.getByRole("link", { name: "Player profile", exact: true })).toBeVisible();

  const keymap = page.locator(".settings-keymap");
  const keymapSummary = keymap.locator("summary");
  if (info.project.name === "mobile") {
    await expect(keymap).not.toHaveAttribute("open", "");
    const summaryBox = (await keymapSummary.boundingBox())!;
    expect(summaryBox.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: info.outputPath("settings-touch-default.png"), fullPage: true, animations: "disabled" });
    await keymapSummary.click();
    await expect(keymap).toHaveAttribute("open", "");
  } else {
    await expect(keymap).toHaveAttribute("open", "");
  }

  await page.getByRole("textbox", { name: "Board name", exact: true }).fill("Night Rider");
  const updatedAvatar = header.getByRole("link", { name: "Night Rider profile", exact: true });
  await expect(updatedAvatar).toBeVisible();
  await expect(updatedAvatar.locator(".header-avatar-visual")).toHaveText("NR");
  await page.getByRole("spinbutton", { name: "Global offset (ms)", exact: true }).fill("37");
  await page.getByRole("checkbox", { name: "Hitsound", exact: true }).uncheck();
  const backgroundDim = page.getByRole("slider", { name: "Background dim", exact: true });
  await expect(backgroundDim).toHaveValue("25");
  await expect(backgroundDim).toHaveAttribute("aria-valuetext", "25% dim");
  await backgroundDim.fill("45");
  await expect(backgroundDim).toHaveAttribute("aria-valuetext", "45% dim");
  const noteSpeed = page.getByRole("slider", { name: "Note speed", exact: true });
  await noteSpeed.focus();
  for (let i = 0; i < 5; i++) await noteSpeed.press("ArrowRight");
  await page.getByRole("radio", { name: "WASD", exact: true }).click();

  await expect(page.getByRole("status")).toContainText("Saved on this device");
  const profilePanel = page.locator(".settings-grid .panel").first();
  const recalibrate = profilePanel.getByRole("link", { name: "Recalibrate timing", exact: true });
  await expect(recalibrate).toBeVisible();
  const [profileBox, recalibrateBox] = await Promise.all([
    profilePanel.boundingBox(),
    recalibrate.boundingBox(),
  ]);
  expect(profileBox).not.toBeNull();
  expect(recalibrateBox).not.toBeNull();
  expect(recalibrateBox!.y + recalibrateBox!.height).toBeLessThanOrEqual(profileBox!.y + profileBox!.height + 1);
  await page.screenshot({ path: info.outputPath("settings-saved.png"), fullPage: true, animations: "disabled" });
  await recalibrate.click();
  await expect(page).toHaveURL(/\/calibrate\?return=%2Fsettings$/);

  const stored = await page.evaluate(() => ({
    name: localStorage.getItem("bs_display_name"),
    offset: localStorage.getItem("bs_offset_ms"),
    keys: JSON.parse(localStorage.getItem("bs_keys") ?? "null"),
    settings: JSON.parse(localStorage.getItem("bs_settings") ?? "null"),
  }));
  expect(stored.name).toBe("Night Rider");
  expect(stored.offset).toBe("37");
  expect(stored.keys).toEqual(["KeyA", "KeyS", "KeyW", "KeyD"]);
  expect(stored.settings.hitsound).toBe(false);
  expect(stored.settings.backgroundDim).toBe(0.45);
  expect(stored.settings.scrollBias).toBeCloseTo(1 / 1.25 - 1);

  await page.goto("/settings");
  await expect(page.getByRole("textbox", { name: "Board name", exact: true })).toHaveValue("Night Rider");
  await expect(page.getByRole("spinbutton", { name: "Global offset (ms)", exact: true })).toHaveValue("37");
  await expect(page.getByRole("checkbox", { name: "Hitsound", exact: true })).not.toBeChecked();
  await expect(backgroundDim).toHaveValue("45");
  await expect(noteSpeed).toHaveValue("1.25");
  if (info.project.name === "mobile") {
    await expect(keymap).not.toHaveAttribute("open", "");
    await keymapSummary.click();
  }
  await expect(page.getByRole("radio", { name: "WASD", exact: true })).toHaveClass(/is-active/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("settings use a desktop control deck and preserve the narrow reading order", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/settings");

  const grid = page.locator(".settings-grid");
  const panels = grid.locator(".panel");
  await expect(panels).toHaveCount(4);
  const gridBox = (await grid.boundingBox())!;
  const [profile, audio, gameplay, keymap] = await panels.evaluateAll((nodes) => nodes.map((node) => {
    const box = node.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));

  expect(gridBox.width).toBeGreaterThan(900);
  expect(Math.abs(profile.x - audio.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(gameplay.x - keymap.x)).toBeLessThanOrEqual(1);
  expect(gameplay.x).toBeGreaterThan(profile.x + profile.width);
  expect(Math.abs(profile.y - gameplay.y)).toBeLessThanOrEqual(1);
  expect(audio.y).toBeGreaterThan(profile.y + profile.height);
  expect(keymap.y).toBeGreaterThan(gameplay.y + gameplay.height);
  await page.screenshot({
    path: info.outputPath("settings-desktop-deck.png"),
    fullPage: true,
    animations: "disabled",
  });

  await page.setViewportSize({ width: 390, height: 844 });
  const narrow = await panels.evaluateAll((nodes) => nodes.map((node) => {
    const box = node.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  for (let index = 1; index < narrow.length; index += 1) {
    expect(Math.abs(narrow[index]!.x - narrow[0]!.x)).toBeLessThanOrEqual(1);
    expect(narrow[index]!.y).toBeGreaterThan(narrow[index - 1]!.y + narrow[index - 1]!.height);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({
    path: info.outputPath("settings-narrow-stack.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("settings switches show their state and keep a full touch target", async ({ page }, info) => {
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  await page.goto("/settings");

  const toggles = page.locator(".toggle-field");
  await expect(toggles.first()).toBeVisible();
  expect(await toggles.count()).toBeGreaterThanOrEqual(4);

  for (const row of await toggles.all()) {
    const checkbox = row.getByRole("checkbox");
    const control = row.locator(".toggle-control");
    const state = control.locator(".toggle-state");
    await expect(control).toBeVisible();
    await expect(state).toHaveText(/^(On|Off)$/);

    const [rowBox, checkboxBox] = await Promise.all([
      row.boundingBox(),
      checkbox.boundingBox(),
    ]);
    expect(rowBox).not.toBeNull();
    expect(checkboxBox).not.toBeNull();
    expect(rowBox!.height).toBeGreaterThanOrEqual(44);
    expect(checkboxBox!.width).toBeGreaterThanOrEqual(44);
    expect(checkboxBox!.height).toBeGreaterThanOrEqual(28);
  }

  const hitsound = page.getByRole("checkbox", { name: "Hitsound", exact: true });
  const hitsoundRow = page.locator(".toggle-field").filter({ has: hitsound });
  await expect(hitsoundRow.locator(".toggle-state")).toHaveText("On");
  await hitsound.focus();
  await expect(hitsound).toBeFocused();
  await hitsound.press("Space");
  await expect(hitsound).not.toBeChecked();
  await expect(hitsoundRow.locator(".toggle-state")).toHaveText("Off");
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  expect(await page.evaluate(() => (
    JSON.parse(localStorage.getItem("bs_settings") ?? "null")?.hitsound
  ))).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await page.screenshot({
    path: info.outputPath("settings-switches.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("settings sliders keep a full drag target without losing keyboard control", async ({ page }, info) => {
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  await page.goto("/settings");

  const sliders = page.locator('.settings-grid input[type="range"]');
  await expect(sliders.first()).toBeVisible();
  await expect(sliders).toHaveCount(4);

  for (const slider of await sliders.all()) {
    const box = await slider.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(120);
  }

  const music = page.getByRole("slider", { name: /Music volume/ });
  await expect(music).toHaveValue("70");
  await music.focus();
  await expect(music).toBeFocused();
  await music.press("ArrowRight");
  await expect(music).toHaveValue("71");
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  expect(await page.evaluate(() => (
    JSON.parse(localStorage.getItem("bs_settings") ?? "null")?.musicVolume
  ))).toBe(0.71);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await page.screenshot({
    path: info.outputPath("settings-sliders.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("profile controls keep full touch targets and accept a typed negative offset", async ({ page }, info) => {
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  await page.goto("/settings");

  const boardName = page.getByRole("textbox", { name: "Board name", exact: true });
  const offset = page.getByRole("spinbutton", { name: "Global offset (ms)", exact: true });
  for (const control of [boardName, offset]) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  await offset.click();
  await offset.selectText();
  await offset.press("Backspace");
  await page.keyboard.type("-37", { delay: 40 });
  await expect(offset).toHaveValue("-37");
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  expect(await page.evaluate(() => localStorage.getItem("bs_offset_ms"))).toBe("-37");

  const quickAdjust = page.getByRole("group", { name: "Global offset quick adjust" });
  await expect(quickAdjust).toBeVisible();
  const minusTen = quickAdjust.getByRole("button", { name: "Decrease offset by 10 milliseconds" });
  const reset = quickAdjust.getByRole("button", { name: "Reset offset to zero" });
  const plusTen = quickAdjust.getByRole("button", { name: "Increase offset by 10 milliseconds" });
  for (const control of [minusTen, reset, plusTen]) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  await minusTen.click();
  await expect(offset).toHaveValue("-47");
  await plusTen.click();
  await expect(offset).toHaveValue("-37");
  await reset.click();
  await expect(offset).toHaveValue("0");
  expect(await page.evaluate(() => localStorage.getItem("bs_offset_ms"))).toBe("0");

  await offset.fill("250");
  await expect(offset).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert").filter({ hasText: "−200 to +200 ms" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Fix the highlighted field");
  expect(await page.evaluate(() => localStorage.getItem("bs_offset_ms"))).toBe("0");
  await offset.press("ArrowDown");
  await expect(offset).toHaveValue("-1");
  await expect(offset).not.toHaveAttribute("aria-invalid", "true");
  expect(await page.evaluate(() => localStorage.getItem("bs_offset_ms"))).toBe("-1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await page.screenshot({
    path: info.outputPath("settings-profile-controls.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("hybrid devices expose touch assist without collapsing desktop keyboard settings", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "The hybrid contract needs a fine primary pointer.");
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 5,
    });
  });
  await page.goto("/settings");

  await expect(page.getByRole("checkbox", { name: "Thumb chord assist (touch)", exact: true }))
    .toBeVisible();
  await expect(page.locator(".settings-keymap")).toHaveAttribute("open", "");
});

test("invalid profile or key edits do not block unrelated autosaves", async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_display_name", "Valid Rider");
    localStorage.setItem("bs_keys", JSON.stringify(["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"]));
  });
  await page.goto("/settings");
  const header = page.locator(".site-header");
  await expect(header.getByRole("link", { name: "Valid Rider profile", exact: true })).toBeVisible();

  const keymap = page.locator(".settings-keymap");
  if (!await keymap.evaluate((node) => (node as HTMLDetailsElement).open)) {
    await keymap.locator("summary").click();
  }

  await page.getByRole("textbox", { name: "Board name", exact: true }).fill("ASS");
  await expect(header.getByRole("link", { name: "Valid Rider profile", exact: true })).toBeVisible();
  await expect(header.getByRole("link", { name: "ASS profile", exact: true })).toHaveCount(0);
  await page.locator(".keys-grid label").first().getByRole("button").click();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByText("Two lanes share the same key", { exact: false })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("your other changes are still saved");

  await page.getByRole("slider", { name: /Music volume/ }).fill("35");
  await page.screenshot({ path: info.outputPath("settings-invalid.png"), fullPage: true, animations: "disabled" });
  await page.locator('a[href$="/library"]:visible').first().click();
  await expect(page).toHaveURL(/\/library$/);

  const stored = await page.evaluate(() => ({
    name: localStorage.getItem("bs_display_name"),
    keys: JSON.parse(localStorage.getItem("bs_keys") ?? "null"),
    settings: JSON.parse(localStorage.getItem("bs_settings") ?? "null"),
  }));
  expect(stored.name).toBe("Valid Rider");
  expect(stored.keys).toEqual(["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"]);
  expect(stored.settings.musicVolume).toBe(0.35);
});

test("profile identity stays current when another tab changes the board name", async ({ page, context }) => {
  await page.goto("/profile");
  const header = page.locator(".site-header");
  await expect(header.getByRole("link", { name: "Player profile", exact: true })).toBeVisible();

  const settingsPage = await context.newPage();
  const settingsErrors: string[] = [];
  settingsPage.on("pageerror", (error) => settingsErrors.push(error.message));
  await settingsPage.goto("/settings");
  await settingsPage.getByRole("textbox", { name: "Board name", exact: true }).fill("Cross Tab DJ");

  const updatedAvatar = header.getByRole("link", { name: "Cross Tab DJ profile", exact: true });
  await expect(updatedAvatar).toBeVisible();
  await expect(updatedAvatar.locator(".header-avatar-visual")).toHaveText("CT");
  expect(settingsErrors).toEqual([]);
  await settingsPage.close();
});

test("denied browser storage is reported instead of claiming a save", async ({ page }) => {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (key === "bs_onboarded") return originalSetItem.call(this, key, value);
      throw new DOMException("denied", "SecurityError");
    };
  });
  await page.goto("/settings");

  await page.getByRole("checkbox", { name: "Hitsound", exact: true }).uncheck();
  await expect(page.getByRole("status")).toContainText("Couldn’t save in this browser");
});

test("keyboard setup exposes preset, capture, and validation state", async ({ page }) => {
  await page.goto("/settings");

  const keymap = page.locator(".settings-keymap");
  if (!await keymap.evaluate((node) => (node as HTMLDetailsElement).open)) {
    await keymap.locator("summary").click();
  }

  const presets = page.getByRole("radiogroup", { name: "Keyboard layout presets" });
  const arrows = presets.getByRole("radio", { name: "Arrow keys", exact: true });
  const wasd = presets.getByRole("radio", { name: "WASD", exact: true });
  const dfjk = presets.getByRole("radio", { name: "D F J K", exact: true });
  await expect(arrows).toHaveAttribute("aria-checked", "true");
  await expect(arrows).toHaveAttribute("tabindex", "0");
  await expect(wasd).toHaveAttribute("aria-checked", "false");
  await expect(wasd).toHaveAttribute("tabindex", "-1");
  expect(await textContrast(arrows)).toBeGreaterThanOrEqual(4.5);

  await arrows.focus();
  await arrows.press("ArrowRight");
  await expect(wasd).toBeFocused();
  await expect(wasd).toHaveAttribute("aria-checked", "true");
  await expect(wasd).toHaveAttribute("tabindex", "0");
  await expect(arrows).toHaveAttribute("aria-checked", "false");
  expect(await textContrast(wasd)).toBeGreaterThanOrEqual(4.5);

  await wasd.press("End");
  await expect(dfjk).toBeFocused();
  await expect(dfjk).toHaveAttribute("aria-checked", "true");
  await dfjk.press("ArrowRight");
  await expect(arrows).toBeFocused();
  await expect(arrows).toHaveAttribute("aria-checked", "true");

  await wasd.click();
  await expect(wasd).toHaveAttribute("aria-checked", "true");

  const laneBindings = page.getByRole("group", { name: "Custom lane bindings" });
  const laneOne = laneBindings.locator(".keycap").first();
  await expect(laneOne).toHaveAttribute("aria-label", "Lane 1, A. Activate to rebind");
  await laneOne.click();
  await expect(laneOne).toHaveAttribute(
    "aria-label",
    "Lane 1, waiting for a key. Press Escape to cancel",
  );
  await page.keyboard.press("s");
  await expect(laneBindings).toHaveAttribute("aria-invalid", "true");
  await expect(laneBindings).toHaveAttribute("aria-describedby", "keymap-error");
  await expect(page.getByRole("alert").filter({ hasText: "Two lanes share the same key" })).toBeVisible();

  const boardName = page.getByRole("textbox", { name: "Board name", exact: true });
  await boardName.fill("ASS");
  await expect(boardName).toHaveAttribute("aria-invalid", "true");
  await expect(boardName).toHaveAttribute("aria-describedby", "display-name-error");
  await expect(page.getByRole("alert").filter({ hasText: "board censors" })).toBeVisible();
});
