import { useEffect, useId, useState } from "react";
import { saveSettings, type BsSettings } from "../storage/settings";
import { useDeviceSettings } from "../storage/useDeviceSettings";
import type { PracticeTempo } from "../lib/practiceTempo";
import {
  formatNoteSpeed,
  noteSpeedFromScrollBias,
  NOTE_SPEED_MAX,
  NOTE_SPEED_MIN,
  NOTE_SPEED_STEP,
  scrollBiasFromNoteSpeed,
} from "../lib/noteSpeed";
import { hasTouchInput } from "../input/touchInput";
import { PracticeTempoPicker } from "./PracticeTempoPicker";

function percent(value: number): number {
  return Math.round(value * 100);
}

export function PauseAudioControls({
  practiceTempo,
  onPracticeTempoChange,
}: {
  practiceTempo?: PracticeTempo;
  onPracticeTempoChange?: (tempo: PracticeTempo) => void;
}) {
  const settings = useDeviceSettings();
  const [touchCapable] = useState(hasTouchInput);
  const [saveFailed, setSaveFailed] = useState(false);
  const panelId = useId();
  const compactQuery = "(orientation: portrait) and (max-width: 640px) and (max-height: 700px)";
  const [compact, setCompact] = useState(() => (
    typeof window !== "undefined" && window.matchMedia(compactQuery).matches
  ));
  const [expanded, setExpanded] = useState(() => (
    typeof window === "undefined" || !window.matchMedia(compactQuery).matches
  ));
  const hasPracticeTempo = practiceTempo !== undefined && onPracticeTempoChange !== undefined;
  const noteSpeed = noteSpeedFromScrollBias(settings.scrollBias);

  useEffect(() => {
    const media = window.matchMedia(compactQuery);
    const syncLayout = (event: MediaQueryListEvent) => {
      setCompact(event.matches);
      // The disclosure is a short-portrait density rule, not a persistent
      // preference. Moving to a roomier or landscape viewport restores the
      // complete control surface; moving back prioritizes run actions again.
      setExpanded(!event.matches);
    };
    media.addEventListener?.("change", syncLayout);
    return () => media.removeEventListener?.("change", syncLayout);
  }, []);

  const update = (patch: Partial<BsSettings>) => {
    setSaveFailed(!saveSettings(patch));
  };

  const controls = (
    <fieldset className="pause-quick-mix">
      <legend>Quick controls</legend>
      <p className="pause-mix-caption">Applies now · saves to this device</p>
      <div className="pause-mix-controls">
        <label className="pause-mix-row">
          <span>Music</span>
          <input
            aria-label="Music volume"
            type="range"
            min="0"
            max="100"
            step="5"
            value={percent(settings.musicVolume)}
            onChange={(event) => update({ musicVolume: Number(event.target.value) / 100 })}
          />
          <output>{percent(settings.musicVolume)}%</output>
        </label>
        <label className="pause-mix-row">
          <span>SFX</span>
          <input
            aria-label="SFX volume"
            type="range"
            min="0"
            max="100"
            step="5"
            value={percent(settings.sfxVolume)}
            onChange={(event) => update({ sfxVolume: Number(event.target.value) / 100 })}
          />
          <output>{percent(settings.sfxVolume)}%</output>
        </label>
        <label className="pause-mix-row">
          <span>Dim</span>
          <input
            aria-label="Background dim"
            type="range"
            min="0"
            max="100"
            step="5"
            value={percent(settings.backgroundDim)}
            aria-valuetext={`${percent(settings.backgroundDim)}% dim`}
            onChange={(event) => update({ backgroundDim: Number(event.target.value) / 100 })}
          />
          <output>{percent(settings.backgroundDim)}%</output>
        </label>
        <label className="pause-mix-row">
          <span>Speed</span>
          <input
            aria-label="Note speed"
            aria-valuetext={`${formatNoteSpeed(noteSpeed)} visual speed`}
            type="range"
            min={NOTE_SPEED_MIN}
            max={NOTE_SPEED_MAX}
            step={NOTE_SPEED_STEP}
            value={noteSpeed}
            onChange={(event) => update({
              scrollBias: scrollBiasFromNoteSpeed(Number(event.target.value)),
            })}
          />
          <output>{formatNoteSpeed(noteSpeed)}</output>
        </label>
        <label className="pause-mix-toggle">
          <span>
            <b>Hitsounds</b>
            <small>Lane feedback</small>
          </span>
          <input
            aria-label="Hitsounds"
            type="checkbox"
            checked={settings.hitsound}
            onChange={(event) => update({ hitsound: event.target.checked })}
          />
        </label>
        <label className="pause-mix-toggle">
          <span>
            <b>Haptics</b>
            <small>Touch &amp; controller</small>
          </span>
          <input
            aria-label="Haptics"
            type="checkbox"
            checked={settings.haptics}
            onChange={(event) => update({ haptics: event.target.checked })}
          />
        </label>
        <label className="pause-mix-toggle">
          <span>
            <b>Reduce motion</b>
            <small>Shake &amp; moving FX</small>
          </span>
          <input
            aria-label="Reduce motion"
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(event) => update({ reduceMotion: event.target.checked })}
          />
        </label>
        {touchCapable && (
          <label className="pause-mix-toggle">
            <span>
              <b>Thumb assist</b>
              <small>Same-hand chords</small>
            </span>
            <input
              aria-label="Thumb chord assist"
              type="checkbox"
              checked={settings.chordAssist}
              onChange={(event) => update({ chordAssist: event.target.checked })}
            />
          </label>
        )}
      </div>
      {saveFailed && (
        <p className="pause-mix-error" role="alert">
          Couldn&apos;t save these controls. Check site-data permissions.
        </p>
      )}
    </fieldset>
  );

  const quickControls = compact ? (
    <div className="pause-mix-disclosure">
      <button
        type="button"
        className="pause-mix-disclosure-toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
      >
        <span>Quick controls</span>
        <small aria-hidden>{expanded ? "Hide" : "Adjust"}</small>
      </button>
      <div id={panelId} hidden={!expanded}>
        {controls}
      </div>
    </div>
  ) : controls;

  return (
    <div className="pause-control-stack" data-practice={hasPracticeTempo ? "1" : "0"}>
      {hasPracticeTempo && (
        <PracticeTempoPicker
          className="pause-practice-tempo"
          tempo={practiceTempo}
          onChange={onPracticeTempoChange}
        />
      )}
      {quickControls}
    </div>
  );
}
