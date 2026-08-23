import { Hono } from "hono";
import { ERROR_CODES } from "@lamp/shared";
import { requestId } from "../lib/config.js";
import { AppError, errorResponse } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { getApiKeyHash } from "../middleware/auth.js";
import { createJobSchema } from "../schemas/jobs.js";
import { enqueueJob } from "../services/job-queue.js";
import { audioExists, createAudioReadStream } from "../services/storage.js";
import { validateCreateJob } from "../services/validation.js";

export const jobRoutes = new Hono();

function serializeJob(job: {
  id: string;
  status: string;
  mode: string;
  engine: string;
  durationSec: number;
  latencyMs: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}) {
  const base = {
    job_id: job.id,
    status: job.status,
    mode: job.mode,
    engine: job.engine,
    duration_sec: job.durationSec,
    created_at: job.createdAt.toISOString(),
    updated_at: job.updatedAt.toISOString(),
  };

  if (job.status === "failed") {
    return {
      ...base,
      error: {
        code: job.errorCode ?? ERROR_CODES.INTERNAL_ERROR,
        message: job.errorMessage ?? "Generation failed",
      },
    };
  }

  if (job.status === "completed") {
    return {
      ...base,
      latency_ms: job.latencyMs,
      audio: {
        mime: "audio/wav",
        download_url: `/v1/jobs/${job.id}/audio`,
      },
      completed_at: job.completedAt?.toISOString(),
    };
  }

  return { ...base, error: null };
}

jobRoutes.post("/jobs", async (c) => {
  const rid = requestId();
  const body = createJobSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    const modeIssue = body.error.issues.find((i) => i.path[0] === "mode");
    return c.json(
      {
        ...errorResponse(
          modeIssue ? ERROR_CODES.INVALID_MODE : ERROR_CODES.INVALID_MODE,
          modeIssue ? "Invalid mode" : "Invalid request body",
          { issues: body.error.issues },
        ),
        meta: { request_id: rid },
      },
      400,
    );
  }

  let validated;
  try {
    validated = validateCreateJob(body.data);
  } catch (err) {
    if (err instanceof AppError) {
      return c.json({ ...errorResponse(err.code, err.message, err.details), meta: { request_id: rid } }, err.status as 400);
    }
    throw err;
  }

  const job = await prisma.job.create({
    data: {
      apiKeyHash: getApiKeyHash(c),
      mode: validated.mode,
      engine: validated.engine,
      modelVariant: validated.modelVariant,
      status: "queued",
      prompt: validated.prompt,
      styleTags: validated.styleTags,
      lyrics: validated.lyrics,
      durationSec: validated.durationSec,
    },
  });

  enqueueJob(job.id, validated.mode);

  return c.json(
    {
      data: {
        job_id: job.id,
        status: job.status,
        mode: job.mode,
        engine: job.engine,
        created_at: job.createdAt.toISOString(),
      },
      meta: { request_id: rid },
    },
    201,
  );
});

jobRoutes.get("/jobs/:id", async (c) => {
  const rid = requestId();
  const job = await prisma.job.findFirst({
    where: { id: c.req.param("id"), apiKeyHash: getApiKeyHash(c) },
  });
  if (!job) {
    return c.json(
      { ...errorResponse(ERROR_CODES.JOB_NOT_FOUND, "Job not found"), meta: { request_id: rid } },
      404,
    );
  }
  return c.json({ data: serializeJob(job), meta: { request_id: rid } });
});

jobRoutes.get("/jobs/:id/audio", async (c) => {
  const rid = requestId();
  const job = await prisma.job.findFirst({
    where: { id: c.req.param("id"), apiKeyHash: getApiKeyHash(c) },
  });
  if (!job) {
    return c.json(
      { ...errorResponse(ERROR_CODES.JOB_NOT_FOUND, "Job not found"), meta: { request_id: rid } },
      404,
    );
  }
  if (job.status !== "completed" || !audioExists(job.id)) {
    return c.json(
      { ...errorResponse(ERROR_CODES.JOB_NOT_READY, "Job audio not ready"), meta: { request_id: rid } },
      409,
    );
  }
  const stream = createAudioReadStream(job.id);
  return new Response(stream as unknown as ReadableStream, {
    headers: { "Content-Type": "audio/wav" },
  });
});
