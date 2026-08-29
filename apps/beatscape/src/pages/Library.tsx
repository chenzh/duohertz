import { useEffect, useMemo, useState } from "react";
import { Link } from "../router";
import { assetUrl, loadCatalog } from "../catalog/loadCatalog";
import {
  TRACK_VIBES,
  VIBE_HINTS,
  VIBE_LABELS,
  isBeginnerTrack,
  resolveTrackVibe,
  trackHasVocals,
} from "../catalog/trackVibe";
import type { CatalogTrack, TrackVibe } from "../types/catalog";
import { loadFavorites } from "../storage/settings";
import { DistrictBadge } from "../components/DistrictBadge";
import { VibeBadge } from "../components/VibeBadge";
import { SCAPE_COPY, districtColor, SHOWCASE_TRACK_IDS } from "../constants/scape";
import { LIBRARY_PAGE_META, usePageMeta } from "../seo/pageMeta";

export function LibraryPage() {
  usePageMeta(LIBRARY_PAGE_META);
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [vibe, setVibe] = useState<TrackVibe | "">("");
  const [beginnerOnly, setBeginnerOnly] = useState(false);
  const [vocalsOnly, setVocalsOnly] = useState(false);
  const [favOnly, setFavOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    void loadCatalog().then((c) => setTracks(c.tracks));
    setFavorites(loadFavorites());
  }, []);

  const genres = useMemo(() => [...new Set(tracks.map((t) => t.genre))].sort(), [tracks]);

  const filtered = tracks.filter((t) => {
    if (genre && t.genre !== genre) return false;
    if (vibe && resolveTrackVibe(t) !== vibe) return false;
    if (beginnerOnly && !isBeginnerTrack(t)) return false;
    if (vocalsOnly && !trackHasVocals(t)) return false;
    if (favOnly && !favorites.includes(t.track_id)) return false;
    if (!q) return true;
    const v = resolveTrackVibe(t);
    const hay = `${t.title} ${t.artist} ${t.district} ${t.genre} ${VIBE_LABELS[v]} ${t.tags.join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <section className="library">
      <header className="page-header">
        <h1>Library</h1>
        <p className="tagline">Find your scape — filter by vibe, genre, or mood.</p>
        {tracks.length > 0 && <span className="page-count">{filtered.length} of {tracks.length} tracks</span>}
      </header>

      <div className="showcase-chips">
        <span className="chip">Showcase charts:</span>
        {SHOWCASE_TRACK_IDS.map((id) => {
          const t = tracks.find((tr) => tr.track_id === id);
          if (!t) return null;
          return (
            <Link key={id} to={`/track/${id}`} className="chip chip-link">
              {t.title}
            </Link>
          );
        })}
      </div>

      <div className="filter-chips" role="group" aria-label="Vibe">
        <span className="filter-chips-label">Vibe</span>
        <button
          type="button"
          className={`filter-chip ${vibe === "" ? "active" : ""}`}
          aria-pressed={vibe === ""}
          onClick={() => setVibe("")}
        >
          All
        </button>
        {TRACK_VIBES.map((v) => (
          <button
            key={v}
            type="button"
            className={`filter-chip vibe-${v} ${vibe === v ? "active" : ""}`}
            aria-pressed={vibe === v}
            title={VIBE_HINTS[v]}
            onClick={() => setVibe(vibe === v ? "" : v)}
          >
            {VIBE_LABELS[v]}
          </button>
        ))}
      </div>

      <div className="filter-chips filter-chips-secondary" role="group" aria-label="Quick filters">
        <button
          type="button"
          className={`filter-chip ${beginnerOnly ? "active" : ""}`}
          aria-pressed={beginnerOnly}
          onClick={() => setBeginnerOnly((b) => !b)}
        >
          Beginner
        </button>
        <button
          type="button"
          className={`filter-chip ${vocalsOnly ? "active" : ""}`}
          aria-pressed={vocalsOnly}
          onClick={() => setVocalsOnly((v) => !v)}
        >
          With vocals
        </button>
        <button
          type="button"
          className={`filter-chip ${favOnly ? "active" : ""}`}
          aria-pressed={favOnly}
          onClick={() => setFavOnly((f) => !f)}
        >
          Favorites
        </button>
      </div>

      <div className="filters-bar">
        <input placeholder="Search tracks…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Genre">
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
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
              <img src={assetUrl(t.cover)} alt="" loading="lazy" />
            </div>
            <div>
              <strong>{t.title}</strong>
              <span>
                {t.artist} · {t.bpm} BPM · {t.genre}
              </span>
              <div className="track-card-badges">
                <VibeBadge vibe={resolveTrackVibe(t)} />
                <DistrictBadge district={t.district} />
                {isBeginnerTrack(t) && <span className="chip">Beginner</span>}
                {trackHasVocals(t) && <span className="chip">Vocals</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
