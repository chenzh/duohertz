import { useEffect, useState } from "react";
import { Link } from "../router";
import { assetUrl, loadCatalog } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import { isOnboarded } from "../storage/settings";
import { FEATURED_TRACK_IDS, SCAPE_COPY } from "../constants/scape";

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
  const featured = FEATURED_TRACK_IDS.map((id) => tracks.find((t) => t.track_id === id)).filter(
    Boolean,
  ) as CatalogTrack[];
  const featuredSet = new Set<string>(FEATURED_TRACK_IDS);
  const explore = tracks.filter((t) => !featuredSet.has(t.track_id));

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
                {SCAPE_COPY.playNow}
              </Link>
            )}
            <Link className="btn ghost" to="/library">
              Browse tracks
            </Link>
          </div>
        </div>

        <div className="hero-visual" aria-hidden={!featured.length}>
          {featured.map((t, i) => (
            <div
              key={t.track_id}
              className="hero-cover-card"
              style={{
                backgroundImage: `url(${assetUrl(t.cover)})`,
                zIndex: featured.length - i,
              }}
            />
          ))}
        </div>
      </div>

      <section className="trending-section">
        <div className="section-head">
          <h2>Featured in the Scape</h2>
          <Link to="/library" className="section-link">
            See all
          </Link>
        </div>
        <div className="trending-scroll">
          {featured.map((t) => (
            <Link key={t.track_id} to={`/track/${t.track_id}`} className="trend-card">
              <div className="trend-cover" style={{ backgroundImage: `url(${assetUrl(t.cover)})` }}>
                <span className="trend-bpm">{t.bpm} BPM</span>
              </div>
              <div className="trend-meta">
                <strong>{t.title}</strong>
                <span>{t.artist}</span>
                <div className="tier-chips">
                  <span className="chip">{t.district}</span>
                </div>
              </div>
            </Link>
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
