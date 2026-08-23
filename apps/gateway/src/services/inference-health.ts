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
      },
      sa3: {
        status: sa3Failures >= 3 ? "down" : sa3.status === "ok" ? "ok" : "degraded",
        url: config.sa3WorkerUrl,
        last_check_ms: sa3.last_check_ms,
      },
    },
  };
}
