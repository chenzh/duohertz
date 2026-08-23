"""Worker unit tests (synth mode, no MLX)."""

from __future__ import annotations

import base64
import importlib.util
import os
import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
SECRET = "harness-test-secret"


def _load_worker_app(relative: str) -> FastAPI:
    path = ROOT / relative
    module_name = f"worker_{path.parent.name}"
    spec = importlib.util.spec_from_file_location(module_name, path)
    if spec is None or spec.loader is None:
        raise ImportError(path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module.app


@pytest.fixture(scope="module")
def ace_client() -> TestClient:
    os.environ["WORKER_MODE"] = "synth"
    os.environ["WORKER_SECRET"] = SECRET
    return TestClient(_load_worker_app("workers/ace-step/server.py"))


@pytest.fixture(scope="module")
def sa3_client() -> TestClient:
    os.environ["WORKER_SECRET"] = SECRET
    return TestClient(_load_worker_app("workers/sa3/server.py"))


def test_ace_health_synth_mode(ace_client: TestClient) -> None:
    res = ace_client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["engine"] == "ace-step-1.5"
    assert body["mode"] == "synth"


def test_ace_generate_requires_secret(ace_client: TestClient) -> None:
    res = ace_client.post(
        "/internal/generate",
        json={
            "job_id": "harness-ace-001",
            "mode": "vocal_lyrics",
            "style_tags": "pop",
            "lyrics": "test",
            "duration_sec": 10,
            "output_path": "/tmp/harness-ace-001.wav",
        },
    )
    assert res.status_code == 401


def test_ace_generate_synth_wav(ace_client: TestClient) -> None:
    res = ace_client.post(
        "/internal/generate",
        json={
            "job_id": "harness-ace-002",
            "mode": "vocal_lyrics",
            "style_tags": "pop",
            "lyrics": "harness lyrics",
            "duration_sec": 10,
            "output_path": "/tmp/harness-ace-002.wav",
        },
        headers={"X-Worker-Secret": SECRET},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert body["latency_ms"] >= 0
    audio = base64.b64decode(body["audio_base64"])
    assert len(audio) > 1024
    assert audio[:4] == b"RIFF"


def test_sa3_health_synth_mode(sa3_client: TestClient) -> None:
    res = sa3_client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["engine"] == "stable-audio-3"
