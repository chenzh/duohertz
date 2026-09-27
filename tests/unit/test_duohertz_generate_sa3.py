"""Candidate generation must not silently use a synthetic worker."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("duohertz_generate_sa3", ROOT / "scripts/duohertz-generate-sa3.py")
assert SPEC and SPEC.loader
generator = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = generator
SPEC.loader.exec_module(generator)


def test_unhealthy_worker_blocks_job_creation(tmp_path: Path, monkeypatch) -> None:
    recipe = tmp_path / "recipe.json"
    recipe.write_text(json.dumps({"track_id": "dh-test", "generation_prompt": "test",
                                  "stream_duration_sec": 128, "model_variant": "small"}))
    monkeypatch.setattr(generator, "MASTERS", tmp_path / "masters")
    monkeypatch.setattr(generator, "RECEIPTS", tmp_path / "receipts")
    calls = []

    def fake_request(method: str, route: str, body=None):
        calls.append((method, route))
        return {"data": {"workers": {"sa3": {"status": "ok", "mode": "synth", "sa3_mlx": "n/a"}}}}

    monkeypatch.setattr(generator, "request", fake_request)
    with pytest.raises(RuntimeError, match="not healthy"):
        generator.generate(recipe)
    assert calls == [("GET", "/v1/health/inference")]
    assert not (tmp_path / "masters").exists()


def test_long_master_request_uses_declared_generation_duration(tmp_path: Path, monkeypatch) -> None:
    recipe = tmp_path / "recipe.json"
    recipe.write_text(json.dumps({"track_id": "dh-test", "generation_prompt": "test",
                                  "stream_duration_sec": 128, "generation_duration_sec": 180,
                                  "stream_start_sec": 24, "model_variant": "small"}))
    monkeypatch.setattr(generator, "MASTERS", tmp_path / "masters")
    monkeypatch.setattr(generator, "RECEIPTS", tmp_path / "receipts")
    payloads = []

    def fake_request(method: str, route: str, body=None):
        if method == "POST":
            payloads.append(body)
            raise RuntimeError("stop after request")
        return {"data": {"workers": {"sa3": {"status": "ok", "mode": "mlx", "sa3_mlx": "ok"}}}}

    monkeypatch.setattr(generator, "request", fake_request)
    with pytest.raises(RuntimeError, match="stop after request"):
        generator.generate(recipe)
    assert payloads == [{"mode": "game_bgm", "prompt": "test", "duration_sec": 180,
                         "model_variant": "small"}]
