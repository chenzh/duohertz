"""ACE-Step 1.5 MLX Worker — port 8101"""

from __future__ import annotations

import base64
import os
import time
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.audio import maybe_run_real_inference, write_wav

app = FastAPI(title="ACE-Step Worker", version="0.1.0")

WORKER_SECRET = os.getenv("WORKER_SECRET", "")
PORT = int(os.getenv("ACE_WORKER_PORT", "8101"))


class GenerateRequest(BaseModel):
    job_id: str
    mode: str
    style_tags: str | None = None
    lyrics: str | None = None
    prompt: str | None = None
    duration_sec: int = Field(ge=5, le=240)
    model_variant: str | None = "turbo"
    output_path: str


def _check_secret(secret: str | None) -> None:
    if WORKER_SECRET and secret != WORKER_SECRET:
        raise HTTPException(status_code=401, detail="invalid worker secret")


@app.get("/health")
def health():
    return {"status": "ok", "engine": "ace-step-1.5", "port": PORT}


@app.post("/internal/generate")
def generate(body: GenerateRequest, x_worker_secret: str | None = Header(default=None)):
    _check_secret(x_worker_secret)
    started = time.time()

    if maybe_run_real_inference("ace", body.model_dump()):
        # Placeholder for MLX repo integration when installed
        pass

    seed = body.style_tags or body.lyrics or body.prompt or body.job_id
    out = body.output_path
    try:
        write_wav(out, "ace", body.duration_sec, seed)
    except OSError:
        out = f"/tmp/{body.job_id}.wav"
        write_wav(out, "ace", body.duration_sec, seed)
    with open(out, "rb") as f:
        audio_b64 = base64.b64encode(f.read()).decode()
    latency_ms = int((time.time() - started) * 1000)
    return {"ok": True, "latency_ms": latency_ms, "audio_base64": audio_b64}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
