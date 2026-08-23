import type { Context, Next } from "hono";
import { ERROR_CODES } from "@lamp/shared";
import { config } from "../lib/config.js";
import { errorResponse } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { getApiKeyHash } from "./auth.js";

const buckets = new Map<string, { tokens: number; last: number }>();
const dailyCounts = new Map<string, { count: number; day: string }>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function rateLimitMiddleware(c: Context, next: Next) {
  if (c.req.path.startsWith("/v1/health") || c.req.method === "GET") {
    await next();
    return;
  }

  const apiKeyHash = getApiKeyHash(c);
  const now = Date.now();
  const bucket = buckets.get(apiKeyHash) ?? { tokens: config.rateLimitQps, last: now };
  const elapsed = (now - bucket.last) / 1000;
  bucket.tokens = Math.min(config.rateLimitQps, bucket.tokens + elapsed * config.rateLimitQps);
  bucket.last = now;

  if (bucket.tokens < 1) {
    return c.json(
      {
        ...errorResponse(ERROR_CODES.RATE_LIMIT_EXCEEDED, "Rate limit exceeded"),
        meta: { request_id: crypto.randomUUID() },
      },
      429,
    );
  }
  bucket.tokens -= 1;
  buckets.set(apiKeyHash, bucket);

  const day = todayKey();
  const daily = dailyCounts.get(apiKeyHash);
  if (!daily || daily.day !== day) {
    dailyCounts.set(apiKeyHash, { count: 0, day });
  }
  const current = dailyCounts.get(apiKeyHash)!;
  if (current.count >= config.rateLimitDailyJobs) {
    return c.json(
      {
        ...errorResponse(ERROR_CODES.RATE_LIMIT_EXCEEDED, "Daily job limit exceeded"),
        meta: { request_id: crypto.randomUUID() },
      },
      429,
    );
  }

  if (c.req.path === "/v1/jobs" && c.req.method === "POST") {
    const count = await prisma.job.count({
      where: {
        apiKeyHash,
        createdAt: { gte: new Date(`${day}T00:00:00.000Z`) },
      },
    });
    if (count >= config.rateLimitDailyJobs) {
      return c.json(
        {
          ...errorResponse(ERROR_CODES.RATE_LIMIT_EXCEEDED, "Daily job limit exceeded"),
          meta: { request_id: crypto.randomUUID() },
        },
        429,
      );
    }
    current.count += 1;
    dailyCounts.set(apiKeyHash, current);
  }

  await next();
}
