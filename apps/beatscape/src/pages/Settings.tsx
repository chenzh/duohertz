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

  return (
    <section className="settings">
      <h1>Settings</h1>
      <p className="tagline">{SCAPE_COPY_EXTRA.offsetHint}</p>
      <label>
        {SCAPE_COPY_EXTRA.playerName}
        <input
          type="text"
          maxLength={24}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </label>
      <label>
        Global offset (ms)
        <input
          type="number"
          min={-200}
          max={200}
          value={offset}
          onChange={(e) => setOffset(Number(e.target.value))}
        />
      </label>
      <label>
        Hitsound
        <input
          type="checkbox"
          checked={settings.hitsound}
          onChange={(e) => setSettings({ ...settings, hitsound: e.target.checked })}
        />
      </label>
      <label>
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
      <div className="keys">
        {keys.map((k, i) => (
          <label key={i}>
            Lane {i}
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
      <div className="cta-row">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            saveSettings(settings);
            saveOffsetMs(offset);
            saveKeys(keys);
            saveDisplayName(displayName);
          }}
        >
          Save
        </button>
        <Link className="btn ghost" to="/calibrate">
          {SCAPE_COPY_EXTRA.recalibrate}
        </Link>
      </div>
    </section>
  );
}
