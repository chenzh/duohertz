import { expect, test } from "@playwright/test";

test("duohertz timing starts separately from legacy settings and refuses sparse taps", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_offset_ms", "200");
    localStorage.setItem("duohertz_timing_offset_ms", "80");
  });
  await page.goto("/beatscape/lab/duohertz");
  const timing = page.getByRole("region", { name: "Timing calibration" });
  await timing.getByRole("button", { name: /Timing sync/ }).click();
  await expect(timing).toContainText("Current timing: +80 ms");
  await timing.getByRole("button", { name: "Check timing with 8 beats" }).click();
  await expect(page.getByRole("button", { name: "Play track with sound" })).toBeDisabled();
  await expect(timing.getByRole("button", { name: /Tap the pulse/ })).toBeVisible();
  await expect(timing).toContainText("Not enough taps to measure timing", { timeout: 8_000 });
  await expect(page.getByRole("button", { name: "Play track with sound" })).toBeEnabled();
  await expect(timing).toContainText("Current timing: +80 ms");
});

test("steady eight-pulse check saves a duohertz-only offset", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  const timing = page.getByRole("region", { name: "Timing calibration" });
  await timing.getByRole("button", { name: /Timing sync/ }).click();
  await timing.getByRole("button", { name: "Check timing with 8 beats" }).click();
  await expect(timing.getByRole("button", { name: /Tap the pulse/ })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => {
    let taps = 0;
    const sendTap = () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", bubbles: true }));
      taps++;
      if (taps === 5) resolve();
      else window.setTimeout(sendTap, 500);
    };
    window.setTimeout(sendTap, 850);
  }));
  await expect(timing.getByRole("button", { name: "Use suggested timing" })).toBeVisible({ timeout: 8_000 });
  await timing.getByRole("button", { name: "Use suggested timing" }).click();
  const stored = await page.evaluate(() => localStorage.getItem("duohertz_timing_offset_ms"));
  expect(stored).not.toBeNull();
  expect(Math.abs(Number(stored))).toBeLessThanOrEqual(200);
  expect(await page.evaluate(() => localStorage.getItem("bs_offset_ms"))).toBeNull();
  await page.reload();
  const reloadedTiming = page.getByRole("region", { name: "Timing calibration" });
  await reloadedTiming.getByRole("button", { name: /Timing sync/ }).click();
  await expect(reloadedTiming)
    .toContainText(`Current timing: ${Number(stored) > 0 ? "+" : ""}${stored} ms`);
});

test("saved timing keeps a late tap eligible after the uncorrected miss deadline", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("duohertz_timing_offset_ms", "150"));
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Play track with sound" }).click();
  await page.waitForFunction(() =>
    Number.parseFloat(document.querySelector(".dh-lab__readout span")?.textContent ?? "0") >= 1.23);
  await page.keyboard.down("Space");
  await expect(page.locator(".dh-lab__readout")).toContainText(/GREAT|GOOD/);
  await page.keyboard.up("Space");
});

test("Space still activates the focused cancel control during calibration", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  const timing = page.getByRole("region", { name: "Timing calibration" });
  await timing.getByRole("button", { name: /Timing sync/ }).click();
  await timing.getByRole("button", { name: "Check timing with 8 beats" }).click();
  const cancel = timing.getByRole("button", { name: "Cancel timing check" });
  await cancel.focus();
  await cancel.press("Space");
  await expect(timing.getByRole("button", { name: "Check timing with 8 beats" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play track with sound" })).toBeEnabled();
});

test("timing controls fit the narrow game layout", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/beatscape/lab/duohertz");
  const timing = page.getByRole("region", { name: "Timing calibration" });
  await expect(timing.getByRole("button", { name: /Timing sync/ })).toHaveAttribute("aria-expanded", "false");
  await timing.getByRole("button", { name: /Timing sync/ }).click();
  await expect(timing.getByRole("button", { name: "Check timing with 8 beats" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("a pending sound permission can be cancelled without trapping the game", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: class {
        resume() { return new Promise<void>(() => {}); }
        close() { return Promise.resolve(); }
      },
    });
  });
  await page.goto("/beatscape/lab/duohertz");
  const timing = page.getByRole("region", { name: "Timing calibration" });
  await timing.getByRole("button", { name: /Timing sync/ }).click();
  await timing.getByRole("button", { name: "Check timing with 8 beats" }).click();
  await expect(page.getByRole("button", { name: "Play track with sound" })).toBeDisabled();
  await timing.getByRole("button", { name: "Cancel timing check" }).click();
  await expect(page.getByRole("button", { name: "Play track with sound" })).toBeEnabled();
  await expect(timing.getByRole("button", { name: "Check timing with 8 beats" })).toBeVisible();
});
