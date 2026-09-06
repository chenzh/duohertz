import { afterEach, expect, test, vi } from "vitest";

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
