import { useEffect, useMemo, useState } from "react";
import { Link } from "../router";
import { getMessages } from "../i18n";
import { assetUrl } from "../catalog/loadCatalog";
import { useCatalog } from "../catalog/useCatalog";
import { CHARACTER_LIST, HOME_COPY, SCAPE_COPY } from "../constants/scape";
import { HomeHeroPlay } from "../components/HomeHeroPlay";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { CuratedRow } from "../components/CuratedRow";
import { useReveal } from "../components/useReveal";
import { duoHref } from "../lib/firstPlay";
import { homeEntry } from "../lib/homeEntry";
import { curatedPicks } from "../data/curated";
import { dailyPlayHref, getDailyChallenge, summarizeDailyChallenge } from "../lib/dailyChallenge";
import { useUtcDailyClock } from "../lib/useUtcDailyClock";
import { trackEvent } from "../lib/analytics";
import { RADIO_EPISODES } from "../data/radioEpisodes";
import { episodeIndexAt } from "../lib/radio";
import { useKeyLabels } from "../input/useKeyLabels";
import { usePhysicalKeyboardInput } from "../input/usePhysicalKeyboardInput";
import { loadKeys } from "../storage/settings";
import { loadDailyBoard, readLastRun } from "../storage/session";
import { HOME_PAGE_META, usePageMeta } from "../seo/pageMeta";
import { ShiftHomeCard } from "../components/ShiftStory";
import { loadShiftProgress } from "../lib/firstShift";
import { CatalogErrorNotice } from "../components/CatalogErrorNotice";
import { calibrationHref } from "../lib/calibration";
import { computeStats, loadRuns } from "../lib/progress";
import { isCoarsePointer } from "../input/touchInput";
import { useGamepadAssignments } from "../input/useGamepadAssignments";

/** A friendly return greeting; elapsed time never removes story progress. */
const QUIET_BLOCK_MS = 48 * 60 * 60 * 1000;

export function HomePage() {
  usePageMeta(HOME_PAGE_META);
  // 曲库走统一的 useCatalog：取不到时有 error 状态，而不是 unhandled rejection + 空列表。
  const { tracks, error: catalogError, retry: retryCatalog } = useCatalog();
  const [catalogReloadKey, setCatalogReloadKey] = useState(0);
  const t = getMessages();
  const storedKeys = useMemo(loadKeys, []);
  const keys = useKeyLabels(storedKeys);
  // 进度只存在本机：回来的玩家直接看到"下一首"，而不是再看一遍欢迎词。
  const [progress] = useState(loadShiftProgress);
  const [runs] = useState(loadRuns);
  const [touchUi] = useState(isCoarsePointer);
  const physicalKeyboardSeen = usePhysicalKeyboardInput();
  const [gamepadIndex] = useGamepadAssignments(1);
  const dailyClock = useUtcDailyClock();
  const playStats = useMemo(() => computeStats(runs), [runs]);
  const entry = useMemo(() => homeEntry(tracks, progress, runs), [tracks, progress, runs]);
  const curated = useMemo(() => curatedPicks(progress.completed.length), [progress.completed.length]);

  useEffect(() => {
    trackEvent("home_view");
  }, []);

  const cameBackQuiet = useMemo(() => {
    const last = readLastRun();
    if (!last) return false;
    return Date.now() - new Date(last.endedAt).getTime() >= QUIET_BLOCK_MS;
  }, []);
  const onAir = RADIO_EPISODES[episodeIndexAt(Date.now())];
  const curatedIds = new Set(curated.picks.map((p) => p.trackId));
  const explore = tracks.filter((x) => !curatedIds.has(x.track_id)).slice(0, 18);
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
  // The first visit stays focused on the three-song onboarding. Once that
  // circuit is complete, Daily becomes the first post-hero return objective
  // instead of sitting behind several editorial sections.
  const prioritizeDaily = !entry.inShift;
  const inputKicker = gamepadIndex !== null
    ? HOME_COPY.kickerController
    : touchUi
      ? physicalKeyboardSeen ? HOME_COPY.kickerKeyboardTouch : HOME_COPY.kickerTouch
      : HOME_COPY.kickerKeys;
  const dailyBanner = daily && dailyTrack ? (
    <section
      className="daily-challenge-banner"
      aria-label="Today's Daily challenge"
      data-cleared={dailyProgress?.best ? "true" : "false"}
    >
      <div>
        <p className="eyebrow">{dailyProgress?.best ? "Daily cleared" : "Today's challenge"}</p>
        <h2>{dailyTrack.title}</h2>
        <p className="tagline">
          {dailyTrack.artist} · Standard Arcade · {dailyClock.resetLabel}
        </p>
        <p className="daily-challenge-status" role="status">
          {dailyProgress?.best
            ? `Best ${dailyProgress.best.score.toLocaleString("en-US")} PTS · ${dailyProgress.best.accuracy}% ACC · ${dailyProgress.clears} ${dailyProgress.clears === 1 ? "clear" : "clears"}`
            : "Clear the chart to post today's local score."}
        </p>
        {dailyStreakCopy && (
          <p className="daily-streak-status" data-state={playStats.streakStatus}>
            <span aria-hidden>◆</span> {dailyStreakCopy}
          </p>
        )}
      </div>
      <div className="daily-challenge-actions">
        <Link
          className="btn primary"
          to={dailyPlayHref(daily)}
          onClick={() => trackEvent("daily_challenge_click", { track: daily.trackId })}
        >
          {dailyProgress?.best ? "Improve score" : "Play Daily"}
        </Link>
        <Link className="btn ghost" to="/leaderboard?view=daily">
          View Daily board
        </Link>
      </div>
    </section>
  ) : null;

  // Reveal the sections below the hero as you scroll. Keyed on tracks.length so
  // the blocks that only exist after the catalog resolves still get picked up.
  const homeRef = useReveal<HTMLElement>(
    tracks.length,
    ".curated-section, .radio-episode-banner, .meet-characters, .daily-challenge-banner, .trending-section",
  );

  return (
    <section className="home" ref={homeRef}>
      {catalogError && (
        <CatalogErrorNotice onRetry={reconnectCatalog} />
      )}
      <div className="hero-split">
        <div className="hero-copy">
          {/* 先一句话说清"这是个音游"，再让按钮直指第一首。 */}
          <p className="eyebrow">{inputKicker}</p>
          <h1>{HOME_COPY.title}</h1>
          <p className="tagline">{HOME_COPY.subtitle}</p>
          {/* 一句角色台词就够了 —— 世界观在打歌之后讲，不在打歌之前。 */}
          <blockquote className="hero-quote">
            <span className="hero-quote-speaker">{entry.line.speaker}</span>
            <p>“{entry.line.text}”</p>
          </blockquote>
          <div className="hero-entry">
            {catalogError ? (
              <button type="button" className="btn primary hero-play" onClick={reconnectCatalog}>
                Reconnect tracks
              </button>
            ) : (
              <Link
                className="btn primary hero-play"
                to={entry.href}
                onClick={() => trackEvent("home_play_click", { track: entry.track?.track_id ?? "", cta: entry.cta })}
              >
                {entry.cta}
              </Link>
            )}
            <p className="hero-entry-meta">
              {catalogError ? "The play button will return when the track list reconnects." : entry.sub}
            </p>
          </div>
          <div className="cta-row">
            <Link className="btn ghost home-browse-link" to="/library">
              {HOME_COPY.browse}
            </Link>
            {/* Duo 对还没开始的人来说是噪音：打过至少一个节点再出现。 */}
            {entry.track && progress.completed.length > 0 && (
              <Link className="btn ghost" to={duoHref(entry.track.track_id)}>
                Duo
              </Link>
            )}
            <Link className="btn ghost" to={calibrationHref("/")}>
              Calibrate
            </Link>
          </div>
          <div className="key-chips" aria-label="Keyboard lanes">
            {keys.map((k, i) => (
              <span key={i} className="key-chip">
                {k}
              </span>
            ))}
          </div>
          <p className="hero-rights">{SCAPE_COPY.rightsShort}</p>
        </div>

        <div className="hero-visual hero-visual-play">
          <HomeHeroPlay
            trackId={entry.trackId}
            tier={entry.tier}
            mode={entry.mode}
            catalogReloadKey={catalogReloadKey}
            gamepadIndex={gamepadIndex ?? undefined}
            fullRunHref={entry.href}
            fullRunLabel={entry.cta}
          />
        </div>
      </div>

      {cameBackQuiet && (
        <p className="radio-welcome">
          Good to hear from you. We kept your chair. Pick something you like. —{" "}
          <strong>JUNO, The Late Static</strong>
        </p>
      )}

      {prioritizeDaily && dailyBanner}

      {/* First Shift 是辅助说明，不是进入游戏的前置条件。 */}
      <ShiftHomeCard />

      <CuratedRow
        title={curated.title}
        subtitle={curated.subtitle}
        picks={curated.picks}
        tracks={tracks}
        className="curated-section"
      />

      {onAir && (
        <section className="radio-episode-banner" aria-label="On air now — The Late Static">
          <div>
            <p className="eyebrow">On air · The Late Static</p>
            <h2>{`EP ${onAir.ep} — ${onAir.title}`}</h2>
            <p className="tagline">{onAir.lines[0]?.text}</p>
          </div>
          <Link className="btn ghost" to="/radio">
            Season program
          </Link>
        </section>
      )}

      <section className="meet-characters" aria-label="BeatScape characters">
        <div className="section-head">
          <h2>{t.ui.meetNightshift}</h2>
          <Link to="/characters" className="section-link">
            The crew
          </Link>
        </div>
        <div className="character-strip">
          {CHARACTER_LIST.map((c) => (
            <div key={c.code} className="character-strip-item" style={{ ["--district-color" as string]: c.color }}>
              <Link to="/characters" className="character-strip-link" aria-label={`${c.code} — ${c.district}`}>
                <CharacterAvatar district={c.district} size={72} />
                <span className="character-strip-code">{c.code}</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {!prioritizeDaily && dailyBanner}

      {explore.length > 0 && (
        <section className="trending-section">
          <div className="section-head">
            <h2>{t.ui.exploreCity}</h2>
            <Link to="/library" className="section-link">
              {t.ui.seeAll}
            </Link>
          </div>
          <div className="trending-scroll">
            {explore.map((x) => (
              <Link key={x.track_id} to={`/track/${x.track_id}`} className="trend-card">
                <div className="trend-cover">
                  <img
                    className="trend-cover-img"
                    src={assetUrl(x.cover)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={512}
                    height={512}
                  />
                  <span className="trend-bpm">{x.bpm} BPM</span>
                </div>
                <div className="trend-meta">
                  <strong>{x.title}</strong>
                  <span>{x.artist}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
