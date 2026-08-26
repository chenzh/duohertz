import { useCallback, useEffect, useRef, useState } from "react";
import type { ChartJSON, Judgment, PlayMode, PlayResult } from "../types/chart";
import { decodeAudioUrl, SongPlayer } from "../audio/playback";
import {
  playBreak,
  playHit,
  playKeyDown,
  playMilestone,
  resumeAudio,
} from "../audio/hitsounds";
import { loadKeys, loadOffsetMs, loadSettings } from "../storage/settings";
import {
  approachLeadFor,
  approachLeadMs,
  audioRate,
  finalize,
  initPlay,
  noteLanes,
  noteTime,
  noteY,
  pressLane,
  releaseLane,
  tickMisses,
  visualArFor,
  visualScrollBias,
  type LivePlay,
} from "../engine/playState";
import { accuracyPercent } from "../engine/judge";

type Props = {
  chart: ChartJSON;
  audioUrl: string;
  mode: PlayMode;
  casualSpeed: number;
  onFinish: (result: PlayResult) => void;
  onFail: (result: PlayResult) => void;
};

type Spark = { id: number; lane: number; judgment: Judgment; at: number };
type Flash = { lane: number; judgment: Judgment; at: number };

const LEAD_MS = 1400;
const RECEPTOR_RATIO = 0.85;
const LANE_COLORS = ["#3DDCFF", "#8B5CF6", "#EC4899", "#F59E0B"];
const CHORD_LOOKAHEAD_MS = 420;
const SPARK_CAP = 16;

export function PlayField({ chart, audioUrl, mode, casualSpeed, onFinish, onFail }: Props) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<SongPlayer | null>(null);
  const [play, setPlay] = useState<LivePlay>(() => initPlay(chart, mode));
  const [songMs, setSongMs] = useState(0);
  const [fieldH, setFieldH] = useState(520);
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [needsUnlock, setNeedsUnlock] = useState(true);
  const [paused, setPaused] = useState(false);
  const [pressed, setPressed] = useState<Set<number>>(() => new Set());
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [laneFlashes, setLaneFlashes] = useState<Flash[]>([]);
  const [milestoneBanner, setMilestoneBanner] = useState<number | null>(null);
  const [hudPulse, setHudPulse] = useState<"score" | "combo" | null>(null);

  const playRef = useRef(play);
  const startedRef = useRef(started);
  const pausedRef = useRef(paused);
  const pressedRef = useRef(pressed);
  const onFinishRef = useRef(onFinish);
  const onFailRef = useRef(onFail);
  const sparkIdRef = useRef(0);
  const pauseAtRef = useRef(0);
  const seenMilestoneRef = useRef(0);
  const lastFxAtRef = useRef(0);

  playRef.current = play;
  startedRef.current = started;
  pausedRef.current = paused;
  pressedRef.current = pressed;
  onFinishRef.current = onFinish;
  onFailRef.current = onFail;

  const settings = loadSettings();
  const offsetMs = loadOffsetMs() + chart.audio_offset_ms;
  const keys = loadKeys();
  const scrollBias = visualScrollBias(mode, casualSpeed) * (1 + settings.scrollBias);
  const receptorY = fieldH * RECEPTOR_RATIO;
  const visualAr = visualArFor(chart, mode);
  const lead = approachLeadMs(visualAr, approachLeadFor(chart, mode, LEAD_MS));
  const fancyFx = settings.fancyFx;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setReady(false);
      setLoadError("");
      playerRef.current?.stop();
      try {
        const ctx = new AudioContext();
        const buf = await decodeAudioUrl(ctx, audioUrl);
        if (cancelled) return;
        const player = new SongPlayer(ctx, buf);
        player.onEnded = () => {
          setPlay((p) => {
            if (!p.finished) onFinishRef.current(finalize(p));
            return { ...p, finished: true };
          });
        };
        playerRef.current = player;
        setReady(true);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Audio load failed");
      }
    }
    void init();
    return () => {
      cancelled = true;
      playerRef.current?.stop();
    };
  }, [audioUrl]);

  useEffect(() => {
    setPlay(initPlay(chart, mode));
    setSongMs(0);
    setCountdown(3);
    setStarted(false);
    setNeedsUnlock(true);
    setPaused(false);
    setSparks([]);
    setLaneFlashes([]);
    setMilestoneBanner(null);
    seenMilestoneRef.current = 0;
    lastFxAtRef.current = 0;
    playerRef.current?.stop();
  }, [chart, mode, audioUrl]);

  const beginRun = async () => {
    await resumeAudio();
    await playerRef.current?.resume();
    setNeedsUnlock(false);
  };

  useEffect(() => {
    if (!ready || needsUnlock || countdown > 0 || paused) return;
    if (countdown === 0 && !started) {
      void playerRef.current?.resume().then(() => {
        playerRef.current?.play(0);
        setStarted(true);
        setCountdown(-1);
      });
    }
  }, [countdown, started, ready, needsUnlock, paused]);

  useEffect(() => {
    if (countdown > 0 && ready && !needsUnlock && !paused) {
      const id = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [countdown, ready, needsUnlock, paused]);

  useEffect(() => {
    if (!started || paused) return;
    const rate = audioRate(mode, playRef.current.practiceSlowUntil);
    playerRef.current?.setRate(rate);
  }, [mode, songMs, started, paused]);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFieldH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const spawnFx = useCallback(
    (lane: number, judgment: Judgment) => {
      if (!fancyFx) return;
      const at = performance.now();
      setLaneFlashes((prev) => [...prev.filter((f) => at - f.at < 280), { lane, judgment, at }]);
      const burst = judgment === "perfect" ? 5 : judgment === "great" ? 3 : judgment === "good" ? 2 : 1;
      setSparks((prev) => {
        const next = [...prev];
        for (let i = 0; i < burst; i++) {
          sparkIdRef.current += 1;
          next.push({ id: sparkIdRef.current, lane, judgment, at: at + i * 12 });
        }
        return next.slice(-SPARK_CAP);
      });
      setHudPulse(judgment === "miss" ? "combo" : "score");
      window.setTimeout(() => setHudPulse(null), 180);
    },
    [fancyFx],
  );

  const togglePause = useCallback(async () => {
    if (!startedRef.current || needsUnlock || countdown >= 0) return;
    if (!pausedRef.current) {
      pauseAtRef.current = playerRef.current?.currentMs() ?? songMs;
      playerRef.current?.stop();
      setPaused(true);
    } else {
      await resumeAudio();
      await playerRef.current?.resume();
      playerRef.current?.play(pauseAtRef.current / 1000);
      setPaused(false);
    }
  }, [countdown, needsUnlock, songMs]);

  const tick = useCallback(() => {
    if (!started || pausedRef.current) return;
    const player = playerRef.current;
    if (!player) return;
    const ms = player.currentMs();
    setSongMs(ms);
    setPlay((p) => {
      const next = tickMisses(p, ms, offsetMs, mode);
      if (next.failed && !p.failed) onFailRef.current(finalize(next));
      if (
        next.lastFx &&
        next.lastFx.at !== lastFxAtRef.current &&
        next.lastFx.judgment === "miss"
      ) {
        lastFxAtRef.current = next.lastFx.at;
        spawnFx(next.lastFx.lane, "miss");
      }
      return next;
    });
  }, [mode, offsetMs, started, spawnFx]);

  useEffect(() => {
    let id = 0;
    const loop = () => {
      tick();
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [tick]);

  useEffect(() => {
    const now = performance.now();
    setSparks((prev) => prev.filter((s) => now - s.at < 420));
    setLaneFlashes((prev) => prev.filter((f) => now - f.at < 280));
  }, [songMs]);

  useEffect(() => {
    const m = play.comboMilestone;
    if (m && m !== seenMilestoneRef.current && [25, 50, 100].includes(m)) {
      seenMilestoneRef.current = m;
      setMilestoneBanner(m);
      if (settings.hitsound) playMilestone();
      const id = window.setTimeout(() => setMilestoneBanner(null), 900);
      return () => clearTimeout(id);
    }
  }, [play.comboMilestone, settings.hitsound]);

  const handlePress = useCallback(
    (lane: number) => {
      if (!startedRef.current || pausedRef.current) return;
      setPressed((s) => new Set(s).add(lane));
      if (settings.hitsound) playKeyDown();
      const ms = playerRef.current?.currentMs() ?? 0;
      setPlay((p) => {
        const prevCombo = p.combo;
        const next = pressLane(p, chart, lane as 0 | 1 | 2 | 3, ms, offsetMs, mode);
        if (next.lastFx && next.lastFx.at !== lastFxAtRef.current) {
          lastFxAtRef.current = next.lastFx.at;
          if (settings.hitsound) {
            if (next.lastFx.judgment === "miss") playBreak();
            else playHit(next.lastFx.judgment);
          }
          spawnFx(lane, next.lastFx.judgment);
        }
        if (next.combo === 0 && prevCombo > 0 && settings.hitsound) playBreak();
        return next;
      });
    },
    [chart, mode, offsetMs, settings.hitsound, spawnFx],
  );

  const handleRelease = useCallback(
    (lane: number) => {
      setPressed((s) => {
        const n = new Set(s);
        n.delete(lane);
        return n;
      });
      if (!startedRef.current || pausedRef.current) return;
      const ms = playerRef.current?.currentMs() ?? 0;
      setPlay((p) => {
        const next = releaseLane(p, lane, ms, offsetMs, mode);
        if (next.lastFx && next.lastFx.at !== lastFxAtRef.current) {
          lastFxAtRef.current = next.lastFx.at;
          if (settings.hitsound && next.lastFx.judgment !== "miss") {
            playHit(next.lastFx.judgment);
          }
          spawnFx(lane, next.lastFx.judgment);
        }
        return next;
      });
    },
    [mode, offsetMs, settings.hitsound, spawnFx],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        void togglePause();
        return;
      }
      if (e.repeat || pausedRef.current) return;
      const lane = keys.findIndex((k) => k.toLowerCase() === e.key.toLowerCase());
      if (lane < 0) return;
      e.preventDefault();
      if (!pressedRef.current.has(lane)) handlePress(lane);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const lane = keys.findIndex((k) => k.toLowerCase() === e.key.toLowerCase());
      if (lane < 0) return;
      handleRelease(lane);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [keys, handlePress, handleRelease, togglePause]);

  const accPct = accuracyPercent(play.judgments, play.totalNotes);

  const chordLanesActive = new Set<number>();
  const nowChart = songMs - offsetMs;
  for (const ns of play.notes) {
    const n = ns.note;
    if (n.type !== "chord" || ns.missed) continue;
    const eta = noteTime(n) - nowChart;
    if (eta > 0 && eta < CHORD_LOOKAHEAD_MS) {
      for (const l of n.lanes) chordLanesActive.add(l);
    }
  }

  const countdownLabel = countdown === 0 ? "GO" : String(countdown);

  return (
    <div className="play-wrap">
      <div className={`play-hud ${hudPulse ? `pulse-${hudPulse}` : ""}`}>
        <div className="hud-score">
          <span className="label">Score</span>
          <strong>{play.score.toLocaleString()}</strong>
        </div>
        <div className={`hud-combo ${play.combo >= 50 ? "hot" : ""}`}>
          <span className="label">Combo</span>
          <strong>{play.combo}x</strong>
        </div>
        <div className="hud-acc">
          <span className="label">Acc</span>
          <strong>{accPct}%</strong>
        </div>
        {mode === "arcade" && (
          <div className="hp-bar" aria-label="HP">
            <div className="hp-fill" style={{ width: `${play.hp}%` }} />
          </div>
        )}
        {mode === "casual" && <span className="mode-chip">Casual · no fail</span>}
        {started && countdown < 0 && (
          <button type="button" className="btn linkish pause-btn" onClick={() => void togglePause()}>
            {paused ? "Resume" : "Pause"}
          </button>
        )}
      </div>

      <div className="play-field" ref={fieldRef}>
        {loadError && <div className="overlay">{loadError}</div>}
        {!loadError && !ready && <div className="overlay">Loading audio…</div>}
        {!loadError && ready && needsUnlock && (
          <div className="overlay">
            <button type="button" className="btn primary unlock-btn" onClick={() => void beginRun()}>
              Tap to Start
            </button>
            <p className="unlock-hint">D · F · J · K when notes hit the line · Esc to pause</p>
          </div>
        )}
        {!loadError && ready && !needsUnlock && countdown >= 0 && (
          <div className={`overlay countdown count-${countdown === 0 ? "go" : countdown}`}>
            <span className="countdown-num">{countdownLabel}</span>
            {countdown > 0 && <span className="countdown-sub">Get ready</span>}
          </div>
        )}
        {paused && (
          <div className="overlay pause-overlay">
            <p className="pause-title">Paused</p>
            <button type="button" className="btn primary" onClick={() => void togglePause()}>
              Resume
            </button>
            <p className="unlock-hint">Press Esc to continue</p>
          </div>
        )}
        {milestoneBanner != null && (
          <div className="combo-milestone" key={milestoneBanner}>
            {milestoneBanner} COMBO
          </div>
        )}

        <div className="receptor" style={{ top: receptorY }}>
          <div className="receptor-glow" />
        </div>

        {[0, 1, 2, 3].map((lane) => {
          const flash = laneFlashes.find((f) => f.lane === lane);
          return (
            <div
              key={lane}
              className={[
                "lane",
                pressed.has(lane) ? "pressed" : "",
                chordLanesActive.has(lane) ? "chord-hint" : "",
                flash ? `flash-${flash.judgment}` : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ "--lane": LANE_COLORS[lane] } as React.CSSProperties}
              onPointerDown={(e) => {
                e.preventDefault();
                handlePress(lane);
              }}
              onPointerUp={() => handleRelease(lane)}
              onPointerLeave={() => handleRelease(lane)}
            >
              {play.notes.map((ns, idx) => {
                const n = ns.note;
                const lanes = noteLanes(n);
                if (!lanes.includes(lane as 0 | 1 | 2 | 3)) return null;
                const t = noteTime(n);
                const y = noteY(t, songMs, receptorY, lead, visualAr, scrollBias);
                if (y < -40 || y > fieldH + 40) return null;
                const judged =
                  n.type === "chord"
                    ? ns.chordLanes?.[lane as 0 | 1 | 2 | 3]
                    : ns.headJudged;
                const chordClass = n.type === "chord" ? "chord-note" : "";
                if (n.type === "hold" && ns.headJudged && !ns.tailJudged) {
                  const yEnd = noteY(n.end, songMs, receptorY, lead, visualAr, scrollBias);
                  return (
                    <div key={`${idx}-body`}>
                      <div
                        className="note hold-body active"
                        style={{
                          top: Math.min(y, yEnd),
                          height: Math.abs(yEnd - y),
                          left: "50%",
                        }}
                      />
                      <div
                        className={`note diamond hold-head ${chordClass}`}
                        style={{ top: y, opacity: judged ? 0.35 : 1 }}
                      />
                    </div>
                  );
                }
                if (n.type === "hold" && ns.tailJudged) return null;
                if (judged && n.type !== "hold") return null;
                if (n.type === "hold") {
                  const yEnd = noteY(n.end, songMs, receptorY, lead, visualAr, scrollBias);
                  return (
                    <div key={idx}>
                      <div
                        className="note hold-body"
                        style={{
                          top: Math.min(y, yEnd),
                          height: Math.abs(yEnd - y),
                          left: "50%",
                        }}
                      />
                      <div className={`note diamond hold-head ${chordClass}`} style={{ top: y }} />
                    </div>
                  );
                }
                return (
                  <div key={idx} className={`note diamond tap ${chordClass}`} style={{ top: y }} />
                );
              })}
              <span className="lane-key">{keys[lane]}</span>
            </div>
          );
        })}

        {sparks.map((s) => (
          <div
            key={s.id}
            className={`hit-spark ${s.judgment}`}
            style={{ top: receptorY - 8, left: `${12.5 + s.lane * 25}%` }}
          />
        ))}

        {play.popups.map((p) => (
          <div
            key={p.id}
            className={`judge-popup ${p.judgment}`}
            style={{ top: receptorY - 48, left: `${12.5 + p.lane * 25}%` }}
          >
            {p.text}
          </div>
        ))}
      </div>
    </div>
  );
}
