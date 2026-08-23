import type { Context, Next } from "hono";
import { ERROR_CODES } from "@lamp/shared";
import { config, hashApiKey } from "../lib/config.js";
import { errorResponse } from "../lib/errors.js";

export type AuthVars = { apiKeyHash: string };

export async function authMiddleware(c: Context, next: Next) {
  const key = c.req.header("X-API-Key");
  const validKeys = [config.apiKey, config.apiKeyAlt].filter(Boolean);
  if (!key || !validKeys.includes(key)) {
    return c.json(
      { ...errorResponse(ERROR_CODES.UNAUTHORIZED, "Invalid or missing API key"), meta: { request_id: crypto.randomUUID() } },
      401,
    );
  }
  c.set("apiKeyHash", hashApiKey(key));
  await next();
}

export function getApiKeyHash(c: Context): string {
  return c.get("apiKeyHash") as string;
}
