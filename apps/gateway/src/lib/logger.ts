import { config } from "./config.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const current = levels[(config.logLevel as LogLevel) ?? "info"] ?? 20;

export function log(level: LogLevel, msg: string, fields: Record<string, unknown> = {}) {
  if ((levels[level] ?? 20) < current) return;
  const line = JSON.stringify({ level, msg, ...fields, ts: new Date().toISOString() });
  if (level === "error") console.error(line);
  else console.log(line);
}
