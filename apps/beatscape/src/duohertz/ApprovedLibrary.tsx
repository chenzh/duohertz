import { useEffect, useState } from "react";
import { useSearchParams } from "../router";
import { clearApprovedDuohertzCatalogCache, loadApprovedDuohertzCatalog } from "./catalog";
import { DuohertzTrackGrid } from "./TrackGrid";
import { DUOHERTZ_GENRES, publicCatalogTrackCards, type DuohertzTrackCard } from "./trackCards";
import { DUOHERTZ_LIBRARY_BATCH_SIZE, libraryShownCount } from "./libraryDepth";
import "./hub.css";
import "./shell.css";

type LibraryState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; tracks: DuohertzTrackCard[] };
const GENRES = ["All sounds", ...DUOHERTZ_GENRES] as const;

/** Uses the approved v2 artifact only; candidate manifests are never imported. */
export function DuohertzApprovedLibrary({ catalogUrl, playHref, radioHref }: {
  catalogUrl: string;
  playHref: (id: string) => string;
  radioHref: string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<LibraryState>({ kind: "loading" });
  const genre = GENRES.find((choice) => choice === searchParams.get("style")) ?? "All sounds";
  const query = (searchParams.get("q") ?? "").slice(0, 80);
  const shownCount = libraryShownCount(searchParams.get("show"));

  function updateSearch(key: "q" | "style", value: string) {
    const next = new URLSearchParams(searchParams);
    if (value.trim() && value !== "All sounds") next.set(key, value);
    else next.delete(key);
    next.delete("show");
    setSearchParams(next);
  }

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    void loadApprovedDuohertzCatalog(catalogUrl)
      .then((catalog) => {
        if (!cancelled) setState({ kind: "ready", tracks: publicCatalogTrackCards(catalog, playHref,
          import.meta.env.BASE_URL, (id) => `${radioHref}?track=${encodeURIComponent(id)}`) });
      })
      .catch(() => { if (!cancelled) setState({ kind: "error" }); });
    return () => { cancelled = true; };
  }, [catalogUrl, playHref, radioHref, retry]);

  const search = query.trim().toLowerCase();
  const visibleTracks = state.kind === "ready" ? state.tracks.filter((track) =>
    (genre === "All sounds" || track.genre === genre)
    && (!search || track.title.toLowerCase().includes(search) || track.id.toLowerCase().includes(search))) : [];
  const shownTracks = visibleTracks.slice(0, shownCount);
  const returnParams = new URLSearchParams();
  if (query.trim()) returnParams.set("q", query);
  if (genre !== "All sounds") returnParams.set("style", genre);
  if (shownCount > DUOHERTZ_LIBRARY_BATCH_SIZE) returnParams.set("show", String(shownCount));
  const context = returnParams.toString();
  const linkedTracks = context ? shownTracks.map((track) => ({
    ...track, href: `${track.href}${track.href.includes("?") ? "&" : "?"}${context}`,
  })) : shownTracks;

  return <section className="dh-library">
    <div className="dh-section__head dh-library__head">
      <p className="dh-section__eyebrow">duohertz / ELECTRONIC SOUNDS</p>
      <h1 className="dh-section__title">Choose your beat</h1>
      {state.kind === "ready" && <span className="dh-section__meta">{state.tracks.length} tracks · one or two keys</span>}
    </div>
    {state.kind === "loading" && <p className="dh-status" role="status">Loading the music library…</p>}
    {state.kind === "error" && <div className="dh-error" role="alert">
      <p>The duohertz music library is not available yet.</p>
      <button type="button" onClick={() => {
        clearApprovedDuohertzCatalogCache(catalogUrl);
        setRetry((current) => current + 1);
      }}>Try again</button>
    </div>}
    {state.kind === "ready" && <>
      <div className="dh-discovery">
        <label className="dh-search">
          <span>Find a beat</span>
          <input type="search" value={query} maxLength={80} onChange={(event) => updateSearch("q", event.target.value)}
            placeholder="Search title or track ID" autoComplete="off" />
        </label>
        <p className="dh-result-count" role="status">Showing {shownTracks.length} of {visibleTracks.length} {visibleTracks.length === 1 ? "match" : "matches"} · {state.tracks.length} total</p>
      </div>
      <div className="dh-filters" role="group" aria-label="Filter music style">
        {GENRES.map((choice) => <button key={choice} type="button" className="dh-filter" aria-pressed={genre === choice}
          onClick={() => updateSearch("style", choice)}>{choice}</button>)}
      </div>
      {visibleTracks.length === 0 && <p className="dh-empty">No tracks match. Try another title, track ID, or music style.</p>}
      <DuohertzTrackGrid tracks={linkedTracks} />
      {shownTracks.length < visibleTracks.length && <div className="dh-more">
        <button type="button" onClick={() => {
          const next = new URLSearchParams(searchParams);
          next.set("show", String(Math.min(shownCount + DUOHERTZ_LIBRARY_BATCH_SIZE, 105)));
          setSearchParams(next);
        }}>Show {Math.min(DUOHERTZ_LIBRARY_BATCH_SIZE, visibleTracks.length - shownTracks.length)} more tracks</button>
      </div>}
    </>}
  </section>;
}
