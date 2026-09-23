import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 320, height: 568 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test("mobile presents one switchable crew story instead of three stacked biographies", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Mobile-only roster contract");
  await page.goto("/characters");

  const roster = page.getByRole("tablist", { name: "Choose a crew member", exact: true });
  const toggles = roster.getByRole("tab");
  await expect(toggles).toHaveCount(3);
  for (const toggle of await toggles.all()) {
    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await expect(page.locator(".crew-card:visible")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(2200);

  const juno = roster.getByRole("tab", { name: /JUNO/ });
  const atlas = roster.getByRole("tab", { name: /ATLAS/ });
  const torque = roster.getByRole("tab", { name: /TORQUE/ });
  await expect(juno).toHaveAttribute("aria-selected", "true");
  await expect(juno).toHaveAttribute("tabindex", "0");
  await expect(atlas).toHaveAttribute("aria-selected", "false");
  await expect(atlas).toHaveAttribute("tabindex", "-1");
  await expect(page.getByRole("tabpanel", { name: /JUNO/ })).toBeVisible();

  await atlas.click();
  await expect(atlas).toBeFocused();
  await expect(atlas).toHaveAttribute("aria-selected", "true");
  await expect(atlas).toHaveAttribute("tabindex", "0");
  await expect(page.getByRole("tabpanel", { name: /ATLAS/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ATLAS", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "JUNO", exact: true })).toBeHidden();

  await atlas.press("ArrowRight");
  await expect(torque).toBeFocused();
  await expect(torque).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "TORQUE", exact: true })).toBeVisible();
  await expect(page.locator('.crew-card[data-active="true"]')).toHaveCSS("opacity", "1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  await page.locator('.crew-card[data-active="true"] .crew-card-request').scrollIntoViewIfNeeded();
  await expect(roster).toBeInViewport({ ratio: 1 });
  const pinnedRoster = (await roster.boundingBox())!;
  expect(pinnedRoster.y).toBeGreaterThanOrEqual(0);
  expect(pinnedRoster.y).toBeLessThanOrEqual(1);

  await torque.press("Home");
  await expect(juno).toBeFocused();
  await expect(juno).toHaveAttribute("aria-selected", "true");
  await juno.press("ArrowLeft");
  await expect(torque).toBeFocused();
  await expect(torque).toHaveAttribute("aria-selected", "true");
  await torque.press("End");
  await expect(torque).toHaveAttribute("aria-selected", "true");
  await atlas.click();
  await expect(atlas).toHaveAttribute("aria-selected", "true");
  const [rosterAfterSwitch, activePanel] = await Promise.all([
    roster.boundingBox(),
    page.locator('.crew-card[data-active="true"]').boundingBox(),
  ]);
  expect(activePanel!.y).toBeGreaterThanOrEqual(rosterAfterSwitch!.y + rosterAfterSwitch!.height - 1);
  expect(activePanel!.y).toBeLessThanOrEqual(rosterAfterSwitch!.y + rosterAfterSwitch!.height + 10);

  await page.setViewportSize({ width: 800, height: 700 });
  await expect(roster).toBeHidden();
  await expect(page.locator(".crew-card:visible")).toHaveCount(3);
  await page.setViewportSize({ width: 320, height: 568 });
  await expect(roster).toBeVisible();
  await expect(page.locator(".crew-card:visible")).toHaveCount(1);
  await expect(atlas).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('.crew-card[data-active="true"]')).toHaveCSS("opacity", "1");

  await page.screenshot({
    path: info.outputPath("characters-mobile-roster.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("desktop keeps all three crew stories visible together", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Desktop-only comparison contract");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/characters");

  await expect(page.locator(".crew-roster")).toBeHidden();
  await expect(page.getByRole("tablist", { name: "Choose a crew member", exact: true })).toHaveCount(0);
  await expect(page.getByRole("tabpanel")).toHaveCount(0);
  await expect(page.locator(".crew-card:visible")).toHaveCount(3);
  for (const name of ["JUNO", "ATLAS", "TORQUE"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
});
