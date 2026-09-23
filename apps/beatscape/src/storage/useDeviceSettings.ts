import { useEffect, useState } from "react";
import {
  loadSettings,
  SETTINGS_CHANGE_EVENT,
  SETTINGS_STORAGE_KEY,
  type BsSettings,
} from "./settings";

/**
 * Keeps device settings current inside the active tab and across another tab.
 * Saves dispatch a same-tab event because the browser's native `storage`
 * event only fires in other documents.
 */
export function useDeviceSettings(): BsSettings {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    const sync = () => setSettings(loadSettings());
    const syncStored = (event: StorageEvent) => {
      if (event.key === SETTINGS_STORAGE_KEY || event.key === null) sync();
    };

    window.addEventListener(SETTINGS_CHANGE_EVENT, sync);
    window.addEventListener("storage", syncStored);
    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, sync);
      window.removeEventListener("storage", syncStored);
    };
  }, []);

  return settings;
}
