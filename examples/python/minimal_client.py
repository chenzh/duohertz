#!/usr/bin/env python3
"""Minimal client: submit → poll → save WAV."""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.request

API_BASE = os.getenv("API_BASE", "http://localhost:8080")
API_KEY = os.getenv("API_KEY", "dev-api-key-change-me")


def request(method: str, path: str, body: dict | None = None) -> dict:
    data = None
    headers = {"X-API-Key": API_KEY}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode())


def main() -> int:
    created = request("POST", "/v1/jobs", {
        "mode": "game_bgm",
        "prompt": "calm forest ambient instrumental",
        "duration_sec": 20,
    })
    job_id = created["data"]["job_id"]
    print("job_id", job_id)

    for _ in range(120):
        job = request("GET", f"/v1/jobs/{job_id}")
        status = job["data"]["status"]
        print("status", status)
        if status == "completed":
            break
        if status == "failed":
            print(job["data"].get("error"))
            return 1
        time.sleep(2)
    else:
        return 1

    out = f"{job_id}.wav"
    req = urllib.request.Request(
        f"{API_BASE}/v1/jobs/{job_id}/audio",
        headers={"X-API-Key": API_KEY},
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        wav = res.read()
    with open(out, "wb") as f:
        f.write(wav)
    print("saved", out, len(wav))
    return 0


if __name__ == "__main__":
    sys.exit(main())
