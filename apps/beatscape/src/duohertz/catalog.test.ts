import { afterEach, describe, expect, it, vi } from "vitest";
import { clearApprovedDuohertzCatalogCache, loadApprovedDuohertzCatalog, loadDuohertzCatalog, loadDuohertzChart, parseDuohertzCatalog } from "./catalog";
import { loadApprovedDuohertzTrack } from "./approvedTrack";
import { publicCatalogTrackCards } from "./trackCards";

const genres = ["Melodic House", "Synthwave", "Future Bass", "Drum & Bass", "Trance"] as const;
const hash = "a".repeat(64);

function fixture() {
  return {
    version: 2,
    brand: "duohertz",
    source_observations_sha256: hash,
    source_catalog_signoff_sha256: hash,
    site_and_deployment_approval: false,
    tracks: Array.from({ length: 105 }, (_, index) => {
      const trackId = `dh-${String(index + 1).padStart(3, "0")}-original`;
      const base = `/catalog/${trackId}`;
      return {
        track_id: trackId, title: `Original ${index + 1}`, artist: "duohertz studio",
        genre: genres[Math.floor(index / 21)], bpm: 120,
        duration_sec: 60, stream_duration_sec: 120,
        theme: "duohertz", chart_format: 2, rights: "signed_catalog_candidate",
        audio: `${base}/audio.m4a`, stream_audio: `${base}/stream.m4a`,
        preview: `${base}/preview_48s.m4a`, cover: `${base}/cover-art.png`,
        cover_thumb: `${base}/cover-thumb.webp`, cover_thumb_sha256: hash, og: `${base}/og.png`,
        charts: { easy: `${base}/easy.json`, standard: `${base}/standard.json`, hard: `${base}/hard.json` },
        manifest_sha256: hash,
      };
    }),
  };
}

afterEach(() => {
  clearApprovedDuohertzCatalogCache();
  vi.unstubAllGlobals();
});

describe("duohertz v2 catalog boundary", () => {
  it("accepts the complete staged shape without treating it as site approval", () => {
    const catalog = parseDuohertzCatalog(fixture());
    expect(catalog.tracks).toHaveLength(105);
    expect(catalog.site_and_deployment_approval).toBe(false);
    expect(catalog.tracks[0].cover).toBe("/catalog/dh-001-original/cover-art.png");
    expect(catalog.tracks[0].cover_thumb).toBe("/catalog/dh-001-original/cover-thumb.webp");
  });

  it("rejects legacy, incomplete, mixed-brand, or unsafe staging data", () => {
    const legacy = fixture();
    legacy.version = 1;
    expect(() => parseDuohertzCatalog(legacy)).toThrow(/v2 catalog/);

    const incomplete = fixture();
    incomplete.tracks.pop();
    expect(() => parseDuohertzCatalog(incomplete)).toThrow(/complete/);

    const mixed = fixture();
    mixed.tracks[0].theme = "beatscape";
    expect(() => parseDuohertzCatalog(mixed)).toThrow(/catalog track/);

    const wrongQuota = fixture();
    wrongQuota.tracks[0].genre = "Trance";
    expect(() => parseDuohertzCatalog(wrongQuota)).toThrow(/21 tracks/);

    const unsafePath = fixture();
    unsafePath.tracks[0].audio = "/catalog/../legacy/audio.m4a";
    expect(() => parseDuohertzCatalog(unsafePath)).toThrow(/audio path/);

    const unsafeThumbnail = fixture();
    unsafeThumbnail.tracks[0].cover_thumb = "/catalog/../legacy/cover-thumb.webp";
    expect(() => parseDuohertzCatalog(unsafeThumbnail)).toThrow(/cover_thumb path/);
  });

  it("loads only format 2 charts matching the selected track and tier", async () => {
    const track = parseDuohertzCatalog(fixture()).tracks[0];
    const chart = {
      format: 2, theme: "duohertz", track_id: track.track_id, tier: "easy",
      input_count: 1, bpm: track.bpm, audio_offset_ms: 0,
      total_notes: 1, notes: [{ id: "tap-1", type: "tap", t: 1, key: 0 }],
    };
    const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ...chart, format: 1 })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...chart, track_id: "dh-002-other" })))
      .mockResolvedValueOnce(new Response(JSON.stringify(chart)));
    vi.stubGlobal("fetch", request);
    await expect(loadDuohertzChart(track, "easy", "/beatscape/")).rejects.toThrow(/format 2/);
    await expect(loadDuohertzChart(track, "easy", "/beatscape/")).rejects.toThrow(/identity mismatch/);
    await expect(loadDuohertzChart(track, "easy", "/beatscape/")).resolves.toMatchObject({ track_id: track.track_id });
    expect(request).toHaveBeenCalledWith("/beatscape/catalog/dh-001-original/easy.json");
  });

  it("rejects a chart offset or note beyond its audio duration", async () => {
    const track = parseDuohertzCatalog(fixture()).tracks[0];
    const chart = {
      format: 2, theme: "duohertz", track_id: track.track_id, tier: "easy",
      input_count: 1, bpm: track.bpm, audio_offset_ms: 0,
      total_notes: 1, notes: [{ id: "tap-1", type: "tap", t: 1, key: 0 }],
    };
    const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ...chart, audio_offset_ms: 40 })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...chart, notes: [{ ...chart.notes[0], t: 61 }] })));
    vi.stubGlobal("fetch", request);
    await expect(loadDuohertzChart(track, "easy", "/beatscape/")).rejects.toThrow(/timing exceeds/);
    await expect(loadDuohertzChart(track, "easy", "/beatscape/")).rejects.toThrow(/timing exceeds/);
  });

  it("fetches and validates a v2 catalog independently of the legacy loader", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture())));
    vi.stubGlobal("fetch", request);
    await expect(loadDuohertzCatalog("/v2/catalog.json")).resolves.toMatchObject({ version: 2, brand: "duohertz" });
    expect(request).toHaveBeenCalledWith("/v2/catalog.json");
  });

  it("refuses a staged catalog before a public player can load its tracks", async () => {
    const staged = fixture();
    const approved = fixture();
    approved.site_and_deployment_approval = true;
    const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(staged)))
      .mockResolvedValueOnce(new Response(JSON.stringify(approved)));
    vi.stubGlobal("fetch", request);
    await expect(loadApprovedDuohertzCatalog("/v2/catalog.json")).rejects.toThrow(/not been approved/);
    await expect(loadApprovedDuohertzCatalog("/v2/catalog.json")).resolves.toMatchObject({
      version: 2, brand: "duohertz", site_and_deployment_approval: true,
    });
  });

  it("shares one approved catalog request per page session and refreshes after a manual retry", async () => {
    const approved = fixture();
    approved.site_and_deployment_approval = true;
    const request = vi.fn(() => Promise.resolve(new Response(JSON.stringify(approved))));
    vi.stubGlobal("fetch", request);
    const first = loadApprovedDuohertzCatalog("/v2/catalog.json");
    const second = loadApprovedDuohertzCatalog("/v2/catalog.json");
    expect(first).toBe(second);
    await Promise.all([first, second]);
    await loadApprovedDuohertzCatalog("/v2/catalog.json");
    expect(request).toHaveBeenCalledTimes(1);
    clearApprovedDuohertzCatalogCache("/v2/catalog.json");
    await loadApprovedDuohertzCatalog("/v2/catalog.json");
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not fetch charts for an unapproved or missing public track", async () => {
    const staged = fixture();
    const approved = fixture();
    approved.site_and_deployment_approval = true;
    const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(staged)))
      .mockResolvedValueOnce(new Response(JSON.stringify(approved)));
    vi.stubGlobal("fetch", request);
    await expect(loadApprovedDuohertzTrack("/v2/catalog.json", staged.tracks[0].track_id, "/beatscape/"))
      .rejects.toThrow(/not been approved/);
    await expect(loadApprovedDuohertzTrack("/v2/catalog.json", "dh-999-missing", "/beatscape/"))
      .rejects.toThrow(/track is missing/);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("resolves only the selected approved track and its three matching charts", async () => {
    const approved = fixture();
    approved.site_and_deployment_approval = true;
    const track = approved.tracks[0];
    const request = vi.fn(async (url: string) => {
      if (url === "/v2/catalog.json") return new Response(JSON.stringify(approved));
      const tier = url.match(/\/(easy|standard|hard)\.json$/)?.[1];
      if (!tier) return new Response(null, { status: 404 });
      const notes = tier === "easy" ? [{ id: "left", type: "tap", t: 1, key: 0 }]
        : tier === "hard" ? [{ id: "both", type: "chord", t: 1, keys: [0, 1] }]
        : [{ id: "left", type: "tap", t: 1, key: 0 }, { id: "right", type: "tap", t: 2, key: 1 }];
      return new Response(JSON.stringify({
        format: 2, theme: "duohertz", track_id: track.track_id, tier,
        input_count: tier === "easy" ? 1 : 2, bpm: track.bpm, audio_offset_ms: 0,
        total_notes: notes.length === 1 && tier === "hard" ? 2 : notes.length, notes,
      }));
    });
    vi.stubGlobal("fetch", request);
    const playable = await loadApprovedDuohertzTrack("/v2/catalog.json", track.track_id, "/beatscape/");
    expect(playable).toMatchObject({
      id: track.track_id,
      audioUrl: `/beatscape/catalog/${track.track_id}/audio.m4a`,
      coverUrl: `/beatscape/catalog/${track.track_id}/cover-art.png`,
      charts: { easy: { input_count: 1 }, standard: { input_count: 2 }, hard: { input_count: 2 } },
    });
    expect(request).toHaveBeenCalledTimes(4);
  });

  it("keeps staged tracks out of a public grid until site approval is explicit", () => {
    const staged = fixture();
    const trackHref = (id: string) => `/track/${id}`;
    expect(() => publicCatalogTrackCards(staged, trackHref, "/beatscape/")).toThrow(/staged/);

    const incomplete = fixture();
    incomplete.tracks.pop();
    incomplete.site_and_deployment_approval = true;
    expect(() => publicCatalogTrackCards(incomplete, trackHref, "/beatscape/")).toThrow(/complete/);

    const approved = fixture();
    approved.site_and_deployment_approval = true;
    const cards = publicCatalogTrackCards(approved, trackHref, "/beatscape/",
      (id) => `/radio?track=${encodeURIComponent(id)}`);
    expect(cards).toHaveLength(105);
    expect(cards[0]).toMatchObject({
      coverUrl: "/beatscape/catalog/dh-001-original/cover-thumb.webp",
      href: "/track/dh-001-original",
      actionLabel: "Play track",
      radioHref: "/radio?track=dh-001-original",
    });
  });
});
