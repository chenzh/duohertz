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
  complete(new Response(JSON.stringify({ tracks: [{ track_id: "track-1" }] })));
  expect((await first).tracks).toHaveLength(1);
  expect((await hero)?.track_id).toBe("track-1");
  await loadCatalog();
  expect(request).toHaveBeenCalledTimes(1);
});

test("a failed shared request does not poison a later retry", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response("offline", { status: 503 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ tracks: [] }))));
  const { loadCatalog } = await import("./loadCatalog");
  await expect(loadCatalog()).rejects.toThrow("Failed to load catalog");
  await expect(loadCatalog()).resolves.toEqual({ tracks: [] });
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
    .mockResolvedValueOnce(new Response(JSON.stringify({ track_id: "track-1", tier: "hard", notes: [] }))));
  const { loadChart } = await import("./loadCatalog");
  const track = {
    track_id: "track-1",
    charts: { easy: "/easy.json", standard: "/standard.json", hard: "/hard.json" },
  } as CatalogTrack;

  await expect(loadChart(track, "hard")).rejects.toThrow("Chart hard missing");
  await expect(loadChart(track, "hard")).resolves.toMatchObject({ tier: "hard" });
  expect(fetch).toHaveBeenCalledTimes(2);
});
