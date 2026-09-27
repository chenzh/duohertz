"""The reviewer worksheet must bind observations to unchanged candidate assets."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "duohertz_review_worksheet", ROOT / "scripts/duohertz-review-worksheet.py"
)
assert SPEC and SPEC.loader
WORKSHEET = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(WORKSHEET)


def staged_candidate(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    directory = tmp_path / "dh-test"
    directory.mkdir()
    assets = {}
    for name in WORKSHEET.REQUIRED_FILES:
        path = directory / name
        path.write_bytes(f"fixture:{name}".encode())
        assets[name] = WORKSHEET.sha(path)
    (directory / "manifest.json").write_text(json.dumps({
        "track_id": "dh-test", "title": "Test track", "subgenre": "Trance",
        "bpm": 135, "duration_sec": 64,
        "rights_status": "internal_candidate_unreviewed", "files_sha256": assets,
    }), encoding="utf-8")
    monkeypatch.setattr(WORKSHEET, "CANDIDATES", tmp_path)
    return directory


def test_worksheet_is_deterministic_and_has_no_release_approval(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    staged_candidate(tmp_path, monkeypatch)
    page, count = WORKSHEET.build()
    assert count == 1
    assert page == WORKSHEET.build()[0]
    assert "releaseApproval: false" in page
    assert "No specific existing song recalled" in page
    assert 'src="dh-test/cover-art.png"' in page
    assert 'src="dh-test/audio.m4a"' in page
    assert 'src="dh-test/stream.m4a"' in page
    assert 'src="dh-test/preview_48s.m4a"' in page
    assert 'src="dh-test/cover.svg"' not in page


def test_changed_asset_rejects_stale_review_package(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    directory = staged_candidate(tmp_path, monkeypatch)
    (directory / "stream.m4a").write_bytes(b"changed after manifest")
    with pytest.raises(ValueError, match="Missing or changed asset: dh-test/stream.m4a"):
        WORKSHEET.build()


def test_incomplete_candidate_cannot_disappear_from_review_list(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    staged_candidate(tmp_path, monkeypatch)
    (tmp_path / "dh-incomplete").mkdir()
    with pytest.raises(ValueError, match="Incomplete staged candidate"):
        WORKSHEET.build()
