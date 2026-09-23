import { expect, test } from "@playwright/test";

test("curated previews show and play the promised 15-second highlight", async ({ page }, info) => {
  const previewRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/preview_48s.m4a")) {
      previewRequests.push(request.url());
    }
  });

  await page.goto("/");
  const preview = page.locator(".curated-card .curated-preview").first();
  await expect(preview).toBeVisible();
  await expect(preview.locator(".audiobar-time")).toHaveText("0:00 / 0:15");
  const slider = preview.getByRole("slider", { name: /Seek/ });
  await expect(slider).toHaveAttribute("aria-valuemax", "15");
  if (info.project.name === "mobile") {
    await slider.scrollIntoViewIfNeeded();
    const ownsTouchSlop = await slider.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      return [rect.top - 16, rect.bottom + 16].every((y) => document.elementFromPoint(x, y) === node);
    });
    expect(ownsTouchSlop, "preview seek rail keeps a 40px+ invisible touch target").toBe(true);
  }
  expect(previewRequests).toEqual([]);

  await preview.getByRole("button", { name: /Play/ }).click();
  await expect.poll(() => preview.locator("audio").evaluate((audio) => {
    const element = audio as HTMLAudioElement;
    return element.readyState > 0 ? element.currentTime : 0;
  })).toBeGreaterThan(5.5);
  await expect(preview.locator(".audiobar-time")).toContainText("/ 0:15");
  expect(previewRequests.length).toBeGreaterThan(0);
  expect(new Set(previewRequests.map((url) => new URL(url).pathname)).size).toBe(1);

  await slider.focus();
  await slider.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "15");
  await expect.poll(() => preview.locator("audio").evaluate((audio) =>
    (audio as HTMLAudioElement).currentTime,
  )).toBeGreaterThan(20.5);
  await slider.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
  await expect.poll(() => preview.locator("audio").evaluate((audio) =>
    (audio as HTMLAudioElement).currentTime,
  )).toBeGreaterThan(5.5);

  await preview.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("curated-preview-highlight.png"), animations: "disabled" });
});

test("track details keep auditioning to one clear 15-second highlight", async ({ page }, info) => {
  await page.goto("/track/bs-s1-05");

  const preview = page.locator(".track-preview");
  await expect(preview).toBeVisible();
  await expect(preview.locator(".audiobar-time")).toHaveText("0:00 / 0:15");

  const slider = preview.getByRole("slider", { name: /Seek/ });
  await expect(slider).toHaveAttribute("aria-valuemax", "15");
  await slider.focus();
  await slider.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "15");

  await preview.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("track-preview-highlight.png"), animations: "disabled" });
});
