import { useEffect, useState } from "react";
import { Link } from "../router";
import { assetUrl, loadCatalog } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import { isOnboarded } from "../storage/settings";

export function HomePage() {
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);

  useEffect(() => {
    void loadCatalog().then((c) => setTracks(c.tracks));
  }, []);

  const featured = tracks.filter((t) =>
    ["bs-s1-01", "bs-s1-02", "bs-s1-05"].includes(t.track_id),
  );
  const playNow = tracks.find((t) => t.track_id === "bs-s1-01");

  return (
    <section className="home">
      <h1>Feel the Beat, Own the Scape.</h1>
      {!isOnboarded() ? (
        <p className="tagline">New here? Tap Play Now — calibrate, then try Glass Horizon first.</p>
      ) : (
        <p className="tagline">English pop & EDM rhythm game · Owned AI originals</p>
      )}
      <div className="cta-row">
        {playNow && (
          <Link
            className="btn primary"
            to={isOnboarded() ? `/play/${playNow.track_id}?tier=standard&mode=arcade` : "/calibrate"}
          >
            Play Now — D F J K
          </Link>
        )}
        <Link className="btn" to="/library">
          Enter Library
        </Link>
      </div>
      <h2>Featured</h2>
      <div className="track-grid">
        {featured.map((t) => (
          <Link key={t.track_id} to={`/track/${t.track_id}`} className="track-card">
            <img src={assetUrl(t.cover)} alt="" />
            <div>
              <strong>{t.title}</strong>
              <span>{t.artist}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
