import { useEffect, useMemo, useState } from "react";
import { Link } from "../router";
import { getMessages } from "../i18n";
import { assetUrl } from "../catalog/loadCatalog";
import { useCatalog } from "../catalog/useCatalog";
import type { CatalogTrack } from "../types/catalog";
import { FEATURED_TRACK_IDS, SCAPE_COPY, SCAPE_COPY_EXTRA } from "../constants/scape";
import { CHARACTER_LIST } from "../constants/scape";
import { HomeHeroPlay } from "../components/HomeHeroPlay";
import { AudioBar } from "../components/AudioBar";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { useReveal } from "../components/useReveal";
import { FIRST_PLAY_TRACK_ID, INTRO_TRACK_ID, firstPlayHref } from "../lib/firstPlay";
import { dailyPlayHref, getDailyChallenge } from "../lib/dailyChallenge";
import { trackEvent } from "../lib/analytics";
import { RADIO_EPISODES } from "../data/radioEpisodes";
import { episodeIndexAt } from "../lib/radio";
import { keyLabels } from "../input/keyMap";
import { isOnboarded, loadKeys, setOnboarded } from "../storage/settings";
import { readLastRun } from "../storage/session";
import { HOME_PAGE_META, usePageMeta } from "../seo/pageMeta";

/** the Hush marks a block after 48h without music (World Bible §4) — same threshold for the radio welcome-back line. */
const QUIET_BLOCK_MS = 48 * 60 * 60 * 1000;

function FeaturedCard({ track }: { track: CatalogTrack }) {
  const preview = track.preview ?? track.audio;
  return (
    <div className="trend-card-wrap">
      <Link to={`/track/${track.track_id}`} className="trend-card">
        <div className="trend-cover">
          <img
            className="trend-cover-img"
            src={assetUrl(track.cover)}
            alt=""
            loading="lazy"
            decoding="async"
            width={512}
            height={512}
          />
          <span className="trend-bpm">{track.bpm} BPM</span>
        </div>
        <div className="trend-meta">
          <strong>{track.title}</strong>
          <span>{track.artist}</span>
          <div className="tier-chips">
            <span className="chip">{track.district}</span>
          </div>
        </div>
      </Link>
      <AudioBar className="trend-preview-audio" preload="none" src={assetUrl(preview)} label={`Preview ${track.title}`} />
    </div>
  );
}

export function HomePage() {
  usePageMeta(HOME_PAGE_META);
  // 曲库走统一的 useCatalog：取不到时有 error 状态，而不是 unhandled rejection + 空列表。
  const { tracks, error: catalogError } = useCatalog();
  const t = getMessages();
  const [showIntro, setShowIntro] = useState(() => !isOnboarded());
  const keys = useMemo(() => keyLabels(loadKeys()), []);

  useEffect(() => {
    trackEvent("home_view");
  }, []);

  const introTrack = tracks.find((t) => t.track_id === INTRO_TRACK_ID) ?? null;

  const dismissIntro = () => {
    setOnboarded();
    setShowIntro(false);
    trackEvent("intro_dismiss");
  };

  const heroTrack = tracks.find((t) => t.track_id === FIRST_PLAY_TRACK_ID) ?? tracks[0];
  const cameBackQuiet = useMemo(() => {
    const last = readLastRun();
    if (!last) return false;
    return Date.now() - new Date(last.endedAt).getTime() >= QUIET_BLOCK_MS;
  }, []);
  const onAir = RADIO_EPISODES[episodeIndexAt(Date.now())];
  const featured = FEATURED_TRACK_IDS.map((id) => tracks.find((t) => t.track_id === id)).filter(
    Boolean,
  ) as CatalogTrack[];
  const featuredSet = new Set<string>(FEATURED_TRACK_IDS);
  const explore = tracks.filter((t) => !featuredSet.has(t.track_id));
  const daily = getDailyChallenge(tracks.map((t) => t.track_id));
  const dailyTrack = daily ? tracks.find((t) => t.track_id === daily.trackId) : null;

  // Reveal the sections below the hero as you scroll. Keyed on tracks.length so
  // the blocks that only exist after the catalog resolves still get picked up.
  const homeRef = useReveal<HTMLElement>(
    tracks.length,
    ".radio-episode-banner, .meet-characters, .daily-challenge-banner, .trending-section",
  );

  return (
    <section className="home" ref={homeRef}>
      {catalogError && (
        <p className="catalog-error" role="alert">
          Couldn’t load the track list ({catalogError}). Check your connection — the catalog is served from the same site.
        </p>
      )}
      <div className="hero-split">
        <div className="hero-copy">
          <p className="eyebrow">{SCAPE_COPY.rightsShort} · 4-lane rhythm · play in browser</p>
          <h1>
            Feel the Beat.
            <br />
            Own the Scape.
          </h1>
          <p className="tagline">
            English pop &amp; EDM originals — tap Play on the right to hit Strike Vector with sound.
            Until then the lanes demo behind the mask. Calibrate anytime in Settings.
          </p>
          <div className="key-chips" aria-label="Keyboard lanes">
            {keys.map((k, i) => (
              <span key={i} className="key-chip">
                {k}
              </span>
            ))}
          </div>
          <div className="cta-row">
            {heroTrack && (
              <Link
                className="btn primary"
                to={firstPlayHref()}
                onClick={() => trackEvent("home_play_click", { track: heroTrack.track_id })}
              >
                {SCAPE_COPY.playNow}
              </Link>
            )}
            <Link className="btn ghost" to="/library">
              {t.ui.browseTracks}
            </Link>
            <Link className="btn ghost" to="/calibrate">
              Calibrate
            </Link>
          </div>
        </div>

        <div className="hero-visual hero-visual-play">
          <HomeHeroPlay />
        </div>
      </div>

      {cameBackQuiet && (
        <p className="radio-welcome">
          Your block went quiet for a while. Figured you&apos;d call eventually. —{" "}
          <strong>JUNO, The Late Static</strong>
        </p>
      )}

      {onAir && (
        <section className="radio-episode-banner" aria-label="On air now — The Late Static">
          <div>
            <p className="eyebrow">On air · The Late Static</p>
            <h2>{`EP ${onAir.ep} — ${onAir.title}`}</h2>
            <p className="tagline">{onAir.lines[0]}</p>
          </div>
          <Link className="btn ghost" to="/radio">
            Season program
          </Link>
        </section>
      )}

      <section className="meet-characters" aria-label="BeatScape characters">
        <div className="section-head">
          <h2>{t.ui.meetNightshift}</h2>
          <Link to="/characters" className="section-link">
            The crew
          </Link>
        </div>
        <div className="character-strip">
          {CHARACTER_LIST.map((c) => (
            <div key={c.code} className="character-strip-item" style={{ ["--district-color" as string]: c.color }}>
              <Link to="/characters" className="character-strip-link" aria-label={`${c.code} — ${c.district}`}>
                <CharacterAvatar district={c.district} size={72} />
                <span className="character-strip-code">{c.code}</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {daily && dailyTrack && (
        <section className="daily-challenge-banner">
          <div>
            <p className="eyebrow">{SCAPE_COPY_EXTRA.dailyChallenge}</p>
            <h2>{dailyTrack.title}</h2>
            <p className="tagline">
              {dailyTrack.artist} · {daily.tier} · {daily.mode} · {daily.dateKey}
            </p>
          </div>
          <Link
            className="btn primary"
            to={dailyPlayHref(daily)}
            onClick={() => trackEvent("daily_challenge_click", { track: daily.trackId })}
          >
            {SCAPE_COPY_EXTRA.dailyPlay}
          </Link>
        </section>
      )}

      <section className="trending-section">
        <div className="section-head">
          <h2>{t.ui.featuredInScape}</h2>
          <Link to="/library" className="section-link">
            {t.ui.seeAll}
          </Link>
        </div>
        <div className="trending-scroll">
          {featured.map((t) => (
            <FeaturedCard key={t.track_id} track={t} />
          ))}
        </div>
      </section>

      {explore.length > 0 && (
        <section className="trending-section">
          <div className="section-head">
            <h2>{t.ui.exploreCity}</h2>
          </div>
          <div className="trending-scroll">
            {explore.map((t) => (
              <Link key={t.track_id} to={`/track/${t.track_id}`} className="trend-card">
                <div className="trend-cover">
                  <img
                    className="trend-cover-img"
                    src={assetUrl(t.cover)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={512}
                    height={512}
                  />
                  <span className="trend-bpm">{t.bpm} BPM</span>
                </div>
                <div className="trend-meta">
                  <strong>{t.title}</strong>
                  <span>{t.artist}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showIntro && (
        <div className="home-intro-backdrop" role="dialog" aria-modal="true" aria-label={SCAPE_COPY.introTitle}>
          <div className="home-intro">
            <p className="eyebrow">{SCAPE_COPY.introTitle}</p>
            {introTrack && (
              <div className="home-intro-track">
              <img
                className="home-intro-cover"
                src={assetUrl(introTrack.cover)}
                alt=""
                loading="lazy"
                decoding="async"
                width={512}
                height={512}
                aria-hidden
              />
                <div className="home-intro-track-meta">
                  <strong>{introTrack.title}</strong>
                  <span>
                    {introTrack.artist} · Easy · Casual
                  </span>
                </div>
              </div>
            )}
            <p className="tagline">{SCAPE_COPY.introBody}</p>
            <div className="cta-row">
              <Link
                className="btn primary"
                to={firstPlayHref(introTrack ? introTrack.track_id : undefined)}
                onClick={() => {
                  setOnboarded();
                  setShowIntro(false);
                  trackEvent("intro_start", { track: introTrack ? introTrack.track_id : INTRO_TRACK_ID });
                }}
              >
                {SCAPE_COPY.introStart}
              </Link>
              <button type="button" className="btn ghost" onClick={dismissIntro}>
                {SCAPE_COPY.introDismiss}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
