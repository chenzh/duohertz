import { readFileSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const stagedRoot = new URL("../candidates/duohertz/", import.meta.url);
const latestDirectory = readdirSync(stagedRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^dh-\d{3}-/.test(entry.name))
  .map((entry) => entry.name).sort().at(-1);
if (!latestDirectory) throw new Error("No duohertz development candidates");
const candidateRoot = new URL(`${latestDirectory}/`, stagedRoot);
const manifest = JSON.parse(readFileSync(new URL("manifest.json", candidateRoot), "utf8"));
const easy = JSON.parse(readFileSync(new URL("easy.json", candidateRoot), "utf8"));
const standard = JSON.parse(readFileSync(new URL("standard.json", candidateRoot), "utf8"));
type EasyNote = { type: "tap" | "hold"; t: number; end?: number; key: 0 };
const playedEasyNotes = (easy.notes as EasyNote[]).slice(0, 4);
type DuoNote = { type: "tap" | "hold"; t: number; end?: number; key: 0 | 1 };
const playedDuoNotes = ([0, 1] as const).map((key) => {
  const note = (standard.notes as DuoNote[]).find((entry) => entry.key === key);
  if (!note) throw new Error(`Standard candidate has no playable note for key ${key}`);
  return note;
}).sort((a, b) => a.t - b.t);
const duoTotals = [0, 1].map((key) => standard.notes.reduce((total: number, note: { type: string; key: number; keys?: number[] }) =>
  total + Number(note.type === "chord" ? note.keys?.includes(key) : note.key === key), 0));

test("latest candidate scores real Easy input and completes its full audio", async ({ page }) => {
  test.setTimeout((manifest.duration_sec + 20) * 1000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: `${manifest.title} · ${manifest.duration_sec}s candidate` }).click();
  const audio = page.waitForResponse((response) => response.url().includes(`${latestDirectory}/audio.m4a`));
  await page.getByRole("button", { name: "Play track with sound" }).click();
  expect((await audio).status()).toBe(200);
  for (const note of playedEasyNotes) {
    await page.waitForFunction((target) => {
      const readout = document.querySelector(".dh-lab__readout span")?.textContent ?? "0";
      return parseFloat(readout) >= target - 0.06;
    }, note.t);
    await page.keyboard.down("Space");
    if (note.type === "hold" && note.end !== undefined) {
      await page.waitForFunction((target) => {
        const readout = document.querySelector(".dh-lab__readout span")?.textContent ?? "0";
        return parseFloat(readout) >= target - 0.06;
      }, note.end);
    } else {
      await page.waitForTimeout(35);
    }
    await page.keyboard.up("Space");
  }
  await expect(page.locator(".dh-lab__readout")).toContainText(`${playedEasyNotes.length}/${easy.total_notes} notes`);
  await expect(page.locator(".dh-lab__readout")).toContainText(/[1-9]\d*% accuracy/);
  await expect(page.getByRole("status").filter({ hasText: "Track complete. Your result is below." }))
    .toBeVisible({ timeout: (manifest.duration_sec + 5) * 1000 });
  await expect(page.locator(".dh-lab__readout")).toContainText(`${easy.total_notes}/${easy.total_notes} notes`);
  await expect(page.locator(".dh-lab__readout")).toContainText(`${manifest.duration_sec.toFixed(1)} / ${manifest.duration_sec.toFixed(1)} s`);
  expect(errors).toEqual([]);
});

test("latest candidate completes a full Duo run with independent player totals", async ({ page }) => {
  test.setTimeout((manifest.duration_sec + 20) * 1000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/beatscape/lab/duohertz");
  await page.getByRole("button", { name: `${manifest.title} · ${manifest.duration_sec}s candidate` }).click();
  await page.getByRole("button", { name: "Duo · two players" }).click();
  const audio = page.waitForResponse((response) => response.url().includes(`${latestDirectory}/audio.m4a`));
  await page.getByRole("button", { name: "Play track with sound" }).click();
  expect((await audio).status()).toBe(200);
  for (const note of playedDuoNotes) {
    await page.waitForFunction((target) => {
      const readout = document.querySelector(".dh-lab__readout span")?.textContent ?? "0";
      return parseFloat(readout) >= target - 0.06;
    }, note.t);
    const key = note.key === 0 ? "f" : "j";
    await page.keyboard.down(key);
    if (note.type === "hold" && note.end !== undefined) {
      await page.waitForFunction((target) => {
        const readout = document.querySelector(".dh-lab__readout span")?.textContent ?? "0";
        return parseFloat(readout) >= target - 0.06;
      }, note.end);
    } else {
      await page.waitForTimeout(35);
    }
    await page.keyboard.up(key);
  }
  await expect(page.getByRole("region", { name: "Player 1 result" })).toContainText(/[1-9]\d*% accuracy/);
  await expect(page.getByRole("region", { name: "Player 2 result" })).toContainText(/[1-9]\d*% accuracy/);
  await expect(page.getByRole("status").filter({ hasText: "Track complete. Your result is below." }))
    .toBeVisible({ timeout: (manifest.duration_sec + 5) * 1000 });
  await expect(page.getByRole("region", { name: "Player 1 result" })).toContainText(`${duoTotals[0]}/${duoTotals[0]} notes`);
  await expect(page.getByRole("region", { name: "Player 2 result" })).toContainText(`${duoTotals[1]}/${duoTotals[1]} notes`);
  await expect(page.locator(".dh-lab__readout")).toContainText(`${manifest.duration_sec.toFixed(1)} / ${manifest.duration_sec.toFixed(1)} s`);
  expect(errors).toEqual([]);
});
