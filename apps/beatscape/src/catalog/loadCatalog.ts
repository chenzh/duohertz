import type { CatalogJSON, CatalogTrack } from "../types/catalog";
import type { ChartJSON, ChartTier } from "../types/chart";

let cache: CatalogJSON | null = null;

export async function loadCatalog(): Promise<CatalogJSON> {
  if (cache) return cache;
  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}catalog.json`);
  if (!res.ok) throw new Error("Failed to load catalog");
  cache = (await res.json()) as CatalogJSON;
  return cache;
}

export async function getTrack(trackId: string): Promise<CatalogTrack | undefined> {
  const cat = await loadCatalog();
  return cat.tracks.find((t) => t.track_id === trackId);
}

export async function loadChart(track: CatalogTrack, tier: ChartTier): Promise<ChartJSON> {
  const base = import.meta.env.BASE_URL;
  const path = track.charts[tier].replace(/^\//, "");
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`Chart ${tier} missing for ${track.track_id}`);
  return (await res.json()) as ChartJSON;
}

export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, "")}`;
}
