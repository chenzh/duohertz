import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readAccessConfig } from "../lib/access-config.js";
import { config } from "../lib/config.js";
import { demoProxyRoutes } from "../routes/demo-proxy.js";

const original = {
  apiKey: config.apiKey,
  apiKeyAlt: config.apiKeyAlt,
  demoBffEnabled: config.demoBffEnabled,
  demoApiKey: config.demoApiKey,
};
const app = new Hono().route("/demo/api", demoProxyRoutes);
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  Object.assign(config, readAccessConfig({
    NODE_ENV: "production",
    API_KEY: "primary-fixture",
    DEMO_BFF_ENABLED: "true",
    DEMO_API_KEY: "demo-fixture",
  }));
  fetchMock.mockReset().mockResolvedValue(new Response("forwarded", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  Object.assign(config, original);
  vi.unstubAllGlobals();
});

describe("Demo BFF boundary", () => {
  it("returns 404 without forwarding when production activation is absent", async () => {
    Object.assign(config, readAccessConfig({ NODE_ENV: "production", API_KEY: "primary-fixture" }));
    const response = await app.request("/demo/api/v1/jobs", { method: "POST", body: "{}" });
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["GET", "/v1/health"],
    ["GET", "/v1/health/inference"],
    ["POST", "/v1/jobs"],
    ["GET", "/v1/jobs/job-id"],
    ["GET", "/v1/jobs/job-id/audio"],
  ])("forwards the supported %s %s route", async (method, path) => {
    const response = await app.request(`/demo/api${path}?test=1`, {
      method,
      headers: {
        "X-API-Key": "attacker-key",
        "X-Demo-BFF": "1",
        Authorization: "Bearer untrusted",
        "Content-Type": "application/json",
      },
      ...(method === "POST" ? { body: "{}" } : {}),
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("forwarded");
    const [target, init] = fetchMock.mock.calls[0];
    expect(target).toBe(`http://127.0.0.1:${config.port}${path}?test=1`);
    const headers = new Headers(init?.headers);
    expect(headers.get("X-API-Key")).toBe("demo-fixture");
    expect(headers.has("X-Demo-BFF")).toBe(false);
    expect(headers.has("Authorization")).toBe(false);
    expect(headers.get("Content-Type")).toBe("application/json");
    if (method === "POST") expect(new TextDecoder().decode(init?.body as ArrayBuffer)).toBe("{}");
  });

  it.each([
    ["GET", "/demo/api/v1/health"],
    ["GET", "/demo/meta"],
    ["GET", "/v1/jobs"],
    ["POST", "/v1/health"],
    ["DELETE", "/v1/jobs/job-id"],
    ["POST", "/v1/jobs/job-id/audio"],
    ["GET", "/v1/jobs/job-id/unknown"],
    ["GET", "/v1/health/internal"],
  ])("rejects unsupported %s %s without proxying", async (method, path) => {
    expect((await app.request(`/demo/api${path}`, { method })).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
