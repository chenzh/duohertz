import { useEffect, useState } from "react";
import { Link } from "../router";
import { assetUrl, loadCatalog } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import { isOnboarded } from "../storage/settings";

const KEYS = ["D", "F", "J", "K"] as const;

function playHref(track: CatalogTrack, onboarded: boolean) {
  if (!onboarded) return "/calibrate";
  return `/play/${track.track_id}?tier=${track.default_tier}&mode=${track.default_mode}`;
}

export function HomePage() {
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);
  const onboarded = isOnboarded();

  useEffect(() => {
    void loadCatalog().then((c) => setTracks(c.tracks));
  }, []);

  const heroTrack = tracks.find((t) => t.track_id === "bs-s1-01") ?? tracks[0];
  const stackTracks = tracks.filter((t) =>
    ["bs-s1-01", "bs-s1-02", "bs-s1-05"].includes(t.track_id),
  );
  const trending = tracks.length ? tracks : [];

  return (
    <section className="home">
      <div className="hero-split">
        <div className="hero-copy">
          <p className="eyebrow">AI originals · 4-lane rhythm · play in browser</p>
          <h1>
            Feel the Beat.
            <br />
            Own the Scape.
          </h1>
          <p className="tagline">
            {onboarded
              ? "English pop & EDM originals built for the lane."
              : "New here? Hit Play — calibrate once, then try Glass Horizon."}
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
              <Link className="btn primary" to={playHref(heroTrack, onboarded)}>
                Play Now
              </Link>
            )}
            <Link className="btn ghost" to="/library">
              Browse tracks
            </Link>
          </div>
        </div>

        <div className="hero-visual" aria-hidden={!stackTracks.length}>
          {stackTracks.map((t, i) => (
            <div
              key={t.track_id}
              className="hero-cover-card"
              style={{
                backgroundImage: `url(${assetUrl(t.cover)})`,
                zIndex: stackTracks.length - i,
              }}
            />
          ))}
        </div>
      </div>

      <section className="trending-section">
        <div className="section-head">
          <h2>Trending now</h2>
          <Link to="/library" className="section-link">
            See all
          </Link>
        </div>
        <div className="trending-scroll">
          {trending.map((t) => (
            <Link key={t.track_id} to={`/track/${t.track_id}`} className="trend-card">
              <div className="trend-cover" style={{ backgroundImage: `url(${assetUrl(t.cover)})` }}>
                <span className="trend-bpm">{t.bpm} BPM</span>
              </div>
              <div className="trend-meta">
                <strong>{t.title}</strong>
                <span>{t.artist}</span>
                <div className="tier-chips">
                  <span className="chip">Easy</span>
                  <span className="chip">Std</span>
                  <span className="chip">Hard</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
