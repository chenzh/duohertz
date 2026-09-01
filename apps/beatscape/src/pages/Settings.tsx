import { useEffect, useState } from "react";
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
  hasDuplicateKeys,
  keyLabel,
  presetIdFor,
} from "../input/keyMap";
import { isCoarsePointer } from "../input/touchInput";
import { hasProfanity } from "../lib/profanity";
import { SCAPE_COPY_EXTRA } from "../constants/scape";
import { SETTINGS_PAGE_META, usePageMeta } from "../seo/pageMeta";

export function SettingsPage() {
  usePageMeta(SETTINGS_PAGE_META);
  const [settings, setSettings] = useState(loadSettings);
  const [offset, setOffset] = useState(loadOffsetMs);
  const [keys, setKeys] = useState(loadKeys);
  const [displayName, setDisplayName] = useState(loadDisplayName);
  const [saved, setSaved] = useState(false);
  const [listening, setListening] = useState(-1);
  const [touchUi] = useState(isCoarsePointer);

  const preset = presetIdFor(keys);
  const activePreset = KEY_PRESETS.find((p) => p.id === preset) ?? null;
  const duplicate = hasDuplicateKeys(keys);
  const nameBlocked = hasProfanity(displayName);

  useEffect(() => {
    if (listening < 0) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === "Escape") {
        setListening(-1);
        return;
      }
      const code = captureKeyCode(e);
      if (!code) return;
      setKeys((prev) => {
        const next = [...prev];
        next[listening] = code;
        return next;
      });
      setListening(-1);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [listening]);

  const save = () => {
    if (duplicate || nameBlocked) return;
    saveSettings(settings);
    saveOffsetMs(offset);
    saveKeys(keys);
    saveDisplayName(displayName);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="settings">
      <header className="page-header">
        <h1>Settings</h1>
        <p className="tagline">{SCAPE_COPY_EXTRA.offsetHint}</p>
      </header>

      <div className="settings-grid">
        <section className="panel">
          <h2>Profile</h2>
          <label className="field">
            {SCAPE_COPY_EXTRA.playerName}
            <input
              type="text"
              maxLength={24}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          {nameBlocked && (
            <p className="error">That name won&apos;t pass the board censors — pick another.</p>
          )}
          <label className="field">
            Global offset (ms)
            <input
              type="number"
              min={-200}
              max={200}
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
            />
          </label>
        </section>

        <section className="panel">
          <h2>Audio</h2>
          <label className="field toggle-field">
            Hitsound
            <input
              type="checkbox"
              checked={settings.hitsound}
              onChange={(e) => setSettings({ ...settings, hitsound: e.target.checked })}
            />
          </label>
          <label className="field">
            Music volume · {Math.round(settings.musicVolume * 100)}%
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.musicVolume * 100)}
              onChange={(e) => setSettings({ ...settings, musicVolume: Number(e.target.value) / 100 })}
            />
          </label>
          <label className="field">
            SFX volume · {Math.round(settings.sfxVolume * 100)}%
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.sfxVolume * 100)}
              onChange={(e) => setSettings({ ...settings, sfxVolume: Number(e.target.value) / 100 })}
            />
          </label>
        </section>

        <section className="panel">
          <h2>Gameplay</h2>
          <label className="field toggle-field">
            Fancy FX (particles, shake)
            <input
              type="checkbox"
              checked={settings.fancyFx}
              onChange={(e) => setSettings({ ...settings, fancyFx: e.target.checked })}
            />
          </label>
          <label className="field">
            Casual visual speed
            <select
              value={settings.casualSpeed}
              onChange={(e) => setSettings({ ...settings, casualSpeed: Number(e.target.value) })}
            >
              <option value={0.75}>0.75×</option>
              <option value={1}>1.0×</option>
              <option value={1.25}>1.25×</option>
            </select>
          </label>
          {touchUi && (
            <label className="field toggle-field">
              Thumb chord assist (touch)
              <input
                type="checkbox"
                checked={settings.chordAssist}
                onChange={(e) => setSettings({ ...settings, chordAssist: e.target.checked })}
              />
            </label>
          )}
          {touchUi && (
            <p className="field-hint">
              Two thumbs cover four lanes — one per hand. When a chart asks for two
              lanes on the same hand at once, assist banks the second one instead of
              dropping it.
            </p>
          )}
        </section>

        <section className="panel">
          <h2>Key map</h2>
          <div className="preset-row">
            {KEY_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`btn compact${preset === p.id ? " is-active" : ""}`}
                onClick={() => {
                  setKeys(codesForPreset(p.id));
                  setListening(-1);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="field-hint">
            {activePreset ? activePreset.hint : "Custom layout"}
            {" · bound by physical position, so it plays the same on QWERTY, AZERTY and QWERTZ"}
          </p>
          <div className="keys-grid">
            {keys.map((k, i) => (
              <label key={i}>
                Lane {i + 1}
                <button
                  type="button"
                  className={`keycap${listening === i ? " is-listening" : ""}`}
                  onClick={() => setListening(listening === i ? -1 : i)}
                >
                  {listening === i ? "Press a key…" : keyLabel(k)}
                </button>
              </label>
            ))}
          </div>
          {listening >= 0 && <p className="field-hint">Press any key · Esc to cancel</p>}
          {duplicate && <p className="error">Two lanes share the same key — rebind one to save.</p>}
        </section>
      </div>

      <div className="cta-row" style={{ marginTop: 20 }}>
        <button
          type="button"
          className="btn primary"
          onClick={save}
          disabled={duplicate || nameBlocked}
        >
          {saved ? "Saved ✓" : "Save settings"}
        </button>
        <Link className="btn ghost" to="/calibrate">
          {SCAPE_COPY_EXTRA.recalibrate}
        </Link>
      </div>
    </section>
  );
}
