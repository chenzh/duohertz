import { useEffect, useRef, type RefObject } from "react";
import type { LiveStats } from "./liveStats";
import { SURGE_COPY, COMBO_COPY, JUDGE_COPY } from "../../constants/scape";

/**
 * B-1 · Comic-panel HUD overlaid on the PlayField canvas.
 *
 * Panel layout (PRD §7.5 RESONANCE, comic framing):
 *   · top-left   — track capsule  (title + `tier · mode` + live score)
 *   · top-center — SIGNAL pill     (follows surgeTier, recolors per tier)
 *   · top-right  — combo big number (only shown when combo > 0)
 *   · bottom     — judgment count bars (PERFECT / GREAT / GOOD / MISS)
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

// 打歌中的判定词一律走 JUDGE_COPY（通用术语，见 World Bible §9.1），
// 这里只负责大写排版，避免 HUD 与结算页各写一套。
const JUDGE_PANELS = [
  { key: "perfect", label: JUDGE_COPY.perfect.toUpperCase() },
  { key: "great", label: JUDGE_COPY.great.toUpperCase() },
  { key: "good", label: JUDGE_COPY.good.toUpperCase() },
  { key: "miss", label: JUDGE_COPY.miss.toUpperCase() },
] as const;

type JudgeKey = (typeof JUDGE_PANELS)[number]["key"];

export function PlayHud({
  statsRef,
  title,
  tier,
  mode,
  playerLabel,
}: {
  statsRef: RefObject<LiveStats>;
  title: string;
  tier: string;
  mode: string;
  /**
   * Duo · "P1" / "P2" badge on the track capsule. Undefined in single-player
   * (the capsule renders exactly as before — no badge, no extra chip).
   */
  playerLabel?: string;
}) {
  const scoreEl = useRef<HTMLSpanElement>(null);
  const comboEl = useRef<HTMLDivElement>(null);
  const comboNumEl = useRef<HTMLSpanElement>(null);
  const signalEl = useRef<HTMLDivElement>(null);
  const judgeEls = useRef<Record<JudgeKey, HTMLSpanElement | null>>({
    perfect: null,
    great: null,
    good: null,
    miss: null,
  });

  // Last value written per node — used to skip no-op DOM writes.
  const last = useRef<{
    score: number;
    combo: number;
    comboVisible: boolean;
    surgeTier: number;
    perfect: number;
    great: number;
    good: number;
    miss: number;
  }>({
    score: -1,
    combo: -1,
    comboVisible: true,
    surgeTier: -1,
    perfect: -1,
    great: -1,
    good: -1,
    miss: -1,
  });

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

      const showCombo = s.combo > 0;
      if (showCombo !== last.current.comboVisible) {
        if (comboEl.current) comboEl.current.dataset.show = showCombo ? "1" : "0";
        last.current.comboVisible = showCombo;
      }
      if (showCombo && s.combo !== last.current.combo && comboNumEl.current) {
        comboNumEl.current.textContent = String(s.combo);
        last.current.combo = s.combo;
      }

      if (s.surgeTier !== last.current.surgeTier && signalEl.current) {
        signalEl.current.textContent = SURGE_LABEL[s.surgeTier] ?? SURGE_COPY.gauge;
        signalEl.current.dataset.tier = String(s.surgeTier);
        last.current.surgeTier = s.surgeTier;
      }

      for (const { key } of JUDGE_PANELS) {
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
  }, [statsRef]);

  return (
    <div className="play-hud" aria-hidden="true">
      <div className="hud-chip hud-track">
        {/* Duo only: single-player leaves this node out entirely. */}
        {playerLabel && (
          <span className="hud-player" data-player={playerLabel}>
            {playerLabel}
          </span>
        )}
        <span className="hud-track-title">{title}</span>
        <span className="hud-track-tier">
          {tier} · {mode}
        </span>
        <span className="hud-track-score">
          <span className="hud-track-score-label">SCORE</span>
          <span ref={scoreEl}>0</span>
        </span>
      </div>

      <div className="hud-signal" data-tier="0" ref={signalEl}>
        {SURGE_COPY.gauge}
      </div>

      <div className="hud-combo" data-show="0" ref={comboEl}>
        <span className="hud-combo-num" ref={comboNumEl}>
          0
        </span>
        <span className="hud-combo-label">{COMBO_COPY.combo}</span>
      </div>

      <div className="hud-judges">
        {JUDGE_PANELS.map(({ key, label }) => (
          <div className={`hud-judge hud-judge-${key}`} key={key}>
            <span className="hud-judge-label">{label}</span>
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
  );
}
