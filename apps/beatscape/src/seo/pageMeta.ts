import { useEffect } from "react";
import type { ChartTier, PlayMode } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";

export const DEFAULT_PAGE_META = {
  title: "BeatScape — Feel the Beat, Own the Scape",
  description:
    "English pop & EDM browser rhythm game with AI originals. No account, no ads. Scores stay in your browser. Feel the Beat, Own the Scape.",
};

export type PageMeta = {
  title: string;
  description: string;
};

export const HOME_PAGE_META: PageMeta = DEFAULT_PAGE_META;

export const LIBRARY_PAGE_META: PageMeta = {
  title: "Library — BeatScape",
  description:
    "Browse owned AI originals. Filter by night-drive vibe, groove, battle energy, or genre. Feel the Beat, Own the Scape.",
};

export const CHARACTERS_PAGE_META: PageMeta = {
  title: "Meet NIGHTSHIFT — BeatScape",
  description:
    "Meet JUNO, ATLAS and TORQUE: three musicians keeping a pirate radio station alive, one borrowed speaker and one late-night call at a time.",
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

export const PROFILE_PAGE_META: PageMeta = {
  title: "Profile — BeatScape",
  description:
    "Your honor rank, achievements, and play stats — stored on this device only. Feel the Beat, Own the Scape.",
};

export const RADIO_PAGE_META: PageMeta = {
  title: "The Late Static — BeatScape",
  description:
    "Read The Late Static's weekly broadcasts: late-night calls, borrowed gear, and the arguments that keep NIGHTSHIFT together. Start with the playable First shift.",
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
  // Canonical per route (gap doc 5-3): keeps SPA URLs crawl-consistent.
  if (typeof window !== "undefined") {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", `${window.location.origin}${window.location.pathname}`);
  }
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
