#!/usr/bin/env python3
"""Run ACCEPTANCE.md P0 cases against live Gateway."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tests"))

from harness import Harness, HarnessEnv, HttpClient, poll_job, wav_duration_sec  # noqa: E402

env = HarnessEnv()
harness = Harness("acceptance-p0")
client = HttpClient(env)

API_BASE = env.api_base
API_KEY = env.api_key
BAD_KEY = env.bad_api_key
ALT_KEY = env.alt_api_key
INTEGRATION = env.integration


def record(case_id: str, ok: bool, detail: str = "") -> None:
    harness.record(case_id, ok, detail)


def request_raw(
    method: str,
    path: str,
    *,
    key: str | None = API_KEY,
    body: dict | None = None,
    timeout: int = 60,
) -> tuple[int, dict[str, Any] | bytes]:
    return client.request(method, path, key=key, body=body, timeout=timeout)


def run_api_cases() -> None:
    code, body = request_raw("GET", "/v1/health", key=None)
    record("H-01", code == 200 and isinstance(body, dict) and body.get("data", {}).get("status") == "ok")

    code, body = request_raw("GET", "/v1/health/inference", key=None)
    workers = body.get("data", {}).get("workers", {}) if isinstance(body, dict) else {}
    record(
        "H-02",
        code == 200 and workers.get("ace", {}).get("status") == "ok" and workers.get("sa3", {}).get("status") == "ok",
        str(workers),
    )

    code, body = request_raw("POST", "/v1/jobs", key=None, body={"mode": "game_bgm", "prompt": "x", "duration_sec": 20})
    record("A-01", code == 401 and body.get("error", {}).get("code") == "UNAUTHORIZED")

    code, body = request_raw("POST", "/v1/jobs", key=BAD_KEY, body={"mode": "game_bgm", "prompt": "x", "duration_sec": 20})
    record("A-02", code == 401)

    code, body = request_raw(
        "POST",
        "/v1/jobs",
        body={"mode": "vocal_lyrics", "style_tags": "pop", "lyrics": "test lyrics here", "duration_sec": 30},
    )
    record("A-03", code == 201 and bool(body.get("data", {}).get("job_id")))

    for case_id, payload, err in [
        ("V-01", {"mode": "invalid"}, "INVALID_MODE"),
        ("V-02", {"mode": "vocal_lyrics", "style_tags": "pop"}, "INVALID_LYRICS"),
        ("V-03", {"mode": "vocal_lyrics", "lyrics": "x"}, "INVALID_STYLE_TAGS"),
        ("V-04", {"mode": "game_bgm"}, "INVALID_PROMPT"),
        ("V-05", {"mode": "game_bgm", "prompt": "bgm", "duration_sec": 5}, "INVALID_DURATION"),
        ("V-06", {"mode": "vocal_lyrics", "style_tags": "p", "lyrics": "l", "duration_sec": 300}, "INVALID_DURATION"),
    ]:
        code, body = request_raw("POST", "/v1/jobs", body=payload)
        record(case_id, code == 400 and body.get("error", {}).get("code") == err, str(body.get("error")))

    code, body = request_raw("GET", "/v1/jobs/00000000-0000-0000-0000-000000000099")
    record("J-01", code == 404)

    if INTEGRATION:
        code, created = request_raw(
            "POST",
            "/v1/jobs",
            body={"mode": "game_bgm", "prompt": "j02 isolation", "duration_sec": 15},
        )
        if code == 201:
            jid = created["data"]["job_id"]
            code2, _ = request_raw("GET", f"/v1/jobs/{jid}", key=ALT_KEY)
            record("J-02", code2 == 404, f"status={code2}")
        else:
            record("J-02", False, str(created))
        time.sleep(2)

    if INTEGRATION:
        code, created = request_raw(
            "POST",
            "/v1/jobs",
            body={
                "mode": "vocal_lyrics",
                "style_tags": "j-pop, female vocal",
                "lyrics": "[Verse]\nAcceptance test\n[Chorus]\nSing",
                "duration_sec": 30,
            },
        )
        if code != 201:
            record("U-01", False, str(created))
        else:
            job_id = created["data"]["job_id"]
            job = poll_job(client, job_id, timeout_sec=180)
            record("U-01", job.get("status") == "completed", job.get("status", ""))
            ac, audio = request_raw("GET", f"/v1/jobs/{job_id}/audio")
            record("U-02", ac == 200 and isinstance(audio, bytes) and len(audio) > 1024, f"bytes={len(audio) if isinstance(audio, bytes) else 0}")
        time.sleep(2)

        code, created = request_raw(
            "POST",
            "/v1/jobs",
            body={"mode": "vocal_desc", "prompt": "upbeat pop with female vocal", "duration_sec": 30},
        )
        if code != 201:
            record("U-03", False, str(created))
        else:
            job = poll_job(client, created["data"]["job_id"], timeout_sec=180)
            record("U-03", job.get("status") == "completed")
        time.sleep(2)

        code, created = request_raw(
            "POST",
            "/v1/jobs",
            body={"mode": "game_theme_vocal", "prompt": "epic game theme", "duration_sec": 30},
        )
        if code != 201:
            record("U-04", False, str(created))
        else:
            job = poll_job(client, created["data"]["job_id"], timeout_sec=180)
            record("U-04", job.get("status") == "completed")
        time.sleep(2)

        code, created = request_raw(
            "POST",
            "/v1/jobs",
            body={"mode": "game_bgm", "prompt": "dark dungeon ambient tense", "duration_sec": 30},
        )
        if code != 201:
            record("G-01", False, str(created))
        else:
            job = poll_job(client, created["data"]["job_id"], timeout_sec=120)
            record("G-01", job.get("status") == "completed")

            ac, audio = request_raw("GET", f"/v1/jobs/{created['data']['job_id']}/audio")
            record("G-02", ac == 200 and isinstance(audio, bytes) and len(audio) > 1024, "instrumental synth wav")
        time.sleep(2)

        code, created = request_raw(
            "POST",
            "/v1/jobs",
            body={"mode": "game_bgm", "prompt": "calm forest", "duration_sec": 60},
        )
        if code != 201:
            record("G-03", False, str(created))
        else:
            job = poll_job(client, created["data"]["job_id"], timeout_sec=180)
            ac, audio = request_raw("GET", f"/v1/jobs/{created['data']['job_id']}/audio")
            dur = wav_duration_sec(audio) if isinstance(audio, bytes) else 0
            record("G-03", job.get("status") == "completed" and 55 <= dur <= 65, f"duration={dur:.1f}s")
        time.sleep(2)

        code, created = request_raw(
            "POST",
            "/v1/jobs",
            body={"mode": "game_bgm", "prompt": "status flow", "duration_sec": 15},
        )
        if code != 201:
            record("J-04", False, str(created))
        else:
            statuses: list[str] = []
            jid = created["data"]["job_id"]
            for _ in range(60):
                _, body = request_raw("GET", f"/v1/jobs/{jid}")
                st = body["data"]["status"]
                if not statuses or statuses[-1] != st:
                    statuses.append(st)
                if st in ("completed", "failed"):
                    break
                time.sleep(0.5)
            valid = ["queued", "routing", "generating", "uploading", "completed"]
            record("J-04", statuses == valid[: len(statuses)] or statuses[-1] == "completed", ",".join(statuses))

    code, body = request_raw("GET", "/demo/api/v1/health/inference", key=None)
    record("D-01-proxy", code == 200 and bool(body.get("data", {}).get("workers")), "bff health")

    code, body = request_raw("POST", "/demo/api/v1/jobs", key=None, body={"mode": "game_bgm", "prompt": "demo bff", "duration_sec": 15})
    record("D-04-proxy", code == 201 and bool(body.get("data", {}).get("job_id")), str(body)[:120])

    code, body = request_raw("POST", "/v1/jobs", key=None, body={"mode": "game_bgm", "prompt": "x", "duration_sec": 15})
    record("D-06", code == 401)

    mc = subprocess.run(
        [sys.executable, str(ROOT / "examples" / "python" / "minimal_client.py")],
        env={**os.environ, "API_BASE": API_BASE, "API_KEY": API_KEY},
        capture_output=True,
        text=True,
    )
    record("D-05", mc.returncode == 0, mc.stdout.strip()[-80:])

    hits = 0
    for _ in range(8):
        code, _ = request_raw(
            "POST",
            "/v1/jobs",
            body={"mode": "game_bgm", "prompt": "rate limit burst test", "duration_sec": 15},
        )
        if code == 429:
            hits += 1
    record("R-01", hits >= 1, f"429_count={hits}")


def run_examples() -> None:
    mac_ssh = os.getenv("MAC_SSH", "192.168.0.199")
    gw_host = os.getenv("GW_HOST", "192.168.0.135")
    remote_base = f"export API_BASE=http://{gw_host}:8080 API_KEY={API_KEY} && cd ~/Desktop/MusicSaas"

    def ssh(cmd: str) -> int:
        return subprocess.call(["ssh", "-o", "BatchMode=yes", f"zhenhuachen@{mac_ssh}", cmd])

    if ssh(f"{remote_base} && bash examples/curl/health.sh") == 0:
        record("E-01", True, "mac")
    else:
        record("E-01", False, "mac health")

    out = subprocess.check_output(
        ["ssh", "-o", "BatchMode=yes", f"zhenhuachen@{mac_ssh}", f"{remote_base} && bash examples/curl/create_game_bgm.sh"],
        text=True,
    )
    job_id = json.loads(out)["data"]["job_id"]
    record("E-02", bool(job_id), job_id)

    record("E-03", ssh(f"{remote_base} && bash examples/curl/poll_job.sh {job_id}") == 0)
    record(
        "E-04",
        ssh(f"{remote_base} && bash examples/curl/download_audio.sh {job_id} /tmp/{job_id}.wav") == 0,
        f"/tmp/{job_id}.wav",
    )


def main() -> int:
    print(f"API_BASE={API_BASE} INTEGRATION={INTEGRATION}")
    run_api_cases()
    if INTEGRATION:
        try:
            run_examples()
        except Exception as e:
            record("E-01", False, f"examples error: {e}")
    return harness.summary()


if __name__ == "__main__":
    sys.exit(main())
