import type { Context, Next } from "hono";
import { ERROR_CODES } from "@lamp/shared";
import { config } from "../lib/config.js";
import { errorResponse } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { getApiKeyHash } from "./auth.js";

const buckets = new Map<string, { tokens: number; last: number }>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function takeToken(apiKeyHash: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(apiKeyHash) ?? { tokens: config.rateLimitQps, last: now };
  const elapsed = (now - bucket.last) / 1000;
  bucket.tokens = Math.min(config.rateLimitQps, bucket.tokens + elapsed * config.rateLimitQps);
  bucket.last = now;
  if (bucket.tokens < 1) {
    buckets.set(apiKeyHash, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(apiKeyHash, bucket);
  return true;
}

function refundToken(apiKeyHash: string): void {
  const bucket = buckets.get(apiKeyHash);
  if (!bucket) return;
  bucket.tokens = Math.min(config.rateLimitQps, bucket.tokens + 1);
  buckets.set(apiKeyHash, bucket);
}

export async function rateLimitMiddleware(c: Context, next: Next) {
  if (c.req.path.startsWith("/v1/health") || c.req.method === "GET" || c.req.header("X-Demo-BFF")) {
    await next();
    return;
  }

  const apiKeyHash = getApiKeyHash(c);
  if (!takeToken(apiKeyHash)) {
    return c.json(
      {
        ...errorResponse(ERROR_CODES.RATE_LIMIT_EXCEEDED, "Rate limit exceeded"),
        meta: { request_id: crypto.randomUUID() },
      },
      429,
    );
  }

  if (c.req.path === "/v1/jobs" && c.req.method === "POST") {
    const day = todayKey();
    const count = await prisma.job.count({
      where: {
        apiKeyHash,
        createdAt: { gte: new Date(`${day}T00:00:00.000Z`) },
      },
    });
    if (count >= config.rateLimitDailyJobs) {
      refundToken(apiKeyHash);
      return c.json(
        {
          ...errorResponse(ERROR_CODES.RATE_LIMIT_EXCEEDED, "Daily job limit exceeded"),
          meta: { request_id: crypto.randomUUID() },
        },
        429,
      );
    }
  }

  await next();

  // Only successful job creation consumes QPS budget
  if (c.req.path === "/v1/jobs" && c.req.method === "POST" && c.res.status !== 201) {
    refundToken(apiKeyHash);
  }
}
