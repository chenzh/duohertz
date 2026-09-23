import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

for (const run of [
  { route: "play", heading: "Play Voltage Drop" },
  { route: "duo", heading: "Duo Voltage Drop" },
] as const) {
  test(`${run.route} exposes the current song as one main heading`, async ({ page }) => {
    await page.goto(`/${run.route}/bs-s1-05?tier=easy&mode=casual`);
    await expect(page.locator(".play-meta")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: run.heading, exact: true }))
      .toHaveCount(1);
    await expect(page.locator(".play-meta > strong")).toHaveText("Voltage Drop");
  });
}
