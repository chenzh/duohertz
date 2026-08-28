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

export const HOME_PAGE_META: PageMeta = DEFAULT_PAGE_META;

export const LIBRARY_PAGE_META: PageMeta = {
  title: "Library — BeatScape",
  description:
    "Browse owned AI originals. Search tracks, filter by genre, and save favorites. Feel the Beat, Own the Scape.",
};

export const CALIBRATION_PAGE_META: PageMeta = {
  title: "Calibration — BeatScape",
  description:
    "Tap D F J K on each lane flash across 8 beats. Save your timing offset or skip to play. Feel the Beat, Own the Scape.",
};

export const SETTINGS_PAGE_META: PageMeta = {
  title: "Settings — BeatScape",
  description:
    "Adjust global offset, hitsound, lane keys, and casual speed. Scores and preferences stay on this device. Feel the Beat, Own the Scape.",
};

export const PRIVACY_PAGE_META: PageMeta = {
  title: "Privacy — BeatScape",
  description:
    "BeatScape stores play records, scores, and settings in your browser only. No account, no ad trackers, no server upload in Stage1–3. Feel the Beat, Own the Scape.",
};

export const TERMS_PAGE_META: PageMeta = {
  title: "Terms of Use — BeatScape",
  description:
    "BeatScape browser rhythm game terms: owned AI originals, acceptable use, and entertainment disclaimer. Feel the Beat, Own the Scape.",
};

export const NOT_FOUND_PAGE_META: PageMeta = {
  title: "Page Not Found — BeatScape",
  description:
    "This page does not exist. Return to BeatScape home or browse the library. Feel the Beat, Own the Scape.",
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
