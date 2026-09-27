#!/usr/bin/env python3
"""Request one SA3 master and retain a local, hash-bound generation receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
BASE = os.getenv("API_BASE", "http://127.0.0.1:8080").rstrip("/")
KEY = os.getenv("API_KEY", "dev-api-key-change-me")
MASTERS = ROOT / "data/beatscape-preview/masters"
RECEIPTS = ROOT / "data/duohertz-preview/receipts"


def request(method: str, route: str, body: dict | None = None, *, timeout: int = 120):
    headers = {"X-API-Key": KEY}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + route, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        data = response.read()
        return data if "audio/" in response.headers.get("Content-Type", "") else json.loads(data)


def generate(recipe_path: Path) -> tuple[Path, Path]:
    recipe = json.loads(recipe_path.read_text(encoding="utf-8"))
    track_id = recipe["track_id"]
    master = MASTERS / f"{track_id}-sa3-master.wav"
    receipt_path = RECEIPTS / f"{track_id}.json"
    if master.exists() or receipt_path.exists():
        raise FileExistsError(f"Refusing to overwrite master or receipt for {track_id}")
    before = request("GET", "/v1/health/inference")["data"]["workers"]["sa3"]
    if before.get("status") != "ok" or before.get("mode") != "mlx" or before.get("sa3_mlx") != "ok":
        raise RuntimeError("SA3 MLX worker is not healthy; refusing candidate generation")
    payload = {
        "mode": "game_bgm",
        "prompt": recipe["generation_prompt"],
        "duration_sec": recipe.get("generation_duration_sec", recipe["stream_duration_sec"]),
        "model_variant": recipe["model_variant"],
    }
    created = request("POST", "/v1/jobs", payload)
    job_id = created["data"]["job_id"]
    deadline = time.monotonic() + int(os.getenv("JOB_POLL_TIMEOUT", "3600"))
    while time.monotonic() < deadline:
        status = request("GET", f"/v1/jobs/{job_id}")["data"]
        if status["status"] == "completed":
            break
        if status["status"] == "failed":
            raise RuntimeError(f"SA3 job {job_id} failed: {status.get('error')}")
        time.sleep(5)
    else:
        raise TimeoutError(f"SA3 job {job_id} timed out")
    audio = request("GET", f"/v1/jobs/{job_id}/audio", timeout=300)
    if not isinstance(audio, bytes) or len(audio) < 100_000:
        raise RuntimeError("SA3 job returned no usable audio")
    after = request("GET", "/v1/health/inference")["data"]["workers"]["sa3"]
    if after.get("status") != "ok" or after.get("mode") != "mlx" or after.get("sa3_mlx") != "ok":
        raise RuntimeError("SA3 MLX worker health changed before download")
    MASTERS.mkdir(parents=True, exist_ok=True)
    RECEIPTS.mkdir(parents=True, exist_ok=True)
    master.write_bytes(audio)
    receipt = {
        "track_id": track_id,
        "gateway_job_id": job_id,
        "source_recipe": str(recipe_path.relative_to(ROOT)),
        "source_recipe_sha256": hashlib.sha256(recipe_path.read_bytes()).hexdigest(),
        "source_master_sha256": hashlib.sha256(audio).hexdigest(),
        "request": payload,
        "worker_health_before": before,
        "worker_health_after": after,
        "inference_mode_limit": "MLX health plus audio-format checks do not prove per-job model execution or musical quality",
    }
    receipt_path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {track_id} job={job_id} master={master} receipt={receipt_path}")
    return master, receipt_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--recipe", type=Path, required=True)
    args = parser.parse_args()
    generate(args.recipe.resolve())


if __name__ == "__main__":
    main()
