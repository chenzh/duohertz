import { appHref, normalizeAppBase } from "../lib/appBase";
import { loadApprovedDuohertzCatalog, loadDuohertzChart } from "./catalog";
import type { DuohertzPlayableTrack } from "./Game";

/** Resolve one real v2 track for the shared game, never a development candidate. */
export async function loadApprovedDuohertzTrack(catalogUrl: string, trackId: string,
  base = import.meta.env.BASE_URL): Promise<DuohertzPlayableTrack> {
  const catalog = await loadApprovedDuohertzCatalog(catalogUrl);
  const track = catalog.tracks.find((item) => item.track_id === trackId);
  if (!track) throw new Error(`duohertz track is missing: ${trackId}`);
  const appBase = normalizeAppBase(base);
  const assetBase = `${appBase}/`;
  const [easy, standard, hard] = await Promise.all([
    loadDuohertzChart(track, "easy", assetBase),
    loadDuohertzChart(track, "standard", assetBase),
    loadDuohertzChart(track, "hard", assetBase),
  ]);
  return {
    id: track.track_id,
    title: track.title,
    audioUrl: appHref(track.audio, appBase),
    coverUrl: appHref(track.cover, appBase),
    coverThumbUrl: appHref(track.cover_thumb, appBase),
    coverAlt: `${track.title} cover art`,
    durationMs: Math.round(track.duration_sec * 1000),
    charts: { easy, standard, hard },
  };
}
