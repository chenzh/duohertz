import { useEffect, useRef, type RefObject } from "react";
import {
  chartProgressPercent,
  liveAccuracyLabel,
  liveHpDamage,
  openingTimingCoachVisible,
  liveScoreTargetStatus,
  type LiveScoreTarget,
  type LiveStats,
} from "./liveStats";
import { SURGE_COPY } from "../../constants/scape";
import type { PlayMode } from "../../types/chart";
import { formatPracticeTempo, type PracticeTempo } from "../../lib/practiceTempo";

/**
 * B-1 · Comic-panel HUD overlaid on the PlayField canvas.
 *
 * Panel layout (PRD §7.5 RESONANCE, comic framing):
 *   · top-left   — performance card (score + accuracy + progress + Arcade HP)
 *   · top-center — SIGNAL pill     (follows surgeTier, recolors per tier)
 *   · center      — combo feedback remains on the canvas, close to the notes
 *   · receptor   — transient judgment feedback stays on the canvas beside the hit
 *
 * Performance discipline: this component renders its static skeleton ONCE.
 * A 20Hz rAF reads `statsRef` and writes text directly into cached DOM nodes,
 * skipping any write whose value is unchanged. It never calls setState, so the
 * canvas game loop is never disturbed.
 *
 * `pointer-events: none` on the container — the HUD is read-only; the only
 * interactive control (pause) is owned by PlayField and sets its own auto.
 */

const SURGE_LABEL: Record<number, string> = {
  0: SURGE_COPY.gauge,
  1: SURGE_COPY.t1,
  2: SURGE_COPY.t2,
  3: SURGE_COPY.t3,
};

const JUDGE_KEYS = ["perfect", "great", "good", "miss"] as const;

type JudgeKey = (typeof JUDGE_KEYS)[number];

export function PlayHud({
  statsRef,
  mode,
  playerLabel,
  scoreTarget,
  openingCoach = false,
  openingCoachTouch = false,
  practiceTempo = 1,
}: {
  statsRef: RefObject<LiveStats>;
  mode: PlayMode;
  /**
   * Duo · "P1" / "P2" badge on the track capsule. Undefined in single-player
   * (the capsule renders exactly as before — no badge, no extra chip).
   */
  playerLabel?: string;
  /** One unambiguous chase target; omitted for unranked and Daily runs. */
  scoreTarget?: LiveScoreTarget;
  /** First Shift · reveal a one-shot receptor-line rescue after three opening misses. */
  openingCoach?: boolean;
  /** Match the rescue verb to the active primary input surface. */
  openingCoachTouch?: boolean;
  /** Player-selected Practice music/chart rate for this run. */
  practiceTempo?: PracticeTempo;
}) {
  const scoreEl = useRef<HTMLSpanElement>(null);
  const scoreTargetEl = useRef<HTMLSpanElement>(null);
  const accuracyEl = useRef<HTMLSpanElement>(null);
  const progressEl = useRef<HTMLSpanElement>(null);
  const progressCountEl = useRef<HTMLSpanElement>(null);
  const hpEl = useRef<HTMLSpanElement>(null);
  const hpFillEl = useRef<HTMLSpanElement>(null);
  const hpValueEl = useRef<HTMLSpanElement>(null);
  const hpDamageEl = useRef<HTMLSpanElement>(null);
  const hpDamageUntilRef = useRef(0);
  const signalEl = useRef<HTMLDivElement>(null);
  const assistEl = useRef<HTMLDivElement>(null);
  const assistTitleEl = useRef<HTMLElement>(null);
  const assistValueEl = useRef<HTMLSpanElement>(null);
  const openingCoachEl = useRef<HTMLDivElement>(null);
  const openingCoachProgressEl = useRef<HTMLElement>(null);
  const judgeEls = useRef<Record<JudgeKey, HTMLSpanElement | null>>({
    perfect: null,
    great: null,
    good: null,
    miss: null,
  });

  // Last value written per node — used to skip no-op DOM writes.
  const last = useRef<{
    score: number;
    scoreTarget: string;
    accuracy: string;
    judged: number;
    total: number;
    hp: number;
    assistVisible: boolean;
    openingCoachVisible: boolean;
    playbackRate: number;
    assistSeconds: number;
    surgeTier: number;
    perfect: number;
    great: number;
    good: number;
    miss: number;
  }>({
    score: -1,
    scoreTarget: "",
    accuracy: "",
    judged: -1,
    total: -1,
    hp: -1,
    assistVisible: false,
    openingCoachVisible: false,
    playbackRate: -1,
    assistSeconds: -1,
    surgeTier: -1,
    perfect: -1,
    great: -1,
    good: -1,
    miss: -1,
  });
  const targetKind = scoreTarget?.kind;
  const targetScore = scoreTarget?.score;
  const initialTargetStatus = scoreTarget ? liveScoreTargetStatus(0, scoreTarget) : null;

  useEffect(() => {
    let raf = 0;
    let prev = 0;
    const STEP = 50; // ~20Hz

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - prev < STEP) return;
      prev = t;
      const s = statsRef.current;
      if (!s) return;

      if (s.score !== last.current.score && scoreEl.current) {
        scoreEl.current.textContent = s.score.toLocaleString("en-US");
        last.current.score = s.score;
      }

      if (targetKind && targetScore !== undefined && scoreTargetEl.current) {
        const targetStatus = liveScoreTargetStatus(s.score, { kind: targetKind, score: targetScore });
        if (targetStatus.text !== last.current.scoreTarget) {
          scoreTargetEl.current.textContent = targetStatus.text;
          scoreTargetEl.current.dataset.state = targetStatus.state;
          last.current.scoreTarget = targetStatus.text;
        }
      }

      const accuracy = liveAccuracyLabel(s);
      if (accuracy !== last.current.accuracy && accuracyEl.current) {
        accuracyEl.current.textContent = accuracy;
        last.current.accuracy = accuracy;
      }

      if (s.judged !== last.current.judged || s.total !== last.current.total) {
        if (progressCountEl.current) {
          progressCountEl.current.textContent = `${Math.min(s.judged, s.total)}/${s.total}`;
        }
        if (progressEl.current) {
          progressEl.current.style.width = `${chartProgressPercent(s)}%`;
        }
        if (openingCoachProgressEl.current) {
          openingCoachProgressEl.current.textContent = `${Math.min(s.judged, s.total)} / ${s.total} ${s.total === 1 ? "note" : "notes"}`;
        }
        last.current.judged = s.judged;
        last.current.total = s.total;
      }

      const hp = Math.round(Math.min(100, Math.max(0, s.hp)));
      if (hp !== last.current.hp) {
        const damage = liveHpDamage(last.current.hp, hp);
        if (damage > 0 && hpDamageEl.current) {
          hpDamageEl.current.textContent = `−${damage}`;
          hpDamageEl.current.dataset.show = "1";
          hpDamageUntilRef.current = t + 900;
        }
        if (hpFillEl.current) hpFillEl.current.style.width = `${hp}%`;
        if (hpValueEl.current) hpValueEl.current.textContent = String(hp);
        if (hpEl.current) hpEl.current.dataset.critical = hp <= 30 ? "1" : "0";
        last.current.hp = hp;
      }
      if (
        hpDamageEl.current?.dataset.show === "1"
        && t >= hpDamageUntilRef.current
      ) {
        hpDamageEl.current.dataset.show = "0";
      }

      const temporaryAssist = s.playbackRate < practiceTempo - 0.001 && s.rateRemainingMs > 0;
      const manualTempo = mode === "practice" && practiceTempo < 0.999;
      const assistVisible = temporaryAssist || manualTempo;
      const assistSeconds = temporaryAssist ? Math.max(1, Math.ceil(s.rateRemainingMs / 1000)) : 0;
      if (assistVisible !== last.current.assistVisible && assistEl.current) {
        assistEl.current.dataset.show = assistVisible ? "1" : "0";
        assistEl.current.setAttribute("aria-hidden", assistVisible ? "false" : "true");
        if (signalEl.current) signalEl.current.dataset.assist = assistVisible ? "1" : "0";
        last.current.assistVisible = assistVisible;
      }
      if (
        assistVisible
        && (s.playbackRate !== last.current.playbackRate || assistSeconds !== last.current.assistSeconds)
        && assistValueEl.current
      ) {
        const title = temporaryAssist ? "Practice assist" : "Practice tempo";
        const value = temporaryAssist
          ? `${formatPracticeTempo(0.5)} · ${assistSeconds}s`
          : formatPracticeTempo(practiceTempo);
        if (assistTitleEl.current) {
          assistTitleEl.current.textContent = title;
        }
        assistValueEl.current.textContent = value;
        if (assistEl.current) {
          assistEl.current.dataset.shortLabel = temporaryAssist ? "ASSIST" : "TEMPO";
          assistEl.current.setAttribute("aria-label", `${title} ${value}`);
        }
        last.current.playbackRate = s.playbackRate;
        last.current.assistSeconds = assistSeconds;
      }

      const openingCoachVisible = openingTimingCoachVisible(openingCoach, s);
      if (openingCoachVisible !== last.current.openingCoachVisible && openingCoachEl.current) {
        openingCoachEl.current.dataset.show = openingCoachVisible ? "1" : "0";
        openingCoachEl.current.setAttribute("aria-hidden", openingCoachVisible ? "false" : "true");
        last.current.openingCoachVisible = openingCoachVisible;
      }

      if (s.surgeTier !== last.current.surgeTier && signalEl.current) {
        signalEl.current.textContent = SURGE_LABEL[s.surgeTier] ?? SURGE_COPY.gauge;
        signalEl.current.dataset.tier = String(s.surgeTier);
        last.current.surgeTier = s.surgeTier;
      }

      for (const key of JUDGE_KEYS) {
        const v = s[key];
        if (v !== last.current[key]) {
          const el = judgeEls.current[key];
          if (el) el.textContent = String(v);
          last.current[key] = v;
        }
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [statsRef, targetKind, targetScore, openingCoach, mode, practiceTempo]);

  return (
    <>
      <div className="play-hud" aria-hidden="true">
      <div className="hud-chip hud-track">
        <span className="hud-performance-head">
          {/* Duo only: single-player leaves this node out entirely. */}
          {playerLabel && (
            <span className="hud-player" data-player={playerLabel}>
              {playerLabel}
            </span>
          )}
          <span className="hud-track-score-label">SCORE</span>
          {scoreTarget && initialTargetStatus && (
            <span
              className="hud-score-target"
              data-kind={scoreTarget.kind}
              data-state={initialTargetStatus.state}
              ref={scoreTargetEl}
            >
              {initialTargetStatus.text}
            </span>
          )}
        </span>
        <span className="hud-track-score">
          <span ref={scoreEl}>0</span>
        </span>
        <span className="hud-performance-meta">
          <span className="hud-track-accuracy">
            <b>ACC</b> <span ref={accuracyEl}>—</span>
          </span>
          <span className="hud-progress-count" ref={progressCountEl}>0/0</span>
        </span>
        <span className="hud-progress-rail">
          <span className="hud-progress-fill" ref={progressEl} />
        </span>
        {mode === "arcade" && (
          <span className="hud-hp" data-critical="0" ref={hpEl}>
            <span className="hud-hp-label">HP</span>
            <span className="hud-hp-rail">
              <span className="hud-hp-fill" ref={hpFillEl} />
            </span>
            <span className="hud-hp-value" ref={hpValueEl}>100</span>
            <span className="hud-hp-damage" data-show="0" ref={hpDamageEl}>−0</span>
          </span>
        )}
      </div>

      <div className="hud-signal" data-tier="0" data-assist="0" ref={signalEl}>
        {SURGE_COPY.gauge}
      </div>

      {/* Cumulative judgment totals belong on Results. Keeping the mirrors
          hidden lets pause/input diagnostics observe state without painting
          four global values as if they were lane labels. */}
      <div className="hud-judges" hidden>
        {JUDGE_KEYS.map((key) => (
          <div className={`hud-judge hud-judge-${key}`} key={key}>
            <span
              className="hud-judge-count"
              ref={(el) => {
                judgeEls.current[key] = el;
              }}
            >
              0
            </span>
          </div>
        ))}
      </div>
      </div>
      <div
        className="hud-practice-assist"
        data-show="0"
        data-short-label="ASSIST"
        ref={assistEl}
        role="status"
        aria-live="polite"
        aria-label="Practice assist 0.5× · 5s"
        aria-hidden="true"
      >
        <strong ref={assistTitleEl}>Practice assist</strong>
        <span ref={assistValueEl}>0.5× · 5s</span>
      </div>
      {openingCoach && (
        <div
          className="hud-opening-coach"
          data-show="0"
          ref={openingCoachEl}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-hidden="true"
        >
          <strong>Find the line</strong>
          <span>
            {openingCoachTouch
              ? "Tap notes at the line"
              : "Press keys at the line"}
          </span>
          <small className="hud-opening-progress" ref={openingCoachProgressEl} aria-hidden="true">
            0 / 0 notes
          </small>
        </div>
      )}
    </>
  );
}
