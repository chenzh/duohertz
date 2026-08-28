import { useState } from "react";
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
import { SCAPE_COPY_EXTRA } from "../constants/scape";

export function SettingsPage() {
  const [settings, setSettings] = useState(loadSettings);
  const [offset, setOffset] = useState(loadOffsetMs);
  const [keys, setKeys] = useState(loadKeys);
  const [displayName, setDisplayName] = useState(loadDisplayName);
  const [saved, setSaved] = useState(false);

  const save = () => {
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
        </section>

        <section className="panel">
          <h2>Key map</h2>
          <div className="keys-grid">
            {keys.map((k, i) => (
              <label key={i}>
                Lane {i + 1}
                <input
                  maxLength={1}
                  value={k}
                  onChange={(e) => {
                    const next = [...keys];
                    next[i] = e.target.value.toUpperCase() || k;
                    setKeys(next);
                  }}
                />
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="cta-row" style={{ marginTop: 20 }}>
        <button type="button" className="btn primary" onClick={save}>
          {saved ? "Saved ✓" : "Save settings"}
        </button>
        <Link className="btn ghost" to="/calibrate">
          {SCAPE_COPY_EXTRA.recalibrate}
        </Link>
      </div>
    </section>
  );
}
