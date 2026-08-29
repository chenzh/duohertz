import { useEffect, useMemo, useState } from "react";
import { assetUrl, getTrack, loadChart } from "../catalog/loadCatalog";
import { PlayField } from "./PlayField";
import { HeroGameplayPreview } from "./HeroGameplayPreview";
import { HOME_HERO_TRACK_ID, firstPlayHref } from "../lib/firstPlay";
import { loadKeys, loadSettings } from "../storage/settings";
import { keyLabels } from "../input/keyMap";
import { unlockAudio } from "../audio/playback";
import { Link } from "../router";
import { trackEvent } from "../lib/analytics";
import { SCAPE_COPY } from "../constants/scape";
import type { CatalogTrack } from "../types/catalog";
import type { ChartJSON } from "../types/chart";

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
export function HomeHeroPlay() {
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [chart, setChart] = useState<ChartJSON | null>(null);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const settings = loadSettings();
  const keys = useMemo(() => keyLabels(loadKeys()), []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const t = await getTrack(HOME_HERO_TRACK_ID);
      if (!t) {
        if (alive) setError("Strike Vector missing from catalog");
        return;
      }
      try {
        const c = await loadChart(t, "easy");
        if (!alive) return;
        setTrack(t);
        setChart(c);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Chart load failed");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const armPlay = async () => {
    await unlockAudio();
    setLive(true);
    trackEvent("home_sound_toggle", { muted: 0 });
    trackEvent("home_hero_play_start", { track: HOME_HERO_TRACK_ID });
  };

  if (error) {
    return (
      <div className="home-hero-play home-hero-play-error">
        <p>{error}</p>
        <Link className="btn ghost" to={firstPlayHref()}>
          Open full play
        </Link>
      </div>
    );
  }

  if (!track || !chart) {
    return (
      <div className="home-hero-play home-hero-play-loading" aria-busy>
        <div className="loading-spinner" aria-hidden />
        <p>Loading Strike Vector…</p>
      </div>
    );
  }

  return (
    <div className="home-hero-play">
      <div className="home-hero-play-meta">
        <strong>{track.title}</strong>
        <span>
          {track.artist} · easy · casual
        </span>
      </div>
      <div className="home-hero-play-stage">
        {!live ? (
          <div className="home-hero-demo play-wrap play-wrap-hero">
            <HeroGameplayPreview keyHints={keys} />
            <div className="home-hero-demo-mask">
              <p className="overlay-kicker">{SCAPE_COPY.heroPlayKicker}</p>
              <button
                type="button"
                className="btn primary unlock-btn home-play-sound-btn"
                onClick={() => void armPlay()}
              >
                <SoundIcon on />
                <span>{SCAPE_COPY.play}</span>
              </button>
              {!keys.length ? null : (
                <div className="unlock-keys" aria-hidden>
                  {keys.map((k, i) => (
                    <span key={i} className="key-chip">
                      {k}
                    </span>
                  ))}
                </div>
              )}
              <p className="unlock-hint">{SCAPE_COPY.heroPlaySoundHint}</p>
            </div>
          </div>
        ) : (
          <PlayField
            key={`${track.track_id}-${runKey}`}
            chart={chart}
            audioUrl={assetUrl(track.audio)}
            mode="casual"
            casualSpeed={settings.casualSpeed}
            variant="hero"
            muted={false}
            autoStart
            onStart={() => trackEvent("home_hero_play_start", { track: track.track_id })}
            onFinish={() => {
              trackEvent("home_hero_play_finish", { track: track.track_id });
              setRunKey((k) => k + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}
