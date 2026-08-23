import { useCallback, useEffect, useState } from "react";
import { fetchInferenceHealth } from "../api";

export type InferenceState = {
  gateway: "ok" | "down";
  ace: string;
  sa3: string;
  aceMode?: string;
  aceApi?: string;
  lmModel?: string;
  workersOk: boolean;
};

export function useInferenceHealth(pollMs = 15000) {
  const [state, setState] = useState<InferenceState>({
    gateway: "down",
    ace: "?",
    sa3: "?",
    workersOk: false,
  });

  const refresh = useCallback(async () => {
    try {
      const inf = await fetchInferenceHealth();
      const ace = inf.workers.ace;
      const sa3 = inf.workers.sa3;
      const workersOk = ace.status === "ok" && sa3.status === "ok";
      setState({
        gateway: "ok",
        ace: ace.status,
        sa3: sa3.status,
        aceMode: ace.mode,
        aceApi: ace.ace_api,
        lmModel: ace.lm_model,
        workersOk,
      });
    } catch {
      setState((s) => ({ ...s, gateway: "down", workersOk: false }));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(t);
  }, [pollMs, refresh]);

  return { ...state, refresh };
}
