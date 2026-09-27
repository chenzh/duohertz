import {
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { useReveal } from "../components/useReveal";
import { TrackGridSkeleton } from "../components/Skeletons";
import { SHOWCASE_TRACK_IDS } from "../constants/scape";
import { LIBRARY_PAGE_META, usePageMeta } from "../seo/pageMeta";
import { CatalogErrorNotice } from "../components/CatalogErrorNotice";
import { AudioBar } from "../components/AudioBar";
import { libraryHrefForSearch, withLibraryReturn } from "../lib/libraryReturn";

const TRACK_BATCH_SIZE = 24;
type TrackSort = "title" | "bpm-desc" | "bpm-asc";
type LibraryFilter = "all" | "new" | "favorites" | "cleared";

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

function difficultyLetterFor(tier: string) {
  const v = tier.toLowerCase();
  if (v === "easy") return { letter: "B", cls: "dh-diff dh-diff--b" };
  if (v === "normal") return { letter: "A", cls: "dh-diff" };
  return { letter: "S", cls: "dh-diff" };
}

function difficultyTagFor(track: { default_tier: string; bpm: number }) {
  const tier = track.default_tier.toLowerCase();
  if (tier === "easy") return { label: `EASY ${Math.max(8, Math.min(11, Math.round(track.bpm / 18)))}`, tone: "easy" as const };
  if (tier === "normal") return { label: `HARD ${Math.max(11, Math.min(14, Math.round(track.bpm / 14)))}`, tone: "hard" as const };
  if (tier === "hard") return { label: `EXTREME ${Math.max(13, Math.min(16, Math.round(track.bpm / 12)))}`, tone: "extreme" as const };
  return { label: `INFINITY ${Math.max(16, Math.min(20, Math.round(track.bpm / 10)))}`, tone: "infinity" as const };
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
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>(favOnly ? "favorites" : "all");
  const [visibleTrackLimit, setVisibleTrackLimit] = useState(TRACK_BATCH_SIZE);
  const trackGridRef = useRef<HTMLDivElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const pendingBatchFocusIndex = useRef<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [runs] = useState(loadRuns);
  const [progress] = useState(loadShiftProgress);
  const curated = useMemo(() => curatedPicks(progress.completed.length), [progress.completed.length]);

  useEffect(() => {
    setFavorites(loadFavorites());
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
    if (currentSearch === discoverySearch) return;
    setSearchParams(new URLSearchParams(discoverySearch));
  }, [currentSearch, discoverySearch, setSearchParams]);

  useEffect(() => {
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

  const libraryRef = useReveal<HTMLElement>(
    `${tracks.length}:${visibleTracks.length}`,
    ".dh-track-card",
  );

  useEffect(() => {
    const focusIndex = pendingBatchFocusIndex.current;
    if (focusIndex === null || focusIndex >= visibleTracks.length) return;
    const nextTrack = trackGridRef.current
      ?.querySelectorAll<HTMLAnchorElement>(".track-card-link")
      .item(focusIndex);
    pendingBatchFocusIndex.current = null;
    nextTrack?.focus();
    nextTrack?.scrollIntoView({ block: "center" });
  }, [visibleTracks.length]);

  const clearedIds = useMemo(
    () => new Set(runs.filter((r) => !r.failed).map((r) => r.track_id)),
    [runs],
  );
  const orderedForView = useMemo(() => {
    if (activeFilter === "new") return [...orderedTracks].reverse();
    if (activeFilter === "cleared") return orderedTracks.filter((t) => clearedIds.has(t.track_id));
    return orderedTracks;
  }, [orderedTracks, activeFilter, clearedIds]);

  const visibleForView = orderedForView.slice(0, visibleTrackLimit);
  const unlocked = useMemo(() => {
    if (tracks.length === 0) return 0;
    return Math.round((clearedIds.size / tracks.length) * 100);
  }, [tracks.length, clearedIds]);

  const clearFilters = () => {
    setQ("");
    setGenre("");
    setVibe("");
    setBeginnerOnly(false);
    setVocalsOnly(false);
    setFavOnly(false);
    setActiveFilter("all");
  };

  const toggleFavoritesFilter = () => {
    setFavOnly((active) => !active);
    setActiveFilter((f) => (f === "favorites" ? "all" : "favorites"));
  };

  const viewFilterResults = () => {
    window.requestAnimationFrame(() => {
      const heading = resultsHeadingRef.current;
      if (!heading) return;
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: "start" });
    });
  };

  return (
    <section className={`dh-library${hasActiveFilters ? " dh-library--filtering" : ""}`} ref={libraryRef}>
      {/* Header + stats */}
      <header className="dh-library-head">
        <div>
          <span className="dh-eyebrow">COLLECTION · 曲库</span>
          <h1 style={{ margin: "8px 0 4px", fontSize: "2.2rem", color: "var(--dh-text-strong)" }}>
            曲库 <span style={{ color: "var(--dh-text-muted)", fontWeight: 500, fontSize: "0.55em", letterSpacing: "0.18em" }}>LIBRARY</span>
          </h1>
          <p style={{ margin: 0, color: "var(--dh-text-muted)" }}>
            从低音谱到高频振荡 · 打开你的下一首律动。
          </p>
        </div>
        <div className="dh-library-stats" aria-label="Library stats">
          <div>
            <span className="dh-stat-label">TOTAL SONGS</span>
            <span className="dh-stat-value">{tracks.length.toLocaleString("en-US")}</span>
          </div>
          <div>
            <span className="dh-stat-label">UNLOCKED</span>
            <span className="dh-stat-value">{unlocked}%</span>
          </div>
          <div>
            <span className="dh-stat-label">MASTERY</span>
            <span className="dh-stat-value">Level {Math.min(99, Math.max(1, clearedIds.size + 1))}</span>
          </div>
        </div>
      </header>

      {catalogError ? (
        <CatalogErrorNotice onRetry={retryCatalog} />
      ) : (
        <>
          {/* Controls */}
          <div className="dh-library-controls">
            <label className="dh-library-search">
              <span aria-hidden style={{ color: "var(--dh-text-dim)", display: "inline-flex" }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <input
                data-gamepad-default="true"
                type="search"
                inputMode="search"
                autoComplete="off"
                placeholder="搜索曲名、艺术家、流浪…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape" && q) setQ(""); }}
                aria-label="搜索曲库"
              />
            </label>
            <button
              type="button"
              className={`dh-filter-chip ${activeFilter === "all" ? "is-active" : ""}`}
              onClick={() => { setActiveFilter("all"); setFavOnly(false); }}
            >全部</button>
            <button
              type="button"
              className={`dh-filter-chip ${activeFilter === "new" ? "is-active" : ""}`}
              onClick={() => setActiveFilter("new")}
            >新曲</button>
            <button
              type="button"
              className={`dh-filter-chip ${activeFilter === "favorites" ? "is-active" : ""}`}
              onClick={toggleFavoritesFilter}
            >★ 收藏</button>
            <button
              type="button"
              className={`dh-filter-chip ${activeFilter === "cleared" ? "is-active" : ""}`}
              onClick={() => setActiveFilter("cleared")}
            >已通关</button>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--dh-text-muted)", fontSize: "0.85rem", marginLeft: "auto" }}>
              <span>排序</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as TrackSort)}
                aria-label="排序"
                style={{
                  background: "rgba(7,9,26,0.6)",
                  border: "1px solid var(--dh-line)",
                  borderRadius: 999,
                  color: "var(--dh-text)",
                  padding: "6px 10px",
                  fontSize: "0.85rem",
                }}
              >
                <option value="title">最近更新</option>
                <option value="bpm-desc">BPM · 高到低</option>
                <option value="bpm-asc">BPM · 低到高</option>
              </select>
            </label>
          </div>

          {/* Genre + vibe secondary filters (collapsed) */}
          <div className="dh-row-center" style={{ flexWrap: "wrap", gap: 8 }}>
            <select
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              aria-label="风格"
              style={{
                background: "rgba(13,18,40,0.55)",
                border: "1px solid var(--dh-line)",
                borderRadius: 999,
                color: "var(--dh-text-muted)",
                padding: "6px 12px",
                fontSize: "0.82rem",
              }}
            >
              <option value="">全部风格</option>
              {genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <button
              type="button"
              className={`dh-filter-chip ${beginnerOnly ? "is-active" : ""}`}
              aria-pressed={beginnerOnly}
              onClick={() => setBeginnerOnly((b) => !b)}
            >新手友好</button>
            <button
              type="button"
              className={`dh-filter-chip ${vocalsOnly ? "is-active" : ""}`}
              aria-pressed={vocalsOnly}
              onClick={() => setVocalsOnly((v) => !v)}
            >有人声</button>
            {TRACK_VIBES.slice(0, 4).map((v) => (
              <button
                key={v}
                type="button"
                className={`dh-filter-chip ${vibe === v ? "is-active" : ""}`}
                onClick={() => setVibe(vibe === v ? "" : v)}
                title={VIBE_HINTS[v]}
              >{VIBE_LABELS[v]}</button>
            ))}
            {hasActiveFilters && (
              <button type="button" className="dh-btn dh-btn--ghost" style={{ padding: "6px 14px", fontSize: "0.8rem" }} onClick={clearFilters}>
                清除筛选
              </button>
            )}
            <span style={{ marginLeft: "auto", color: "var(--dh-text-muted)", fontFamily: "IBM Plex Mono, monospace", fontSize: "0.78rem" }}>
              {loading ? "加载曲库…" : `${visibleForView.length} / ${orderedForView.length} 首`}
            </span>
          </div>

          {/* Recent run card (if any) */}
          {!hasActiveFilters && latestRun && latestTrack && (
            <div className="dh-card dh-card--glow" aria-label="Your latest run">
              <div className="dh-flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
                <div className="dh-row-center" style={{ gap: 14 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                    <img src={assetUrl(latestTrack.cover)} alt="" loading="lazy" decoding="async" width={144} height={144} />
                  </div>
                  <div>
                    <span className="dh-eyebrow">YOUR LATEST RUN</span>
                    <h3 style={{ margin: "6px 0 4px", color: "var(--dh-text-strong)" }}>{latestTrack.title}</h3>
                    <p style={{ margin: 0, color: "var(--dh-text-muted)", fontSize: "0.86rem" }}>
                      {latestRun.accuracy.toFixed(1)}% ACC · {latestRun.score.toLocaleString("en-US")} PTS · {latestRun.failed ? "未通关" : latestNeedsRetry ? "未命中" : "通关"}
                    </p>
                  </div>
                </div>
                <div className="dh-row-center" style={{ gap: 8 }}>
                  <Link className="dh-btn dh-btn--primary" to={playHref(latestTrack.track_id, latestRun.tier, latestRun.mode)} style={{ textDecoration: "none" }}>
                    {latestNeedsRetry ? "Retry" : "Play again"}
                  </Link>
                  <Link className="dh-btn dh-btn--cyan-ghost" to={trackSetupHref(latestTrack.track_id, latestRun.tier, latestRun.mode)} style={{ textDecoration: "none" }}>
                    调整设置
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!hasActiveFilters && <CuratedRow title={curated.title} subtitle={curated.subtitle} picks={curated.picks} tracks={tracks} showAllLink={false} />}

          {!hasActiveFilters && (
            <div className="dh-row-center" style={{ flexWrap: "wrap", gap: 8 }}>
              <span style={{ color: "var(--dh-text-muted)", fontSize: "0.82rem" }}>Showcase:</span>
              {SHOWCASE_TRACK_IDS.slice(0, 4).map((id) => {
                const track = tracks.find((tr) => tr.track_id === id);
                if (!track) return null;
                return (
                  <Link key={id} to={`/track/${id}`} className="dh-filter-chip" style={{ textDecoration: "none" }}>
                    {track.title}
                  </Link>
                );
              })}
            </div>
          )}

          <h2 ref={resultsHeadingRef} tabIndex={-1} style={{ margin: "8px 0 0", color: "var(--dh-text-strong)", fontSize: "1.1rem" }}>
            {hasActiveFilters ? "匹配结果" : "全部曲目"}
          </h2>

          {loading ? (
            <TrackGridSkeleton count={8} />
          ) : (
            <div className="dh-library-grid" id="library-track-grid" ref={trackGridRef}>
              {visibleForView.length === 0 && (
                <div className="dh-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: 36 }}>
                  <p style={{ margin: 0, color: "var(--dh-text-muted)" }}>
                    {favOnly ? "还没有收藏的曲目。" : "没有匹配的曲目。"}
                  </p>
                  {favOnly && (
                    <button type="button" className="dh-btn dh-btn--primary" style={{ marginTop: 14 }} onClick={clearFilters}>
                      浏览全部曲目
                    </button>
                  )}
                </div>
              )}
              {visibleForView.map((t, idx) => {
                const isFavorite = favoriteIds.has(t.track_id);
                const diff = difficultyLetterFor(t.default_tier);
                const diffTag = difficultyTagFor(t);
                const featuredTag = idx === 0 ? { tag: "NEW", cls: "dh-chip--new" } : idx === 2 ? { tag: "HOT", cls: "dh-chip--hot" } : null;
                const defaultTierLabel = t.default_tier[0].toUpperCase() + t.default_tier.slice(1);
                const defaultModeLabel = t.default_mode[0].toUpperCase() + t.default_mode.slice(1);
                const defaultRunHref = withLibraryReturn(
                  playHref(t.track_id, t.default_tier, t.default_mode),
                  libraryReturnHref,
                );
                return (
                  <article
                    key={t.track_id}
                    className="dh-track-card track-card"
                    data-favorite={isFavorite || undefined}
                  >
                    <Link
                      to={withLibraryReturn(`/track/${t.track_id}`, libraryReturnHref)}
                      className="track-card-link"
                      aria-label={`打开 ${t.title}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div className="dh-track-card-cover">
                        <img src={assetUrl(t.cover)} alt="" loading="lazy" decoding="async" width={512} height={512} />
                        {featuredTag && <span className={`dh-chip ${featuredTag.cls} dh-cover-chip-tl`}>{featuredTag.tag}</span>}
                        <span className="dh-cover-chip-tr">
                          <span className={diff.cls}>{diff.letter}</span>
                        </span>
                      </div>
                      <div className="dh-track-card-meta">
                        <div className="dh-track-row-1">
                          <strong>{t.title}</strong>
                          <span className="dh-track-dur">{Math.max(1, Math.round(t.bpm * 1.7 / 60))}:{String(((t.bpm * 1.7) % 60) | 0).padStart(2, "0")}</span>
                        </div>
                        <div className="dh-track-row-2">
                          <span className="dh-track-artist">{t.artist}</span>
                          <span className="dh-track-tags">
                            <span>{t.bpm}</span>
                            <button
                              className={`dh-fav ${isFavorite ? "is-fav" : ""}`}
                              aria-label={isFavorite ? "取消收藏" : "收藏"}
                              type="button"
                              onClick={(event) => { event.preventDefault(); setFavorites(toggleFavorite(t.track_id)); }}
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />
                              </svg>
                            </button>
                          </span>
                        </div>
                        <div className="dh-row-center" style={{ gap: 6, marginTop: 6 }}>
                          <span className={`dh-diff-tag dh-diff-tag--${diffTag.tone}`}>{diffTag.label}</span>
                          {isBeginnerTrack(t) && <span className="dh-chip dh-chip--mint">Beginner</span>}
                        </div>
                      </div>
                    </Link>
                    <div style={{ display: "none" }}>
                      <Link to={defaultRunHref} className="btn primary track-card-play" aria-label={`Play ${t.title}`}>
                        <span>Play</span>
                        <small>{defaultTierLabel} · {defaultModeLabel}</small>
                      </Link>
                      <AudioBar className="track-card-preview" compact preload="none" src={assetUrl(t.preview ?? t.audio)} label={t.title} />
                    </div>
                  </article>
                );
              })}
              {/* Empty placeholder card (mirrors "更多旋律正在路上") */}
              {visibleForView.length > 0 && visibleForView.length < TRACK_BATCH_SIZE && (
                <div className="dh-track-card dh-track-card--placeholder" aria-hidden>
                  <div>
                    <strong>更多旋律正在路上</strong>
                    <p style={{ margin: 0, color: "var(--dh-text-muted)" }}>
                      同步中…请期待后续更新。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && hiddenTrackCount > 0 && (
            <div className="dh-row-center" style={{ justifyContent: "center", marginTop: 8 }}>
              <button
                type="button"
                className="dh-btn dh-btn--cyan-ghost"
                aria-controls="library-track-grid"
                onClick={() => {
                  pendingBatchFocusIndex.current = visibleForView.length;
                  setVisibleTrackLimit((limit) => limit + TRACK_BATCH_SIZE);
                  viewFilterResults();
                }}
              >
                显示 {nextTrackBatchSize} 首更多
              </button>
            </div>
          )}
        </>
      )}
      {!loading && tracks.length > 0 && (
        <div className="dh-fab-stack" aria-label="Quick actions">
          <Link
            to={playHref(tracks[0]!.track_id, tracks[0]!.default_tier, tracks[0]!.default_mode)}
            className="dh-fab dh-fab--accent"
            aria-label="快速播放"
            title="快速播放"
            style={{ textDecoration: "none" }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </Link>
          <button
            type="button"
            className="dh-fab"
            onClick={toggleFavoritesFilter}
            aria-pressed={favOnly}
            aria-label={favOnly ? "显示全部曲目" : "只看收藏"}
            title={favOnly ? "显示全部曲目" : "只看收藏"}
            style={favOnly ? { color: "var(--dh-amber)", borderColor: "rgba(251, 191, 36, 0.55)", boxShadow: "0 0 18px rgba(251, 191, 36, 0.3)" } : undefined}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill={favOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}