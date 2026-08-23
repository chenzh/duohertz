import { ERROR_CODES, MODE_ENGINE_MAP, type Mode } from "@lamp/shared";
import { config } from "../lib/config.js";
import { log } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { audioPathForJob } from "./storage.js";
import { callWorkerGenerate } from "./worker-client.js";

const aceBusy = { running: false };
const sa3Busy = { running: false };

type PendingJob = { id: string; worker: "ace" | "sa3" };
const queue: PendingJob[] = [];
let processing = false;

export function enqueueJob(jobId: string, mode: Mode): void {
  const worker = MODE_ENGINE_MAP[mode].worker;
  queue.push({ id: jobId, worker });
  void processQueue();
}

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    while (queue.length > 0) {
      const next = queue.shift()!;
      const busy = next.worker === "ace" ? aceBusy : sa3Busy;
      if (busy.running) {
        queue.unshift(next);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      busy.running = true;
      try {
        await runJob(next.id, next.worker);
      } finally {
        busy.running = false;
      }
    }
  } finally {
    processing = false;
  }
}

async function runJob(jobId: string, worker: "ace" | "sa3"): Promise<void> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status === "completed" || job.status === "failed") return;

  await prisma.job.update({ where: { id: jobId }, data: { status: "routing" } });

  const outputPath = audioPathForJob(jobId);
  const started = Date.now();

  try {
    await prisma.job.update({ where: { id: jobId }, data: { status: "generating" } });

    let prompt = job.prompt;
    if (job.mode === "game_bgm" && prompt && !prompt.toLowerCase().includes("no vocal")) {
      prompt = `${prompt}, instrumental, no vocals`;
    }

    const result = await callWorkerGenerate(worker, {
      job_id: jobId,
      mode: job.mode,
      prompt,
      style_tags: job.styleTags,
      lyrics: job.lyrics,
      duration_sec: job.durationSec,
      model_variant: job.modelVariant,
      output_path: outputPath,
    });

    if (!result.ok) {
      throw new Error(result.error);
    }

    await prisma.job.update({ where: { id: jobId }, data: { status: "uploading" } });

    const latency = result.latency_ms ?? Date.now() - started;
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "completed",
        audioPath: outputPath,
        latencyMs: latency,
        completedAt: new Date(),
      },
    });
    log("info", "job_completed", { job_id: jobId, worker, latency_ms: latency });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    const code =
      message.includes("timeout") || message.includes("Timeout")
        ? ERROR_CODES.GENERATION_TIMEOUT
        : message.includes("unavailable")
          ? ERROR_CODES.WORKER_UNAVAILABLE
          : ERROR_CODES.INTERNAL_ERROR;
    await prisma.job.updateMany({
      where: { id: jobId },
      data: {
        status: "failed",
        errorCode: code,
        errorMessage: message.slice(0, 500),
      },
    });
    log("error", "job_failed", { job_id: jobId, error: message });
  }
}

export async function waitForQueueDrain(timeoutMs = 120_000): Promise<void> {
  const start = Date.now();
  while ((queue.length > 0 || aceBusy.running || sa3Busy.running) && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 200));
  }
}
