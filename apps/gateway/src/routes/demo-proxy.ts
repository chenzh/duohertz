import { Hono } from "hono";
import { config } from "../lib/config.js";

export const demoProxyRoutes = new Hono();

demoProxyRoutes.all("/*", async (c) => {
  if (!config.demoBffEnabled) return c.notFound();

  const incoming = new URL(c.req.url);
  const path = incoming.pathname.replace(/^\/demo\/api/, "");
  const allowed =
    (c.req.method === "POST" && path === "/v1/jobs") ||
    (c.req.method === "GET" &&
      (/^\/v1\/health(?:\/inference)?$/.test(path) ||
        /^\/v1\/jobs\/[a-zA-Z0-9_-]+(?:\/audio)?$/.test(path)));
  if (!allowed) return c.notFound();

  const target = new URL(`http://127.0.0.1:${config.port}${path}`);
  target.search = incoming.search;

  const headers = new Headers();
  for (const name of ["accept", "content-type", "range"]) {
    const value = c.req.header(name);
    if (value) headers.set(name, value);
  }
  headers.set("X-API-Key", config.demoApiKey);

  const init: RequestInit = { method: c.req.method, headers };
  if (c.req.method === "POST") {
    init.body = await c.req.raw.clone().arrayBuffer();
  }

  const res = await fetch(target.toString(), init);
  return new Response(res.body, { status: res.status, headers: res.headers });
});
