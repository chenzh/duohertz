import { useEffect, useMemo, useState } from "react";
import { Link } from "../router";
import { assetUrl } from "../catalog/loadCatalog";
import { useCatalog } from "../catalog/useCatalog";
import { CHARACTER_LIST } from "../constants/scape";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { CuratedRow } from "../components/CuratedRow";
import { useReveal } from "../components/useReveal";
import { homeEntry } from "../lib/homeEntry";
import { curatedPicks } from "../data/curated";
import { dailyPlayHref, getDailyChallenge, summarizeDailyChallenge } from "../lib/dailyChallenge";
import { useUtcDailyClock } from "../lib/useUtcDailyClock";
import { trackEvent } from "../lib/analytics";
import { RADIO_EPISODES } from "../data/radioEpisodes";
import { episodeIndexAt } from "../lib/radio";
import { loadDailyBoard, readLastRun } from "../storage/session";
import { HOME_PAGE_META, usePageMeta } from "../seo/pageMeta";
import { ShiftHomeCard } from "../components/ShiftStory";
import { loadShiftProgress } from "../lib/firstShift";
import { CatalogErrorNotice } from "../components/CatalogErrorNotice";
import { computeStats, loadRuns } from "../lib/progress";

const FEATURED_PICK = 3;

function difficultyTagFor(track: { default_tier: string; bpm: number }) {
  const tier = track.default_tier.toLowerCase();
  if (tier === "easy") return { label: `EASY ${Math.max(8, Math.min(11, Math.round(track.bpm / 18)))}`, tone: "easy" as const };
  if (tier === "normal") return { label: `HARD ${Math.max(11, Math.min(14, Math.round(track.bpm / 14)))}`, tone: "hard" as const };
  if (tier === "hard") return { label: `EXTREME ${Math.max(13, Math.min(16, Math.round(track.bpm / 12)))}`, tone: "extreme" as const };
  if (tier === "expert") return { label: `INFINITY ${Math.max(16, Math.min(20, Math.round(track.bpm / 10)))}`, tone: "infinity" as const };
  return { label: tier.toUpperCase(), tone: "hard" as const };
}

function difficultyLetterFor(tier: string) {
  const v = tier.toLowerCase();
  if (v === "easy") return "B";
  if (v === "normal") return "A";
  if (v === "hard") return "S";
  return "S";
}

function difficultyLetterClass(tier: string) {
  const v = tier.toLowerCase();
  if (v === "easy") return "dh-diff dh-diff--b";
  if (v === "normal") return "dh-diff dh-diff";
  return "dh-diff dh-diff";
}

function featuredLabelFor(idx: number) {
  if (idx === 0) return { tag: "NEW", cls: "dh-chip--new" };
  if (idx === 1) return { tag: "NEW", cls: "dh-chip--new" };
  return { tag: "HOT", cls: "dh-chip--hot" };
}

export function HomePage() {
  usePageMeta(HOME_PAGE_META);
  const { tracks, error: catalogError, retry: retryCatalog } = useCatalog();
  const [, setCatalogReloadKey] = useState(0);
  const [progress] = useState(loadShiftProgress);
  const [runs] = useState(loadRuns);
  const dailyClock = useUtcDailyClock();
  const playStats = useMemo(() => computeStats(runs), [runs]);
  const entry = useMemo(() => homeEntry(tracks, progress, runs), [tracks, progress, runs]);
  const curated = useMemo(() => curatedPicks(progress.completed.length), [progress.completed.length]);

  useEffect(() => {
    trackEvent("home_view");
  }, []);

  const featured = useMemo(() => {
    const ids = new Set(curated.picks.map((p) => p.trackId));
    const pool = tracks.filter((x) => !ids.has(x.track_id));
    const top = pool.slice(0, FEATURED_PICK);
    while (top.length < FEATURED_PICK && tracks.length > 0) {
      top.push(tracks[top.length % tracks.length]!);
    }
    return top;
  }, [tracks, curated]);

  const recentFavorites = useMemo(() => {
    const lastRun = readLastRun();
    return lastRun ? tracks.filter((x) => x.track_id === lastRun.track_id).slice(0, 3) : tracks.slice(0, 3);
  }, [tracks]);

  const recentActivity = useMemo(() => {
    const recent = runs.slice(0, 4);
    return recent.map((run) => {
      const track = tracks.find((x) => x.track_id === run.track_id);
      return {
        id: run.endedAt,
        title: track?.title ?? "",
        summary: `${run.score.toLocaleString("en-US")} PTS · ${run.accuracy.toFixed(1)}% ACC`,
        kind: "achievement",
      };
    });
  }, [runs, tracks]);

  const daily = getDailyChallenge(tracks.map((x) => x.track_id), dailyClock.dateKey);
  const dailyTrack = daily ? tracks.find((x) => x.track_id === daily.trackId) : null;
  const dailyProgress = daily
    ? summarizeDailyChallenge(daily, loadDailyBoard(daily.dateKey))
    : null;
  const dailyStreakCopy = playStats.streakStatus === "played-today"
    ? `${playStats.activeStreakDays}-night streak active · Today is locked in.`
    : playStats.streakStatus === "ready-today"
      ? `${playStats.activeStreakDays}-night streak ready · Play today to keep it alive.`
      : playStats.totalRuns > 0
        ? `Best streak ${playStats.bestStreakDays} ${playStats.bestStreakDays === 1 ? "night" : "nights"} · Start a new streak today.`
        : null;
  const reconnectCatalog = () => {
    setCatalogReloadKey((value) => value + 1);
    retryCatalog();
  };
  const onAir = RADIO_EPISODES[episodeIndexAt(Date.now())];
  const curatedIds = new Set(curated.picks.map((p) => p.trackId));
  const explore = tracks.filter((x) => !curatedIds.has(x.track_id)).slice(0, 18);

  const homeRef = useReveal<HTMLElement>(
    tracks.length,
    ".dh-song-card, .dh-radio-cta, .dh-character-card, .dh-list-row",
  );

  return (
    <section className="dh-home" ref={homeRef}>
      {catalogError && <CatalogErrorNotice onRetry={reconnectCatalog} />}

      {/* Hero */}
      <div className="dh-home-hero">
        <div className="dh-home-hero-copy">
          <span className="dh-eyebrow">SEASON 04 · NEW PULSE</span>
          <h1>
            真我<span className="dh-hero-accent">赫兹</span>
            <br />
            重新定义节奏
          </h1>
          <p className="tagline">
            在无限延展的数字音域中，聆听属于你的灵魂波长。
            <br />
            高保真音频模组已就绪。
          </p>
          <div className="dh-hero-cta-row">
            {catalogError ? (
              <button type="button" className="dh-btn dh-btn--primary" onClick={reconnectCatalog}>
                重新连接曲库
              </button>
            ) : (
              <Link
                className="dh-btn dh-btn--primary"
                to={entry.href}
                onClick={() => trackEvent("home_play_click", { track: entry.track?.track_id ?? "", cta: entry.cta })}
                style={{ textDecoration: "none" }}
              >
                ▶ {entry.cta}
              </Link>
            )}
            <Link to="/library" className="dh-btn dh-btn--ghost" style={{ textDecoration: "none" }}>
              浏览曲库
            </Link>
          </div>
          <div className="dh-row-center" style={{ gap: 18, marginTop: 10, flexWrap: "wrap" }}>
            <div className="dh-row-center" style={{ gap: 8, color: "var(--dh-text-muted)", fontSize: "0.82rem" }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <span>全年轮转: <strong style={{ color: "var(--dh-text)" }}>41.2M</strong></span>
            </div>
            <div className="dh-row-center" style={{ gap: 8, color: "var(--dh-text-muted)", fontSize: "0.82rem" }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <span>已储纳: <strong style={{ color: "var(--dh-text)" }}>{tracks.length.toLocaleString("en-US")}</strong></span>
            </div>
          </div>
        </div>
        <div className="dh-home-hero-visual">
          <span className="dh-orbit-tag dh-orbit-tag--top">REAL-TIME 320KBPS</span>
          <div className="dh-orb" aria-hidden />
          <span className="dh-orbit-tag dh-orbit-tag--bottom">FREQ · 44.1KHZ</span>
        </div>
      </div>

      {/* Featured tracks */}
      <div>
        <div className="dh-flex-between" style={{ marginBottom: 18 }}>
          <div className="dh-section-title">
            <span className="dh-eyebrow">FEATURED · 精选曲目</span>
            <span className="dh-section-en">
              精选曲目 <em>curated playlist</em>
            </span>
          </div>
          <Link to="/library" style={{ color: "var(--dh-primary)", textDecoration: "none", fontSize: "0.88rem" }}>
            查看全部 →
          </Link>
        </div>
        <div className="dh-track-row">
          {featured.map((track, idx) => {
            const tag = featuredLabelFor(idx);
            const diff = difficultyTagFor(track);
            return (
              <Link
                key={track.track_id + ":" + idx}
                to={`/track/${track.track_id}`}
                className="dh-song-card"
                style={{ textDecoration: "none" }}
              >
                <div className="dh-song-card-cover">
                  {track.cover ? (
                    <img src={assetUrl(track.cover)} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="dh-cover-placeholder">{track.title}</span>
                  )}
                  <span className={`dh-chip ${tag.cls} dh-cover-badge`}>{tag.tag}</span>
                  <span className="dh-cover-diff">
                    <span className={difficultyLetterClass(track.default_tier)}>{difficultyLetterFor(track.default_tier)}</span>
                  </span>
                </div>
                <div className="dh-song-card-meta">
                  <strong>{track.title}</strong>
                  <span>{track.artist}</span>
                </div>
                <div className="dh-song-card-footer">
                  <span className={`dh-diff-tag dh-diff-tag--${diff.tone}`}>{diff.label}</span>
                  <span className="dh-song-meta-right">
                    <span>{track.bpm} BPM</span>
                    <button className="dh-fav-btn" aria-label="收藏" type="button" onClick={(e) => e.preventDefault()}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />
                      </svg>
                    </button>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Radio CTA card */}
      <div className="dh-radio-cta">
        <div className="dh-radio-disc" aria-hidden>
          <div className="dh-radio-disc-core" />
        </div>
        <div className="dh-radio-info">
          <div className="dh-row-center" style={{ gap: 10 }}>
            <span className="dh-chip dh-chip--live"><span className="dh-radio-live-dot" /> LIVE NOW</span>
            <span className="dh-eyebrow" style={{ color: "var(--dh-text-muted)" }}>FREQUENCY · 44.1KHZ</span>
          </div>
          <h3>赫兹频率电台</h3>
          <p>加入专属你的音域进度，发现最新鲜的独家曲目、致力于记录共同律动。</p>
          <div className="dh-radio-tags">
            <span className="dh-chip dh-chip--cyan">"Electric Station"</span>
            <span className="dh-chip dh-chip--violet">Lofi · Chill</span>
            <span className="dh-chip dh-chip--amber">1.2k · 现在</span>
          </div>
        </div>
        <div className="dh-radio-actions">
          <Link to="/radio" className="dh-btn dh-btn--primary" style={{ textDecoration: "none" }}>
            进入曲库 →
          </Link>
        </div>
      </div>

      {/* Characters strip */}
      <div>
        <div className="dh-flex-between" style={{ marginBottom: 18 }}>
          <div className="dh-section-title">
            <span className="dh-eyebrow">LEGEND NAVIGATORS</span>
            <span className="dh-section-en">
              传奇领航员 <em>legend navigators</em>
            </span>
            <span className="dh-section-zh">选择你的领航员，每个角色都将指引你的独特风格与个性潜能。</span>
          </div>
          <Link to="/characters" style={{ color: "var(--dh-primary)", textDecoration: "none", fontSize: "0.88rem" }}>
            查看全部角色 →
          </Link>
        </div>
        <div className="dh-characters-strip">
          {CHARACTER_LIST.slice(0, 3).map((c) => (
            <Link
              key={c.code}
              to="/characters"
              className="dh-character-card"
              style={{ textDecoration: "none" }}
            >
              <div className="dh-character-card-art">
                <CharacterAvatar district={c.district} size={200} />
              </div>
              <div className="dh-character-card-meta">
                <small>{c.district}</small>
                <strong>{c.code}</strong>
                <em>{c.role}</em>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Daily challenge (kept functional) */}
      {daily && dailyTrack && (
        <div className="dh-card">
          <div className="dh-flex-between" style={{ marginBottom: 12 }}>
            <div>
              <span className="dh-eyebrow">{dailyProgress?.best ? "DAILY CLEARED" : "TODAY'S CHALLENGE"}</span>
              <h2 style={{ margin: "6px 0 4px", color: "var(--dh-text-strong)" }}>{dailyTrack.title}</h2>
              <p style={{ margin: 0, color: "var(--dh-text-muted)" }}>
                {dailyTrack.artist} · Standard Arcade · {dailyClock.resetLabel}
              </p>
            </div>
            <Link className="dh-btn dh-btn--primary" to={dailyPlayHref(daily)} style={{ textDecoration: "none" }}>
              {dailyProgress?.best ? "Improve score" : "Play Daily"}
            </Link>
          </div>
          {dailyStreakCopy && (
            <p style={{ color: "var(--dh-text-muted)", fontSize: "0.85rem", margin: 0 }}>
              ◆ {dailyStreakCopy}
            </p>
          )}
        </div>
      )}

      {/* Shift story card kept (gentle restyle) */}
      <ShiftHomeCard />

      {/* Recent collections + Recent activity */}
      <div className="dh-two-col">
        <div className="dh-list-card">
          <div className="dh-list-card-head">
            <h3>♡ 我的收藏</h3>
            <span className="dh-chip dh-chip--cyan">24 · 曲曲目</span>
          </div>
          {recentFavorites.map((track, idx) => (
            <Link
              key={track.track_id + ":" + idx}
              to={`/track/${track.track_id}`}
              className="dh-list-row"
              style={{ textDecoration: "none" }}
            >
              <div
                className="dh-list-thumb"
                style={{
                  background: track.cover
                    ? `url(${assetUrl(track.cover)}) center/cover`
                    : "linear-gradient(135deg, rgba(34,211,238,0.45), rgba(168,85,247,0.45))",
                }}
              />
              <div className="dh-list-meta">
                <strong>{track.title}</strong>
                <span>{track.artist} · {track.bpm} BPM · {track.genre}</span>
              </div>
              <div className="dh-list-stats">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                {track.bpm}
              </div>
            </Link>
          ))}
        </div>

        <div className="dh-list-card">
          <div className="dh-list-card-head">
            <h3>◇ 最近活动</h3>
            <span className="dh-chip dh-chip--violet">活动日志</span>
          </div>
          {recentActivity.length === 0 && (
            <p className="dh-text-muted" style={{ margin: 0 }}>
              完成第一局后这里会显示你的成绩节奏。
            </p>
          )}
          {recentActivity.map((event) => (
            <div key={event.id} className="dh-list-row" style={{ gridTemplateColumns: "32px 1fr" }}>
              <span className="dh-ach-icon" aria-hidden>★</span>
              <div className="dh-list-meta">
                <strong>{event.title}</strong>
                <span>{event.summary}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {onAir && (
        <div className="dh-card dh-card--inset">
          <div className="dh-flex-between">
            <div>
              <span className="dh-eyebrow">ON AIR · THE LATE STATIC</span>
              <h2 style={{ margin: "6px 0 4px", color: "var(--dh-text-strong)" }}>
                EP {onAir.ep} — {onAir.title}
              </h2>
              <p style={{ margin: 0, color: "var(--dh-text-muted)" }}>
                {onAir.lines[0]?.text}
              </p>
            </div>
            <Link to="/radio" className="dh-btn dh-btn--cyan-ghost" style={{ textDecoration: "none" }}>
              Season program
            </Link>
          </div>
        </div>
      )}

      {/* Keep explore row only if needed; Visily home doesn't have a long horizontal scroller, so it's omitted in favor of the curated strip above */}
      {explore.length > 0 && false && (
        <CuratedRow
          title={curated.title}
          subtitle={curated.subtitle}
          picks={curated.picks}
          tracks={tracks}
          className="curated-section"
        />
      )}
    </section>
  );
}