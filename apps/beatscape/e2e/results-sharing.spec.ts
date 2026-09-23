import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

type ShareCapability = "native" | "clipboard" | "download";

const baseRun = {
  v: 1,
  track_id: "bs-s1-01",
  title: "Neon Pulse",
  artist: "Pulse Atlas",
  tier: "easy",
  mode: "arcade",
  score: 82_400,
  accuracy: 82.4,
  maxCombo: 44,
  grade: "B",
  fc: false,
  ap: false,
  failed: false,
  counts: { perfect: 76, great: 20, good: 15, miss: 3 },
  totalNotes: 114,
  durationMs: 75_000,
  endedAt: "2026-09-12T00:00:00.000Z",
};

async function seedResult(page: Page, capability: ShareCapability) {
  await page.addInitScript(({ run, mode }) => {
    localStorage.setItem("bs_onboarded", "true");
    sessionStorage.setItem("bs_last_run", JSON.stringify(run));

    const state = window as typeof window & {
      __posterShare?: {
        fileCount: number;
        fileName: string;
        fileType: string;
        text: string;
        width: number;
        height: number;
      };
      __posterCopy?: { itemCount: number; mime: string; size: number; width: number; height: number };
    };
    // Model an event-scoped activation: native share and image clipboard must
    // be invoked before an awaited font load/toBlob ends the click dispatch.
    let posterClickActive = false;
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element) || !/^(Share|Copy) poster$/.test(target.closest("button")?.textContent?.trim() ?? "")) return;
      posterClickActive = true;
    }, true);
    document.addEventListener("click", () => { posterClickActive = false; });
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: mode !== "download",
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: mode === "native"
        ? async (data: ShareData) => {
            if (!posterClickActive) throw new DOMException("Share requires the click activation", "NotAllowedError");
            const file = data.files?.[0];
            const bitmap = file ? await createImageBitmap(file) : null;
            state.__posterShare = {
              fileCount: data.files?.length ?? 0,
              fileName: file?.name ?? "",
              fileType: file?.type ?? "",
              text: data.text ?? "",
              width: bitmap?.width ?? 0,
              height: bitmap?.height ?? 0,
            };
            bitmap?.close();
          }
        : undefined,
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: mode === "native" ? (data: ShareData) => Boolean(data.files?.length) : undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: mode === "clipboard"
        ? {
            write: async (items: Array<{ payload: Record<string, Blob> }>) => {
              if (!posterClickActive) throw new DOMException("Image copy requires the click activation", "NotAllowedError");
              const blob = items[0]?.payload["image/png"];
              const bitmap = blob ? await createImageBitmap(blob) : null;
              state.__posterCopy = {
                itemCount: items.length,
                mime: blob?.type ?? "",
                size: blob?.size ?? 0,
                width: bitmap?.width ?? 0,
                height: bitmap?.height ?? 0,
              };
              bitmap?.close();
            },
          }
        : undefined,
    });
    Object.defineProperty(window, "ClipboardItem", {
      configurable: true,
      value: mode === "clipboard"
        ? class ClipboardItemMock {
            payload: Record<string, Blob>;

            constructor(payload: Record<string, Blob>) {
              this.payload = payload;
            }
          }
        : undefined,
    });
  }, { run: baseRun, mode: capability });
}

test("a file-capable device gets a 4:5 poster in the native share sheet", async ({ page }, info) => {
  await seedResult(page, "native");
  await page.goto("/results");

  await expect(page.getByRole("button", { name: "Share poster", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy poster", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Share poster", exact: true }).click();
  await expect(page.getByRole("button", { name: "Poster shared", exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { __posterShare?: unknown }).__posterShare)).toEqual({
    fileCount: 1,
    fileName: "beatscape-bs-s1-01-B.png",
    fileType: "image/png",
    text: expect.stringContaining("Neon Pulse"),
    width: 1080,
    height: 1350,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("native-poster-share.png"), fullPage: true, animations: "disabled" });
});

test("poster share stays available while catalog metadata is slow", async ({ page }) => {
  await seedResult(page, "native");
  await page.route("**/catalog.json*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    await route.continue();
  });
  await page.goto("/results", { waitUntil: "domcontentloaded" });

  const share = page.getByRole("button", { name: "Share poster", exact: true });
  await expect(share).toBeEnabled({ timeout: 4000 });
  await share.click();
  await expect(page.getByRole("button", { name: "Poster shared", exact: true })).toBeVisible();
});

test("a desktop clipboard gets a real PNG poster copy", async ({ page }) => {
  await seedResult(page, "clipboard");
  await page.goto("/results");

  await expect(page.getByRole("button", { name: "Copy poster", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Share poster", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Copy poster", exact: true }).click();
  await expect(page.getByRole("button", { name: "Poster copied", exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { __posterCopy?: unknown }).__posterCopy)).toEqual({
    itemCount: 1,
    mime: "image/png",
    size: expect.any(Number),
    width: 1200,
    height: 630,
  });
  expect((await page.evaluate(() => (window as typeof window & { __posterCopy: { size: number } }).__posterCopy.size))).toBeGreaterThan(1_000);
});

test("an unsupported browser gets a 4:5 download without a dead action", async ({ page }, info) => {
  await seedResult(page, "download");
  await page.goto("/results");

  await expect(page.getByRole("button", { name: "Share poster", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy poster", exact: true })).toHaveCount(0);
  await expect(page.getByText("Download the 4:5 score card to share it from this browser.", { exact: true })).toBeVisible();
  const downloadButton = page.getByRole("button", { name: "Download 4:5", exact: true });
  await expect(downloadButton).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    downloadButton.click(),
  ]);
  const downloadPath = info.outputPath("downloaded-score-card.png");
  await download.saveAs(downloadPath);
  const png = await readFile(downloadPath);
  expect(png.readUInt32BE(16)).toBe(1080);
  expect(png.readUInt32BE(20)).toBe(1350);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("download-poster-fallback.png"), fullPage: true, animations: "disabled" });
});

test("route changes synchronize canonical, Open Graph, and X metadata", async ({ page }) => {
  await seedResult(page, "download");
  await page.goto("/library?source=share-test");

  await expect(page).toHaveTitle("Library — BeatScape");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/library$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Library — BeatScape");
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /Browse owned AI originals/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", /\/library$/);
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", "Library — BeatScape");
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute("content", /Browse owned AI originals/);

  await page.goto("/track/bs-s1-01?source=share-test");
  await expect(page).toHaveTitle("Neon Pulse — BeatScape AI Original");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Neon Pulse — BeatScape AI Original");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", /\/track\/bs-s1-01$/);

  await page.goto("/results?run=local");
  await expect(page).toHaveTitle("B on Neon Pulse — BeatScape");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "B on Neon Pulse — BeatScape");
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /82,400 points · 82.4% accuracy/);

  await page.goto("/leaderboard");
  await expect(page).toHaveTitle("Local Leaderboard — BeatScape");
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", "Local Leaderboard — BeatScape");
});
