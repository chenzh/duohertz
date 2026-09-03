import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "../router";
import { assetUrl, getTrack, loadChart } from "../catalog/loadCatalog";
import { unlockAudio } from "../audio/playback";
import { PlayField } from "../components/PlayField";
import type { ChartJSON, ChartTier, PlayMode, PlayResult } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";
import { loadKeys, loadSettings } from "../storage/settings";
import { keyLabels, partnerKeysFor } from "../input/keyMap";
import { districtColor } from "../constants/scape";
import { makeLiveStats, type LiveStats } from "../components/playfield/liveStats";
import { trackEvent } from "../lib/analytics";
import { buildPlayPageMeta, usePageMeta } from "../seo/pageMeta";

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
 *   (two decodes = a few ms of delay = flanger/echo). Hit SFX stay on for both,
 *   so each player still hears their own feedback.
 * · **Keys**: P1 keeps the player's saved binding; P2 is handed the preset that
 *   can't collide with it (arrows ↔ D F J K), see `keyMap.partnerKeysFor`.
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
  const [startedAt] = useState(() => performance.now());
  const settings = useMemo(loadSettings, []);
  usePageMeta(track ? buildPlayPageMeta(track, tier, mode) : null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
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
        const c = await loadChart(t, tier);
        if (!cancelled) {
          setTrack(t);
          setChart(c);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Chart load failed");
      }
    })();
    return () => {
      cancelled = true;
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

  const exitDuo = () => {
    nav(track ? `/track/${track.track_id}` : "/library");
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
        <strong>{track.title}</strong>
        <span className="play-meta-tier">
          DUO · {tier} · {mode}
        </span>
        <span className="duo-keyhint" aria-hidden>
          <b>P1</b> {p1Hint} <span className="duo-keyhint-sep">|</span> <b>P2</b> {p2Hint}
        </span>
        <button type="button" className="btn compact" onClick={exitDuo}>
          Exit
        </button>
      </div>
      <div className="duo-stage">
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
          onFinish={finish(0)}
        />
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
          onFinish={finish(1)}
        />
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

      {duoResult && (
        <div className="duo-result" role="dialog" aria-label="Duo results">
          <div className="overlay-card duo-result-card">
            <p className="overlay-kicker">Duo · {track.title}</p>
            <p className="overlay-title">{winner}</p>
            <div className="duo-scoreline">
              {duoResult.map((r, i) => (
                <div className={`duo-scorecol${r.score === best ? " is-winner" : ""}`} key={i}>
                  <span className="duo-scorecol-who">{i === 0 ? "P1" : "P2"}</span>
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
              <button type="button" className="btn" onClick={exitDuo}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
