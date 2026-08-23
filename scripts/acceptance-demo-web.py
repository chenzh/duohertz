#!/usr/bin/env python3
"""Acceptance for Demo web (D-01~D-04) via http://localhost:3000."""

from __future__ import annotations

import json
import struct
import sys
import time
import urllib.error
import urllib.request
import wave
from io import BytesIO
from typing import Any

DEMO_BASE = "http://localhost:3000"
API = f"{DEMO_BASE}/demo/api/v1"

results: list[tuple[str, bool, str]] = []


def record(case_id: str, ok: bool, detail: str = "") -> None:
    results.append((case_id, ok, detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {case_id} {detail}")


def get(path: str, timeout: int = 30) -> tuple[int, Any]:
    req = urllib.request.Request(f"{API}{path}")
    with urllib.request.urlopen(req, timeout=timeout) as res:
        raw = res.read()
        ctype = res.headers.get("Content-Type", "")
        if "audio" in ctype:
            return res.status, raw
        return res.status, json.loads(raw.decode())


def post(path: str, body: dict) -> tuple[int, dict]:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.status, json.loads(res.read().decode())["data"]


def poll_job(job_id: str, timeout_sec: int = 120) -> dict:
    start = time.time()
    while time.time() - start < timeout_sec:
        _, body = get(f"/jobs/{job_id}")
        last = body["data"]
        if last["status"] in ("completed", "failed"):
            return last
        time.sleep(2)
    raise TimeoutError(job_id)


def wav_ok(data: bytes) -> tuple[bool, str]:
    if len(data) < 1000:
        return False, f"too small ({len(data)} bytes)"
    try:
        with wave.open(BytesIO(data)) as wf:
            dur = wf.getnframes() / float(wf.getframerate())
            return True, f"{len(data)} bytes, {dur:.1f}s, {wf.getnchannels()}ch"
    except wave.Error as e:
        return False, str(e)


def main() -> int:
    # Page shell
    try:
        with urllib.request.urlopen(f"{DEMO_BASE}/", timeout=10) as res:
            html = res.read().decode()
        record("WEB-01", "Local AI Music API" in html and 'id="root"' in html, "index.html")
        record("WEB-02", res.status == 200, f"status={res.status}")
    except Exception as e:
        record("WEB-01", False, str(e))
        record("WEB-02", False, str(e))

    # Vite entry
    try:
        with urllib.request.urlopen(f"{DEMO_BASE}/src/main.tsx", timeout=10) as res:
            record("WEB-03", res.status == 200 and b"createRoot" in res.read(), "main.tsx loads")
    except Exception as e:
        record("WEB-03", False, str(e))

    # Health via Demo proxy (same path browser uses)
    try:
        _, h = get("/health")
        record("D-01-preflight", h["data"]["status"] == "ok", "gateway health via :3000 proxy")
        _, inf = get("/health/inference")
        w = inf["data"]["workers"]
        record(
            "D-health-workers",
            w["ace"]["status"] == "ok" and w["sa3"]["status"] == "ok",
            f"ace={w['ace']['status']} sa3={w['sa3']['status']}",
        )
    except Exception as e:
        record("D-01-preflight", False, str(e))
        record("D-health-workers", False, str(e))

    modes = [
        (
            "D-01",
            "game_bgm",
            {"mode": "game_bgm", "prompt": "dark dungeon ambient, tense, instrumental", "duration_sec": 15},
        ),
        (
            "D-02",
            "vocal_lyrics",
            {
                "mode": "vocal_lyrics",
                "style_tags": "j-pop, female vocal",
                "lyrics": "[Verse]\nDemo test line\n[Chorus]\nSing along",
                "duration_sec": 30,
            },
        ),
        (
            "D-02b",
            "vocal_desc",
            {"mode": "vocal_desc", "prompt": "upbeat pop female vocal", "duration_sec": 30},
        ),
        (
            "D-02c",
            "game_theme_vocal",
            {
                "mode": "game_theme_vocal",
                "style_tags": "epic orchestral",
                "lyrics": "[Chorus]\nBoss battle theme",
                "prompt": "final boss fight",
                "duration_sec": 30,
            },
        ),
    ]

    audio_job_ids: dict[str, str] = {}
    for case_id, mode_name, payload in modes:
        try:
            _, created = post("/jobs", payload)
            job_id = created["job_id"]
            job = poll_job(job_id)
            if job["status"] != "completed":
                record(case_id, False, f"status={job['status']} err={job.get('error')}")
                continue
            _, audio = get(f"/jobs/{job_id}/audio")
            assert isinstance(audio, bytes)
            ok, info = wav_ok(audio)
            audio_job_ids[mode_name] = job_id
            record(case_id, ok, f"{mode_name} job={job_id[:8]} {info}")
        except Exception as e:
            record(case_id, False, f"{mode_name}: {e}")

    # D-04: same params via direct gateway should also complete
    try:
        body = {"mode": "game_bgm", "prompt": "dark dungeon ambient, tense, instrumental", "duration_sec": 15}
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            "http://localhost:8080/v1/jobs",
            data=data,
            headers={"Content-Type": "application/json", "X-API-Key": "dev-api-key-change-me"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as res:
            curl_job = json.loads(res.read().decode())["data"]["job_id"]
        curl_job_data = poll_job_via_gateway(curl_job)
        demo_job = audio_job_ids.get("game_bgm")
        demo_len = 0
        if demo_job:
            _, audio = get(f"/jobs/{demo_job}/audio")
            demo_len = len(audio) if isinstance(audio, bytes) else 0
        record(
            "D-04",
            curl_job_data["status"] == "completed" and demo_len > 1000,
            f"curl job={curl_job[:8]} demo_wav={demo_len}B",
        )
    except Exception as e:
        record("D-04", False, str(e))

    if audio_job_ids.get("game_bgm"):
        jid = audio_job_ids["game_bgm"]
        url = f"{API}/jobs/{jid}/audio"
        record("WEB-audio-url", "/demo/api/v1/jobs/" in url and jid in url, url)

    print("\n=== Demo Web Summary ===")
    passed = sum(1 for _, ok, _ in results if ok)
    print(f"PASS {passed} / {len(results)}")
    failed = [c for c, ok, _ in results if not ok]
    if failed:
        print("FAILED:", ", ".join(failed))
        return 1
    return 0


def poll_job_via_gateway(job_id: str, timeout_sec: int = 120) -> dict:
    start = time.time()
    while time.time() - start < timeout_sec:
        req = urllib.request.Request(
            f"http://localhost:8080/v1/jobs/{job_id}",
            headers={"X-API-Key": "dev-api-key-change-me"},
        )
        with urllib.request.urlopen(req, timeout=30) as res:
            data = json.loads(res.read().decode())["data"]
        if data["status"] in ("completed", "failed"):
            return data
        time.sleep(2)
    raise TimeoutError(job_id)


if __name__ == "__main__":
    sys.exit(main())
