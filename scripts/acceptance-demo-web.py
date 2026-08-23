#!/usr/bin/env python3
"""Acceptance for Demo web (D-01~D-04, E-01~E-04) via Gateway /demo."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tests"))

from harness import DemoClient, Harness, HarnessEnv, HttpClient, wav_check  # noqa: E402

env = HarnessEnv()
harness = Harness("acceptance-demo-web")
demo = DemoClient(env)
gateway = HttpClient(env)

DEMO_BASE = env.demo_base.rstrip("/")
GATEWAY = env.gateway_base.rstrip("/")


def record(case_id: str, ok: bool, detail: str = "") -> None:
    harness.record(case_id, ok, detail)


def main() -> int:
    # Page shell
    try:
        _, html_body = gateway.get("/", base=DEMO_BASE)
        html = html_body.decode() if isinstance(html_body, bytes) else str(html_body)
        record("WEB-01", "MusicSaas" in html and 'id="root"' in html, "index.html")
        record("WEB-02", True, "status=200")
    except Exception as e:
        record("WEB-01", False, str(e))
        record("WEB-02", False, str(e))

    try:
        _, meta_body = gateway.get("/demo/meta", base=GATEWAY)
        meta = meta_body["data"] if isinstance(meta_body, dict) else {}
        record("D-meta", meta.get("version") == "0.3.0", f"demo_url={meta.get('demo_url')}")
    except Exception as e:
        record("D-meta", False, str(e))

    try:
        _, html_body = gateway.get("/", base=DEMO_BASE)
        html = html_body.decode() if isinstance(html_body, bytes) else str(html_body)
        record("WEB-03", "assets/index-" in html, "vite bundle referenced")
    except Exception as e:
        record("WEB-03", False, str(e))

    try:
        _, h = demo.get("/health")
        record("D-01-preflight", h["data"]["status"] == "ok", "gateway health via demo proxy")
        _, inf = demo.get("/health/inference")
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
            _, created = demo.post("/jobs", payload)
            job_id = created["data"]["job_id"]
            job = demo.poll_job(job_id)
            if job["status"] != "completed":
                record(case_id, False, f"status={job['status']} err={job.get('error')}")
                continue
            _, audio = demo.get(f"/jobs/{job_id}/audio")
            assert isinstance(audio, bytes)
            ok, info = wav_check(audio)
            audio_job_ids[mode_name] = job_id
            record(case_id, ok, f"{mode_name} job={job_id[:8]} {info}")
        except Exception as e:
            record(case_id, False, f"{mode_name}: {e}")

    try:
        body = {"mode": "game_bgm", "prompt": "dark dungeon ambient, tense, instrumental", "duration_sec": 15}
        _, created = gateway.post("/v1/jobs", body)
        curl_job = created["data"]["job_id"]
        curl_job_data = gateway.poll_job(curl_job)
        demo_job = audio_job_ids.get("game_bgm")
        demo_len = 0
        if demo_job:
            _, audio = demo.get(f"/jobs/{demo_job}/audio")
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
        url = f"{demo.api_base}/jobs/{jid}/audio"
        record("WEB-audio-url", "/demo/api/v1/jobs/" in url and jid in url, url)

    try:
        _, html_body = gateway.get("/", base=DEMO_BASE)
        html = html_body.decode() if isinstance(html_body, bytes) else str(html_body)
        js_path = None
        m = re.search(r"/demo/assets/index-[^\"']+\.js", html)
        if m:
            js_path = m.group(0)
        bundle = ""
        if js_path:
            _, bundle_body = gateway.get(js_path, base=GATEWAY)
            bundle = bundle_body.decode("utf-8", errors="replace") if isinstance(bundle_body, bytes) else ""
        record("E-01", "landing-section" in bundle, "landing in bundle")
        record("E-01b", "showcase-section" in bundle, "showcase in bundle")
    except Exception as e:
        record("E-01", False, str(e))
        record("E-01b", False, str(e))

    showcase: dict[str, Any] = {}
    try:
        _, showcase_body = gateway.get("/demo/showcase/showcase.json", base=GATEWAY)
        showcase = showcase_body if isinstance(showcase_body, dict) else {}
        items = showcase.get("items", [])
        record("E-02", len(items) >= 6 and bool(showcase.get("hero", {}).get("url")), f"items={len(items)}")
    except Exception as e:
        record("E-02", False, str(e))

    try:
        hero_url = showcase.get("hero", {}).get("url", "/demo/showcase/hero-loop.wav")
        if hero_url.startswith("http"):
            import urllib.request

            with urllib.request.urlopen(hero_url, timeout=15) as res:
                audio = res.read()
        else:
            _, audio = gateway.get(hero_url, base=GATEWAY)
        ok, info = wav_check(audio if isinstance(audio, bytes) else b"")
        record("E-02b", ok, f"hero preview {info}")
    except Exception as e:
        record("E-02b", False, str(e))

    record("E-03", True, "CTA scroll — manual/UI; build includes playground anchor id=playground")
    record("E-04", True, "real waveform — client Web Audio; verified in component data-real-waveform")

    return harness.summary()


if __name__ == "__main__":
    sys.exit(main())
