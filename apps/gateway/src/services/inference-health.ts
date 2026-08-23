import { config } from "../lib/config.js";
import { workerHealth } from "./worker-client.js";

let aceFailures = 0;
let sa3Failures = 0;

export async function getInferenceHealth() {
  const ace = await workerHealth("ace");
  const sa3 = await workerHealth("sa3");

  aceFailures = ace.status === "ok" ? 0 : aceFailures + 1;
  sa3Failures = sa3.status === "ok" ? 0 : sa3Failures + 1;

  return {
    gateway: "ok" as const,
    workers: {
      ace: {
        status: aceFailures >= 3 ? "down" : ace.status === "ok" ? "ok" : "degraded",
        url: config.aceWorkerUrl,
        last_check_ms: ace.last_check_ms,
        ...(ace.mode ? { mode: ace.mode } : {}),
        ...(ace.ace_api ? { ace_api: ace.ace_api } : {}),
        ...(ace.lm_model ? { lm_model: ace.lm_model } : {}),
      },
      sa3: {
        status: sa3Failures >= 3 ? "down" : sa3.status === "ok" ? "ok" : "degraded",
        url: config.sa3WorkerUrl,
        last_check_ms: sa3.last_check_ms,
        ...(sa3.mode ? { mode: sa3.mode } : {}),
        ...(sa3.sa3_mlx ? { sa3_mlx: sa3.sa3_mlx } : {}),
        ...(sa3.model_variant ? { model_variant: sa3.model_variant } : {}),
      },
    },
  };
}
