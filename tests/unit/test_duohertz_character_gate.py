"""Unreviewed character concepts must be intact before design review."""

from __future__ import annotations

import importlib.util
import json
import shutil
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("duohertz_character_gate", ROOT / "scripts/duohertz-character-gate.py")
assert SPEC and SPEC.loader
GATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)


def test_three_character_cutouts_match_manifest() -> None:
    GATE.validate()


def test_changed_art_hash_blocks_review(tmp_path: Path) -> None:
    candidate = tmp_path / "characters"
    shutil.copytree(GATE.DIRECTORY, candidate)
    manifest_path = candidate / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["characters"][0]["sha256"] = "0" * 64
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    with pytest.raises(ValueError, match="RHYVORI: missing or modified art"):
        GATE.validate(candidate)


def test_changed_side_view_hash_blocks_review(tmp_path: Path) -> None:
    candidate = tmp_path / "characters"
    shutil.copytree(GATE.DIRECTORY, candidate)
    manifest_path = candidate / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["characters"][1]["side_view"]["sha256"] = "0" * 64
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    with pytest.raises(ValueError, match="NIVAREO side: missing or modified art"):
        GATE.validate(candidate)


def test_side_prompt_origin_is_required_after_rename(tmp_path: Path) -> None:
    candidate = tmp_path / "characters"
    shutil.copytree(GATE.DIRECTORY, candidate)
    manifest_path = candidate / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["characters"][2]["side_view"].pop("prompt_name_at_generation")
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    with pytest.raises(ValueError, match="ZORYMELA: side-view provenance mismatch"):
        GATE.validate(candidate)
