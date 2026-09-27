"""The new candidate gate must reject legacy charts before any publication path can use them."""

from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "scripts/duohertz-candidate-gate.py"
SPEC = importlib.util.spec_from_file_location("duohertz_candidate_gate", MODULE_PATH)
assert SPEC and SPEC.loader
GATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)


def chart() -> dict:
    return {
        "format": 2, "theme": "duohertz", "track_id": "dh-test", "tier": "easy",
        "input_count": 1, "bpm": 120, "audio_offset_ms": 0, "total_notes": 2,
        "notes": [
            {"id": "a", "type": "tap", "t": 1, "key": 0},
            {"id": "b", "type": "hold", "t": 2, "end": 2.5, "key": 0},
        ],
    }


def validate(value: dict) -> dict:
    return GATE.validate_chart(value, tier="easy", track_id="dh-test", bpm=120, track_duration=4)


def test_accepts_new_one_key_chart() -> None:
    assert validate(chart())["total_notes"] == 2


def test_rejects_two_key_label_on_one_key_music() -> None:
    candidate = chart()
    candidate["tier"] = "standard"
    candidate["input_count"] = 2
    with pytest.raises(ValueError, match="every declared key"):
        GATE.validate_chart(candidate, tier="standard", track_id="dh-test", bpm=120, track_duration=4)


@pytest.mark.parametrize("field,value", [
    ("format", 1), ("theme", "beatscape"), ("input_count", 2), ("input_count", True),
    ("total_notes", 3),
])
def test_rejects_wrong_format_or_count(field: str, value: object) -> None:
    candidate = chart()
    candidate[field] = value
    with pytest.raises(ValueError):
        validate(candidate)


def test_rejects_impossible_hold_overlap_and_boolean_time() -> None:
    overlap = chart()
    overlap["notes"].append({"id": "c", "type": "tap", "t": 2.25, "key": 0})
    overlap["total_notes"] = 3
    with pytest.raises(ValueError, match="same-key conflict"):
        validate(overlap)
    invalid = copy.deepcopy(chart())
    invalid["notes"][0]["t"] = True
    with pytest.raises(ValueError, match="invalid or unsorted"):
        validate(invalid)


def test_rejects_duplicate_timestamps_and_unchecked_audio_offset() -> None:
    same_time = chart()
    same_time["notes"][1]["t"] = 1
    same_time["notes"][1]["end"] = 1.5
    with pytest.raises(ValueError, match="invalid or unsorted"):
        validate(same_time)
    offset = chart()
    offset["audio_offset_ms"] = 70
    with pytest.raises(ValueError, match="nonzero audio offset"):
        validate(offset)


def test_stream_master_can_be_longer_but_not_shorter_than_game_audio(tmp_path: Path, monkeypatch) -> None:
    values = {"audio.m4a": 60.0, "stream.m4a": 120.0, "preview_48s.m4a": 48.0}
    monkeypatch.setattr(GATE, "duration", lambda path: values[path.name])
    GATE.validate_durations(tmp_path, 60.0, 120.0)
    with pytest.raises(ValueError, match="does not match manifest"):
        GATE.validate_durations(tmp_path, 60.0, 119.0)
    values["stream.m4a"] = 50.0
    with pytest.raises(ValueError, match="shorter than game audio"):
        GATE.validate_durations(tmp_path, 60.0)


@pytest.mark.parametrize("tier,passing,too_sparse", [
    ("easy", 32, 31), ("standard", 58, 57), ("hard", 116, 115),
])
def test_rejects_grossly_sparse_64_second_drafts(tier: str, passing: int, too_sparse: int) -> None:
    GATE.validate_density({"total_notes": passing}, tier=tier, track_duration=64.0)
    with pytest.raises(ValueError, match="technical density floor"):
        GATE.validate_density({"total_notes": too_sparse}, tier=tier, track_duration=64.0)


def test_image_dimensions_are_checked_from_png_header(tmp_path: Path) -> None:
    source = ROOT / "apps/beatscape/candidates/duohertz/dh-001-first-frequency/og.png"
    assert GATE.png_size(source) == (1200, 630)
    invalid = tmp_path / "og.png"
    invalid.write_bytes(b"not a PNG")
    with pytest.raises(ValueError, match="Invalid PNG"):
        GATE.png_size(invalid)


def test_local_svg_provenance_requires_unchanged_source() -> None:
    name = "scripts/duohertz-art-sources/dh-081-braided-pulse-cover.svg"
    provenance = {
        "tool": "local-authored SVG", "cover_prompt": "Original braided sound ribbons",
        "og_prompt": "Wide braided sound ribbons", "render_method": "local sips",
        "cover_svg_source": name, "cover_svg_source_sha256": GATE.sha(ROOT / name),
        "og_svg_source": name, "og_svg_source_sha256": GATE.sha(ROOT / name),
    }
    GATE.validate_art_provenance(provenance)
    provenance["cover_svg_source_sha256"] = "0" * 64
    with pytest.raises(ValueError, match="changed local SVG source"):
        GATE.validate_art_provenance(provenance)


def test_batch_checks_remaining_candidates_and_fails_if_one_does(tmp_path: Path, monkeypatch, capsys) -> None:
    for name in ("dh-first", "dh-second", "dh-third"):
        (tmp_path / name).mkdir()
    examined: list[str] = []

    def validate_candidate(path: Path) -> None:
        examined.append(path.name)
        if path.name == "dh-second":
            raise ValueError("invalid chart")

    monkeypatch.setattr(GATE, "validate", validate_candidate)
    assert GATE.validate_staged(tmp_path) == 1
    assert examined == ["dh-first", "dh-second", "dh-third"]
    output = capsys.readouterr().out
    assert "FAIL dh-second: invalid chart" in output
    assert "Staged technical candidates: 2/3 PASS" in output


def test_batch_rejects_empty_catalog(tmp_path: Path, capsys) -> None:
    assert GATE.validate_staged(tmp_path) == 1
    assert "No staged duohertz candidates" in capsys.readouterr().out


def test_batch_reports_malformed_manifests_without_aborting(tmp_path: Path, capsys) -> None:
    first = tmp_path / "dh-first"
    second = tmp_path / "dh-second"
    first.mkdir()
    second.mkdir()
    (first / "manifest.json").write_text("[]", encoding="utf-8")
    assert GATE.validate_staged(tmp_path) == 1
    output = capsys.readouterr().out
    assert "FAIL dh-first: Candidate manifest must be an object" in output
    assert "FAIL dh-second:" in output
    assert "Staged technical candidates: 0/2 PASS" in output
