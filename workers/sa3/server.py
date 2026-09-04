"""Stable Audio 3 MLX Worker — port 8102"""

from __future__ import annotations

import asyncio
import base64
import os
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.audio import maybe_run_real_inference, write_wav

try:
    from common.sa3_client import generate_via_sa3_mlx, mlx_enabled, mlx_ready, mlx_root
except ImportError:
    generate_via_sa3_mlx = None  # type: ignore[assignment,misc]
    mlx_enabled = lambda: False  # type: ignore[assignment,misc]
    mlx_ready = lambda: False  # type: ignore[assignment,misc]
    mlx_root = lambda: Path("/")  # type: ignore[assignment,misc]

app = FastAPI(title="SA3 Worker", version="0.1.0")

WORKER_SECRET = os.getenv("WORKER_SECRET", "")
PORT = int(os.getenv("SA3_WORKER_PORT", "8102"))
_EXECUTOR = ThreadPoolExecutor(max_workers=1)


class GenerateRequest(BaseModel):
    job_id: str
    mode: str
    prompt: str | None = None
    duration_sec: int = Field(ge=5, le=180)
    model_variant: str | None = "small"
    output_path: str
    # Optional per-request negative prompt. When set, overrides the process
    # default (SA3_NEGATIVE_PROMPT = "vocals, singing, speech, lyrics") so a
    # caller can ask for wordless humming. Game BGM callers omit it → default
    # stays fully instrumental.
    negative_prompt: str | None = None
    # Optional per-request sampling params. Override the process defaults
    # (SA3_CFG / SA3_STEPS). CFG>1 pushes output toward the prompt — useful to
    # sharpen a wordless vocal; defaults keep the fast low-CFG posture.
    cfg: float | None = None
    steps: int | None = None


def _check_secret(secret: str | None) -> None:
    if WORKER_SECRET and secret != WORKER_SECRET:
        raise HTTPException(status_code=401, detail="invalid worker secret")


def _worker_mode() -> str:
    return os.getenv("SA3_WORKER_MODE", os.getenv("WORKER_MODE", "synth"))


@app.get("/health")
def health():
    mode = _worker_mode()
    mlx = "ok" if mode == "mlx" and mlx_ready() else "down" if mode == "mlx" else "n/a"
    return {
        "status": "ok",
        "engine": "stable-audio-3",
        "port": PORT,
        "mode": mode,
        "sa3_mlx": mlx,
        "model_variant": os.getenv("SA3_MODEL_VARIANT", "small"),
        "mlx_dir": str(mlx_root()) if mode == "mlx" else None,
    }


def _generate_sync(body: GenerateRequest) -> dict:
    started = time.time()
    out = f"/tmp/{body.job_id}.wav"

    if maybe_run_real_inference("sa3", body.model_dump()) and generate_via_sa3_mlx:
        ok, sa3_ms, err = generate_via_sa3_mlx(body.model_dump(), out)
        if ok:
            with open(out, "rb") as f:
                audio_b64 = base64.b64encode(f.read()).decode()
            return {"ok": True, "latency_ms": sa3_ms, "audio_base64": audio_b64}
        if os.getenv("SA3_FALLBACK_SYNTH", "true").lower() != "true":
            return {"ok": False, "error": err or "sa3 inference failed"}

    seed = body.prompt or body.job_id
    try:
        write_wav(out, "sa3", body.duration_sec, seed)
    except OSError:
        out = f"/tmp/{body.job_id}.wav"
        write_wav(out, "sa3", body.duration_sec, seed)
    with open(out, "rb") as f:
        audio_b64 = base64.b64encode(f.read()).decode()
    latency_ms = int((time.time() - started) * 1000)
    return {"ok": True, "latency_ms": latency_ms, "audio_base64": audio_b64}


@app.post("/internal/generate")
async def generate(body: GenerateRequest, x_worker_secret: str | None = Header(default=None)):
    _check_secret(x_worker_secret)
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_EXECUTOR, _generate_sync, body)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
