import { useMemo } from "react";
import { allPlaylists, type PlaylistKind } from "../lib/playlists";
import { navigate, playlistHref } from "../router";

const KIND_ORDER: Array<{ kind: PlaylistKind; title: string; sub?: string }> = [
  { kind: "vibe", title: "Radio Columns", sub: "The Late Static programming, by vibe." },
  { kind: "tag", title: "Station Picks" },
  { kind: "genre", title: "By Genre" },
  { kind: "district", title: "By District", sub: "Seven blocks, seven frequencies." },
];

export function Playlists() {
  const playlists = useMemo(() => allPlaylists(), []);

  return (
    <div className="page">
      <h1 className="page-title">Shows</h1>
      <p className="page-sub">
        The Late Static programming — columns, picks and block frequencies. All derived from the
        catalog, refreshed with every drop.
      </p>

      {KIND_ORDER.map(({ kind, title, sub }) => {
        const lists = playlists.filter((p) => p.kind === kind);
        if (lists.length === 0) return null;
        return (
          <section key={kind} className="pl-section">
            <h2 className="section-title">{title}</h2>
            {sub && <p className="section-sub">{sub}</p>}
            <div className="pl-grid">
              {lists.map((p) => (
                <button
                  key={p.id}
                  className="pl-card"
                  onClick={() => navigate(playlistHref(p.id))}
                  style={p.color ? { borderTopColor: p.color } : undefined}
                >
                  <span className="pl-kind">{kind}</span>
                  <span className="pl-name">{p.name}</span>
                  <span className="pl-blurb">{p.blurb}</span>
                  <span className="pl-count">{p.trackIds.length} tracks</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
