import { useEffect, useMemo, useState } from "react";
import { Link } from "../router";
import { assetUrl, loadCatalog } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import { loadFavorites } from "../storage/settings";
import { DistrictBadge } from "../components/DistrictBadge";
import { SCAPE_COPY, districtColor } from "../constants/scape";

export function LibraryPage() {
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [district, setDistrict] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    void loadCatalog().then((c) => setTracks(c.tracks));
    setFavorites(loadFavorites());
  }, []);

  const genres = useMemo(() => [...new Set(tracks.map((t) => t.genre))].sort(), [tracks]);
  const districts = useMemo(() => [...new Set(tracks.map((t) => t.district))].sort(), [tracks]);

  const filtered = tracks.filter((t) => {
    if (genre && t.genre !== genre) return false;
    if (district && t.district !== district) return false;
    if (favOnly && !favorites.includes(t.track_id)) return false;
    if (!q) return true;
    const hay = `${t.title} ${t.artist} ${t.district} ${t.tags.join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <section className="library">
      <h1>Library</h1>
      <p className="tagline">Search the Scape — filter by genre, district, or favorites.</p>
      <div className="filters">
        <input placeholder="Search tracks…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">All districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <label>
          <input type="checkbox" checked={favOnly} onChange={(e) => setFavOnly(e.target.checked)} /> Favorites
        </label>
      </div>
      <div className="track-grid">
        {filtered.length === 0 && (
          <p className="library-empty">
            {favOnly ? SCAPE_COPY.emptyFavorites : "No tracks match your filters."}
          </p>
        )}
        {filtered.map((t) => (
          <Link key={t.track_id} to={`/track/${t.track_id}`} className="track-card">
            <div
              className="track-card-cover-wrap"
              style={{ ["--district-color" as string]: districtColor(t.district) }}
            >
              <img src={assetUrl(t.cover)} alt="" />
            </div>
            <div>
              <strong>{t.title}</strong>
              <span>
                {t.artist} · {t.bpm} BPM · {t.genre}
              </span>
              <DistrictBadge district={t.district} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
