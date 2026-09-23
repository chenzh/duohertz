import { expect, test, type Page } from "@playwright/test";

type WakeLockState = { requests: number; releases: number };

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  await page.addInitScript(() => localStorage.setItem("bs_onboarded", "true"));
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

async function mockWakeLock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = { requests: 0, releases: 0 };
    Object.defineProperty(window, "__wakeLockState", { value: state });
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: {
        request: async (type: string) => {
          if (type !== "screen") throw new Error(`Unexpected wake lock type: ${type}`);
          state.requests++;
          let released = false;
          const sentinel = new EventTarget() as EventTarget & {
            readonly released: boolean;
            release(): Promise<void>;
          };
          Object.defineProperty(sentinel, "released", { get: () => released });
          Object.defineProperty(sentinel, "release", {
            value: async () => {
              if (released) return;
              released = true;
              state.releases++;
              sentinel.dispatchEvent(new Event("release"));
            },
          });
          return sentinel;
        },
      },
    });
  });
}

async function mockDelayedWakeLock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = { requests: 0, releases: 0 };
    let grant: (() => void) | null = null;
    Object.defineProperty(window, "__wakeLockState", { value: state });
    Object.defineProperty(window, "__grantWakeLock", {
      value: () => grant?.(),
    });
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: {
        request: async () => {
          state.requests++;
          return new Promise<EventTarget & { readonly released: boolean; release(): Promise<void> }>((resolve) => {
            let released = false;
            const sentinel = new EventTarget() as EventTarget & {
              readonly released: boolean;
              release(): Promise<void>;
            };
            Object.defineProperty(sentinel, "released", { get: () => released });
            Object.defineProperty(sentinel, "release", {
              value: async () => {
                if (released) return;
                released = true;
                state.releases++;
                sentinel.dispatchEvent(new Event("release"));
              },
            });
            grant = () => resolve(sentinel);
          });
        },
      },
    });
  });
}

function wakeState(page: Page): Promise<WakeLockState> {
  return page.evaluate(() => (
    window as typeof window & { __wakeLockState: WakeLockState }
  ).__wakeLockState);
}

test("single-player holds wake lock only while the run is moving", async ({ page }) => {
  await mockWakeLock(page);
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect.poll(async () => (await wakeState(page)).requests).toBe(1);

  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: /resume/i })).toBeVisible();
  await expect.poll(async () => (await wakeState(page)).releases).toBe(1);

  await page.getByRole("button", { name: /resume/i }).click();
  await expect.poll(async () => (await wakeState(page)).requests).toBe(2);
  await page.locator(".play-exit").click();
  await expect(page.getByRole("dialog", { name: "Leave the Scape?" })).toBeVisible();
  await expect.poll(async () => (await wakeState(page)).releases).toBe(2);

  await page.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect.poll(async () => (await wakeState(page)).requests).toBe(3);
});

test("Duo owns one shared wake lock across both fields", async ({ page }) => {
  await mockWakeLock(page);
  await page.goto("/duo/bs-s1-01?tier=easy&mode=casual");
  const start = page.locator(".duo-start button");
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveCount(2);
  await expect.poll(async () => (await wakeState(page)).requests).toBe(1);

  await page.getByRole("button", { name: "Pause", exact: true }).first().click();
  const pauseDialog = page.getByRole("dialog", { name: "Duo paused", exact: true });
  await expect(pauseDialog).toBeVisible();
  await expect.poll(async () => (await wakeState(page)).releases).toBe(1);

  await pauseDialog.getByRole("button", { name: "Resume", exact: true }).click();
  await expect.poll(async () => (await wakeState(page)).requests).toBe(2);
});

test("unsupported Wake Lock never blocks gameplay", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: undefined });
  });
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
});

test("a late Wake Lock grant is released after the run pauses", async ({ page }) => {
  await mockDelayedWakeLock(page);
  await page.goto("/play/bs-s1-01?tier=easy&mode=casual");
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  await expect.poll(async () => (await wakeState(page)).requests).toBe(1);

  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: /resume/i })).toBeVisible();
  await page.waitForTimeout(50);
  await page.evaluate(() => (
    window as typeof window & { __grantWakeLock: () => void }
  ).__grantWakeLock());
  await expect.poll(async () => (await wakeState(page)).releases).toBe(1);
});
