import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link } from "../router";
import {
  loadKeys,
  loadOffsetMs,
  loadSettings,
  loadDisplayName,
  saveDisplayName,
  saveKeys,
  saveOffsetMs,
  saveSettings,
} from "../storage/settings";
import {
  KEY_PRESETS,
  captureKeyCode,
  codesForPreset,
  hasBrowserShortcutModifier,
  hasDuplicateKeys,
  keyLabel,
  presetIdFor,
} from "../input/keyMap";
import { useKeyLabels } from "../input/useKeyLabels";
import { hasTouchInput, isCoarsePointer } from "../input/touchInput";
import { hasProfanity } from "../lib/profanity";
import { SCAPE_COPY_EXTRA } from "../constants/scape";
import { SETTINGS_PAGE_META, usePageMeta } from "../seo/pageMeta";
import { calibrationHref } from "../lib/calibration";
import {
  formatNoteSpeed,
  NOTE_SPEED_MAX,
  NOTE_SPEED_MIN,
  NOTE_SPEED_STEP,
  noteSpeedFromScrollBias,
  scrollBiasFromNoteSpeed,
} from "../lib/noteSpeed";

type SettingsSwitchProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function SettingsSwitch({ label, checked, onChange }: SettingsSwitchProps) {
  return (
    <label className="field toggle-field">
      <span className="toggle-label">{label}</span>
      <span className={`toggle-control${checked ? " is-on" : ""}`}>
        <span className="toggle-state" aria-hidden="true">{checked ? "On" : "Off"}</span>
        <input
          className="toggle-input"
          type="checkbox"
          aria-label={label}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="toggle-switch" aria-hidden="true">
          <span className="toggle-thumb" />
        </span>
      </span>
    </label>
  );
}

function rangeFill(value: number, min: number, max: number): CSSProperties {
  const progress = Math.max(0, Math.min(1, (value - min) / (max - min))) * 100;
  return { "--range-progress": `${progress}%` } as CSSProperties;
}

const OFFSET_MIN = -200;
const OFFSET_MAX = 200;

type OffsetEditor = {
  draft: string;
  value: number;
  valid: boolean;
};

function parseOffsetDraft(draft: string): number | null {
  const normalized = draft.trim();
  if (!/^-?\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isInteger(value) || value < OFFSET_MIN || value > OFFSET_MAX) return null;
  return value;
}

export function SettingsPage() {
  usePageMeta(SETTINGS_PAGE_META);
  const [settings, setSettings] = useState(loadSettings);
  const [offsetEditor, setOffsetEditor] = useState<OffsetEditor>(() => {
    const value = loadOffsetMs();
    return { draft: String(value), value, valid: true };
  });
  const [keys, setKeys] = useState(loadKeys);
  const [displayName, setDisplayName] = useState(loadDisplayName);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const saveTimerRef = useRef<number | null>(null);
  const [listening, setListening] = useState(-1);
  const [touchUi] = useState(isCoarsePointer);
  const [touchCapable] = useState(hasTouchInput);
  const displayedKeys = useKeyLabels(keys, settings.keyLabelLayout);

  const preset = presetIdFor(keys);
  const activePreset = KEY_PRESETS.find((p) => p.id === preset) ?? null;
  const duplicate = hasDuplicateKeys(keys);
  const nameBlocked = hasProfanity(displayName);
  const noteSpeed = noteSpeedFromScrollBias(settings.scrollBias);
  const localizedKeyLabels = displayedKeys.some((label, index) => label !== keyLabel(keys[index] ?? ""));

  const reportSave = useCallback((ok: boolean) => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setSaveState(ok ? "saved" : "error");
    if (ok) {
      saveTimerRef.current = window.setTimeout(() => {
        setSaveState("idle");
        saveTimerRef.current = null;
      }, 2400);
    }
  }, []);

  useEffect(() => {
    if (listening < 0) return;
    const onKey = (e: KeyboardEvent) => {
      // Rebinding must not become a browser-wide keyboard trap. Command
      // chords stay owned by the browser/OS and leave capture armed so the
      // player can still press the intended lane key afterwards.
      if (hasBrowserShortcutModifier(e)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setListening(-1);
        return;
      }
      // Tab remains native focus navigation and exits capture; otherwise the
      // next key pressed on an unrelated control could silently become a lane.
      if (e.code === "Tab") {
        setListening(-1);
        return;
      }
      const code = captureKeyCode(e);
      if (!code) return;
      e.preventDefault();
      const next = [...keys];
      next[listening] = code;
      setKeys(next);
      if (!hasDuplicateKeys(next)) reportSave(saveKeys(next));
      setListening(-1);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [keys, listening, reportSave]);

  useEffect(() => () => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
  }, []);

  const updateSettings = (next: typeof settings) => {
    setSettings(next);
    reportSave(saveSettings(next));
  };

  const updateKeys = (next: string[]) => {
    setKeys(next);
    if (!hasDuplicateKeys(next)) reportSave(saveKeys(next));
  };

  const saveStatus = nameBlocked || duplicate || !offsetEditor.valid
    ? "Fix the highlighted field — your other changes are still saved."
    : saveState === "saved"
      ? "Saved on this device ✓"
      : saveState === "error"
        ? "Couldn’t save in this browser. Check site-data permissions."
        : "Changes save automatically on this device.";
  const saveStatusClass = nameBlocked || duplicate || !offsetEditor.valid || saveState === "error"
    ? " is-error"
    : saveState === "saved"
      ? " is-saved"
      : "";

  const updateDisplayName = (next: string) => {
    setDisplayName(next);
    if (!hasProfanity(next)) reportSave(saveDisplayName(next));
  };

  const applyOffset = (next: number) => {
    const value = Math.max(OFFSET_MIN, Math.min(OFFSET_MAX, Math.round(next)));
    setOffsetEditor({ draft: String(value), value, valid: true });
    reportSave(saveOffsetMs(value));
  };

  const updateOffsetDraft = (draft: string) => {
    const value = parseOffsetDraft(draft);
    if (value === null) {
      setOffsetEditor((current) => ({ ...current, draft, valid: false }));
      return;
    }
    setOffsetEditor({ draft, value, valid: true });
    reportSave(saveOffsetMs(value));
  };

  const handleOffsetKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    let next: number | null = null;
    if (event.key === "ArrowDown") next = offsetEditor.value - 1;
    if (event.key === "ArrowUp") next = offsetEditor.value + 1;
    if (event.key === "PageDown") next = offsetEditor.value - 10;
    if (event.key === "PageUp") next = offsetEditor.value + 10;
    if (event.key === "Home") next = OFFSET_MIN;
    if (event.key === "End") next = OFFSET_MAX;
    if (next === null) return;
    event.preventDefault();
    applyOffset(next);
  };

  const applyKeyPreset = (index: number) => {
    const nextPreset = KEY_PRESETS[index];
    if (!nextPreset) return;
    updateKeys(codesForPreset(nextPreset.id));
    setListening(-1);
  };

  const handlePresetKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % KEY_PRESETS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + KEY_PRESETS.length) % KEY_PRESETS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = KEY_PRESETS.length - 1;
    }
    if (nextIndex === null) return;

    event.preventDefault();
    applyKeyPreset(nextIndex);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      .item(nextIndex)
      .focus();
  };

  return (
    <section className="settings">
      <header className="page-header">
        <h1>Settings</h1>
        <p className="tagline">{SCAPE_COPY_EXTRA.offsetHint}</p>
      </header>

      <p className={`settings-save-status${saveStatusClass}`} role="status" aria-live="polite">
        {saveStatus}
      </p>

      <div className="settings-grid">
        <div className="settings-column">
          <section className="panel">
          <h2>Profile</h2>
          <label className="field">
            {SCAPE_COPY_EXTRA.playerName}
            <input
              data-gamepad-default="true"
              type="text"
              maxLength={24}
              value={displayName}
              aria-invalid={nameBlocked || undefined}
              aria-describedby={nameBlocked ? "display-name-error" : undefined}
              onChange={(e) => updateDisplayName(e.target.value)}
            />
          </label>
          {nameBlocked && (
            <p id="display-name-error" className="error" role="alert">
              That name won&apos;t pass the board censors — pick another.
            </p>
          )}
          <label className="field">
            Global offset (ms)
            <span className="offset-input-wrap">
              <input
                type="text"
                role="spinbutton"
                inputMode="numeric"
                pattern="-?[0-9]*"
                autoComplete="off"
                aria-label="Global offset (ms)"
                aria-valuemin={OFFSET_MIN}
                aria-valuemax={OFFSET_MAX}
                aria-valuenow={offsetEditor.valid ? offsetEditor.value : undefined}
                aria-valuetext={offsetEditor.valid ? `${offsetEditor.value} milliseconds` : undefined}
                aria-invalid={!offsetEditor.valid || undefined}
                aria-describedby={!offsetEditor.valid ? "offset-error" : "offset-hint"}
                value={offsetEditor.draft}
                onChange={(event) => updateOffsetDraft(event.target.value)}
                onKeyDown={handleOffsetKeyDown}
              />
              <span className="offset-input-unit" aria-hidden="true">ms</span>
            </span>
          </label>
          {!offsetEditor.valid && (
            <p id="offset-error" className="error" role="alert">
              Enter a whole number from −200 to +200 ms.
            </p>
          )}
          <div className="offset-quick-adjust" role="group" aria-label="Global offset quick adjust">
            <button
              type="button"
              className="btn ghost"
              aria-label="Decrease offset by 10 milliseconds"
              disabled={offsetEditor.value <= OFFSET_MIN}
              onClick={() => applyOffset(offsetEditor.value - 10)}
            >
              −10 ms
            </button>
            <button
              type="button"
              className="btn ghost"
              aria-label="Reset offset to zero"
              disabled={offsetEditor.valid && offsetEditor.value === 0}
              onClick={() => applyOffset(0)}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn ghost"
              aria-label="Increase offset by 10 milliseconds"
              disabled={offsetEditor.value >= OFFSET_MAX}
              onClick={() => applyOffset(offsetEditor.value + 10)}
            >
              +10 ms
            </button>
          </div>
          <p id="offset-hint" className="field-hint offset-hint">
            Arrow keys adjust 1 ms · Page keys and buttons adjust 10 ms.
          </p>
          <Link className="btn ghost settings-calibrate" to={calibrationHref("/settings")}>
            {SCAPE_COPY_EXTRA.recalibrate}
          </Link>
          </section>

          <section className="panel">
          <h2>Audio</h2>
          <SettingsSwitch
            label="Hitsound"
            checked={settings.hitsound}
            onChange={(checked) => updateSettings({ ...settings, hitsound: checked })}
          />
          <label className="field">
            Music volume · {Math.round(settings.musicVolume * 100)}%
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.musicVolume * 100)}
              style={rangeFill(settings.musicVolume, 0, 1)}
              onChange={(e) => updateSettings({ ...settings, musicVolume: Number(e.target.value) / 100 })}
            />
          </label>
          <label className="field">
            SFX volume · {Math.round(settings.sfxVolume * 100)}%
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.sfxVolume * 100)}
              style={rangeFill(settings.sfxVolume, 0, 1)}
              onChange={(e) => updateSettings({ ...settings, sfxVolume: Number(e.target.value) / 100 })}
            />
          </label>
          </section>
        </div>

        <div className="settings-column">
          <section className="panel">
          <h2>Gameplay</h2>
          <SettingsSwitch
            label="Haptics (touch & controller)"
            checked={settings.haptics}
            onChange={(checked) => updateSettings({ ...settings, haptics: checked })}
          />
          <p className="field-hint">
            Short pulses on supported touchscreens and controllers. This is separate from hitsound audio.
          </p>
          <SettingsSwitch
            label="Fancy FX (particles, shake)"
            checked={settings.fancyFx}
            onChange={(checked) => updateSettings({ ...settings, fancyFx: checked })}
          />
          <SettingsSwitch
            label="Reduce motion (screen shake, moving backgrounds)"
            checked={settings.reduceMotion}
            onChange={(checked) => updateSettings({ ...settings, reduceMotion: checked })}
          />
          <p className="field-hint">
            Your system&apos;s “reduce motion” setting is always honored. This switch
            is for when you want the same thing without changing the whole system.
          </p>
          <label className="field">
            Playfield background · {Math.round(settings.backgroundDim * 100)}% dim
            <input
              aria-label="Background dim"
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(settings.backgroundDim * 100)}
              style={rangeFill(settings.backgroundDim, 0, 1)}
              aria-valuetext={`${Math.round(settings.backgroundDim * 100)}% dim`}
              onChange={(e) => updateSettings({
                ...settings,
                backgroundDim: Number(e.target.value) / 100,
              })}
            />
            <span className="field-hint">
              Darkens character art and pulse lighting behind the lanes. Notes, judgments, and score stay clear.
            </span>
          </label>
          <label className="field">
            Note speed · {formatNoteSpeed(noteSpeed)}
            <input
              aria-label="Note speed"
              type="range"
              min={NOTE_SPEED_MIN}
              max={NOTE_SPEED_MAX}
              step={NOTE_SPEED_STEP}
              value={noteSpeed}
              style={rangeFill(noteSpeed, NOTE_SPEED_MIN, NOTE_SPEED_MAX)}
              onChange={(e) => updateSettings({
                ...settings,
                scrollBias: scrollBiasFromNoteSpeed(Number(e.target.value)),
              })}
            />
            <span className="field-hint">All modes. Higher means faster notes. Music and timing windows stay the same.</span>
          </label>
          {touchCapable && (
            <SettingsSwitch
              label="Thumb chord assist (touch)"
              checked={settings.chordAssist}
              onChange={(checked) => updateSettings({ ...settings, chordAssist: checked })}
            />
          )}
          {touchCapable && (
            <p className="field-hint">
              Two thumbs cover four lanes — one per hand. When a chart asks for two
              lanes on the same hand at once, assist banks the second one instead of
              dropping it. Only touch hits qualify; keyboard and mouse play stays unassisted.
            </p>
          )}
          </section>

          <details className={`panel settings-keymap${touchUi ? " is-collapsible" : ""}`} open={!touchUi}>
          <summary className="settings-keymap-summary">
            <span>Keyboard controls</span>
            <small>External keyboard</small>
          </summary>
          <div className="settings-keymap-body">
            <h2>Key map</h2>
            <div className="preset-row" role="radiogroup" aria-label="Keyboard layout presets">
              {KEY_PRESETS.map((p, index) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  className={`btn compact${preset === p.id ? " is-active" : ""}`}
                  aria-checked={preset === p.id}
                  tabIndex={preset === p.id || (preset === "custom" && index === 0) ? 0 : -1}
                  onClick={() => applyKeyPreset(index)}
                  onKeyDown={(event) => handlePresetKeyDown(event, index)}
                >
                  {p.label}
                  {preset === p.id && localizedKeyLabels && (
                    <small className="preset-layout-label">{displayedKeys.join(" ")}</small>
                  )}
                </button>
              ))}
            </div>
            <p className="field-hint">
              {activePreset ? activePreset.hint : "Custom layout"}
              {localizedKeyLabels
                ? ` · ${settings.keyLabelLayout === "auto" ? "This keyboard shows" : "Displayed as"} ${displayedKeys.join(" · ")}`
                : ""}
              {" · bound by physical position, so it plays the same on QWERTY, AZERTY and QWERTZ"}
            </p>
            <label className="field">
              Printed key labels
              <select
                className="key-label-layout-select"
                value={settings.keyLabelLayout}
                onChange={(event) => updateSettings({
                  ...settings,
                  keyLabelLayout: event.target.value as typeof settings.keyLabelLayout,
                })}
              >
                <option value="auto">Auto-detect (US fallback)</option>
                <option value="qwerty">US QWERTY</option>
                <option value="azerty">French AZERTY</option>
                <option value="qwertz">German QWERTZ</option>
              </select>
              <span className="field-hint">
                Display only; lane bindings stay at the same physical positions. If auto-detect shows the wrong letters, choose your keyboard. Manual choices cover common letter swaps.
              </span>
            </label>
            <div
              className="keys-grid"
              role="group"
              aria-label="Custom lane bindings"
              aria-invalid={duplicate || undefined}
              aria-describedby={duplicate ? "keymap-error" : undefined}
            >
              {keys.map((k, i) => (
                <label key={i}>
                  Lane {i + 1}
                  <button
                    type="button"
                    className={`keycap${listening === i ? " is-listening" : ""}`}
                    aria-label={listening === i
                      ? `Lane ${i + 1}, waiting for a key. Press Escape to cancel`
                      : `Lane ${i + 1}, ${displayedKeys[i] ?? keyLabel(k)}. Activate to rebind`}
                    onClick={() => setListening(listening === i ? -1 : i)}
                  >
                    {listening === i ? "Press a key…" : displayedKeys[i] ?? keyLabel(k)}
                  </button>
                </label>
              ))}
            </div>
            {listening >= 0 && (
              <p className="field-hint" role="status">Press any key · Esc to cancel</p>
            )}
            {duplicate && (
              <p id="keymap-error" className="error" role="alert">
                Two lanes share the same key — rebind one to save.
              </p>
            )}
          </div>
          </details>
        </div>
      </div>

    </section>
  );
}
