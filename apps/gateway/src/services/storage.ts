import { createReadStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { config } from "../lib/config.js";
import { log } from "../lib/logger.js";

mkdirSync(config.audioStoragePath, { recursive: true });

export function audioPathForJob(jobId: string): string {
  return join(config.audioStoragePath, `${jobId}.wav`);
}

export function audioExists(jobId: string): boolean {
  return existsSync(audioPathForJob(jobId));
}

export function createAudioReadStream(jobId: string) {
  return createReadStream(audioPathForJob(jobId));
}

export function cleanupExpiredAudio(): void {
  const ttlMs = config.audioTtlHours * 3600 * 1000;
  const now = Date.now();
  for (const file of readdirSync(config.audioStoragePath)) {
    if (!file.endsWith(".wav")) continue;
    const full = join(config.audioStoragePath, file);
    const age = now - statSync(full).mtimeMs;
    if (age > ttlMs) {
      unlinkSync(full);
      log("info", "audio_ttl_deleted", { file });
    }
  }
}

setInterval(cleanupExpiredAudio, 60 * 60 * 1000);
