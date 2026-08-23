import { writeFileSync } from "node:fs";
import { config } from "../lib/config.js";

export type WorkerKind = "ace" | "sa3";

export type GeneratePayload = {
  job_id: string;
  mode: string;
  prompt?: string | null;
  style_tags?: string | null;
  lyrics?: string | null;
  duration_sec: number;
  model_variant?: string | null;
  output_path: string;
};

export type GenerateResult =
  | { ok: true; latency_ms: number; audio_base64?: string }
  | { ok: false; error: string };

function workerUrl(kind: WorkerKind): string {
  return kind === "ace" ? config.aceWorkerUrl : config.sa3WorkerUrl;
}

export async function workerHealth(kind: WorkerKind): Promise<{ status: "ok" | "down"; last_check_ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${workerUrl(kind)}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { status: "down", last_check_ms: Date.now() - start };
    const body = (await res.json()) as { status?: string };
    return { status: body.status === "ok" ? "ok" : "down", last_check_ms: Date.now() - start };
  } catch {
    return { status: "down", last_check_ms: Date.now() - start };
  }
}

export async function callWorkerGenerate(
  kind: WorkerKind,
  payload: GeneratePayload,
): Promise<GenerateResult> {
  if (config.mockWorkers) {
    await new Promise((r) => setTimeout(r, 500));
    const { writeMockWav } = await import("./mock-audio.js");
    writeMockWav(payload.output_path, payload.duration_sec, kind === "ace");
    return { ok: true, latency_ms: 500 };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.workerSecret) headers["X-Worker-Secret"] = config.workerSecret;

  const res = await fetch(`${workerUrl(kind)}/internal/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(config.jobTimeoutSec * 1000),
  });

  const body = (await res.json()) as GenerateResult;
  if (body.ok && "audio_base64" in body && body.audio_base64) {
    writeFileSync(payload.output_path, Buffer.from(body.audio_base64, "base64"));
  }
  return body;
}
