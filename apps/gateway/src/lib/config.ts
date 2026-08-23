import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

function env(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Missing env ${key}`);
  return v;
}

export const config = {
  port: Number(process.env.GATEWAY_PORT ?? 8080),
  apiKey: env("API_KEY", "dev-api-key-change-me"),
  databaseUrl: env("DATABASE_URL", "file:../../data/dev.db"),
  aceWorkerUrl: env("ACE_WORKER_URL", "http://127.0.0.1:8101"),
  sa3WorkerUrl: env("SA3_WORKER_URL", "http://127.0.0.1:8102"),
  workerSecret: process.env.WORKER_SECRET ?? "",
  audioStoragePath: resolve(env("AUDIO_STORAGE_PATH", "../../data/audio")),
  audioTtlHours: Number(process.env.AUDIO_TTL_HOURS ?? 72),
  rateLimitQps: Number(process.env.RATE_LIMIT_QPS ?? 2),
  rateLimitDailyJobs: Number(process.env.RATE_LIMIT_DAILY_JOBS ?? 200),
  jobTimeoutSec: Number(process.env.JOB_TIMEOUT_SEC ?? 600),
  logLevel: process.env.LOG_LEVEL ?? "info",
  get mockWorkers() {
    return process.env.MOCK_WORKERS === "true";
  },
  version: "0.1.0",
};

mkdirSync(config.audioStoragePath, { recursive: true });

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function requestId(): string {
  return randomUUID();
}

export const startedAt = Date.now();
