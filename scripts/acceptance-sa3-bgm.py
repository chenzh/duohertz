#!/usr/bin/env python3
"""End-to-end game_bgm via Gateway -> Mac SA3 MLX worker."""

from __future__ import annotations

import json
import os
import struct
import sys
import time
import urllib.request
import wave
from io import BytesIO

API_BASE = os.getenv("API_BASE", "http://127.0.0.1:8080")
API_KEY = os.getenv("API_KEY", "dev-api-key-change-me")
DURATION = int(os.getenv("SA3_TEST_DURATION", "15"))
TIMEOUT = int(os.getenv("JOB_POLL_TIMEOUT", "900"))


def req(method: str, path: str, body: dict | None = None, timeout: int = 120):
    headers = {"X-API-Key": API_KEY}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, timeout=timeout) as res:
        raw = res.read()
        if "audio" in res.headers.get("Content-Type", ""):
            return res.status, raw
        return res.status, json.loads(raw.decode())


def wav_info(audio: bytes) -> tuple[float, int, int]:
    try:
        with wave.open(BytesIO(audio)) as wf:
            return wf.getnframes() / wf.getframerate(), wf.getnchannels(), wf.getframerate()
    except wave.Error:
        pos = 12
        fmt: bytes | None = None
        data_size = 0
        while pos + 8 <= len(audio):
            chunk_id = audio[pos : pos + 4]
            size = struct.unpack("<I", audio[pos + 4 : pos + 8])[0]
            pos += 8
            if chunk_id == b"fmt ":
                fmt = audio[pos : pos + size]
            elif chunk_id == b"data":
                data_size = size
                break
            pos += size + (size % 2)
        if not fmt or len(fmt) < 16 or data_size <= 0:
            raise ValueError("unsupported wav")
        _tag, channels, sample_rate, _byte_rate, block_align, bits = struct.unpack("<HHIIHH", fmt[:16])
        frame_bytes = max(block_align, channels * (bits // 8))
        frames = data_size // frame_bytes
        return frames / sample_rate, channels, sample_rate


def main() -> int:
    print(f"API_BASE={API_BASE} duration={DURATION}s poll_timeout={TIMEOUT}s")
    code, raw = req("GET", "/v1/health/inference")
    health = raw.get("data", raw) if isinstance(raw, dict) else raw
    print("inference health:", json.dumps(health, ensure_ascii=False)[:240])
    if code != 200:
        return 1
    sa3 = health.get("workers", {}).get("sa3", {})
    if sa3.get("mode") != "mlx" or sa3.get("sa3_mlx") != "ok":
        print("SKIP: SA3 MLX not ready (mode/sa3_mlx)", sa3)
        return 0

    body = {
        "mode": "game_bgm",
        "prompt": "dark dungeon ambient tense instrumental",
        "duration_sec": DURATION,
        "model_variant": "small",
    }
    print("creating job...")
    code, created = req("POST", "/v1/jobs", body)
    if code != 201:
        print("create failed:", created)
        return 1
    job_id = created["data"]["job_id"]
    print("job_id:", job_id)

    start = time.time()
    latency_ms = None
    while time.time() - start < TIMEOUT:
        _, polled = req("GET", f"/v1/jobs/{job_id}")
        st = polled["data"]["status"]
        latency_ms = polled["data"].get("latency_ms")
        print(f"  status={st} elapsed={int(time.time()-start)}s latency_ms={latency_ms}")
        if st == "completed":
            break
        if st == "failed":
            print("failed:", polled)
            return 1
        time.sleep(3)
    else:
        print("poll timeout")
        return 1

    ac, audio = req("GET", f"/v1/jobs/{job_id}/audio", timeout=120)
    if ac != 200 or not isinstance(audio, bytes):
        print("audio download failed", ac)
        return 1

    dur, ch, sr = wav_info(audio)
    out = f"sa3-gateway-{job_id}.wav"
    with open(out, "wb") as f:
        f.write(audio)

    wall = time.time() - start
    print(
        f"OK wav={out} bytes={len(audio)} duration={dur:.1f}s ch={ch} sr={sr} "
        f"wall={wall:.1f}s worker_latency_ms={latency_ms}"
    )
    # Real SA3 stereo 44.1kHz; synth placeholder was tiny mono tone
    if len(audio) < 100000:
        print("WARN: output suspiciously small — may be synth fallback")
        return 1
    return 0 if dur >= DURATION - 2 else 1


if __name__ == "__main__":
    sys.exit(main())
