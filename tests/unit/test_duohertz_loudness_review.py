"""Loudness cues stay hash-bound and cannot turn a listening list into approval."""

from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "duohertz_loudness_review", ROOT / "scripts/duohertz-loudness-review.py"
)
assert SPEC and SPEC.loader
REVIEW = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(REVIEW)


def test_ranked_levels_keep_exact_source_hashes_without_granting_approval() -> None:
    tracks = [
        {"track_id": "dh-001-loud", "title": "<Loud>", "subgenre": "Trance",
         "manifest_sha256": "a" * 64, "assets_sha256": {name: "b" * 64 for name in REVIEW.AUDIO_NAMES}},
        {"track_id": "dh-002-middle", "title": "Middle", "subgenre": "Trance",
         "manifest_sha256": "c" * 64, "assets_sha256": {name: "d" * 64 for name in REVIEW.AUDIO_NAMES}},
        {"track_id": "dh-003-soft", "title": "Soft", "subgenre": "Trance",
         "manifest_sha256": "e" * 64, "assets_sha256": {name: "f" * 64 for name in REVIEW.AUDIO_NAMES}},
    ]
    levels = {
        "dh-001-loud": (-14.0, -13.5, -13.0),
        "dh-002-middle": (-19.0, -19.5, -18.8),
        "dh-003-soft": (-23.0, -21.0, -22.5),
    }
    measurements = {
        (track_id, name): (values[index], -1.5)
        for track_id, values in levels.items()
        for index, name in enumerate(REVIEW.AUDIO_NAMES)
    }
    report = REVIEW.build_report(tracks, measurements)
    assert report["releaseApproval"] is False
    assert report["summary"]["game_median_lufs"] == -19.0
    assert [row["track_id"] for row in report["tracks"]] == [
        "dh-001-loud", "dh-003-soft", "dh-002-middle"
    ]
    assert report["tracks"][0]["manifest_sha256"] == "a" * 64
    assert report["tracks"][0]["audio"]["audio.m4a"]["sha256"] == "b" * 64
    page = REVIEW.render(report)
    assert "&lt;Loud&gt;" in page
    assert "<Loud>" not in page
    assert 'href="review-worksheet.html#dh-001-loud"' in page
    assert "not a loudness pass" in page
