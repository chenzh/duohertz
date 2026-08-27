import { useEffect, useMemo, useState } from "react";
import { Link } from "../router";
import { assetUrl, loadCatalog } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import { LIBRARY_PAGE_META, usePageMeta } from "../seo/pageMeta";
import { loadFavorites } from "../storage/settings";

const BEGINNER_TAG = "Beginner Pick";

export function LibraryPage() {
  usePageMeta(LIBRARY_PAGE_META);
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    void loadCatalog().then((c) => setTracks(c.tracks));
    setFavorites(loadFavorites());
  }, []);

  const genres = useMemo(() => [...new Set(tracks.map((t) => t.genre))], [tracks]);

  const filtered = tracks.filter((t) => {
    if (genre && t.genre !== genre) return false;
    if (favOnly && !favorites.includes(t.track_id)) return false;
    if (!q) return true;
    const hay = `${t.title} ${t.artist} ${t.tags.join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <section className="library">
      <h1>Library</h1>
      <p className="tagline">Default path: Casual · Easy · no HP fail</p>
      <div className="filters">
        <input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <label>
          <input type="checkbox" checked={favOnly} onChange={(e) => setFavOnly(e.target.checked)} /> Favorites
        </label>
      </div>
      <div className="track-grid">
        {filtered.map((t) => (
          <Link key={t.track_id} to={`/track/${t.track_id}`} className="track-card">
            <img src={assetUrl(t.cover)} alt="" />
            <div>
              <strong>{t.title}</strong>
              {t.tags.includes(BEGINNER_TAG) && <span className="badge beginner">Beginner Pick</span>}
              <span>
                {t.artist} · {t.bpm} BPM · {t.genre}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
