import { useCallback, useEffect, useRef, useState } from "react";
import type { ChartJSON, PlayMode } from "../types/chart";
import { decodeAudioUrl, SongPlayer } from "../audio/playback";
import { playBreak, playHit, playKeyDown, resumeAudio } from "../audio/hitsounds";
import { loadSettings } from "../storage/settings";
import {
  finalize,
  initPlay,
  noteY,
  pressLane,
  releaseLane,
  speedMultiplier,
  tickMisses,
  type LivePlay,
} from "../engine/playState";
import type { PlayResult } from "../types/chart";

type Props = {
  chart: ChartJSON;
  audioUrl: string;
  audioWavBytes?: ArrayBuffer;
  mode: PlayMode;
  casualSpeed: number;
  readOnly?: boolean;
  onFinish: (result: PlayResult) => void;
  onFail: (result: PlayResult) => void;
};

type Particle = { id: number; lane: number; ox: number; oy: number; born: number; color: string };
type TapRipple = { id: number; lane: number; born: number; judgment?: string };

const LEAD_MS = 1400;
const RECEPTOR_RATIO = 0.82;
const LANE_COLORS = ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b"];
const LANE_KEYS = ["D", "F", "J", "K"];

export function PlayField({
  chart,
  audioUrl,
  audioWavBytes,
  mode,
  casualSpeed,
  readOnly,
  onFinish,
  onFail,
}: Props) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<SongPlayer | null>(null);
  const [play, setPlay] = useState<LivePlay>(() => initPlay(chart, mode));
  const [songMs, setSongMs] = useState(0);
  const [fieldH, setFieldH] = useState(480);
  const [countdown, setCountdown] = useState(2);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [pressed, setPressed] = useState<Set<number>>(() => new Set());
  const [milestoneBanner, setMilestoneBanner] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripples, setRipples] = useState<TapRipple[]>([]);
  const [dropFlash, setDropFlash] = useState(false);
  const particleId = useRef(0);
  const rippleId = useRef(0);
  const playRef = useRef(play);
  const prevComboRef = useRef(0);
  const dropFired = useRef<Set<number>>(new Set());
  const onFinishRef = useRef(onFinish);
  const onFailRef = useRef(onFail);
  playRef.current = play;
  onFinishRef.current = onFinish;
  onFailRef.current = onFail;
  const settings = loadSettings();
  const receptorY = fieldH * RECEPTOR_RATIO;
  const beatMs = 60000 / chart.meta.bpm;
  const beatPhase = started ? (songMs % beatMs) / beatMs : 0;
  const onKick = started && beatPhase < 0.12;
  const onBeat = started && beatPhase < 0.08;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setReady(false);
      setLoadError("");
      playerRef.current?.stop();
      try {
        const ctx = new AudioContext();
        let buf: AudioBuffer;
        if (audioWavBytes) {
          buf = await ctx.decodeAudioData(audioWavBytes.slice(0));
        } else {
          buf = await decodeAudioUrl(ctx, audioUrl);
        }
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
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Audio failed to load");
        }
      }
    }
    void init();
    return () => {
      cancelled = true;
      playerRef.current?.stop();
    };
  }, [audioUrl, audioWavBytes]);

  useEffect(() => {
    setPlay(initPlay(chart, mode));
    setSongMs(0);
    setCountdown(2);
    setStarted(false);
    setParticles([]);
    dropFired.current = new Set();
    playerRef.current?.stop();
  }, [chart, mode, audioUrl]);

  useEffect(() => {
    if (!ready || countdown > 0) return;
    if (countdown === 0 && !started) {
      void resumeAudio().then(() => {
        playerRef.current?.resume().then(() => {
          playerRef.current?.play(0);
          setStarted(true);
          setCountdown(-1);
        });
      });
    }
  }, [countdown, started, ready]);

  useEffect(() => {
    if (countdown > 0 && ready) {
      const id = window.setTimeout(() => setCountdown((c) => c - 1), 600);
      return () => clearTimeout(id);
    }
  }, [countdown, ready]);

  useEffect(() => {
    const combo = play.combo;
    for (const m of [25, 50, 100, 200]) {
      if (prevComboRef.current < m && combo >= m) {
        setMilestoneBanner(m);
        window.setTimeout(() => setMilestoneBanner(null), 1400);
        break;
      }
    }
    prevComboRef.current = combo;
  }, [play.combo]);

  useEffect(() => {
    if (!started) return;
    const rate = speedMultiplier(mode, casualSpeed, playRef.current.practiceSlowUntil);
    playerRef.current?.setRate(rate);
  }, [mode, casualSpeed, songMs, started]);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFieldH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!started || !chart.meta.sections) return;
    for (const sec of chart.meta.sections) {
      if (sec.type !== "drop") continue;
      const key = Math.round(sec.t);
      if (songMs >= sec.t && songMs < sec.t + 200 && !dropFired.current.has(key)) {
        dropFired.current.add(key);
        setDropFlash(true);
        window.setTimeout(() => setDropFlash(false), 500);
      }
    }
  }, [songMs, chart.meta.sections, started]);

  const spawnRipple = (lane: number, judgment?: string) => {
    setRipples((r) => [
      ...r.slice(-8),
      { id: rippleId.current++, lane, born: performance.now(), judgment },
    ]);
  };

  const spawnParticles = (lane: number, judgment: string) => {
    const color =
      judgment === "perfect" ? "#fde047" : judgment === "great" ? LANE_COLORS[lane]! : judgment === "miss" ? "#ef4444" : "#22c55e";
    const count = judgment === "perfect" ? 22 : judgment === "miss" ? 8 : 14;
    const batch: Particle[] = [];
    for (let i = 0; i < count; i++) {
      batch.push({
        id: particleId.current++,
        lane,
        ox: (Math.random() - 0.5) * (judgment === "perfect" ? 90 : 70),
        oy: (Math.random() - 0.5) * 50 - 25,
        born: performance.now(),
        color,
      });
    }
    setParticles((p) => [...p.slice(-60), ...batch]);
  };

  const getSongMs = () => playerRef.current?.currentMs() ?? 0;

  const tick = useCallback(() => {
    if (!started) return;
    const player = playerRef.current;
    if (!player) return;
    const ms = player.currentMs();
    setSongMs(ms);
    setPlay((p) => {
      const next = tickMisses(p, ms, settings.offsetMs, mode);
      if (next.failed && !p.failed) onFailRef.current(finalize(next));
      return next;
    });
    setParticles((p) => p.filter((pt) => performance.now() - pt.born < 500));
    setRipples((r) => r.filter((rp) => performance.now() - rp.born < 350));
  }, [mode, settings.offsetMs, started]);

  useEffect(() => {
    const id = requestAnimationFrame(function loop() {
      tick();
      requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [tick]);

  const handlePress = (lane: number) => {
    if (readOnly || !started) return;
    setPressed((s) => new Set(s).add(lane));
    spawnRipple(lane);
    if (settings.hitsounds) playKeyDown(lane);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);

    const ms = getSongMs();
    setPlay((p) => {
      const prevCombo = p.combo;
      const next = pressLane(p, chart, lane as 0 | 1 | 2 | 3, ms, settings.offsetMs, mode);
      const judged = next.lastFx;
      if (settings.hitsounds && judged && judged.lane === lane && judged.judgment !== "miss") {
        playHit(judged.judgment, lane);
        spawnRipple(lane, judged.judgment);
        spawnParticles(lane, judged.judgment);
        if (judged.judgment === "perfect" && navigator.vibrate) navigator.vibrate([8, 4, 16]);
      }
      if (judged && judged.lane === lane && judged.judgment === "miss") {
        spawnRipple(lane, "miss");
        spawnParticles(lane, "miss");
        if (navigator.vibrate) navigator.vibrate(30);
      }
      if (next.combo === 0 && prevCombo > 0) playBreak();
      return next;
    });
  };

  const handleRelease = (lane: number) => {
    setPressed((s) => {
      const n = new Set(s);
      n.delete(lane);
      return n;
    });
    if (readOnly || !started) return;
    const ms = getSongMs();
    setPlay((p) => releaseLane(p, lane, ms, settings.offsetMs, mode));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const lane = settings.keys.findIndex((k) => k.toLowerCase() === e.key.toLowerCase());
    if (lane < 0) return;
    e.preventDefault();
    if (!pressed.has(lane)) handlePress(lane);
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const lane = settings.keys.findIndex((k) => k.toLowerCase() === e.key.toLowerCase());
    if (lane < 0) return;
    handleRelease(lane);
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  const progress = Math.min(100, (songMs / (chart.notes.at(-1)?.t ?? 1)) * 100);
  const now = performance.now();
  const shake =
    play.lastFx?.judgment === "perfect" && now - (play.lastFx?.at ?? 0) < 120
      ? "shake shake-hard"
      : play.lastFx?.judgment === "great" && now - (play.lastFx?.at ?? 0) < 80
        ? "shake"
        : "";
  const totalHits =
    play.judgments.perfect + play.judgments.great + play.judgments.good + play.judgments.miss;
  const accPct = totalHits
    ? Math.round(
        ((play.judgments.perfect * 100 +
          play.judgments.great * 70 +
          play.judgments.good * 40) /
          (totalHits * 100)) *
          100,
      )
    : 100;

  return (
    <div className={`play-wrap ${shake} ${dropFlash ? "drop-flash" : ""} ${onKick ? "kick-pulse" : ""}`}>
      <div className="play-hud">
        <div className="hud-block">
          <span className="label">Score</span>
          <strong className={play.combo >= 50 ? "score-hot" : ""}>{play.score.toLocaleString()}</strong>
        </div>
        <div className="hud-block">
          <span className="label">Combo</span>
          <strong className={`combo-display ${play.combo >= 10 ? "combo-fire" : ""}`}>
            {play.combo}x
          </strong>
        </div>
        <div className="hud-block">
          <span className="label">Acc</span>
          <strong>{accPct}%</strong>
        </div>
        {mode === "arcade" && (
          <div className="hud-block hp">
            <span className="label">HP</span>
            <div className="hp-bar">
              <div
                className={`hp-fill ${play.hp < 30 ? "hp-danger" : ""}`}
                style={{ width: `${play.hp}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className={`play-field ${onBeat ? "on-beat" : ""}`} ref={fieldRef}>
        {loadError && (
          <div className="countdown-overlay">
            <span className="countdown-num" style={{ fontSize: "1.2rem" }}>
              Audio error
            </span>
            <p className="countdown-hint">{loadError} — go back and tap Play Now again.</p>
          </div>
        )}
        {!loadError && !ready && (
          <div className="countdown-overlay">
            <span className="countdown-num" style={{ fontSize: "1.5rem" }}>
              Loading…
            </span>
          </div>
        )}
        {!loadError && ready && countdown >= 0 && (
          <div className="countdown-overlay">
            <span className="countdown-num">{countdown === 0 ? "GO!" : countdown}</span>
            <p className="countdown-hint">
              {countdown > 0 ? "Get ready…" : "GO!"} Keys: D · F · J · K
            </p>
          </div>
        )}
        {milestoneBanner && (
          <div className="milestone-banner">{milestoneBanner}x COMBO!</div>
        )}
        {started && songMs < 6000 && songMs > 0 && (
          <div className="tutorial-banner">
            <strong>D</strong> left kick · <strong>F/J</strong> mid · <strong>K</strong> right snare
          </div>
        )}
        {[0, 1, 2, 3].map((lane) => {
          const laneHit =
            play.lastFx?.lane === lane && now - (play.lastFx?.at ?? 0) < 180
              ? play.lastFx.judgment
              : null;
          return (
            <div
              key={lane}
              className={`lane ${pressed.has(lane) ? "lane-pressed" : ""} ${laneHit ? `lane-hit-${laneHit}` : ""}`}
              style={{ "--lane-color": LANE_COLORS[lane] } as React.CSSProperties}
            >
              <div className="lane-track" />
              <div className="lane-glow" style={{ top: receptorY }} />
              {ripples
                .filter((r) => r.lane === lane)
                .map((r) => {
                  const age = now - r.born;
                  const scale = 1 + age / 80;
                  return (
                    <div
                      key={r.id}
                      className={`tap-ring ${r.judgment ? `tap-ring-${r.judgment}` : ""}`}
                      style={{
                        top: receptorY,
                        transform: `translateX(-50%) scale(${scale})`,
                        opacity: 1 - age / 350,
                      }}
                    />
                  );
                })}
              <div
                className="receptor"
                style={{ top: receptorY }}
                onPointerDown={() => handlePress(lane)}
                onPointerUp={() => handleRelease(lane)}
                onPointerLeave={() => handleRelease(lane)}
              >
                <span className="key-cap">{LANE_KEYS[lane]}</span>
              </div>
              {play.notes.map((ns) => {
                const n = ns.note;
                if (n.lane !== lane) return null;
                const y = noteY(
                  n.type === "hold" && ns.headJudged ? n.end_t : n.t,
                  songMs,
                  receptorY,
                  LEAD_MS,
                  chart.meta.approach_rate,
                );
                if (y < -40 || y > fieldH + 40) {
                  if (n.type === "hold" && ns.headJudged && !ns.tailJudged) {
                    const headY = noteY(n.t, songMs, receptorY, LEAD_MS, chart.meta.approach_rate);
                    const h = Math.max(16, y - headY);
                    return (
                      <div key={n.id} className="note hold-body" style={{ top: headY, height: h }} />
                    );
                  }
                  return null;
                }
                if (n.type === "hold") {
                  const headY = noteY(n.t, songMs, receptorY, LEAD_MS, chart.meta.approach_rate);
                  const h = Math.max(16, y - headY);
                  return (
                    <div key={n.id}>
                      {!ns.headJudged && headY < receptorY && (
                        <div className="note-trail" style={{ top: headY, height: receptorY - headY }} />
                      )}
                      <div className="note hold-body" style={{ top: headY, height: h }} />
                      <div className={`note hold-head ${ns.headJudged ?? ""}`} style={{ top: headY }} />
                      <div className="note hold-tail" style={{ top: y }} />
                    </div>
                  );
                }
                const showTrail = !ns.headJudged && y < receptorY;
                return (
                  <div key={n.id}>
                    {showTrail && (
                      <div className="note-trail" style={{ top: y, height: receptorY - y }} />
                    )}
                    <div className={`note tap ${ns.headJudged ?? ""}`} style={{ top: y }} />
                  </div>
                );
              })}
              {particles
                .filter((p) => p.lane === lane)
                .map((p) => {
                  const age = now - p.born;
                  return (
                    <div
                      key={p.id}
                      className="hit-particle"
                      style={{
                        top: receptorY + p.oy - age * 0.15,
                        left: `calc(50% + ${p.ox}px)`,
                        background: p.color,
                        opacity: 1 - age / 400,
                        transform: `scale(${1 - age / 500})`,
                      }}
                    />
                  );
                })}
              {play.popups
                .filter((p) => p.lane === lane && now - p.at < 550)
                .map((p) => (
                  <div
                    key={p.id}
                    className={`judge-popup judge-${p.judgment}`}
                    style={{ top: receptorY - 56 - (now - p.at) * 0.12 }}
                  >
                    {p.text}
                  </div>
                ))}
            </div>
          );
        })}
      </div>
      {play.failed && <div className="fail-overlay">FAILED — HP depleted</div>}
    </div>
  );
}
