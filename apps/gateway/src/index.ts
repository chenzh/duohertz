import { serve } from "@hono/node-server";
import { Agent, setGlobalDispatcher } from "undici";
import { config } from "./lib/config.js";
import { log } from "./lib/logger.js";
import { createApp } from "./app.js";

const fetchTimeoutMs = config.jobTimeoutSec * 1000;
setGlobalDispatcher(
  new Agent({
    connectTimeout: 30_000,
    headersTimeout: fetchTimeoutMs,
    bodyTimeout: fetchTimeoutMs,
  }),
);

const app = createApp();

serve({ fetch: app.fetch, port: config.port }, (info) => {
  log("info", "gateway_started", { port: info.port, mock_workers: config.mockWorkers });
});
