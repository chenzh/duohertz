import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link, useSearchParams } from "../router";
import { assetUrl } from "../catalog/loadCatalog";
import { useCatalog } from "../catalog/useCatalog";
import { trackMatchesSearch } from "../catalog/trackSearch";
import {
  TRACK_VIBES,
  VIBE_HINTS,
  VIBE_LABELS,
  isBeginnerTrack,
  resolveTrackVibe,
  trackHasVocals,
} from "../catalog/trackVibe";
import type { TrackVibe } from "../types/catalog";
import { loadFavorites, toggleFavorite } from "../storage/settings";
import { loadShiftProgress } from "../lib/firstShift";
import { latestRunForTrackIds, loadRuns, runNeedsRetry } from "../lib/progress";
import { playHref, trackSetupHref } from "../lib/playHref";
import { curatedPicks } from "../data/curated";
import { CuratedRow } from "../components/CuratedRow";
import { DistrictBadge } from "../components/DistrictBadge";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { VibeBadge } from "../components/VibeBadge";
import { useReveal } from "../components/useReveal";
import { TrackGridSkeleton } from "../components/Skeletons";
import { SCAPE_COPY, districtColor, SHOWCASE_TRACK_IDS } from "../constants/scape";
import { LIBRARY_PAGE_META, usePageMeta } from "../seo/pageMeta";
import { CatalogErrorNotice } from "../components/CatalogErrorNotice";
import { AudioBar } from "../components/AudioBar";
import { libraryHrefForSearch, withLibraryReturn } from "../lib/libraryReturn";

const TRACK_BATCH_SIZE = 24;
type TrackSort = "title" | "bpm-desc" | "bpm-asc";
const VIBE_FILTERS: readonly (TrackVibe | "")[] = ["", ...TRACK_VIBES];

const LIBRARY_PARAM_KEYS = [
  "q",
  "genre",
  "vibe",
  "beginner",
  "vocals",
  "favorites",
  "sort",
  "returnTo",
] as const;

const TRACK_TITLE_COLLATOR = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

function trackSortFromParam(value: string | null): TrackSort {
  return value === "bpm-desc" || value === "bpm-asc" ? value : "title";
}

function trackVibeFromParam(value: string | null): TrackVibe | "" {
  return TRACK_VIBES.includes(value as TrackVibe) ? value as TrackVibe : "";
}

export function LibraryPage() {
  usePageMeta(LIBRARY_PAGE_META);
  const { tracks, loading, error: catalogError, retry: retryCatalog } = useCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialParams] = useState(() => new URLSearchParams(window.location.search));
  const [q, setQ] = useState(() => (initialParams.get("q") ?? "").slice(0, 120));
  const [genre, setGenre] = useState(() => initialParams.get("genre") ?? "");
  const [vibe, setVibe] = useState<TrackVibe | "">(() => trackVibeFromParam(initialParams.get("vibe")));
  const [beginnerOnly, setBeginnerOnly] = useState(() => initialParams.get("beginner") === "1");
  const [vocalsOnly, setVocalsOnly] = useState(() => initialParams.get("vocals") === "1");
  const [favOnly, setFavOnly] = useState(() => initialParams.get("favorites") === "1");
  const [sortMode, setSortMode] = useState<TrackSort>(() => trackSortFromParam(initialParams.get("sort")));
  const [visibleTrackLimit, setVisibleTrackLimit] = useState(TRACK_BATCH_SIZE);
  const trackGridRef = useRef<HTMLDivElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const pendingBatchFocusIndex = useRef<number | null>(null);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(
    () => window.matchMedia("(min-width: 641px)").matches,
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [runs] = useState(loadRuns);
  const secondaryFilterCount = Number(Boolean(genre))
    + Number(favOnly)
    + Number(Boolean(vibe))
    + Number(beginnerOnly)
    + Number(vocalsOnly)
    + Number(sortMode !== "title");
  // 上层推荐跟着本机 First Shift 进度走：没打完给入口曲，打完了给下一组。
  const [progress] = useState(loadShiftProgress);
  const curated = useMemo(() => curatedPicks(progress.completed.length), [progress.completed.length]);

  useEffect(() => {
    // 曲库加载交给 useCatalog；这里只负责收藏列表（同步读 localStorage）。
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 641px)");
    // A fast phone → desktop → phone resize can deliver an older change event
    // after the final viewport. Read the live query, not the event snapshot.
    const sync = () => setMoreFiltersOpen(desktop.matches);
    desktop.addEventListener("change", sync);
    return () => desktop.removeEventListener("change", sync);
  }, []);

  const genres = useMemo(() => [...new Set(tracks.map((t) => t.genre))].sort(), [tracks]);
  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);
  const latestRun = useMemo(
    () => latestRunForTrackIds(runs, tracks.map((track) => track.track_id)),
    [runs, tracks],
  );
  const latestTrack = latestRun
    ? tracks.find((track) => track.track_id === latestRun.track_id) ?? null
    : null;
  const latestNeedsRetry = latestRun ? runNeedsRetry(latestRun) : false;
  const normalizedQuery = q.trim().toLowerCase();
  const hasActiveFilters = Boolean(
    normalizedQuery || genre || vibe || beginnerOnly || vocalsOnly || favOnly,
  );
  const currentSearch = searchParams.toString();
  const discoverySearch = useMemo(() => {
    const params = new URLSearchParams(currentSearch);
    for (const key of LIBRARY_PARAM_KEYS) params.delete(key);
    if (normalizedQuery) params.set("q", normalizedQuery);
    if (genre) params.set("genre", genre);
    if (vibe) params.set("vibe", vibe);
    if (beginnerOnly) params.set("beginner", "1");
    if (vocalsOnly) params.set("vocals", "1");
    if (favOnly) params.set("favorites", "1");
    if (sortMode !== "title") params.set("sort", sortMode);
    return params.toString();
  }, [currentSearch, normalizedQuery, genre, vibe, beginnerOnly, vocalsOnly, favOnly, sortMode]);
  const libraryReturnHref = libraryHrefForSearch(discoverySearch);

  useEffect(() => {
    // A Library URL is a durable discovery state: reloading it or returning
    // from a track must restore the same query and controls. Replace (rather
    // than push) keeps typing and toggles out of the browser Back stack.
    if (currentSearch === discoverySearch) return;
    setSearchParams(new URLSearchParams(discoverySearch));
  }, [currentSearch, discoverySearch, setSearchParams]);

  useEffect(() => {
    // A stale shared URL should degrade to All genres once the current
    // catalog is known, rather than leaving the player at a false empty state.
    if (!loading && tracks.length > 0 && genre && !genres.includes(genre)) setGenre("");
  }, [genre, genres, loading, tracks.length]);

  const filtered = tracks.filter((t) => {
    if (genre && t.genre !== genre) return false;
    if (vibe && resolveTrackVibe(t) !== vibe) return false;
    if (beginnerOnly && !isBeginnerTrack(t)) return false;
    if (vocalsOnly && !trackHasVocals(t)) return false;
    if (favOnly && !favoriteIds.has(t.track_id)) return false;
    if (!normalizedQuery) return true;
    const v = resolveTrackVibe(t);
    return trackMatchesSearch(t, VIBE_LABELS[v], normalizedQuery);
  });
  const orderedTracks = [...filtered].sort((a, b) => {
    const titleOrder = TRACK_TITLE_COLLATOR.compare(a.title, b.title);
    if (sortMode === "bpm-desc") return b.bpm - a.bpm || titleOrder;
    if (sortMode === "bpm-asc") return a.bpm - b.bpm || titleOrder;
    return titleOrder;
  });
  const visibleTracks = orderedTracks.slice(0, visibleTrackLimit);
  const hiddenTrackCount = Math.max(0, filtered.length - visibleTracks.length);
  const nextTrackBatchSize = Math.min(TRACK_BATCH_SIZE, hiddenTrackCount);

  useEffect(() => {
    setVisibleTrackLimit(TRACK_BATCH_SIZE);
  }, [normalizedQuery, genre, vibe, beginnerOnly, vocalsOnly, favOnly, sortMode]);

  // Cards are rendered by router.Link, which doesn't forward arbitrary props,
  // so they're targeted by class. Re-scan only when the progressive slice grows
  // (or the catalog arrives); filter changes never strand unseen cards hidden.
  const libraryRef = useReveal<HTMLElement>(
    `${tracks.length}:${visibleTracks.length}`,
    ".track-card",
  );

  useEffect(() => {
    const focusIndex = pendingBatchFocusIndex.current;
    if (focusIndex === null || focusIndex >= visibleTracks.length) return;
    const nextTrack = trackGridRef.current
      ?.querySelectorAll<HTMLAnchorElement>(".track-card-link")
      .item(focusIndex);
    pendingBatchFocusIndex.current = null;
    nextTrack?.focus({ preventScroll: true });
    nextTrack?.scrollIntoView({ block: "center" });
  }, [visibleTracks.length]);

  const clearFilters = () => {
    setQ("");
    setGenre("");
    setVibe("");
    setBeginnerOnly(false);
    setVocalsOnly(false);
    setFavOnly(false);
  };

  const toggleFavoritesFilter = () => {
    setFavOnly((active) => !active);
    if (window.matchMedia("(max-width: 640px)").matches) setMoreFiltersOpen(false);
  };

  const handleVibeKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % VIBE_FILTERS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + VIBE_FILTERS.length) % VIBE_FILTERS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = VIBE_FILTERS.length - 1;
    }
    if (nextIndex === null) return;

    const nextVibe = VIBE_FILTERS[nextIndex];
    if (nextVibe === undefined) return;
    event.preventDefault();
    setVibe(nextVibe);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      .item(nextIndex)
      .focus();
  };

  const viewFilterResults = () => {
    setMoreFiltersOpen(false);
    window.requestAnimationFrame(() => {
      const heading = resultsHeadingRef.current;
      if (!heading) return;
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: "start" });
    });
  };

  return (
    <section className={`library${hasActiveFilters ? " library-filtering" : ""}`} ref={libraryRef}>
      <header className="page-header">
        <h1>Library</h1>
        <p className="tagline">The request board is open — pick a vibe and JUNO cues it up.</p>
        {tracks.length > 0 && (
          <span className="page-count">
            {hasActiveFilters ? `${filtered.length} of ${tracks.length} tracks` : `${tracks.length} tracks`}
          </span>
        )}
      </header>

      {catalogError ? (
        <CatalogErrorNotice onRetry={retryCatalog} />
      ) : (
        <>
          <section className="library-discovery" aria-labelledby="library-find-heading">
            <div className="library-discovery-head">
              <div>
                <span className="eyebrow">Find your next run</span>
                <h2 id="library-find-heading">Find a track</h2>
              </div>
              {hasActiveFilters && (
                <button type="button" className="btn compact library-clear" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>

            <div className="filters-bar">
              <input
                data-gamepad-default="true"
                type="search"
                inputMode="search"
                autoComplete="off"
                placeholder="Search tracks…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && q) setQ("");
                }}
                aria-label="Search tracks"
                aria-describedby="library-filter-status"
              />
            </div>

            <details
              className="library-more-filters"
              open={moreFiltersOpen}
              onToggle={(event) => {
                if (event.currentTarget.open !== moreFiltersOpen) {
                  setMoreFiltersOpen(event.currentTarget.open);
                }
              }}
            >
              <summary>
                <span>Filters</span>
                <small>Genre, favorites, sort, vibe</small>
                {secondaryFilterCount > 0 && (
                  <b
                    className="library-filter-count"
                    aria-label={`${secondaryFilterCount} active ${secondaryFilterCount === 1 ? "filter" : "filters"}`}
                  >
                    {secondaryFilterCount}
                  </b>
                )}
              </summary>
              <div className="library-filter-options">
                <div className="library-filter-primary">
                  <label className="library-genre-control">
                    <span>Genre</span>
                    <select
                      value={genre}
                      onChange={(event) => setGenre(event.target.value)}
                      aria-label="Genre"
                      aria-describedby="library-filter-status"
                    >
                      <option value="">All genres</option>
                      {genres.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="library-saved-row">
                    <button
                      type="button"
                      className={`filter-chip library-saved-toggle ${favOnly ? "active" : ""}`}
                      aria-label={`Favorites, ${favorites.length} saved`}
                      aria-pressed={favOnly}
                      onClick={toggleFavoritesFilter}
                    >
                      <span aria-hidden>{favOnly ? "★" : "☆"}</span>
                      Favorites
                      <b>{favorites.length}</b>
                    </button>
                    <small>Saved on this device</small>
                  </div>
                </div>

                <label className="library-sort-control">
                  <span>Sort by</span>
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as TrackSort)}
                    aria-label="Sort tracks"
                    aria-describedby="library-filter-status"
                  >
                    <option value="title">Title · A–Z</option>
                    <option value="bpm-desc">Tempo · fast first</option>
                    <option value="bpm-asc">Tempo · slow first</option>
                  </select>
                </label>

                <div className="filter-chips" role="radiogroup" aria-label="Vibe">
                  <span className="filter-chips-label">Vibe</span>
                  <button
                    type="button"
                    className={`filter-chip ${vibe === "" ? "active" : ""}`}
                    role="radio"
                    aria-checked={vibe === ""}
                    tabIndex={vibe === "" ? 0 : -1}
                    onClick={() => setVibe("")}
                    onKeyDown={(event) => handleVibeKeyDown(event, 0)}
                  >
                    All
                  </button>
                  {TRACK_VIBES.map((v, index) => (
                    <button
                      key={v}
                      type="button"
                      className={`filter-chip vibe-${v} ${vibe === v ? "active" : ""}`}
                      role="radio"
                      aria-checked={vibe === v}
                      tabIndex={vibe === v ? 0 : -1}
                      title={VIBE_HINTS[v]}
                      onClick={() => setVibe(v)}
                      onKeyDown={(event) => handleVibeKeyDown(event, index + 1)}
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
                </div>

                <button
                  type="button"
                  className="btn primary library-view-results"
                  aria-describedby="library-filter-status"
                  onClick={viewFilterResults}
                >
                  View {filtered.length} {hasActiveFilters
                    ? `match${filtered.length === 1 ? "" : "es"}`
                    : `track${filtered.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </details>
          </section>

          {!hasActiveFilters && (
            <>
              {latestRun && latestTrack && (
                <section
                  className="library-recent"
                  aria-label="Your latest run"
                  style={{ ["--recent-district-color" as string]: districtColor(latestTrack.district) }}
                >
                  <div className="library-recent-cover">
                    <img
                      src={assetUrl(latestTrack.cover)}
                      alt=""
                      loading="eager"
                      decoding="async"
                      width={512}
                      height={512}
                    />
                  </div>
                  <div className="library-recent-copy">
                    <span className="eyebrow">Your latest run</span>
                    <h2 id="library-recent-heading">{latestTrack.title}</h2>
                    <div className="library-recent-stats">
                      <strong>{latestRun.accuracy.toFixed(1)}% ACC</strong>
                      <span>
                        {latestRun.tier[0].toUpperCase() + latestRun.tier.slice(1)} · {latestRun.mode[0].toUpperCase() + latestRun.mode.slice(1)}
                      </span>
                      <span className={latestNeedsRetry ? "is-failed" : ""}>
                        {latestRun.failed ? "Run ended early" : latestNeedsRetry ? "No notes hit" : "Run complete"}
                      </span>
                    </div>
                  </div>
                  <div className="library-recent-actions">
                    <Link
                      className="btn primary"
                      to={playHref(latestTrack.track_id, latestRun.tier, latestRun.mode)}
                    >
                      {latestNeedsRetry ? "Retry" : "Play again"}
                    </Link>
                    <Link
                      className="btn ghost"
                      to={trackSetupHref(latestTrack.track_id, latestRun.tier, latestRun.mode)}
                    >
                      Change setup
                    </Link>
                  </div>
                </section>
              )}

              <CuratedRow
                title={curated.title}
                subtitle={curated.subtitle}
                picks={curated.picks}
                tracks={tracks}
                showAllLink={false}
              />

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
            </>
          )}

          <div className="library-results-head">
            <h2 ref={resultsHeadingRef} tabIndex={-1}>
              {hasActiveFilters ? "Matches" : "All tracks"}
            </h2>
            <span id="library-filter-status" role="status" aria-live="polite">
              {loading
                ? "Loading tracks…"
                : hiddenTrackCount > 0
                  ? `Showing ${visibleTracks.length} of ${filtered.length} ${hasActiveFilters ? "matches" : "tracks"}`
                  : hasActiveFilters
                    ? `${filtered.length} match${filtered.length === 1 ? "" : "es"}`
                    : `${tracks.length} tracks`}
            </span>
          </div>

          {loading ? (
            <TrackGridSkeleton count={8} />
          ) : (
            <div className="track-grid" id="library-track-grid" ref={trackGridRef}>
              {filtered.length === 0 && (
                <div className="library-empty">
                  <p>{favOnly ? SCAPE_COPY.emptyFavorites : "No tracks match your filters."}</p>
                  {favOnly && (
                    <button type="button" className="btn" onClick={clearFilters}>
                      Browse all tracks
                    </button>
                  )}
                </div>
              )}
              {visibleTracks.map((t) => {
                const isFavorite = favoriteIds.has(t.track_id);
                const defaultTierLabel = t.default_tier[0].toUpperCase() + t.default_tier.slice(1);
                const defaultModeLabel = t.default_mode[0].toUpperCase() + t.default_mode.slice(1);
                const defaultRunHref = withLibraryReturn(
                  playHref(t.track_id, t.default_tier, t.default_mode),
                  libraryReturnHref,
                );
                return (
                  <article key={t.track_id} className="track-card" data-favorite={isFavorite || undefined}>
                    <Link
                      to={withLibraryReturn(`/track/${t.track_id}`, libraryReturnHref)}
                      className="track-card-link"
                      aria-label={`Open ${t.title}`}
                    >
                      <div
                        className="track-card-cover-wrap"
                        style={{ ["--district-color" as string]: districtColor(t.district) }}
                      >
                        <img src={assetUrl(t.cover)} alt="" loading="lazy" decoding="async" width={512} height={512} />
                        <CharacterAvatar district={t.district} size={52} className="track-card-avatar" />
                      </div>
                      <div className="track-card-copy">
                        <strong>{t.title}</strong>
                        <span>
                          {t.artist} · {t.bpm} BPM · {t.genre}
                        </span>
                        <div className="track-card-badges">
                          <VibeBadge vibe={resolveTrackVibe(t)} />
                          <DistrictBadge district={t.district} />
                          {isBeginnerTrack(t) && <span className="chip chip-beginner">Beginner</span>}
                          {trackHasVocals(t) && <span className="chip chip-vocals">Vocals</span>}
                        </div>
                      </div>
                    </Link>
                    <div className="track-card-actions">
                      <AudioBar
                        className="track-card-preview"
                        compact
                        preload="none"
                        src={assetUrl(t.preview ?? t.audio)}
                        label={t.title}
                      />
                      <Link
                        className="btn primary track-card-play"
                        to={defaultRunHref}
                        aria-label={`Play ${t.title} · ${defaultTierLabel} ${defaultModeLabel}`}
                      >
                        <span>Play</span>
                        <small>{defaultTierLabel} · {defaultModeLabel}</small>
                      </Link>
                    </div>
                    <button
                      type="button"
                      className="track-card-favorite"
                      aria-label={`${isFavorite ? "Remove" : "Add"} ${t.title} ${isFavorite ? "from" : "to"} favorites`}
                      aria-pressed={isFavorite}
                      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      onClick={() => setFavorites(toggleFavorite(t.track_id))}
                    >
                      <span aria-hidden>{isFavorite ? "★" : "☆"}</span>
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && hiddenTrackCount > 0 && (
            <div className="library-load-more">
              <span aria-hidden>
                {visibleTracks.length} / {filtered.length} shown
              </span>
              <button
                type="button"
                className="btn primary"
                aria-controls="library-track-grid"
                aria-describedby="library-filter-status"
                onClick={() => {
                  pendingBatchFocusIndex.current = visibleTracks.length;
                  setVisibleTrackLimit((limit) => limit + TRACK_BATCH_SIZE);
                }}
              >
                Show {nextTrackBatchSize} more {hasActiveFilters
                  ? nextTrackBatchSize === 1 ? "match" : "matches"
                  : nextTrackBatchSize === 1 ? "track" : "tracks"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
