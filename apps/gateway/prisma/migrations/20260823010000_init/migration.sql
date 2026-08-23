-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "api_key_hash" TEXT,
    "mode" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "model_variant" TEXT,
    "status" TEXT NOT NULL,
    "prompt" TEXT,
    "style_tags" TEXT,
    "lyrics" TEXT,
    "duration_sec" INTEGER NOT NULL,
    "audio_path" TEXT,
    "audio_mime" TEXT NOT NULL DEFAULT 'audio/wav',
    "error_code" TEXT,
    "error_message" TEXT,
    "latency_ms" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "completed_at" DATETIME
);

CREATE INDEX "idx_jobs_api_key_created" ON "jobs"("api_key_hash", "created_at" DESC);
CREATE INDEX "idx_jobs_status" ON "jobs"("status");
