import type { CatalogJSON, CatalogTrack } from "../types/catalog";
import type { ChartJSON, ChartTier } from "../types/chart";

let cache: CatalogJSON | null = null;
let pendingCatalog: Promise<CatalogJSON> | null = null;
const chartCache = new Map<string, ChartJSON>();
const pendingCharts = new Map<string, Promise<ChartJSON>>();

export async function loadCatalog(): Promise<CatalogJSON> {
  if (cache) return cache;
  if (!pendingCatalog) {
    pendingCatalog = (async () => {
      const base = import.meta.env.BASE_URL;
      // Must exactly match the index.html preload (<link rel=preload
      // as=fetch>, no crossorigin) or the preload is wasted. WebKit does not
      // reuse cors-mode preloads for fetch() (bugs 236009/268370/284067);
      // same-origin no-cors + credentials:"include" is the only combination
      // that dedupes across Chromium/Firefox/WebKit. Staleness is still
      // guarded by the server's max-age=0, must-revalidate (Cloudflare Pages
      // default for non-hashed assets), which forces a 304 revalidation.
      const res = await fetch(`${base}catalog.json`, {
        mode: "no-cors",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load catalog");
      cache = (await res.json()) as CatalogJSON;
      return cache;
    })().finally(() => { pendingCatalog = null; });
  }
  return pendingCatalog;
}

export async function getTrack(trackId: string): Promise<CatalogTrack | undefined> {
  const cat = await loadCatalog();
  return cat.tracks.find((t) => t.track_id === trackId);
}

export async function loadChart(track: CatalogTrack, tier: ChartTier): Promise<ChartJSON> {
  const base = import.meta.env.BASE_URL;
  const path = track.charts[tier].replace(/^\//, "");
  const url = `${base}${path}`;
  const cached = chartCache.get(url);
  if (cached) return cached;

  let pending = pendingCharts.get(url);
  if (!pending) {
    pending = (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Chart ${tier} missing for ${track.track_id}`);
      const chart = (await res.json()) as ChartJSON;
      chartCache.set(url, chart);
      return chart;
    })().finally(() => { pendingCharts.delete(url); });
    pendingCharts.set(url, pending);
  }
  return pending;
}

export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, "")}`;
}
