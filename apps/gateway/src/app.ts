import { Hono } from "hono";
import { ERROR_CODES } from "@lamp/shared";
import { errorResponse } from "./lib/errors.js";
import { log } from "./lib/logger.js";
import { authMiddleware } from "./middleware/auth.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { demoProxyRoutes } from "./routes/demo-proxy.js";
import { healthRoutes } from "./routes/health.js";
import { jobRoutes } from "./routes/jobs.js";

export function createApp() {
  const app = new Hono();

  app.use("*", async (c, next) => {
    try {
      await next();
    } catch (err) {
      log("error", "unhandled", { err: String(err) });
      return c.json(
        {
          ...errorResponse(ERROR_CODES.INTERNAL_ERROR, "Internal server error"),
          meta: { request_id: crypto.randomUUID() },
        },
        500,
      );
    }
  });

  app.route("/v1", healthRoutes);
  app.route("/demo/api", demoProxyRoutes);

  const api = new Hono();
  api.use("*", authMiddleware);
  api.use("*", rateLimitMiddleware);
  api.route("/", jobRoutes);
  app.route("/v1", api);

  return app;
}
