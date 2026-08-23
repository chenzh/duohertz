import { Hono } from "hono";
import { config } from "../lib/config.js";

export const demoProxyRoutes = new Hono();

demoProxyRoutes.all("/*", async (c) => {
  const incoming = new URL(c.req.url);
  const path = incoming.pathname.replace(/^\/demo\/api/, "");
  const target = new URL(`http://127.0.0.1:${config.port}${path}`);
  target.search = incoming.search;

  const headers = new Headers(c.req.raw.headers);
  headers.set("X-API-Key", config.apiKey);
  headers.set("X-Demo-BFF", "1");
  headers.delete("host");

  const init: RequestInit = { method: c.req.method, headers };
  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    init.body = await c.req.raw.clone().arrayBuffer();
  }

  const res = await fetch(target.toString(), init);
  return new Response(res.body, { status: res.status, headers: res.headers });
});
