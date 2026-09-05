import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { readStorage, readStoredJson, readStoredLocale, writeStorage, writeStoredJson } from "../src/lib/storage.ts";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

function useWindow(value: object) {
  Object.defineProperty(globalThis, "window", { configurable: true, value });
}

test("blocked storage access keeps the page usable and returns defaults", () => {
  useWindow({
    get localStorage() { throw new Error("SecurityError"); },
    get sessionStorage() { throw new Error("SecurityError"); },
  });
  assert.equal(readStorage("missing", "fallback"), "fallback");
  assert.equal(readStoredLocale(), "zh");
  assert.deepEqual(readStoredJson("draft", { prompt: "default" }), { prompt: "default" });
  assert.equal(writeStorage("locale", "en"), false);
  assert.equal(writeStoredJson("tasks", [], "session"), false);
});

test("storage quota failures are contained", () => {
  useWindow({ localStorage: { getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); } } });
  assert.equal(writeStoredJson("draft", { prompt: "test" }), false);
});

test("invalid locales and malformed saved JSON fall back safely", () => {
  const localStorage = memoryStorage();
  useWindow({ localStorage });
  localStorage.setItem("demo_locale", "fr");
  localStorage.setItem("draft", "{broken");
  assert.equal(readStoredLocale(), "zh");
  assert.deepEqual(readStoredJson("draft", []), []);
  localStorage.setItem("draft", '{"unexpected":true}');
  assert.deepEqual(readStoredJson<string[]>("draft", [], (value): value is string[] => Array.isArray(value)), []);
  writeStorage("demo_locale", "en");
  assert.equal(readStoredLocale(), "en");
});

test("local drafts and session tasks persist independently", () => {
  useWindow({ localStorage: memoryStorage(), sessionStorage: memoryStorage() });
  assert.equal(writeStoredJson("data", { prompt: "forest" }), true);
  assert.equal(writeStoredJson("data", ["job-a"], "session"), true);
  assert.deepEqual(readStoredJson("data", {}), { prompt: "forest" });
  assert.deepEqual(readStoredJson("data", [], undefined, "session"), ["job-a"]);
});
