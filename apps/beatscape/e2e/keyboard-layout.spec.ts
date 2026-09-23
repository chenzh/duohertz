import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("bs_onboarded", "true");
    localStorage.setItem("bs_keys", JSON.stringify(["KeyA", "KeyS", "KeyW", "KeyD"]));

    let layout = new Map([
      ["KeyA", "q"],
      ["KeyS", "s"],
      ["KeyW", "z"],
      ["KeyD", "d"],
      ["KeyF", "f"],
      ["KeyJ", "j"],
      ["KeyK", "k"],
    ]);
    const listeners = new Set<EventListenerOrEventListenerObject>();
    const keyboard = {
      getLayoutMap: async () => layout,
      addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === "layoutchange") listeners.add(listener);
      },
      removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === "layoutchange") listeners.delete(listener);
      },
    };
    Object.defineProperty(navigator, "keyboard", { configurable: true, value: keyboard });
    Object.defineProperty(window, "__setBeatScapeKeyboardLayout", {
      configurable: true,
      value: (entries: Array<[string, string]>) => {
        layout = new Map(entries);
        const event = new Event("layoutchange");
        for (const listener of listeners) {
          if (typeof listener === "function") listener.call(keyboard, event);
          else listener.handleEvent(event);
        }
      },
    });
  });
});

test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("Settings shows the keys printed by the current physical keyboard layout", async ({ page }, info) => {
  await page.goto("/settings");
  const keymap = page.locator(".settings-keymap");
  if (!await keymap.evaluate((node) => (node as HTMLDetailsElement).open)) {
    await keymap.locator("summary").click();
  }

  const bindings = page.getByRole("group", { name: "Custom lane bindings" });
  const laneKeys = bindings.getByRole("button");
  await expect(laneKeys).toHaveCount(4);
  await expect(laneKeys.nth(0)).toHaveText("Q");
  await expect(laneKeys.nth(1)).toHaveText("S");
  await expect(laneKeys.nth(2)).toHaveText("Z");
  await expect(laneKeys.nth(3)).toHaveText("D");
  await expect(laneKeys.nth(0)).toHaveAccessibleName("Lane 1, Q. Activate to rebind");

  const wasd = page.getByRole("radiogroup", { name: "Keyboard layout presets" })
    .getByRole("radio", { name: /WASD/ });
  await expect(wasd).toContainText("Q S Z D");
  await expect(page.getByText(/This keyboard shows Q · S · Z · D/)).toBeVisible();
  await page.screenshot({
    path: info.outputPath("settings-azerty-layout.png"),
    fullPage: true,
    animations: "disabled",
  });

  await page.evaluate(() => {
    (window as Window & {
      __setBeatScapeKeyboardLayout: (entries: Array<[string, string]>) => void;
    }).__setBeatScapeKeyboardLayout([
      ["KeyA", "a"],
      ["KeyS", "s"],
      ["KeyW", "w"],
      ["KeyD", "d"],
      ["KeyF", "f"],
      ["KeyJ", "j"],
      ["KeyK", "k"],
    ]);
  });
  await expect(laneKeys.nth(0)).toHaveText("A");
  await expect(laneKeys.nth(2)).toHaveText("W");
  await expect(wasd).toHaveText("WASD");
});

test("Home, Play, and Duo use layout-aware legends without changing physical bindings", async ({ page }, info) => {
  await page.goto("/");
  const homeKeys = page.locator(".home-hero-demo-mask .unlock-keys .key-chip");
  if (info.project.name === "mobile") {
    await expect(homeKeys).toHaveCount(0);
    await expect(page.locator(".home-hero-demo-mask .unlock-touch-lanes span")).toHaveCount(4);
    await expect(page.locator(".home-hero-demo-mask .unlock-hint")).toHaveText("Demo · no progress saved");
  } else {
    await expect(homeKeys).toHaveText(["Q", "S", "Z", "D"]);
    const homeKeyGroup = page.locator(".home-hero-demo-mask .unlock-keys");
    await expect(homeKeyGroup).toHaveRole("img");
    await expect(homeKeyGroup).toHaveAccessibleName("Lane keys: Q · S · Z · D");
  }

  if (info.project.name === "desktop") {
    await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
    const playKeys = page.locator(".overlay-tap .unlock-keys");
    await expect(playKeys.locator(".key-chip")).toHaveText(["Q", "S", "Z", "D"]);
    await expect(playKeys).toHaveRole("img");
    await expect(playKeys).toHaveAccessibleName("Lane keys: Q · S · Z · D");
    await expect(page.locator(".overlay-tap .unlock-hint")).toHaveText("Hit the line");
  }

  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");
  const seats = page.locator(".duo-seat-hint");
  if (info.project.name === "mobile") {
    await expect(seats).toContainText("P1 Tap 4 lanes");
    await expect(seats).toContainText("P2 Tap 4 lanes");
  } else {
    await expect(seats).toContainText("P1 Q · S · Z · D");
    await expect(seats).toContainText("P2 ← · ↓ · ↑ · →");
  }

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("bs_keys") ?? "null"));
  expect(stored).toEqual(["KeyA", "KeyS", "KeyW", "KeyD"]);
});

test("experienced solo players shed keycap chrome after GO and regain it for resume", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "In-run keycap hints are desktop-only");

  await page.addInitScript(() => {
    if (sessionStorage.getItem("bs_key_hint_new_player") !== "true") {
      localStorage.setItem("bs_runs", JSON.stringify(Array.from({ length: 3 }, (_, index) => ({
        track_id: "bs-s1-01",
        district: "Pulse Core",
        tier: "easy",
        mode: "casual",
        score: 0,
        accuracy: 0,
        maxCombo: 0,
        fc: false,
        ap: false,
        failed: false,
        durationMs: 1_000,
        endedAt: `2026-09-${String(10 + index).padStart(2, "0")}T12:00:00.000Z`,
        dateKey: `2026-09-${String(10 + index).padStart(2, "0")}`,
      }))));
    }

    const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    Object.defineProperty(CanvasRenderingContext2D.prototype, "drawImage", {
      configurable: true,
      value: function drawImage(
        this: CanvasRenderingContext2D,
        source: CanvasImageSource,
        ...dimensions: number[]
      ) {
        const [, , width, height] = dimensions;
        if (
          this.canvas.classList.contains("play-canvas")
          && source instanceof HTMLCanvasElement
          && dimensions.length === 4
          && Number(width) > 0
          && Number(width) <= 48
          && Number(height) > 0
          && Number(height) <= 32
        ) {
          Object.defineProperty(window, "__bsLastKeyHintDraw", {
            configurable: true,
            writable: true,
            value: performance.now(),
          });
        }
        Reflect.apply(originalDrawImage, this, [source, ...dimensions]);
      },
    });
  });

  const keyHintDrawAge = () => page.evaluate(() => {
    const lastDraw = (window as Window & { __bsLastKeyHintDraw?: number }).__bsLastKeyHintDraw ?? 0;
    return lastDraw > 0 ? performance.now() - lastDraw : Number.POSITIVE_INFINITY;
  });

  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await expect.poll(keyHintDrawAge).toBeLessThan(250);

  // The three-second count-in is instructional; after GO, an experienced
  // player's lane should be visually clean once the brief fade completes.
  await page.waitForTimeout(4_200);
  expect(await keyHintDrawAge()).toBeGreaterThan(400);

  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("dialog", { name: "Scape paused", exact: true })
    .getByRole("button", { name: "Resume", exact: true })
    .click();
  await expect.poll(keyHintDrawAge).toBeLessThan(250);

  // A fresh player keeps the reminders after GO for their first three runs.
  await page.evaluate(() => {
    sessionStorage.setItem("bs_key_hint_new_player", "true");
    localStorage.removeItem("bs_runs");
  });
  await page.reload();
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await page.waitForTimeout(4_200);
  expect(await keyHintDrawAge()).toBeLessThan(250);
});
