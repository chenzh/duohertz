"""Reject gross source-master faults before creating a music candidate."""

from __future__ import annotations

from array import array
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys
import wave

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("duohertz_stage_sa3", ROOT / "scripts/duohertz-stage-sa3.py")
assert SPEC and SPEC.loader
stage = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = stage
SPEC.loader.exec_module(stage)
RATE = 44_100


def write_stereo(path: Path, *, seconds: int = 10, silent_start: int = 0,
                 clipped: bool = False, mono_copy: bool = False, repeat_half: bool = False) -> None:
    samples = array("h")
    for frame in range(RATE * seconds):
        at = frame % (RATE * (seconds // 2)) if repeat_half else frame
        left = int((8000 + at // RATE * 100) * math.sin(2 * math.pi * 220 * at / RATE))
        right = left if mono_copy else int((6500 + at // RATE * 100) * math.sin(2 * math.pi * 330 * at / RATE))
        if frame < RATE * silent_start:
            left = right = 0
        if clipped and frame % 50 == 0:
            left = right = 32767
        samples.extend((left, right))
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(samples.tobytes())


def test_valid_stereo_master_passes_with_measured_evidence(tmp_path: Path) -> None:
    path = tmp_path / "valid.wav"
    write_stereo(path)
    result = stage.preflight_master(path)
    assert result["sample_rate_hz"] == RATE
    assert result["channels"] == 2
    assert result["sampled_rms"] > 0.015
    assert result["silent_8s_windows"] == 0


@pytest.mark.parametrize(
    ("options", "message"),
    [
        ({"repeat_half": True}, "exact duplicated half"),
        ({"silent_start": 8}, "silent"),
        ({"clipped": True}, "clipping"),
        ({"mono_copy": True}, "identical left and right"),
    ],
)
def test_bad_master_is_rejected(tmp_path: Path, options: dict, message: str) -> None:
    path = tmp_path / "bad.wav"
    write_stereo(path, **options)
    with pytest.raises(ValueError, match=message):
        stage.preflight_master(path)


def test_staging_rejects_receipt_for_a_different_master_before_writing(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(stage, "CANDIDATES", tmp_path / "candidates")
    recipe = tmp_path / "recipe.json"
    recipe.write_text(json.dumps({
        "track_id": "dh-test", "generation_prompt": "test", "stream_duration_sec": 128,
        "model_variant": "small",
    }))
    master = tmp_path / "master.wav"
    master.write_bytes(b"master")
    receipt = tmp_path / "receipt.json"
    receipt.write_text(json.dumps({
        "track_id": "dh-test", "gateway_job_id": "job-1",
        "source_recipe_sha256": hashlib.sha256(recipe.read_bytes()).hexdigest(),
        "source_master_sha256": "0" * 64,
    }))
    with pytest.raises(ValueError, match="receipt does not match"):
        stage.stage(recipe, master, tmp_path / "cover.png", tmp_path / "og.png", receipt)
    assert not (tmp_path / "candidates").exists()


def test_excerpt_must_fit_inside_generated_master(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(stage, "CANDIDATES", tmp_path / "candidates")
    recipe = tmp_path / "recipe.json"
    recipe.write_text(json.dumps({"track_id": "dh-test", "stream_duration_sec": 128,
                                  "generation_duration_sec": 140, "stream_start_sec": 24}))
    with pytest.raises(ValueError, match="excerpt start"):
        stage.stage(recipe, tmp_path / "master.wav", tmp_path / "cover.png",
                    tmp_path / "og.png", tmp_path / "receipt.json")
    assert not (tmp_path / "candidates").exists()


def test_excerpt_encoding_uses_same_start_and_fixed_length_for_all_versions(tmp_path: Path, monkeypatch) -> None:
    commands = []
    monkeypatch.setattr(stage.subprocess, "run", lambda command, **kwargs: commands.append(command))
    for name, length in (("game.m4a", 64), ("stream.m4a", 128), ("preview.m4a", 48)):
        stage.encode(tmp_path / "master.wav", tmp_path / name, length, start_sec=24)
    assert [command[command.index("-ss") + 1] for command in commands] == ["24", "24", "24"]
    assert [command[command.index("-t") + 1] for command in commands] == ["64", "128", "48"]


def test_local_svg_source_cannot_reference_remote_images(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(stage, "ROOT", tmp_path)
    source = tmp_path / "scripts/duohertz-art-sources/unsafe.svg"
    source.parent.mkdir(parents=True)
    source.write_text('<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/art.png"/></svg>')
    with pytest.raises(ValueError, match="self-contained"):
        stage.local_svg_source({"cover_source_svg": "scripts/duohertz-art-sources/unsafe.svg"},
                               "cover_source_svg", tmp_path / "cover.png", 1024, 1024)


@pytest.mark.parametrize("gain", [float("nan"), float("inf"), -31.0, 0.1])
def test_staging_rejects_invalid_aac_gain_before_writing(tmp_path: Path, gain: float, monkeypatch) -> None:
    monkeypatch.setattr(stage, "CANDIDATES", tmp_path / "candidates")
    with pytest.raises(ValueError, match="AAC gain"):
        stage.stage(tmp_path / "recipe.json", tmp_path / "master.wav", tmp_path / "cover.png",
                    tmp_path / "og.png", tmp_path / "receipt.json", gain_db=gain)
    assert not (tmp_path / "candidates").exists()


@pytest.mark.parametrize("limit", [float("nan"), float("inf"), 0.0, 1.1])
def test_staging_rejects_invalid_stream_limiter_before_writing(tmp_path: Path, limit: float, monkeypatch) -> None:
    monkeypatch.setattr(stage, "CANDIDATES", tmp_path / "candidates")
    with pytest.raises(ValueError, match="Stream limiter"):
        stage.stage(tmp_path / "recipe.json", tmp_path / "master.wav", tmp_path / "cover.png",
                    tmp_path / "og.png", tmp_path / "receipt.json", stream_limiter=limit)
    assert not (tmp_path / "candidates").exists()
