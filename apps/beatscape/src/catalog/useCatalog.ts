import { useCallback, useEffect, useState } from "react";
import type { CatalogTrack } from "../types/catalog";
import { loadCatalog } from "./loadCatalog";

export type CatalogState = {
  tracks: CatalogTrack[];
  loading: boolean;
  error: string;
  retry: () => void;
};

/**
 * 统一的曲库加载状态。
 *
 * 改造前 Home / Library 都是 `void loadCatalog().then(...)`，没有 catch：
 * catalog.json 一旦取不到（部署漏文件、CDN 抖动、离线），就是一个 unhandled
 * rejection，页面呈现为"空列表"—— 没有任何提示，用户还以为曲库本来就是空的。
 */
export function useCatalog(): CatalogState {
  const [state, setState] = useState<Omit<CatalogState, "retry">>({ tracks: [], loading: true, error: "" });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: "" }));
    loadCatalog()
      .then((c) => {
        if (!cancelled) setState({ tracks: c.tracks, loading: false, error: "" });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            tracks: [],
            loading: false,
            error: e instanceof Error ? e.message : "Failed to load catalog",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  return { ...state, retry };
}
