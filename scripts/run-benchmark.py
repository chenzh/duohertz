#!/usr/bin/env python3
"""Run ACE + SA3 benchmark via Gateway API."""

from __future__ import annotations

import json
import os
import time
import urllib.request

API_BASE = os.getenv("API_BASE", "http://localhost:8080")
API_KEY = os.getenv("API_KEY", "dev-api-key-change-me")


def api(method: str, path: str, body: dict | None = None) -> dict:
    data = None
    headers = {"X-API-Key": API_KEY}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=120) as res:
        return json.loads(res.read().decode())


def run_job(payload: dict) -> tuple[str, float, int]:
    start = time.time()
    created = api("POST", "/v1/jobs", payload)
    job_id = created["data"]["job_id"]
    while True:
        job = api("GET", f"/v1/jobs/{job_id}")
        status = job["data"]["status"]
        if status == "completed":
            return job_id, time.time() - start, job["data"].get("latency_ms", 0)
        if status == "failed":
            raise RuntimeError(job["data"].get("error"))
        if time.time() - start > 600:
            raise TimeoutError(job_id)
        time.sleep(2)


def main() -> None:
    ace_id, ace_sec, ace_ms = run_job(
        {
            "mode": "vocal_lyrics",
            "style_tags": "j-pop, female vocal, emotional",
            "lyrics": "[Verse]\nBenchmark line\n[Chorus]\nTest chorus",
            "duration_sec": 30,
        }
    )
    sa3_id, sa3_sec, sa3_ms = run_job(
        {
            "mode": "game_bgm",
            "prompt": "dark dungeon ambient, tense, instrumental",
            "duration_sec": 30,
        }
    )
    print(json.dumps({"ace": {"job_id": ace_id, "wall_sec": ace_sec, "latency_ms": ace_ms}, "sa3": {"job_id": sa3_id, "wall_sec": sa3_sec, "latency_ms": sa3_ms}}, indent=2))


if __name__ == "__main__":
    main()
