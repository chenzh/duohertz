"""Call local ACE-Step API (MLX) from the thin gateway worker."""

from __future__ import annotations

import json
import os
import shutil
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


def _api_base() -> str:
    return os.getenv("ACE_API_URL", "http://127.0.0.1:8200").rstrip("/")


def _api_token() -> str:
    return os.getenv("ACE_API_TOKEN", "dev-api-key")


def _request(method: str, path: str, body: dict | None = None, timeout: int = 120) -> dict[str, Any]:
    data = None
    headers: dict[str, str] = {}
    if body is not None:
        payload = {**body, "ai_token": _api_token()}
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{_api_base()}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode())


def _build_release_body(payload: dict) -> dict[str, Any]:
    mode = payload.get("mode", "")
    lyrics = payload.get("lyrics") or ""
    prompt = payload.get("prompt") or ""
    style = payload.get("style_tags") or ""
    duration = float(payload.get("duration_sec", 30))

    if mode == "vocal_lyrics":
        return {
            "lyrics": lyrics,
            "prompt": style,
            "thinking": True,
            "audio_duration": duration,
            "model": "acestep-v15-turbo",
        }
    if mode == "game_theme_vocal":
        return {
            "lyrics": lyrics,
            "prompt": f"{style}, {prompt}".strip(", "),
            "thinking": True,
            "audio_duration": duration,
            "model": "acestep-v15-turbo",
        }
    # vocal_desc and fallback
    return {
        "lyrics": "",
        "prompt": prompt or style,
        "thinking": True,
        "audio_duration": duration,
        "model": "acestep-v15-turbo",
    }


def _extract_audio_path(result_item: dict[str, Any]) -> str | None:
    status = result_item.get("status")
    if status not in (1, "1"):
        return None
    raw = result_item.get("result")
    if not raw:
        return None
    try:
        parsed = json.loads(raw) if isinstance(raw, str) else raw
    except json.JSONDecodeError:
        return None
    if isinstance(parsed, list) and parsed:
        parsed = parsed[0]
    if not isinstance(parsed, dict):
        return None
    paths = parsed.get("audio_paths") or parsed.get("raw_audio_paths") or []
    if paths:
        return paths[0]
    return parsed.get("first_audio_path")


def generate_via_ace_api(payload: dict, output_path: str, timeout_sec: int = 1800) -> tuple[bool, int, str | None]:
    """Submit ACE job, poll, copy wav to output_path. Returns (ok, latency_ms, error)."""
    started = time.time()
    try:
        created = _request("POST", "/release_task", _build_release_body(payload))
        if created.get("code") != 200:
            return False, 0, str(created)
        task_id = created["data"]["task_id"]

        deadline = time.time() + timeout_sec
        audio_path: str | None = None
        while time.time() < deadline:
            polled = _request("POST", "/query_result", {"task_id_list": [task_id]})
            if polled.get("code") != 200:
                time.sleep(3)
                continue
            items = polled.get("data") or []
            if not items:
                time.sleep(3)
                continue
            item = items[0]
            st = item.get("status")
            if st in (2, "2"):
                return False, int((time.time() - started) * 1000), item.get("result") or "failed"
            audio_path = _extract_audio_path(item)
            if audio_path:
                break
            time.sleep(3)

        if not audio_path or not os.path.isfile(audio_path):
            return False, int((time.time() - started) * 1000), "timeout or missing audio"

        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        shutil.copyfile(audio_path, output_path)
        return True, int((time.time() - started) * 1000), None
    except (urllib.error.URLError, TimeoutError, KeyError, OSError) as err:
        return False, int((time.time() - started) * 1000), str(err)
