import { useEffect } from "react";
import type { ChartTier, PlayMode } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";

export const DEFAULT_PAGE_META = {
  title: "BeatScape — Feel the Beat, Own the Scape",
  description:
    "Feel the Beat, Own the Scape. English pop & EDM browser rhythm game with owned AI originals.",
};

export type PageMeta = {
  title: string;
  description: string;
};

export function setPageMeta(meta: PageMeta): void {
  document.title = meta.title;
  let el = document.querySelector('meta[name="description"]');
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", "description");
    document.head.appendChild(el);
  }
  el.setAttribute("content", meta.description);
}

export function buildPlayPageMeta(
  track: CatalogTrack,
  tier: ChartTier,
  mode: PlayMode,
): PageMeta {
  const seoDesc =
    track.seo?.description ?? `Own the Scape. ${track.bpm} BPM ${track.genre} chart.`;
  return {
    title: `Play ${track.title} — BeatScape`,
    description: `${track.title} · ${tier} · ${mode}. ${seoDesc} Feel the Beat, Own the Scape.`,
  };
}

export function usePageMeta(meta: PageMeta | null): void {
  useEffect(() => {
    if (!meta) return;
    setPageMeta(meta);
    return () => setPageMeta(DEFAULT_PAGE_META);
  }, [meta?.title, meta?.description]);
}
