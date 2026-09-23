import { lazy } from "react";

let playFieldModule: Promise<{ default: typeof import("./PlayField").PlayField }> | null = null;

export function loadPlayField() {
  playFieldModule ??= import("./PlayField").then(({ PlayField }) => ({ default: PlayField }));
  return playFieldModule;
}

export const LazyPlayField = lazy(loadPlayField);
