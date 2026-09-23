import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import { assetUrl, getTrack, loadChart } from "../catalog/loadCatalog";
import { HeroGameplayPreview } from "./HeroGameplayPreview";
import { LazyPlayField, loadPlayField } from "./LazyPlayField";
import { HOME_HERO_TRACK_ID } from "../lib/firstPlay";
import { loadKeys } from "../storage/settings";
import { useKeyLabels } from "../input/useKeyLabels";
import { usePhysicalKeyboardInput } from "../input/usePhysicalKeyboardInput";
import { isCoarsePointer } from "../input/touchInput";
import { unlockAudio } from "../audio/playback";
import { trackEvent } from "../lib/analytics";
import { SCAPE_COPY } from "../constants/scape";
import { MODE_GUIDANCE, TIER_GUIDANCE } from "../lib/runSetup";
import { playHref } from "../lib/playHref";
import { Link, useNavigate } from "../router";
import {
  gamepadButtonIsPressed,
  STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON,
  STANDARD_GAMEPAD_RIGHT_FACE_BUTTON,
} from "../input/gamepadInput";
import type { CatalogTrack } from "../types/catalog";
import type { ChartJSON, ChartTier, PlayMode, PlayResult } from "../types/chart";

type Props = {
  trackId?: string;
  tier?: ChartTier;
  mode?: PlayMode;
  catalogReloadKey?: number;
  /** Home-owned standard controller assignment; keyboard and touch remain active. */
  gamepadIndex?: number;
  /** Exact full-run entry, including First Shift / replay identity. */
  fullRunHref?: string;
  fullRunLabel?: string;
};

/** Speaker glyph — hard-edge RESONANCE, no soft icon font. */
function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden focusable="false">
      <path
        d="M4 9h3.2L12 5.2v13.6L7.2 15H4V9z"
        fill="currentColor"
        stroke="#000"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {on ? (
        <>
          <path
            d="M15.2 9.2c1.1.9 1.8 2.2 1.8 3.8s-.7 2.9-1.8 3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          />
          <path
            d="M18 7c1.9 1.5 3 3.6 3 6s-1.1 4.5-3 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          />
        </>
      ) : (
        <path
          d="M15.5 9.5l5 5m0-5l-5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="square"
        />
      )}
    </svg>
  );
}

/**
 * Home hero — demo behind translucent mask until one combined Play+Sound tap.
 */
export function HomeHeroPlay({
  trackId = HOME_HERO_TRACK_ID,
  tier = "easy",
  mode = "casual",
  catalogReloadKey = 0,
  gamepadIndex,
  fullRunHref,
  fullRunLabel = "Play full run",
}: Props = {}) {
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [chart, setChart] = useState<ChartJSON | null>(null);
  const [error, setError] = useState("");
  const [armError, setArmError] = useState("");
  const [live, setLive] = useState(false);
  const [arming, setArming] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [demoResult, setDemoResult] = useState<PlayResult | null>(null);
  const armingRef = useRef(false);
  const armAttemptRef = useRef(0);
  const nav = useNavigate();
  const storedKeys = useMemo(loadKeys, []);
  const keys = useKeyLabels(storedKeys);
  const [touchUi] = useState(isCoarsePointer);
  const physicalKeyboardSeen = usePhysicalKeyboardInput();
  const showTouchLegend = touchUi && !physicalKeyboardSeen;

  useEffect(() => {
    let alive = true;
    setTrack(null);
    setChart(null);
    setError("");
    setArmError("");
    setLive(false);
    armAttemptRef.current++;
    armingRef.current = false;
    setArming(false);
    setRunKey(0);
    setDemoResult(null);
    void (async () => {
      try {
        const t = await getTrack(trackId);
        if (!t) throw new Error(`${trackId} missing from catalog`);
        if (!alive) return;
        setTrack(t);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Chart load failed");
      }
    })();
    return () => {
      alive = false;
      armAttemptRef.current++;
      armingRef.current = false;
    };
  }, [trackId, tier, mode, catalogReloadKey]);

  const armPlay = async () => {
    // A state-only guard leaves a same-turn double-click window before React
    // can commit disabled=true. Keep one authoritative attempt synchronously.
    if (!track || armingRef.current) return;
    const attempt = ++armAttemptRef.current;
    armingRef.current = true;
    setArming(true);
    setArmError("");
    try {
      try {
        await unlockAudio();
      } catch {
        if (armAttemptRef.current === attempt) {
          setArmError("Audio could not start. Check browser sound permission, then try again.");
        }
        return;
      }
      // Leaving Home or changing the selected entry while permission is
      // pending must not download gameplay assets for an abandoned intent.
      if (armAttemptRef.current !== attempt) return;
      // The idle preview is procedural and does not use a chart. Load the real
      // chart only after the visitor chooses to play, preserving audio consent.
      const [loaded] = await Promise.all([
        loadChart(track, tier),
        loadPlayField(),
      ]);
      if (armAttemptRef.current !== attempt) return;
      setChart(loaded);
      setLive(true);
      trackEvent("home_sound_toggle", { muted: 0 });
    } catch {
      if (armAttemptRef.current === attempt) {
        setArmError("Demo could not load. Check your connection, then try again.");
      }
    } finally {
      if (armAttemptRef.current === attempt) {
        armingRef.current = false;
        setArming(false);
      }
    }
  };

  const keepDemoActionClear = (event: FocusEvent<HTMLButtonElement>) => {
    const tabBar = document.querySelector<HTMLElement>(".mobile-tabbar");
    if (!tabBar || getComputedStyle(tabBar).display === "none") return;
    const disclosure = event.currentTarget.parentElement?.querySelector<HTMLElement>(".unlock-hint");
    const contentBottom = Math.max(
      event.currentTarget.getBoundingClientRect().bottom,
      disclosure?.getBoundingClientRect().bottom ?? 0,
    );
    const overlap = contentBottom - (tabBar.getBoundingClientRect().top - 8);
    if (overlap > 0) window.scrollBy(0, Math.ceil(overlap));
  };

  const retryDemo = useCallback(() => {
    setDemoResult(null);
    setRunKey((key) => key + 1);
  }, []);

  const fullRunDestination = fullRunHref ?? (
    track ? playHref(track.track_id, tier, mode) : ""
  );

  useEffect(() => {
    if (demoResult === null || gamepadIndex === undefined || !fullRunDestination || !track) return;

    let frame = 0;
    let armed = false;
    let previousPrimary = false;
    let previousRetry = false;

    const poll = () => {
      let gamepad: Gamepad | null = null;
      try {
        gamepad = navigator.getGamepads?.()[gamepadIndex] ?? null;
      } catch {
        // Permissions Policy and hardened browsers can reject Gamepad access.
        // The visible pointer/keyboard actions remain available.
      }

      if (!gamepad?.connected || gamepad.mapping !== "standard") {
        // A reconnected/reassigned controller must also return to neutral
        // before it can activate a result action.
        armed = false;
        previousPrimary = false;
        previousRetry = false;
        frame = window.requestAnimationFrame(poll);
        return;
      }

      const primary = gamepadButtonIsPressed(
        gamepad.buttons[STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON],
      );
      const retry = gamepadButtonIsPressed(
        gamepad.buttons[STANDARD_GAMEPAD_RIGHT_FACE_BUTTON],
      );

      // The last gameplay hit may still be held when PlayField hands off to
      // this card. Require one neutral frame so that hit cannot open/retry.
      if (!armed) {
        armed = !primary && !retry;
      } else if (primary && !previousPrimary) {
        trackEvent("home_play_click", { track: track.track_id, cta: fullRunLabel });
        nav(fullRunDestination);
        return;
      } else if (retry && !previousRetry) {
        retryDemo();
        return;
      }

      previousPrimary = primary;
      previousRetry = retry;
      frame = window.requestAnimationFrame(poll);
    };

    frame = window.requestAnimationFrame(poll);
    return () => window.cancelAnimationFrame(frame);
  }, [demoResult, fullRunDestination, fullRunLabel, gamepadIndex, nav, retryDemo, track]);

  if (error) {
    return (
      <div className="home-hero-play home-hero-play-error">
        <p className="eyebrow">Demo offline</p>
        <p>The live preview will return with the track list.</p>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="home-hero-play home-hero-play-loading" aria-busy>
        <div className="loading-spinner" aria-hidden />
        <p>Loading your next track…</p>
      </div>
    );
  }

  return (
    <div
      className="home-hero-play"
      role="region"
      aria-label="Interactive demo. Progress is not saved."
    >
      <div className="home-hero-play-meta">
        <strong>{track.title}</strong>
        <span>
          {track.artist} · {TIER_GUIDANCE[tier].label} · {MODE_GUIDANCE[mode].label}
        </span>
      </div>
      <div className="home-hero-play-stage">
        {!live ? (
          <>
            {/* Comic "ON AIR" slab. Only over the demo — once live, the tag
                would sit on top of the falling notes. */}
            <p className="home-hero-onair" aria-hidden>
              <i className="home-hero-onair-dot" />
              <span>On air · demo</span>
            </p>
            <div className="home-hero-demo play-wrap play-wrap-hero">
              <HeroGameplayPreview keyHints={showTouchLegend ? [] : keys} />
              <div className="home-hero-demo-mask">
                <p className="overlay-kicker">{SCAPE_COPY.heroPlayKicker}</p>
                <p className="unlock-hint">
                  {gamepadIndex !== undefined
                    ? touchUi
                      ? "Controller connected · touch lanes stay active"
                      : "Controller connected · keyboard stays active"
                    : physicalKeyboardSeen && touchUi
                      ? "Demo · no progress saved · keyboard + touch"
                      : touchUi
                        ? SCAPE_COPY.heroPlayHintTouch
                        : SCAPE_COPY.heroPlaySoundHint}
                </p>
                <button
                  type="button"
                  className="btn primary unlock-btn home-play-sound-btn"
                  onClick={() => void armPlay()}
                  onFocus={keepDemoActionClear}
                  disabled={arming}
                  aria-busy={arming}
                >
                  <SoundIcon on />
                  <span>{arming ? "Starting…" : SCAPE_COPY.heroPlayAction}</span>
                </button>
                {gamepadIndex !== undefined ? (
                  <div
                    className="unlock-gamepad"
                    role="note"
                    aria-label="Controller ready. Use the D-pad or four face buttons."
                  >
                    <span className="unlock-gamepad-buttons" aria-hidden>◀ ▼ ▲ ▶</span>
                    <span>
                      <strong>Controller ready</strong>
                      <small>D-pad or face buttons</small>
                    </span>
                  </div>
                ) : showTouchLegend ? (
                  <div className="unlock-touch-lanes" aria-hidden>
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                ) : !keys.length ? null : (
                  <div
                    className="unlock-keys"
                    role="img"
                    aria-label={`Lane keys: ${keys.join(" · ")}`}
                  >
                    {keys.map((k, i) => (
                      <span key={i} className="key-chip" aria-hidden>
                        {k}
                      </span>
                    ))}
                  </div>
                )}
                {armError && (
                  <p className="start-run-error home-hero-demo-error" role="alert">{armError}</p>
                )}
              </div>
            </div>
          </>
        ) : demoResult ? (
          <div
            className="home-hero-demo-result play-wrap play-wrap-hero"
            role="region"
            aria-label="Demo result"
          >
            <div className="home-hero-demo-result-card">
              <div className="home-hero-demo-result-summary" role="status" aria-live="polite">
                <p className="overlay-kicker">Demo complete</p>
                <strong className="home-hero-demo-result-score">
                  {demoResult.judgments.perfect + demoResult.judgments.great + demoResult.judgments.good === 0
                    ? "No notes hit"
                    : `${demoResult.accuracy.toFixed(2)}% ACC · Grade ${demoResult.grade}`}
                </strong>
                <p className="home-hero-demo-result-note">Progress was not saved.</p>
              </div>
              <div className="home-hero-demo-result-actions">
                <Link
                  className="btn primary"
                  to={fullRunDestination}
                  onClick={() => trackEvent("home_play_click", { track: track.track_id, cta: fullRunLabel })}
                >
                  {fullRunLabel}
                </Link>
                <button type="button" className="btn ghost" onClick={retryDemo}>
                  Try demo again
                </button>
              </div>
              {gamepadIndex !== undefined && (
                <div
                  className="home-hero-demo-result-gamepad"
                  role="note"
                  aria-label="Controller result controls. Bottom face starts the full run. Right face retries the demo."
                >
                  <span>Face down · Full run</span>
                  <span>Face right · Retry</span>
                </div>
              )}
            </div>
          </div>
        ) : chart ? (
          <Suspense fallback={null}>
            <LazyPlayField
              key={`${track.track_id}-${runKey}`}
              district={track.district}
              chart={chart}
              audioUrl={assetUrl(track.audio)}
              mode={mode}
              variant="hero"
              gamepadIndex={gamepadIndex}
              muted={false}
              autoStart
              onStart={() => trackEvent("home_hero_play_start", { track: track.track_id })}
              onFinish={(result) => {
                const hits = result.judgments.perfect + result.judgments.great + result.judgments.good;
                trackEvent("home_hero_play_finish", {
                  track: track.track_id,
                  accuracy: result.accuracy,
                  grade: result.grade,
                  hits,
                });
                setDemoResult(result);
              }}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}
