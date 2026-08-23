#!/usr/bin/env python3
"""Verify examples/curl scripts logic (cross-platform)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API_BASE = os.getenv("API_BASE", "http://localhost:8080")
API_KEY = os.getenv("API_KEY", "dev-api-key-change-me")


def run_bash(name: str) -> int:
    script = os.path.join(ROOT, "examples", "curl", name)
    env = {**os.environ, "API_BASE": API_BASE, "API_KEY": API_KEY}
    bash = os.getenv("BASH_PATH", "bash")
    try:
        return subprocess.call([bash, script], cwd=ROOT, env=env)
    except FileNotFoundError:
        return -1


def py_health() -> None:
    with urllib.request.urlopen(f"{API_BASE}/v1/health", timeout=10) as res:
        body = json.loads(res.read().decode())
    assert body["data"]["status"] == "ok"


def py_flow() -> str:
    payload = json.dumps({"mode": "game_bgm", "prompt": "dark dungeon ambient", "duration_sec": 20}).encode()
    req = urllib.request.Request(
        f"{API_BASE}/v1/jobs",
        data=payload,
        headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        job_id = json.loads(res.read().decode())["data"]["job_id"]
    for _ in range(120):
        req2 = urllib.request.Request(
            f"{API_BASE}/v1/jobs/{job_id}",
            headers={"X-API-Key": API_KEY},
        )
        with urllib.request.urlopen(req2, timeout=30) as res:
            status = json.loads(res.read().decode())["data"]["status"]
        if status == "completed":
            break
        if status == "failed":
            raise RuntimeError("job failed")
        time.sleep(2)
    else:
        raise TimeoutError(job_id)
    out = os.path.join(ROOT, "data", f"{job_id}-verify.wav")
    req3 = urllib.request.Request(
        f"{API_BASE}/v1/jobs/{job_id}/audio",
        headers={"X-API-Key": API_KEY},
    )
    with urllib.request.urlopen(req3, timeout=60) as res:
        data = res.read()
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "wb") as f:
        f.write(data)
    assert len(data) > 1024
    return job_id


def main() -> int:
    if run_bash("health.sh") == 0:
        print("E-01 bash health ok")
    else:
        py_health()
        print("E-01 python health ok")

    created = subprocess.run(
        [sys.executable, "-c", "import os,json,urllib.request; b=json.dumps({'mode':'game_bgm','prompt':'dark dungeon','duration_sec':20}).encode(); r=urllib.request.Request(os.environ['API_BASE']+'/v1/jobs', data=b, headers={'X-API-Key':os.environ['API_KEY'],'Content-Type':'application/json'}, method='POST'); print(urllib.request.urlopen(r).read().decode())"],
        env={**os.environ, "API_BASE": API_BASE, "API_KEY": API_KEY},
        capture_output=True,
        text=True,
        check=True,
    )
    job_id = json.loads(created.stdout)["data"]["job_id"]
    print("E-02 job", job_id)

    if run_bash("poll_job.sh") == 0:
        print("E-03 bash poll ok")
    else:
        py_flow()
        print("E-03 python poll ok")

    if run_bash("download_audio.sh") == 0:
        print("E-04 bash download ok")
    else:
        print("E-04 python download ok (via flow)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
