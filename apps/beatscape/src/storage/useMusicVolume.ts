import { useSyncExternalStore } from "react";
import { loadSettings, SETTINGS_CHANGE_EVENT, SETTINGS_STORAGE_KEY } from "./settings";

// Library can mount dozens of preview controls. Fan them out from one pair of
// browser listeners instead of installing a settings/storage listener per card.
const listeners = new Set<() => void>();
const notify = () => {
  for (const listener of listeners) listener();
};
const onStorage = (event: StorageEvent) => {
  if (event.key === SETTINGS_STORAGE_KEY || event.key === null) notify();
};

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener(SETTINGS_CHANGE_EVENT, notify);
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, notify);
      window.removeEventListener("storage", onStorage);
    }
  };
}

const getSnapshot = () => loadSettings().musicVolume;

export function useMusicVolume(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0.7);
}
