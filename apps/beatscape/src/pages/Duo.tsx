import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "../router";
import { assetUrl, getTrack, loadChart } from "../catalog/loadCatalog";
import { unlockAudio } from "../audio/playback";
import { PlayField } from "../components/PlayField";
import { ExitGameDialog } from "../components/ExitGameDialog";
import type { ChartJSON, ChartTier, PlayMode, PlayResult } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";
import { loadKeys, loadSettings } from "../storage/settings";
import { keyLabels, partnerKeysFor, presetIdFor } from "../input/keyMap";
import { districtColor } from "../constants/scape";
import { makeLiveStats, type LiveStats } from "../components/playfield/liveStats";
import { trackEvent } from "../lib/analytics";
import { buildPlayPageMeta, usePageMeta } from "../seo/pageMeta";
import { getAudioContext } from "../audio/context";
import { decodedAudioCache } from "../audio/decodedAudioCache";

/**
 * DUO · Split-screen versus — two players, one track, one keyboard.
 *
 * Design notes:
 * · Both fields run the SAME chart from the SAME audio file, but each owns its
 *   own `Conductor` + `GameSession` (PlayField has no shared-clock mode).
 * · **Start sync**: each field fires `onReady` when its decode finishes; the
 *   parent only bumps `startGate` once BOTH are armed, so both `begin()` calls
 *   land in the same React commit — the same frame. Without the gate, P2 would
 *   start a few frames late and the two charts would visibly drift.
 * · **Audio**: P2 gets `muteMusic` so we don't layer the same track on itself
 *   (independent source starts can otherwise produce flanger/echo). Hit SFX stay on for both,
 *   so each player still hears their own feedback.
 * · **Keys**: P1 keeps the player's saved binding; P2 is handed the preset that
 *   can't collide with it — and that sits as far away as the board allows
 *   (arrows ↔ WASD, two opposite corners), see `keyMap.partnerKeysFor`.
 * · **Pause**: both fields hand their pause toggles to the parent, which bumps
 *   a single `pauseSync` counter that flips BOTH fields — a one-sided pause
 *   would freeze one chart while the other kept falling.
 */

export function DuoPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const tier = (params.get("tier") as ChartTier) || "easy";
  const mode = (params.get("mode") as PlayMode) || "casual";
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [chart, setChart] = useState<ChartJSON | null>(null);
  const [loadError, setLoadError] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);
  const [startedAt] = useState(() => performance.now());
  const settings = useMemo(loadSettings, []);
  usePageMeta(track ? buildPlayPageMeta(track, tier, mode) : null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let warmAudio: ReturnType<typeof decodedAudioCache.acquire> | null = null;
    void (async () => {
      setLoadError("");
      setTrack(null);
      setChart(null);
      try {
        const t = await getTrack(id);
        if (!t) {
          if (!cancelled) setLoadError(`Track not found: ${id}`);
          return;
        }
        if (cancelled) return;
        warmAudio = decodedAudioCache.acquire(getAudioContext(), assetUrl(t.audio));
        void warmAudio.promise.catch(() => {}); // Each field owns its retry UI.
        const c = await loadChart(t, tier);
        if (!cancelled) {
          setTrack(t);
          setChart(c);
        }
      } catch (e) {
        warmAudio?.release();
        warmAudio = null;
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Chart load failed");
      }
    })();
    return () => {
      cancelled = true;
      warmAudio?.release();
    };
  }, [id, tier, nav]);

  // One live-stats bridge per player — each field writes, each HUD reads.
  const p1Stats = useRef<LiveStats>(makeLiveStats());
  const p2Stats = useRef<LiveStats>(makeLiveStats());

  const p1Keys = useMemo(loadKeys, []);
  const p2Keys = useMemo(() => partnerKeysFor(p1Keys), [p1Keys]);
  const p1Hint = useMemo(() => keyLabels(p1Keys).join(" · "), [p1Keys]);
  const p2Hint = useMemo(() => keyLabels(p2Keys).join(" · "), [p2Keys]);

  // Start gate. Each field reports ready when its decode finishes; only when
  // BOTH are armed do we show the START card. The click (a) unlocks the
  // AudioContext inside the user-gesture stack — without it Chrome's autoplay
  // policy suspends the context and the run starts silent — and (b) bumps the
  // gate so both conductors `begin()` in the same React commit.
  const [readyCount, setReadyCount] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const startGate = gateOpen ? 1 : 0;
  const armReady = useCallback(() => {
    setReadyCount((c) => c + 1);
  }, []);
  const startDuo = async () => {
    // Must run inside the click handler (user-gesture stack) for autoplay unlock.
    await unlockAudio();
    setGateOpen(true);
    trackEvent("duo_start", { track: track?.track_id ?? "", tier, mode });
  };

  // Linked pause: any pause action on either field broadcasts once and BOTH
  // fields flip together (a one-sided pause would drift the charts apart).
  // Both fields' window-keydown handlers fire for the SAME key event — and
  // browsers run a microtask checkpoint between event listeners, so a
  // queueMicrotask here would flush after listener #1 and the second
  // broadcast would slip through as a SECOND bump (two flips = no pause).
  // setTimeout(0) lands after the whole dispatch task, so the two reports
  // collapse into exactly one bump.
  const [pauseSync, setPauseSync] = useState(0);
  const pausePendingRef = useRef(false);
  const broadcastPause = useCallback(() => {
    if (pausePendingRef.current) return;
    pausePendingRef.current = true;
    setTimeout(() => {
      pausePendingRef.current = false;
      setPauseSync((s) => s + 1);
    }, 0);
  }, []);

  // Both runs must land before we can call a winner.
  const [duoResult, setDuoResult] = useState<[PlayResult, PlayResult] | null>(null);
  const resultsRef = useRef<Array<PlayResult | null>>([null, null]);
  const finish = (who: 0 | 1) => (result: PlayResult) => {
    resultsRef.current[who] = result;
    const [a, b] = resultsRef.current;
    if (a && b) {
      setDuoResult([a, b]);
      trackEvent("duo_finish", {
        track: track?.track_id ?? "",
        tier,
        mode,
        p1: a.score,
        p2: b.score,
        durationMs: Math.round(performance.now() - startedAt),
      });
    }
  };

  // Rematch: bumping this key remounts both fields (fresh sessions, fresh
  // decode, fresh ready-arms). The gate closes and re-arms before reopening.
  const [runKey, setRunKey] = useState(0);
  const rematch = () => {
    resultsRef.current = [null, null];
    setDuoResult(null);
    setGateOpen(false);
    setReadyCount(0);
    setRunKey((k) => k + 1);
  };

  const leaveDuo = () => nav(track ? `/track/${track.track_id}` : "/library");

  // 左上角 X / 对局途中退出：这一局没打完（DUO 也不写单人档案），确认一次
  // 再走 —— X 就在左上角，误触比原来那个被推到右上角的 Exit 容易得多。
  const exitDuo = () => {
    setConfirmExit(true);
  };

  if (loadError) {
    return (
      <section className="play-page">
        <p className="error">{loadError}</p>
        <button type="button" className="btn" onClick={() => nav("/library")}>
          Back to Library
        </button>
      </section>
    );
  }

  if (!track || !chart) {
    return (
      <div className="loading-state">
        <div className="tuning-dial" aria-hidden="true">
          <div className="tuning-scan" />
        </div>
        <p className="tuning-callsign">THE LATE STATIC · 88.6 FM</p>
        <p className="tuning-status">Tuning two receivers…</p>
      </div>
    );
  }

  const best = duoResult ? Math.max(duoResult[0].score, duoResult[1].score) : 0;
  const winner = !duoResult
    ? ""
    : duoResult[0].score === duoResult[1].score
      ? "DEAD HEAT"
      : duoResult[0].score > duoResult[1].score
        ? "P1 WINS"
        : "P2 WINS";

  // WASD lives under the left hand, the arrow cluster in the bottom-right
  // corner — so whoever is on WASD takes the LEFT panel, or the two players'
  // hands end up crossed in front of each other.
  const p2OnLeft = presetIdFor(p2Keys) === "wasd";

  // Everything that has a left/right order follows the panels, so what the
  // player reads matches where their board actually is.
  const keyHints: Array<[string, string]> = [
    ["P1", p1Hint],
    ["P2", p2Hint],
  ];
  if (p2OnLeft) keyHints.reverse();

  const scoreCols: Array<[string, PlayResult]> = duoResult
    ? [
        ["P1", duoResult[0]],
        ["P2", duoResult[1]],
      ]
    : [];
  if (p2OnLeft) scoreCols.reverse();

  // Both fields as elements so the stage can flip their DOM order without
  // touching identity: React matches on `key`, so a flip moves the nodes
  // instead of remounting them (no lost session, no re-decode).
  const fieldP1 = (
    <PlayField
      key={`p1-${track.track_id}-${tier}-${mode}-${runKey}`}
      district={track.district}
      chart={chart}
      audioUrl={assetUrl(track.audio)}
      mode={mode}
      casualSpeed={settings.casualSpeed}
      statsRef={p1Stats}
      trackTitle={track.title}
      tierLabel={tier}
      playerLabel="P1"
      keys={p1Keys}
      startGate={startGate}
      onReady={armReady}
      hideStartOverlay
      onPauseChange={broadcastPause}
      pauseSync={pauseSync}
      suspended={confirmExit}
      onFinish={finish(0)}
    />
  );
  const fieldP2 = (
    <PlayField
      key={`p2-${track.track_id}-${tier}-${mode}-${runKey}`}
      district={track.district}
      chart={chart}
      audioUrl={assetUrl(track.audio)}
      mode={mode}
      casualSpeed={settings.casualSpeed}
      statsRef={p2Stats}
      trackTitle={track.title}
      tierLabel={tier}
      playerLabel="P2"
      keys={p2Keys}
      muteMusic
      startGate={startGate}
      onReady={armReady}
      hideStartOverlay
      onPauseChange={broadcastPause}
      pauseSync={pauseSync}
      suspended={confirmExit}
      onFinish={finish(1)}
    />
  );

  return (
    <section className="play-page duo-page">
      <div
        className="play-bg"
        aria-hidden
        style={{ backgroundImage: `url(${assetUrl(track.cover)})` }}
      />
      <div
        className="neon-layer"
        aria-hidden
        style={{ "--district-color": districtColor(track.district) } as React.CSSProperties}
      >
        <i className="tube" />
        <i className="tube" />
        <i className="tube" />
        <i className="tube" />
        <i className="sign" />
        <i className="sign" />
        <i className="sign" />
        <i className="sign" />
        <i className="breathe" />
      </div>
      <div className="play-meta duo-meta">
        {/* 同 Play 页：X 坐最左，全屏下唯一够得着的关闭方式。 */}
        <button type="button" className="play-exit" onClick={exitDuo} aria-label="Exit the Scape">
          ✕
        </button>
        <strong>{track.title}</strong>
        <span className="play-meta-tier">
          DUO · {tier} · {mode}
        </span>
        <span className="duo-keyhint" aria-hidden>
          {keyHints.map(([who, hint], i) => (
            <span key={who}>
              {i > 0 && <span className="duo-keyhint-sep">|</span>}
              <b>{who}</b> {hint}
            </span>
          ))}
        </span>
      </div>
      {/* 屏幕左右要跟键盘左右对上：用 WASD（左手区）的那个玩家坐左边，用
          方向键（右下角）的坐右边。否则两个人手是交叉的——右手边的人去够
          键盘左边的 WASD，左手边的人去够右下角的方向键，别扭且容易碰手。
          P1 / P2 的身份、计分、回调都跟着玩家走，交换的只是 DOM 顺序。 */}
      <div className="duo-stage">
        {p2OnLeft
          ? [fieldP2, fieldP1]
          : [fieldP1, fieldP2]}
      </div>

      {/* Ready card — shown once BOTH fields finished decoding. One click:
          unlock AudioContext (user gesture) + open the gate (both begin, same frame). */}
      {readyCount >= 2 && !gateOpen && !duoResult && (
        <div className="duo-start" onClick={() => void startDuo()}>
          <div className="overlay-card">
            <p className="overlay-kicker">Both receivers locked</p>
            <p className="overlay-title">Duel ready</p>
            <button
              type="button"
              className="btn primary unlock-btn"
              onClick={(e) => {
                e.stopPropagation();
                void startDuo();
              }}
            >
              Start
            </button>
            <p className="unlock-hint">
              P1 {p1Hint} · P2 {p2Hint}
            </p>
          </div>
        </div>
      )}

      {confirmExit && (
        <ExitGameDialog
          trackTitle={track.title}
          duo
          onKeepPlaying={() => setConfirmExit(false)}
          onLeave={leaveDuo}
        />
      )}
      {duoResult && (
        <div className="duo-result" role="dialog" aria-label="Duo results">
          <div className="overlay-card duo-result-card">
            <p className="overlay-kicker">Duo · {track.title}</p>
            <p className="overlay-title">{winner}</p>
            <div className="duo-scoreline">
              {scoreCols.map(([who, r]) => (
                <div className={`duo-scorecol${r.score === best ? " is-winner" : ""}`} key={who}>
                  <span className="duo-scorecol-who">{who}</span>
                  <span className="duo-scorecol-grade">{r.grade}</span>
                  <span className="duo-scorecol-score">{r.score.toLocaleString("en-US")}</span>
                  <span className="duo-scorecol-meta">
                    {(r.accuracy * 100).toFixed(2)}% · x{r.maxCombo}
                  </span>
                  <span className="duo-scorecol-meta">
                    {r.judgments.perfect}/{r.judgments.great}/{r.judgments.good}/{r.judgments.miss}
                  </span>
                </div>
              ))}
            </div>
            <div className="duo-result-actions">
              <button type="button" className="btn primary" onClick={rematch}>
                Rematch
              </button>
              {/* 两边都打完了，没有可丢的 —— 不再拦一道确认。 */}
              <button type="button" className="btn" onClick={leaveDuo}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
