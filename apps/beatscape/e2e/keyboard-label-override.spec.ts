import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_keys", JSON.stringify(["KeyA", "KeyS", "KeyW", "KeyD"]));
    Object.defineProperty(navigator, "keyboard", { configurable: true, value: undefined });
  });
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("manual AZERTY labels persist when browser layout detection is unavailable", async ({ page }, info) => {
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 568 });
  }
  await page.goto("/settings");
  const keymap = page.locator(".settings-keymap");
  if (!await keymap.evaluate((node) => (node as HTMLDetailsElement).open)) {
    await keymap.locator("summary").click();
  }

  const printedLayout = page.getByRole("combobox", { name: "Printed key labels" });
  const laneKeys = page.getByRole("group", { name: "Custom lane bindings" }).getByRole("button");
  await expect(printedLayout).toHaveValue("auto");
  await expect(laneKeys).toHaveText(["A", "S", "W", "D"]);
  await printedLayout.selectOption("azerty");
  await expect(laneKeys).toHaveText(["Q", "S", "Z", "D"]);
  await expect(laneKeys.nth(0)).toHaveAccessibleName("Lane 1, Q. Activate to rebind");
  await expect(page.getByRole("radiogroup", { name: "Keyboard layout presets" })
    .getByRole("radio", { name: /WASD/ })).toContainText("Q S Z D");
  await printedLayout.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("manual-azerty-key-labels.png"),
    animations: "disabled",
  });

  const stored = await page.evaluate(() => ({
    keys: JSON.parse(localStorage.getItem("bs_keys") ?? "null"),
    layout: JSON.parse(localStorage.getItem("bs_settings") ?? "null")?.keyLabelLayout,
  }));
  expect(stored).toEqual({ keys: ["KeyA", "KeyS", "KeyW", "KeyD"], layout: "azerty" });

  await page.reload();
  if (!await keymap.evaluate((node) => (node as HTMLDetailsElement).open)) {
    await keymap.locator("summary").click();
  }
  await expect(printedLayout).toHaveValue("azerty");
  await expect(laneKeys).toHaveText(["Q", "S", "Z", "D"]);

  if (info.project.name === "desktop") {
    await page.goto("/");
    await expect(page.locator(".key-chips[aria-label='Keyboard lanes'] .key-chip"))
      .toHaveText(["Q", "S", "Z", "D"]);
    await expect(page.locator(".home-hero-demo-mask .unlock-keys .key-chip"))
      .toHaveText(["Q", "S", "Z", "D"]);

    await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
    await expect(page.locator(".overlay-tap .unlock-keys .key-chip"))
      .toHaveText(["Q", "S", "Z", "D"]);

    await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");
    await expect(page.locator(".duo-seat-hint")).toContainText("P1 Q · S · Z · D");

    await page.goto("/calibrate");
    await page.getByRole("button", { name: "Start 8-pulse test" }).click();
    await expect(page.locator(".calib-lanes kbd")).toHaveText(["Q", "S", "Z", "D"]);
  } else {
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    );
    expect((await printedLayout.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});
