import { useEffect } from "react";
import { canonicalPathname, normalizeAppBase } from "../lib/appBase";
import type { ChartTier, PlayMode } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";

const APP_BASE = normalizeAppBase(import.meta.env.BASE_URL);

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
    "Adjust global offset, hitsound, lane keys, and note speed. Scores and preferences stay on this device. Feel the Beat, Own the Scape.",
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

export const LEADERBOARD_PAGE_META: PageMeta = {
  title: "Local Leaderboard — BeatScape",
  description:
    "Compare your best BeatScape scores and today's challenge runs on this device. No account or global upload required.",
};

export const DAILY_LEADERBOARD_PAGE_META: PageMeta = {
  title: "Daily Challenge Board — BeatScape",
  description:
    "Replay today's BeatScape challenge and compare your best runs on this device. No account or global upload required.",
};

export const RESULTS_PAGE_META: PageMeta = {
  title: "Run Results — BeatScape",
  description:
    "Review your score, timing, misses, and next practice move, then share a playable BeatScape challenge.",
};

/**
 * Social preview tags for one route (T1b). Kept pure and exported so it can be
 * asserted without a DOM — `setPageMeta` only applies the result.
 *
 * Scope note: crawlers that build link previews do not run JS, so these updates
 * serve in-app share sheets and clients that re-read the live DOM. The static
 * tags in `index.html` remain the source for the initial unfurl.
 */
export function socialMetaTags(
  meta: PageMeta,
  url: string,
): Array<{ attr: "property" | "name"; key: string; content: string }> {
  return [
    { attr: "property", key: "og:title", content: meta.title },
    { attr: "property", key: "og:description", content: meta.description },
    { attr: "property", key: "og:url", content: url },
    { attr: "name", key: "twitter:title", content: meta.title },
    { attr: "name", key: "twitter:description", content: meta.description },
  ];
}

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
    const url = `${window.location.origin}${canonicalPathname(window.location.pathname, APP_BASE)}`;
    link.setAttribute("href", url);
    // T1b: keep og:/twitter: in step with the route instead of always advertising Home.
    for (const tag of socialMetaTags(meta, url)) {
      const sel = `meta[${tag.attr}="${tag.key}"]`;
      let node = document.querySelector(sel);
      if (!node) {
        node = document.createElement("meta");
        node.setAttribute(tag.attr, tag.key);
        document.head.appendChild(node);
      }
      node.setAttribute("content", tag.content);
    }
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

export function buildTrackPageMeta(track: CatalogTrack): PageMeta {
  return {
    title: track.seo?.title ?? `${track.title} by ${track.artist} — BeatScape`,
    description:
      `${track.seo?.description ?? `${track.bpm} BPM ${track.genre} AI original.`} ` +
      "Choose a chart and play solo or Duo in your browser.",
  };
}

export function buildResultsPageMeta(run: {
  title: string;
  artist: string;
  grade: string;
  score: number;
  accuracy: number;
  maxCombo: number;
}): PageMeta {
  return {
    title: `${run.grade} on ${run.title} — BeatScape`,
    description:
      `${run.score.toLocaleString("en-US")} points · ${run.accuracy}% accuracy · ` +
      `${run.maxCombo} max combo on ${run.title} by ${run.artist}. Play the challenge in your browser.`,
  };
}

export function usePageMeta(meta: PageMeta | null): void {
  useEffect(() => {
    if (!meta) return;
    setPageMeta(meta);
    return () => setPageMeta(DEFAULT_PAGE_META);
  }, [meta?.title, meta?.description]);
}
