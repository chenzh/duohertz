import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __shortcutSong?: {
      context: BaseAudioContext;
      when: number;
      offset: number;
    };
  }
}

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(Element.prototype, "webkitRequestFullscreen", {
      configurable: true,
      value: undefined,
    });

    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > 1) {
        window.__shortcutSong = {
          context: this.context,
          when: args[0] ?? this.context.currentTime,
          offset: args[1] ?? 0,
        };
      }
      return start.apply(this, args);
    };
  });
  await page.route("**/catalog/bs-s1-01/easy.json*", (route) => route.fulfill({
    json: {
      track_id: "bs-s1-01",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 1,
      sections: [{ id: "shortcut", t0: 0, t1: 2 }],
      notes: [{ id: "tap-1", type: "tap", lane: 0, t: 1 }],
    },
  }));
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function waitForSongTime(page: Page, seconds: number) {
  await page.waitForFunction((target) => {
    const song = window.__shortcutSong;
    return !!song && song.context.currentTime - song.when + song.offset >= target;
  }, seconds);
}

async function dispatchKey(page: Page, init: KeyboardEventInit): Promise<boolean> {
  return page.evaluate((eventInit) => window.dispatchEvent(new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...eventInit,
  })), init);
}

test("browser reload and print shortcuts never restart or pause the run", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await waitForSongTime(page, 0.3);
  const browserOwned = [
    await dispatchKey(page, { code: "KeyR", key: "r", ctrlKey: true }),
    await dispatchKey(page, { code: "KeyP", key: "p", metaKey: true }),
  ];
  expect(browserOwned).toEqual([true, true]);
  await expect(page.getByRole("dialog", { name: "Scape paused", exact: true })).toHaveCount(0);
});

test("browser navigation modifiers cannot score a lane", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await waitForSongTime(page, 0.99);
  expect(await dispatchKey(page, { code: "ArrowLeft", key: "ArrowLeft", altKey: true })).toBe(true);

  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({ score: 0, counts: { miss: 1 } });
});

test("an unmodified bound key still owns the lane", async ({ page }) => {
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();

  await waitForSongTime(page, 0.99);
  expect(await dispatchKey(page, { code: "ArrowLeft", key: "ArrowLeft" })).toBe(false);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keyup", {
    bubbles: true,
    code: "ArrowLeft",
    key: "ArrowLeft",
  })));

  await expect(page).toHaveURL(/\/results$/);
  const run = await page.evaluate(() => JSON.parse(sessionStorage.getItem("bs_last_run")!));
  expect(run).toMatchObject({ score: 300, counts: { perfect: 1, miss: 0 } });
});

test("key rebinding leaves browser shortcuts untouched and keeps listening", async ({ page }) => {
  await page.goto("/settings");

  const keymap = page.locator(".settings-keymap");
  if (!await keymap.evaluate((node) => (node as HTMLDetailsElement).open)) {
    await keymap.locator("summary").click();
  }

  const laneOne = page.getByRole("group", { name: "Custom lane bindings" })
    .locator(".keycap")
    .first();
  await laneOne.click();
  await expect(laneOne).toHaveAttribute(
    "aria-label",
    "Lane 1, waiting for a key. Press Escape to cancel",
  );

  const browserOwned = [
    await dispatchKey(page, { code: "KeyR", key: "r", ctrlKey: true }),
    await dispatchKey(page, { code: "KeyP", key: "p", metaKey: true }),
    await dispatchKey(page, { code: "ArrowLeft", key: "ArrowLeft", altKey: true }),
  ];
  expect(browserOwned).toEqual([true, true, true]);
  await expect(laneOne).toHaveAttribute(
    "aria-label",
    "Lane 1, waiting for a key. Press Escape to cancel",
  );
  expect(await page.evaluate(() => localStorage.getItem("bs_keys"))).toBeNull();

  expect(await dispatchKey(page, { code: "KeyZ", key: "z" })).toBe(false);
  await expect(laneOne).toHaveAttribute("aria-label", "Lane 1, Z. Activate to rebind");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("bs_keys") ?? "null")))
    .toEqual(["KeyZ", "ArrowDown", "ArrowUp", "ArrowRight"]);

  await laneOne.click();
  await page.keyboard.press("Tab");
  await expect(laneOne).toHaveAttribute("aria-label", "Lane 1, Z. Activate to rebind");
  await expect(page.getByRole("group", { name: "Custom lane bindings" })
    .locator(".keycap")
    .nth(1))
    .toBeFocused();
});

test("custom Space and Enter bindings do not block keyboard start actions", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bs_keys", JSON.stringify([
      "Space",
      "ArrowDown",
      "ArrowUp",
      "ArrowRight",
    ]));
  });
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");

  const singleStart = page.getByRole("button", { name: "Start playing", exact: true });
  await singleStart.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();

  await page.evaluate(() => {
    localStorage.setItem("bs_keys", JSON.stringify([
      "Enter",
      "ArrowDown",
      "ArrowUp",
      "ArrowRight",
    ]));
  });
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");

  const duoStart = page.getByRole("button", { name: "Start", exact: true });
  await duoStart.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);
});
