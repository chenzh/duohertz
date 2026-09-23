import { describe, expect, it } from "vitest";
import type { CatalogTrack } from "../types/catalog";
import {
  buildPlayPageMeta,
  buildResultsPageMeta,
  buildTrackPageMeta,
  CALIBRATION_PAGE_META,
  DEFAULT_PAGE_META,
  HOME_PAGE_META,
  LIBRARY_PAGE_META,
  NOT_FOUND_PAGE_META,
  PRIVACY_PAGE_META,
  SETTINGS_PAGE_META,
  socialMetaTags,
  TERMS_PAGE_META,
} from "./pageMeta";

const baseTrack: CatalogTrack = {
  track_id: "bs-s1-01",
  title: "Neon Pulse",
  artist: "Lumen Grid",
  genre: "EDM",
  bpm: 160,
  duration_sec: 180,
  preset_id: "edm",
  engine: "beatscape",
  rights: "owned",
  theme: "beatscape",
  tags: ["edm"],
  district: "neon-district",
  default_mode: "arcade",
  default_tier: "standard",
  audio: "catalog/bs-s1-01/audio.m4a",
  cover: "catalog/bs-s1-01/cover.webp",
  charts: {
    easy: "catalog/bs-s1-01/easy.json",
    standard: "catalog/bs-s1-01/standard.json",
    hard: "catalog/bs-s1-01/hard.json",
  },
  seo: {
    title: "Neon Pulse — BeatScape AI Original",
    description: "Own the Scape. 160 BPM EDM chart.",
  },
};

describe("buildPlayPageMeta", () => {
  it("builds play title from track name", () => {
    const meta = buildPlayPageMeta(baseTrack, "standard", "arcade");
    expect(meta.title).toBe("Play Neon Pulse — BeatScape");
  });

  it("includes tier, mode, and catalog seo description", () => {
    const meta = buildPlayPageMeta(baseTrack, "hard", "casual");
    expect(meta.description).toContain("Neon Pulse · hard · casual.");
    expect(meta.description).toContain("Own the Scape. 160 BPM EDM chart.");
    expect(meta.description).toContain("Feel the Beat, Own the Scape.");
  });

  it("falls back when track has no seo block", () => {
    const { seo: _, ...noSeo } = baseTrack;
    const meta = buildPlayPageMeta(noSeo, "easy", "practice");
    expect(meta.title).toBe("Play Neon Pulse — BeatScape");
    expect(meta.description).toContain("Neon Pulse · easy · practice.");
    expect(meta.description).toContain("Own the Scape. 160 BPM EDM chart.");
    expect(meta.description).toContain("Feel the Beat, Own the Scape.");
  });

  it("treats explicit seo undefined the same as missing seo", () => {
    const trackWithoutSeo: CatalogTrack = { ...baseTrack, seo: undefined };
    const meta = buildPlayPageMeta(trackWithoutSeo, "standard", "arcade");
    expect(meta.title).toBe("Play Neon Pulse — BeatScape");
    expect(meta.description).toContain("Neon Pulse · standard · arcade.");
    expect(meta.description).toContain("Own the Scape. 160 BPM EDM chart.");
    expect(meta.description).toContain("Feel the Beat, Own the Scape.");
  });

  it("default site meta matches index.html title", () => {
    expect(DEFAULT_PAGE_META.title).toBe("BeatScape — Feel the Beat, Own the Scape");
  });
});

describe("shareable route meta", () => {
  it("builds a track selection preview from catalog SEO", () => {
    expect(buildTrackPageMeta(baseTrack)).toEqual({
      title: "Neon Pulse — BeatScape AI Original",
      description: "Own the Scape. 160 BPM EDM chart. Choose a chart and play solo or Duo in your browser.",
    });
  });

  it("builds an English-formatted result preview", () => {
    expect(buildResultsPageMeta({
      title: "Neon Pulse",
      artist: "Pulse Atlas",
      grade: "B",
      score: 82_400,
      accuracy: 82.4,
      maxCombo: 44,
    })).toEqual({
      title: "B on Neon Pulse — BeatScape",
      description: "82,400 points · 82.4% accuracy · 44 max combo on Neon Pulse by Pulse Atlas. Play the challenge in your browser.",
    });
  });
});

describe("HOME_PAGE_META", () => {
  it("sets home title matching index.html", () => {
    expect(HOME_PAGE_META.title).toBe("BeatScape — Feel the Beat, Own the Scape");
  });

  it("includes rhythm game semantics and site tagline", () => {
    expect(HOME_PAGE_META.description).toContain("English pop & EDM browser rhythm game");
    expect(HOME_PAGE_META.description).toContain("AI originals");
    expect(HOME_PAGE_META.description).toContain("Scores stay in your browser");
    expect(HOME_PAGE_META.description).toContain("Feel the Beat, Own the Scape.");
  });

  it("matches default site meta", () => {
    expect(HOME_PAGE_META).toBe(DEFAULT_PAGE_META);
  });
});

describe("LIBRARY_PAGE_META", () => {
  it("sets library title", () => {
    expect(LIBRARY_PAGE_META.title).toBe("Library — BeatScape");
  });

  it("includes browse semantics and site tagline", () => {
    expect(LIBRARY_PAGE_META.description).toContain("Browse owned AI originals");
    expect(LIBRARY_PAGE_META.description).toContain("Filter by");
    expect(LIBRARY_PAGE_META.description).toContain("Feel the Beat, Own the Scape.");
  });
});

describe("CALIBRATION_PAGE_META", () => {
  it("sets calibration title", () => {
    expect(CALIBRATION_PAGE_META.title).toBe("Calibration — BeatScape");
  });

  it("includes tap/offset semantics and site tagline", () => {
    expect(CALIBRATION_PAGE_META.description).toContain("Tap D F J K");
    expect(CALIBRATION_PAGE_META.description).toContain("timing offset");
    expect(CALIBRATION_PAGE_META.description).toContain("Feel the Beat, Own the Scape.");
  });
});

describe("SETTINGS_PAGE_META", () => {
  it("sets settings title", () => {
    expect(SETTINGS_PAGE_META.title).toBe("Settings — BeatScape");
  });

  it("includes calibration and local storage semantics", () => {
    expect(SETTINGS_PAGE_META.description).toContain("global offset");
    expect(SETTINGS_PAGE_META.description).toContain("hitsound");
    expect(SETTINGS_PAGE_META.description).toContain("stay on this device");
    expect(SETTINGS_PAGE_META.description).toContain("Feel the Beat, Own the Scape.");
  });
});

describe("LEGAL page meta", () => {
  it("sets privacy title and local-only semantics", () => {
    expect(PRIVACY_PAGE_META.title).toBe("Privacy — BeatScape");
    expect(PRIVACY_PAGE_META.description).toContain("browser only");
    expect(PRIVACY_PAGE_META.description).toContain("No account");
  });

  it("sets terms title and service semantics", () => {
    expect(TERMS_PAGE_META.title).toBe("Terms of Use — BeatScape");
    expect(TERMS_PAGE_META.description).toContain("browser rhythm game");
    expect(TERMS_PAGE_META.description).toContain("Feel the Beat, Own the Scape.");
  });
});

describe("NOT_FOUND_PAGE_META", () => {
  it("sets not-found title with site name", () => {
    expect(NOT_FOUND_PAGE_META.title).toBe("Page Not Found — BeatScape");
  });

  it("includes not-found semantics and site tagline", () => {
    expect(NOT_FOUND_PAGE_META.description).toContain("This page does not exist");
    expect(NOT_FOUND_PAGE_META.description).toContain("Feel the Beat, Own the Scape.");
  });
});

describe("socialMetaTags", () => {
  it("maps route title, description, and canonical URL to Open Graph and X tags", () => {
    expect(socialMetaTags(LIBRARY_PAGE_META, "https://beatscape.example/library")).toEqual([
      { attr: "property", key: "og:title", content: "Library — BeatScape" },
      { attr: "property", key: "og:description", content: LIBRARY_PAGE_META.description },
      { attr: "property", key: "og:url", content: "https://beatscape.example/library" },
      { attr: "name", key: "twitter:title", content: "Library — BeatScape" },
      { attr: "name", key: "twitter:description", content: LIBRARY_PAGE_META.description },
    ]);
  });
});
