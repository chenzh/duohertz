import { useEffect, useMemo, useState } from "react";
import {
  keyLabelsForDisplayLayout,
  type KeyLabelLayout,
  type KeyboardLayoutMapLike,
} from "./keyMap";
import { loadSettings, SETTINGS_CHANGE_EVENT } from "../storage/settings";

type KeyboardLayoutApi = {
  getLayoutMap?: () => Promise<KeyboardLayoutMapLike>;
  addEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
};

function keyboardLayoutApi(): KeyboardLayoutApi | null {
  if (typeof navigator === "undefined") return null;
  return (navigator as Navigator & { keyboard?: KeyboardLayoutApi }).keyboard ?? null;
}

async function readKeyboardLayout(api: KeyboardLayoutApi | null): Promise<KeyboardLayoutMapLike | null> {
  if (!api || typeof api.getLayoutMap !== "function") return null;
  try {
    return await api.getLayoutMap.call(api);
  } catch {
    // Firefox/Safari do not expose the API; Chromium may reject it outside a
    // secure top-level context. The physical-code fallback remains playable.
    return null;
  }
}

/**
 * Progressive keyboard legends for international physical layouts.
 * The synchronous fallback avoids loading flicker; supported browsers replace
 * it with their current layout map and refresh if the OS layout changes.
 */
export function useKeyLabels(codes: readonly string[], selectedLayout?: KeyLabelLayout): string[] {
  const signature = codes.join("\u001f");
  const stableCodes = useMemo(() => [...codes], [signature]);
  const [storedLayout, setStoredLayout] = useState(() => loadSettings().keyLabelLayout);
  const preference = selectedLayout ?? storedLayout;
  const [labels, setLabels] = useState(() => keyLabelsForDisplayLayout(stableCodes, preference));

  useEffect(() => {
    const refresh = () => setStoredLayout(loadSettings().keyLabelLayout);
    window.addEventListener(SETTINGS_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (preference !== "auto") {
      setLabels(keyLabelsForDisplayLayout(stableCodes, preference));
      return;
    }
    let active = true;
    const api = keyboardLayoutApi();
    const refresh = () => {
      void readKeyboardLayout(api).then((layout) => {
        if (active) setLabels(keyLabelsForDisplayLayout(stableCodes, "auto", layout));
      });
    };

    setLabels(keyLabelsForDisplayLayout(stableCodes, "auto"));
    refresh();
    api?.addEventListener?.("layoutchange", refresh);
    return () => {
      active = false;
      api?.removeEventListener?.("layoutchange", refresh);
    };
  }, [stableCodes, preference]);

  return labels;
}
