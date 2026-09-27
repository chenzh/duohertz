import { expect, test } from "@playwright/test";

test("one-key Hold survives keyboard release while a pointer still owns the pad", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Play track with sound" }).click();
  const pad = page.getByRole("button", { name: "Tap or hold the beat" });
  await pad.scrollIntoViewIfNeeded();
  const box = await pad.boundingBox();
  if (!box) throw new Error("Missing beat pad");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  async function at(seconds: number) {
    await page.waitForFunction((target) => {
      const readout = document.querySelector(".dh-lab__readout span")?.textContent ?? "0";
      return Number.parseFloat(readout) >= target;
    }, seconds - 0.03);
  }

  await at(7);
  await page.keyboard.down("Space");
  await page.mouse.down();
  await at(7.25);
  await page.keyboard.up("Space");
  await at(7.5);
  await page.mouse.up();

  await expect(page.locator(".dh-lab__readout")).toContainText(/PERFECT|GREAT|GOOD/);
  expect(errors).toEqual([]);
});

test("a cancelled pad touch releases only that input and keeps the run playing", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "Duo · two players" }).click();
  await page.getByRole("button", { name: "Play track with sound" }).click();

  const left = page.getByRole("button", { name: "Player 1 beat" });
  await left.scrollIntoViewIfNeeded();
  const box = await left.boundingBox();
  if (!box) throw new Error("Missing left beat pad");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await left.dispatchEvent("pointercancel", { pointerId: 1, pointerType: "mouse" });

  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Player 2 beat" })).toBeEnabled();
  await page.mouse.up();
});

test("losing pad capture does not keep its key owned", async ({ page }) => {
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: "2 keys · Standard" }).click();
  await page.getByRole("button", { name: "Play track with sound" }).click();

  const left = page.getByRole("button", { name: "Left beat" });
  await left.evaluate((button) => {
    button.addEventListener("pointerdown", (event) => {
      button.setAttribute("data-captured-pointer-id", String(event.pointerId));
    }, { capture: true, once: true });
    button.addEventListener("gotpointercapture", () => {
      button.setAttribute("data-got-pointer-capture", "true");
    }, { once: true });
  });
  await left.hover();
  await page.mouse.down();
  const box = await left.boundingBox();
  if (!box) throw new Error("Missing left beat pad");
  await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2 + 1);
  await expect(left).toHaveAttribute("data-got-pointer-capture", "true");
  await left.evaluate((button) => {
    const pointerId = Number(button.getAttribute("data-captured-pointer-id"));
    if (!Number.isInteger(pointerId) || !button.hasPointerCapture(pointerId)) {
      throw new Error("The pad did not capture the mouse pointer");
    }
    button.addEventListener("lostpointercapture", () => {
      button.setAttribute("data-lost-pointer-capture", "true");
    }, { once: true });
    (button as HTMLButtonElement).releasePointerCapture(pointerId);
  });
  await page.mouse.move(0, 0);
  await expect(left).toHaveAttribute("data-lost-pointer-capture", "true");
  await page.waitForFunction(() =>
    Number.parseFloat(document.querySelector(".dh-lab__readout span")?.textContent ?? "0") >= 0.94);
  await page.keyboard.down("f");

  await expect(page.locator(".dh-lab__readout")).toContainText(/PERFECT|GREAT|GOOD/);
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await page.keyboard.up("f");
  await page.mouse.up();
});
