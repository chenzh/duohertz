"""The 105-track audit must reject legacy charts and incomplete content."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "duohertz_catalog_structure", ROOT / "scripts/duohertz-catalog-structure.py"
)
assert SPEC and SPEC.loader
AUDIT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUDIT)


def staged_track(tmp_path: Path) -> Path:
    directory = tmp_path / "dh-test"
    directory.mkdir()
    gate = AUDIT.candidate_gate()
    for name in gate.FILES - {"easy.json", "standard.json", "hard.json"}:
        (directory / name).write_bytes(f"fixture:{name}".encode())
    for tier in gate.TIERS:
        two_key = tier != "easy"
        chart = {
            "format": 2, "theme": "duohertz", "track_id": "dh-test",
            "tier": tier, "input_count": 2 if two_key else 1,
            "bpm": 120, "audio_offset_ms": 0,
            "notes": [{"id": "left", "type": "tap", "t": 1, "key": 0}],
            "total_notes": 2 if two_key else 1,
        }
        if two_key:
            chart["notes"].append({"id": "right", "type": "tap", "t": 2, "key": 1})
        (directory / f"{tier}.json").write_text(json.dumps(chart), encoding="utf-8")
    (directory / "manifest.json").write_text(json.dumps({
        "track_id": "dh-test", "title": "Test Track", "artist": "Test Studio",
        "theme": "duohertz", "subgenre": "Melodic House", "bpm": 120,
        "duration_sec": 4,
        "files_sha256": {name: gate.sha(directory / name) for name in gate.FILES},
    }), encoding="utf-8")
    return directory


def test_incomplete_inventory_cannot_pass_as_105_tracks(tmp_path: Path) -> None:
    staged_track(tmp_path)
    report = AUDIT.assess(AUDIT.inspect(tmp_path))
    assert report["staged_tracks"] == 1
    assert report["missing_by_subgenre"]["Melodic House"] == 20
    assert report["technical_structure_pass"] is False
    assert report["human_review_and_release_signoff"] == "not_assessed_here"


def test_rehashed_legacy_chart_is_still_rejected(tmp_path: Path) -> None:
    directory = staged_track(tmp_path)
    chart_path = directory / "standard.json"
    chart = json.loads(chart_path.read_text(encoding="utf-8"))
    chart["format"] = 1
    chart_path.write_text(json.dumps(chart), encoding="utf-8")
    manifest_path = directory / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["files_sha256"]["standard.json"] = AUDIT.candidate_gate().sha(chart_path)
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    with pytest.raises(ValueError, match="format 2 chart"):
        AUDIT.inspect(tmp_path)


def test_two_tracks_cannot_reuse_identical_music_bytes(tmp_path: Path) -> None:
    first = staged_track(tmp_path)
    second = tmp_path / "dh-copy"
    second.mkdir()
    for path in first.iterdir():
        (second / path.name).write_bytes(path.read_bytes())
    for tier in AUDIT.candidate_gate().TIERS:
        path = second / f"{tier}.json"
        chart = json.loads(path.read_text())
        chart["track_id"] = "dh-copy"
        path.write_text(json.dumps(chart))
    manifest_path = second / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    manifest.update(track_id="dh-copy", title="Second Track")
    manifest["files_sha256"] = {
        name: AUDIT.candidate_gate().sha(second / name)
        for name in AUDIT.candidate_gate().FILES
    }
    manifest_path.write_text(json.dumps(manifest))
    with pytest.raises(ValueError, match="Duplicate music bytes"):
        AUDIT.inspect(tmp_path)
