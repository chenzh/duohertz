import { afterEach, expect, test, vi } from "vitest";
import type { CatalogTrack } from "../types/catalog";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

test("concurrent catalog consumers share one request and reuse the result", async () => {
  let complete!: (value: Response) => void;
  const request = vi.fn(() => new Promise<Response>(resolve => { complete = resolve; }));
  vi.stubGlobal("fetch", request);
  const { loadCatalog, getTrack } = await import("./loadCatalog");
  const first = loadCatalog();
  const hero = getTrack("track-1");
  expect(request).toHaveBeenCalledTimes(1);
  complete(new Response(JSON.stringify({ version: 1, tracks: [{ track_id: "track-1", theme: "beatscape" }] })));
  expect((await first).tracks).toHaveLength(1);
  expect((await hero)?.track_id).toBe("track-1");
  await loadCatalog();
  expect(request).toHaveBeenCalledTimes(1);
});

test("a failed shared request does not poison a later retry", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response("offline", { status: 503 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ version: 1, tracks: [] }))));
  const { loadCatalog } = await import("./loadCatalog");
  await expect(loadCatalog()).rejects.toThrow("Failed to load catalog");
  await expect(loadCatalog()).resolves.toEqual({ version: 1, tracks: [] });
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("legacy catalog loader rejects duohertz v2 and retries without caching it", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ version: 2, brand: "duohertz", tracks: [] })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ version: 1, tracks: [] }))));
  const { loadCatalog } = await import("./loadCatalog");
  await expect(loadCatalog()).rejects.toThrow(/BeatScape v1 catalog/);
  await expect(loadCatalog()).resolves.toMatchObject({ version: 1, tracks: [] });
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("chart preview and gameplay share one cached request", async () => {
  const payload = {
    track_id: "track-1",
    tier: "easy",
    format: 1,
    bpm: 120,
    audio_offset_ms: 0,
    ar: 24,
    total_notes: 0,
    notes: [],
  };
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload)));
  vi.stubGlobal("fetch", request);
  const { loadChart } = await import("./loadCatalog");
  const track = {
    track_id: "track-1",
    charts: { easy: "/easy.json", standard: "/standard.json", hard: "/hard.json" },
  } as CatalogTrack;

  const [preview, gameplay] = await Promise.all([
    loadChart(track, "easy"),
    loadChart(track, "easy"),
  ]);
  expect(preview).toEqual(payload);
  expect(gameplay).toBe(preview);
  await loadChart(track, "easy");
  expect(request).toHaveBeenCalledTimes(1);
});

test("a failed chart preview can retry", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response("offline", { status: 503 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ track_id: "track-1", tier: "hard", format: 1, notes: [] }))));
  const { loadChart } = await import("./loadCatalog");
  const track = {
    track_id: "track-1",
    charts: { easy: "/easy.json", standard: "/standard.json", hard: "/hard.json" },
  } as CatalogTrack;

  await expect(loadChart(track, "hard")).rejects.toThrow("Chart hard missing");
  await expect(loadChart(track, "hard")).resolves.toMatchObject({ tier: "hard" });
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("legacy chart loader rejects format 2 and retries format 1", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ track_id: "track-1", tier: "easy", format: 2, theme: "duohertz" })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ track_id: "track-1", tier: "easy", format: 1 }))));
  const { loadChart } = await import("./loadCatalog");
  const track = { track_id: "track-1", charts: { easy: "/easy.json" } } as CatalogTrack;
  await expect(loadChart(track, "easy")).rejects.toThrow(/BeatScape format 1 chart/);
  await expect(loadChart(track, "easy")).resolves.toMatchObject({ format: 1 });
  expect(fetch).toHaveBeenCalledTimes(2);
});
