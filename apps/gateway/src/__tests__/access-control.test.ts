import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { config } from "../lib/config.js";
import { readAccessConfig } from "../lib/access-config.js";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, getApiKeyHash } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/rate-limit.js";

vi.mock("../lib/prisma.js", () => ({ prisma: { job: { count: vi.fn() } } }));

const original = {
  apiKey: config.apiKey,
  apiKeyAlt: config.apiKeyAlt,
  demoBffEnabled: config.demoBffEnabled,
  demoApiKey: config.demoApiKey,
  rateLimitQps: config.rateLimitQps,
  rateLimitDailyJobs: config.rateLimitDailyJobs,
};
const countMock = vi.mocked(prisma.job.count);
const app = new Hono();
app.use("/v1/*", authMiddleware);
app.use("/v1/*", rateLimitMiddleware);
app.post("/v1/jobs", (c) => c.json({ owner: getApiKeyHash(c) }, 201));

function create(key?: string, headers: Record<string, string> = {}) {
  return app.request("/v1/jobs", {
    method: "POST",
    headers: { ...(key ? { "X-API-Key": key } : {}), ...headers },
    body: "{}",
  });
}

beforeEach(() => {
  Object.assign(config, readAccessConfig({
    NODE_ENV: "production",
    API_KEY: `primary-${crypto.randomUUID()}`,
    DEMO_BFF_ENABLED: "true",
    DEMO_API_KEY: `demo-${crypto.randomUUID()}`,
  }), { rateLimitQps: 1, rateLimitDailyJobs: 2 });
  countMock.mockReset().mockResolvedValue(0);
});

afterEach(() => Object.assign(config, original));

describe("API access and shared Demo quota", () => {
  it("rejects unauthenticated and default secondary-key requests despite a forged BFF header", async () => {
    expect((await create(undefined, { "X-Demo-BFF": "1" })).status).toBe(401);
    expect((await create("dev-api-key-alt")).status).toBe(401);
    expect(countMock).not.toHaveBeenCalled();
  });

  it("authenticates a dedicated Demo key under a separate owner", async () => {
    const primary = await create(config.apiKey);
    const demo = await create(config.demoApiKey);
    expect(primary.status).toBe(201);
    expect(demo.status).toBe(201);
    expect((await primary.json()).owner).not.toBe((await demo.json()).owner);
  });

  it("does not authenticate the Demo key when the BFF is disabled", async () => {
    config.demoBffEnabled = false;
    expect((await create(config.demoApiKey)).status).toBe(401);
  });

  it.each(["primary", "demo"])("enforces QPS for the %s key even with forged BFF headers", async (kind) => {
    const key = kind === "primary" ? config.apiKey : config.demoApiKey;
    expect((await create(key, { "X-Demo-BFF": "1" })).status).toBe(201);
    const response = await create(key, { "X-Demo-BFF": "1" });
    expect(response.status).toBe(429);
    expect((await response.json()).error.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("enforces the Demo daily job limit even with a forged BFF header", async () => {
    countMock.mockResolvedValue(2);
    const response = await create(config.demoApiKey, { "X-Demo-BFF": "1" });
    expect(response.status).toBe(429);
    expect((await response.json()).error.message).toBe("Daily job limit exceeded");
  });
});
