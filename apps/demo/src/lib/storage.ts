import type { Locale } from "../i18n";

type StorageArea = "local" | "session";

function getStorage(area: StorageArea): Storage {
  return area === "session" ? window.sessionStorage : window.localStorage;
}

export function readStorage(key: string, fallback: string | null = null, area: StorageArea = "local"): string | null {
  try {
    return getStorage(area).getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: string, area: StorageArea = "local"): boolean {
  try {
    getStorage(area).setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function readStoredJson<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T,
  area: StorageArea = "local",
): T {
  try {
    const raw = readStorage(key, null, area);
    if (raw === null) return fallback;
    const value: unknown = JSON.parse(raw);
    return !validate || validate(value) ? value as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredJson(key: string, value: unknown, area: StorageArea = "local"): boolean {
  try {
    const raw = JSON.stringify(value);
    return raw !== undefined && writeStorage(key, raw, area);
  } catch {
    return false;
  }
}

export function readStoredLocale(key = "demo_locale", fallback: Locale = "zh"): Locale {
  const value = readStorage(key);
  return value === "zh" || value === "en" ? value : fallback;
}
