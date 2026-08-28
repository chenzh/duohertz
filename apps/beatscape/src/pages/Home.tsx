import { useEffect, useState } from "react";
import { Link } from "../router";
import { assetUrl, loadCatalog } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import { FEATURED_TRACK_IDS, SCAPE_COPY, SCAPE_COPY_EXTRA } from "../constants/scape";
import { HeroGameplayPreview } from "../components/HeroGameplayPreview";
import { firstPlayHref } from "../lib/firstPlay";
import { dailyPlayHref, getDailyChallenge } from "../lib/dailyChallenge";
import { trackEvent } from "../lib/analytics";

const KEYS = ["D", "F", "J", "K"] as const;

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
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);

  useEffect(() => {
    trackEvent("home_view");
    void loadCatalog().then((c) => setTracks(c.tracks));
  }, []);

  const heroTrack = tracks.find((t) => t.track_id === "bs-s1-01") ?? tracks[0];
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
            English pop &amp; EDM originals — hit Play and land in Neon Pulse in seconds. Calibrate anytime in Settings.
          </p>
          <div className="key-chips" aria-label="Keyboard lanes">
            {KEYS.map((k) => (
              <span key={k} className="key-chip">
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

        <div className="hero-visual">
          <HeroGameplayPreview />
          {featured.slice(0, 2).map((t, i) => (
            <div
              key={t.track_id}
              className="hero-cover-card hero-cover-card-float"
              style={{
                backgroundImage: `url(${assetUrl(t.cover)})`,
                zIndex: 2 - i,
              }}
            />
          ))}
        </div>
      </div>

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
    </section>
  );
}
