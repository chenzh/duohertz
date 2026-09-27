"""An observation export cannot become a release approval or survive asset changes."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


AUDIT = load("duohertz_review_audit_test", "duohertz-review-audit.py")
WORKSHEET = load("duohertz_review_worksheet_audit_test", "duohertz-review-worksheet.py")


def fixture(tmp_path: Path) -> tuple[Path, dict]:
    directory = tmp_path / "dh-test"
    directory.mkdir()
    assets = {}
    for name in WORKSHEET.REQUIRED_FILES:
        path = directory / name
        path.write_bytes(f"fixture:{name}".encode())
        assets[name] = WORKSHEET.sha(path)
    (directory / "manifest.json").write_text(json.dumps({
        "track_id": "dh-test", "title": "Test Track", "subgenre": "Trance",
        "bpm": 140, "duration_sec": 60, "rights_status": "internal_candidate_unreviewed",
        "files_sha256": assets,
    }), encoding="utf-8")
    current = WORKSHEET.candidates(tmp_path)[0]
    report = {
        "schema": 1, "scope": "duohertz_candidate_observations",
        "reviewer": "Fixture Reviewer", "exportedAt": "2026-09-24T12:00:00Z",
        "releaseApproval": False,
        "tracks": [{
            **{key: current[key] for key in (
                "track_id", "title", "subgenre", "fingerprint", "manifest_sha256",
                "assets_sha256", "rights_status",
            )},
            "verdicts": {key: "pass" for key in AUDIT.QUESTIONS},
            "notes": "Listened to the fixture", "reviewedAt": "2026-09-24T11:00:00Z",
        }],
    }
    return directory, report


def test_no_report_stays_pending(tmp_path: Path) -> None:
    fixture(tmp_path)
    result = AUDIT.audit(tmp_path, None)
    assert result["staged_tracks"] == 1
    assert result["pending_track_ids"] == ["dh-test"]
    assert result["all_observations_pass"] is False
    assert result["release_approved"] is False


def test_full_observation_export_still_grants_no_release_approval(tmp_path: Path) -> None:
    _, report = fixture(tmp_path)
    result = AUDIT.audit(tmp_path, report)
    assert result["complete_observations"] == 1
    assert result["all_observations_pass"] is True
    assert result["rights_art_and_release_signoff"] == "not_assessed_here"
    assert result["release_approved"] is False
    report["releaseApproval"] = True
    with pytest.raises(ValueError, match="releaseApproval=false"):
        AUDIT.audit(tmp_path, report)


def test_changed_asset_invalidates_export_even_after_manifest_rehash(tmp_path: Path) -> None:
    directory, report = fixture(tmp_path)
    asset = directory / "audio.m4a"
    asset.write_bytes(b"changed")
    manifest_path = directory / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["files_sha256"]["audio.m4a"] = WORKSHEET.sha(asset)
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    with pytest.raises(ValueError, match="Stale or mismatched observation"):
        AUDIT.audit(tmp_path, report)


def test_revise_requires_notes_and_cannot_count_as_pass(tmp_path: Path) -> None:
    _, report = fixture(tmp_path)
    report["tracks"][0]["verdicts"]["audioQuality"] = "revise"
    report["tracks"][0]["notes"] = ""
    result = AUDIT.audit(tmp_path, report)
    assert result["pending_track_ids"] == ["dh-test"]
    report["tracks"][0]["notes"] = "Ending needs another listen"
    result = AUDIT.audit(tmp_path, report)
    assert result["complete_observations"] == 1
    assert result["needs_revision_track_ids"] == ["dh-test"]
    assert result["all_observations_pass"] is False


def test_missing_export_row_cannot_pass_and_incomplete_candidate_fails(tmp_path: Path) -> None:
    _, report = fixture(tmp_path)
    report["tracks"] = []
    result = AUDIT.audit(tmp_path, report)
    assert result["matched_records"] == 0
    assert result["pending_track_ids"] == ["dh-test"]
    assert result["all_observations_pass"] is False
    (tmp_path / "dh-incomplete").mkdir()
    with pytest.raises(ValueError, match="Incomplete staged candidate"):
        AUDIT.audit(tmp_path, report)


def test_malformed_verdict_is_rejected(tmp_path: Path) -> None:
    _, report = fixture(tmp_path)
    report["tracks"][0]["verdicts"]["audioQuality"] = ["pass"]
    with pytest.raises(ValueError, match="Invalid verdicts"):
        AUDIT.audit(tmp_path, report)
