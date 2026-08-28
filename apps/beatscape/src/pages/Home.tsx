import { useEffect, useState } from "react";
import { Link } from "../router";
import { assetUrl, loadCatalog } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import { HOME_PAGE_META, usePageMeta } from "../seo/pageMeta";
import { isOnboarded } from "../storage/settings";

const BEGINNER_TAG = "Beginner Pick";
const GUIDE_TRACK = "bs-s1-02";

function playUrl(track: CatalogTrack) {
  return `/play/${track.track_id}?tier=easy&mode=casual`;
}

export function HomePage() {
  usePageMeta(HOME_PAGE_META);
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);

  useEffect(() => {
    void loadCatalog().then((c) => setTracks(c.tracks));
  }, []);

  const featured = tracks.filter((t) =>
    ["bs-s1-01", "bs-s1-02", "bs-s1-05"].includes(t.track_id),
  );
  const playNow =
    tracks.find((t) => t.track_id === GUIDE_TRACK) ?? tracks.find((t) => t.tags.includes(BEGINNER_TAG)) ?? tracks[0];

  return (
    <section className="home">
      <h1>Feel the Beat, Own the Scape.</h1>
      {!isOnboarded() ? (
        <p className="tagline">New here? Tap Play Now — tap the beat, then try Glass Horizon in Casual Easy.</p>
      ) : (
        <p className="tagline">English pop & EDM rhythm game · Owned AI originals · Casual Easy by default</p>
      )}
      <div className="cta-row">
        {playNow && (
          <Link
            className="btn primary"
            to={isOnboarded() ? playUrl(playNow) : "/calibrate"}
          >
            Play Now — D F J K
          </Link>
        )}
        <Link className="btn" to="/library">
          Enter Library
        </Link>
        {playNow && (
          <Link className="btn" to={`/play/${playNow.track_id}?tier=easy&mode=practice`}>
            Practice (slow on miss)
          </Link>
        )}
      </div>
      <h2>Featured</h2>
      <div className="track-grid">
        {featured.map((t) => (
          <Link key={t.track_id} to={`/track/${t.track_id}`} className="track-card">
            <img src={assetUrl(t.cover)} alt="" />
            <div>
              <strong>{t.title}</strong>
              {t.tags.includes(BEGINNER_TAG) && <span className="badge beginner">Beginner Pick</span>}
              <span>{t.artist}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
