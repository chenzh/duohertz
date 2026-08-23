import { Hono } from "hono";
import { config, requestId, startedAt } from "../lib/config.js";

export const healthRoutes = new Hono();

healthRoutes.get("/health", (c) => {
  const rid = requestId();
  return c.json({
    data: {
      status: "ok",
      version: config.version,
      uptime_sec: Math.floor((Date.now() - startedAt) / 1000),
    },
    meta: { request_id: rid },
  });
});

healthRoutes.get("/health/inference", async (c) => {
  const { getInferenceHealth } = await import("../services/inference-health.js");
  const data = await getInferenceHealth();
  return c.json({ data, meta: { request_id: requestId() } });
});
