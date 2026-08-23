import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ERROR_CODES } from "@lamp/shared";
import { errorResponse } from "./lib/errors.js";
import { log } from "./lib/logger.js";
import { authMiddleware } from "./middleware/auth.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { demoProxyRoutes } from "./routes/demo-proxy.js";
import { healthRoutes } from "./routes/health.js";
import { jobRoutes } from "./routes/jobs.js";

const demoDist = resolve(dirname(fileURLToPath(import.meta.url)), "../../demo/dist");

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

  app.get("/", (c) =>
    c.json({
      data: {
        service: "music-saas-gateway",
        demo_url: "/demo/",
        api_health: "/v1/health",
      },
      meta: { request_id: crypto.randomUUID() },
    }),
  );

  app.route("/v1", healthRoutes);
  app.route("/demo/api", demoProxyRoutes);

  app.get("/demo", (c) => c.redirect("/demo/"));
  app.get("/demo/meta", (c) => {
    const host = c.req.header("host") ?? "localhost:8080";
    const proto = c.req.header("x-forwarded-proto") ?? "http";
    return c.json({
      data: {
        version: "0.2.0",
        demo_url: `${proto}://${host}/demo/`,
        api_docs_url:
          "https://github.com/chenzh/MusicSaas/blob/main/docs/DATA_API.md",
        compliance: {
          ace: "ACE-Step 1.5 · MIT",
          sa3: "Stable Audio 3 · Community License",
        },
      },
      meta: { request_id: crypto.randomUUID() },
    });
  });
  app.use(
    "/demo/*",
    serveStatic({
      root: demoDist,
      rewriteRequestPath: (path) => path.replace(/^\/demo/, "") || "/index.html",
    }),
  );

  const api = new Hono();
  api.use("*", authMiddleware);
  api.use("*", rateLimitMiddleware);
  api.route("/", jobRoutes);
  app.route("/v1", api);

  return app;
}
