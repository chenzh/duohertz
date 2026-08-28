import { useState } from "react";
import { Link } from "../router";
import { SETTINGS_PAGE_META, usePageMeta } from "../seo/pageMeta";
import { loadKeys, loadOffsetMs, loadSettings, saveKeys, saveOffsetMs, saveSettings } from "../storage/settings";

export function SettingsPage() {
  usePageMeta(SETTINGS_PAGE_META);
  const [settings, setSettings] = useState(loadSettings);
  const [offset, setOffset] = useState(loadOffsetMs);
  const [keys, setKeys] = useState(loadKeys);

  return (
    <section className="settings">
      <h1>Settings</h1>
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
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          saveSettings(settings);
          saveOffsetMs(offset);
          saveKeys(keys);
        }}
      >
        Save
      </button>
      <nav className="settings-legal" aria-label="Legal">
        <Link to="/privacy">Privacy</Link>
        <span aria-hidden="true"> · </span>
        <Link to="/terms">Terms</Link>
      </nav>
      <p className="settings-legal-note">
        Scores and settings stay on this device. No account required (PRD §9.4).
      </p>
    </section>
  );
}
