import { useMemo, useState } from "react";
import {
  filterTracks,
  GENRES,
  TRACKS,
  VIBES,
  type SortKey,
  type Vibe,
} from "../lib/catalog";
import { TrackRow } from "../components/TrackRow";

export function Library() {
  const [query, setQuery] = useState("");
  const [vibe, setVibe] = useState<Vibe | "all">("all");
  const [genre, setGenre] = useState<string | "all">("all");
  const [sort, setSort] = useState<SortKey>("catalog");

  const list = useMemo(() => filterTracks({ query, vibe, genre, sort }), [query, vibe, genre, sort]);
  const ids = useMemo(() => list.map((t) => t.track_id), [list]);

  return (
    <div className="page">
      <h1 className="page-title">Library</h1>
      <p className="page-sub">
        The full station shelf — {TRACKS.length} owned originals, full length, no covers of
        anybody's catalog but ours.
      </p>

      <input
        className="search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search title, artist or district…"
        aria-label="Search tracks"
      />

      <div className="chiprow" role="group" aria-label="Filter by vibe">
        <button className={`chip ${vibe === "all" ? "is-on" : ""}`} onClick={() => setVibe("all")}>
          All vibes
        </button>
        {VIBES.map((v) => (
          <button
            key={v.id}
            className={`chip ${vibe === v.id ? "is-on" : ""}`}
            style={vibe === v.id ? { borderColor: v.color, color: v.color } : undefined}
            onClick={() => setVibe(v.id)}
            title={v.blurb}
          >
            {v.column}
          </button>
        ))}
      </div>

      <div className="chiprow" role="group" aria-label="Filter by genre">
        <button className={`chip ${genre === "all" ? "is-on" : ""}`} onClick={() => setGenre("all")}>
          All genres
        </button>
        {GENRES.map((g) => (
          <button
            key={g}
            className={`chip ${genre === g ? "is-on" : ""}`}
            onClick={() => setGenre(g)}
          >
            {g}
          </button>
        ))}
        <select
          className="sortsel"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort tracks"
        >
          <option value="catalog">Catalog order</option>
          <option value="title">Title A–Z</option>
          <option value="artist">Artist A–Z</option>
          <option value="bpm">BPM low → high</option>
          <option value="duration">Longest first</option>
        </select>
      </div>

      <p className="count">
        {list.length} track{list.length === 1 ? "" : "s"}
      </p>

      <div className="tracklist">
        {list.map((t, i) => (
          <TrackRow key={t.track_id} track={t} queueIds={ids} index={i} label="Library" />
        ))}
      </div>
      {list.length === 0 && (
        <p className="empty">
          Static{query ? ` — nothing on the board matches “${query}”` : ""}. Try another
          frequency.
        </p>
      )}
    </div>
  );
}
