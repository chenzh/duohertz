import { serve } from "@hono/node-server";
import { config } from "./lib/config.js";
import { log } from "./lib/logger.js";
import { createApp } from "./app.js";

const app = createApp();

serve({ fetch: app.fetch, port: config.port }, (info) => {
  log("info", "gateway_started", { port: info.port, mock_workers: config.mockWorkers });
});
