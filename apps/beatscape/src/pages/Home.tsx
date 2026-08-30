import { useEffect, useMemo, useState } from "react";
import { Link } from "../router";
import { assetUrl, loadCatalog } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import { FEATURED_TRACK_IDS, SCAPE_COPY, SCAPE_COPY_EXTRA } from "../constants/scape";
import { CHARACTER_LIST } from "../constants/scape";
import { HomeHeroPlay } from "../components/HomeHeroPlay";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { FIRST_PLAY_TRACK_ID, INTRO_TRACK_ID, firstPlayHref } from "../lib/firstPlay";
import { dailyPlayHref, getDailyChallenge } from "../lib/dailyChallenge";
import { trackEvent } from "../lib/analytics";
import { keyLabels } from "../input/keyMap";
import { isOnboarded, loadKeys, setOnboarded } from "../storage/settings";
import { HOME_PAGE_META, usePageMeta } from "../seo/pageMeta";

function FeaturedCard({ track }: { track: CatalogTrack }) {
  const preview = track.preview ?? track.audio;
  return (
    <div className="trend-card-wrap">
      <Link to={`/track/${track.track_id}`} className="trend-card">
        <div className="trend-cover" style={{ backgroundImage: `url(${assetUrl(track.cover)})` }}>
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
      <audio className="trend-preview-audio" controls preload="none" src={assetUrl(preview)} aria-label={`Preview ${track.title}`} />
    </div>
  );
}

export function HomePage() {
  usePageMeta(HOME_PAGE_META);
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);
  const [showIntro, setShowIntro] = useState(() => !isOnboarded());
  const keys = useMemo(() => keyLabels(loadKeys()), []);

  useEffect(() => {
    trackEvent("home_view");
    void loadCatalog().then((c) => setTracks(c.tracks));
  }, []);

  const introTrack = tracks.find((t) => t.track_id === INTRO_TRACK_ID) ?? null;

  const dismissIntro = () => {
    setOnboarded();
    setShowIntro(false);
    trackEvent("intro_dismiss");
  };

  const heroTrack = tracks.find((t) => t.track_id === FIRST_PLAY_TRACK_ID) ?? tracks[0];
  const featured = FEATURED_TRACK_IDS.map((id) => tracks.find((t) => t.track_id === id)).filter(
    Boolean,
  ) as CatalogTrack[];
  const featuredSet = new Set<string>(FEATURED_TRACK_IDS);
  const explore = tracks.filter((t) => !featuredSet.has(t.track_id));
  const daily = getDailyChallenge(tracks.map((t) => t.track_id));
  const dailyTrack = daily ? tracks.find((t) => t.track_id === daily.trackId) : null;

  return (
    <section className="home">
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
              Browse tracks
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

      <section className="meet-characters" aria-label="BeatScape characters">
        <div className="section-head">
          <h2>Meet the Districts</h2>
          <Link to="/characters" className="section-link">
            All characters
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
          <h2>Featured in the Scape</h2>
          <Link to="/library" className="section-link">
            See all
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
            <h2>Explore the city</h2>
          </div>
          <div className="trending-scroll">
            {explore.map((t) => (
              <Link key={t.track_id} to={`/track/${t.track_id}`} className="trend-card">
                <div className="trend-cover" style={{ backgroundImage: `url(${assetUrl(t.cover)})` }}>
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
                <div
                  className="home-intro-cover"
                  style={{ backgroundImage: `url(${assetUrl(introTrack.cover)})` }}
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
