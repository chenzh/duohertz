"""ACE-Step 1.5 MLX Worker — port 8101"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.audio import maybe_run_real_inference, write_wav

try:
    from common.ace_client import generate_via_ace_api
except ImportError:
    generate_via_ace_api = None  # type: ignore[assignment,misc]

app = FastAPI(title="ACE-Step Worker", version="0.1.0")

WORKER_SECRET = os.getenv("WORKER_SECRET", "")
PORT = int(os.getenv("ACE_WORKER_PORT", "8101"))
_EXECUTOR = ThreadPoolExecutor(max_workers=2)


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


def _ace_api_health() -> tuple[str, str | None]:
    if os.getenv("WORKER_MODE", "synth") != "mlx":
        return "n/a", None
    api_url = os.getenv("ACE_API_URL", "http://127.0.0.1:8200").rstrip("/")
    try:
        with urllib.request.urlopen(f"{api_url}/health", timeout=3) as res:
            body = json.loads(res.read().decode())
        if body.get("code") != 200:
            return "down", None
        data = body.get("data") or {}
        return "ok", data.get("loaded_lm_model")
    except OSError:
        return "down", None


@app.get("/health")
def health():
    ace_api, lm_model = _ace_api_health()
    return {
        "status": "ok",
        "engine": "ace-step-1.5",
        "port": PORT,
        "mode": os.getenv("WORKER_MODE", "synth"),
        "ace_api": ace_api,
        "lm_model": lm_model or os.getenv("ACESTEP_LM_MODEL_PATH", "acestep-5Hz-lm-0.6B"),
    }


def _generate_sync(body: GenerateRequest) -> dict:
    started = time.time()

    # Gateway may send a Windows/relative path; MLX output always lands on local /tmp.
    out = f"/tmp/{body.job_id}.wav"
    if maybe_run_real_inference("ace", body.model_dump()) and generate_via_ace_api:
        ok, ace_ms, err = generate_via_ace_api(body.model_dump(), out)
        if ok:
            with open(out, "rb") as f:
                audio_b64 = base64.b64encode(f.read()).decode()
            return {"ok": True, "latency_ms": ace_ms, "audio_base64": audio_b64}
        if os.getenv("ACE_FALLBACK_SYNTH", "true").lower() != "true":
            return {"ok": False, "error": err or "ace inference failed"}

    seed = body.style_tags or body.lyrics or body.prompt or body.job_id
    try:
        write_wav(out, "ace", body.duration_sec, seed)
    except OSError:
        out = f"/tmp/{body.job_id}.wav"
        write_wav(out, "ace", body.duration_sec, seed)
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
