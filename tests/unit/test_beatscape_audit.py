"""Regression tests for BeatScape catalog checks in source and CI checkouts."""
import importlib.util
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("beatscape_audit", ROOT / "scripts/beatscape-audit.py")
assert SPEC and SPEC.loader
AUDIT = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = AUDIT
SPEC.loader.exec_module(AUDIT)


def catalog_entry(tmp_path):
    (tmp_path / "audio.m4a").write_bytes(b"ftyp")
    (tmp_path / "cover.svg").write_text("<svg></svg>")
    for tier in ("easy", "standard", "hard"):
        (tmp_path / f"{tier}.json").write_text("{}")
    return {
        "track_id": "bs-s2-01",
        "title": "Slide City",
        "artist": "Pulse Core",
        "genre": "EDM",
        "bpm": 140,
        "duration_sec": 90,
        "preset_id": "p",
        "engine": "e",
        "rights": "owned",
        "theme": "beatscape",
        "audio": "/audio.m4a",
        "cover": "/cover.svg",
        "charts": {tier: f"/{tier}.json" for tier in ("easy", "standard", "hard")},
        "stream_audio": "/stream.m4a",
        "stream_duration_sec": 180,
    }


def test_missing_stream_is_a_failure_for_local_source_checkout(tmp_path):
    report = AUDIT.audit_catalog_entry(catalog_entry(tmp_path), tmp_path)
    check = next(item for item in report.checks if item.code == "catalog.stream_audio")
    assert check.status == "FAIL"


def test_missing_stream_can_be_explicitly_marked_external_for_ci(tmp_path):
    report = AUDIT.audit_catalog_entry(catalog_entry(tmp_path), tmp_path, allow_missing_stream=True)
    check = next(item for item in report.checks if item.code == "catalog.stream_external")
    assert check.status == "WARN"
    assert report.worst == "WARN"
