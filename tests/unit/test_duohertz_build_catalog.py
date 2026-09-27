"""The new catalog staging path refuses incomplete content and stale signoff."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import struct
from types import SimpleNamespace
import zlib

import pytest

ROOT = Path(__file__).resolve().parents[2]


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


BUILDER = load("duohertz_build_catalog_test", "duohertz-build-catalog.py")
GATE = load("duohertz_candidate_gate_build_test", "duohertz-candidate-gate.py")


def fixture(tmp_path: Path) -> tuple[Path, dict]:
    root = tmp_path / "candidates"
    directory = root / "dh-test"
    directory.mkdir(parents=True)
    for name in GATE.FILES - {"easy.json", "standard.json", "hard.json"}:
        (directory / name).write_bytes(b"same audio" if name in {"audio.m4a", "stream.m4a"} else name.encode())
    def png_chunk(kind: bytes, payload: bytes) -> bytes:
        return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", zlib.crc32(kind + payload))
    (directory / "cover-art.png").write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 6, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(b"\x00\xff\x30\x40\xff"))
        + png_chunk(b"IEND", b"")
    )
    for tier in GATE.TIERS:
        notes = [{"id": "left", "type": "tap", "t": 1, "key": 0}]
        if tier != "easy":
            notes.append({"id": "right", "type": "tap", "t": 2, "key": 1})
        (directory / f"{tier}.json").write_text(json.dumps({
            "format": 2, "theme": "duohertz", "track_id": "dh-test", "tier": tier,
            "input_count": 1 if tier == "easy" else 2, "bpm": 120,
            "audio_offset_ms": 0, "total_notes": len(notes), "notes": notes,
        }), encoding="utf-8")
    data = {
        "track_id": "dh-test", "title": "Test Current", "artist": "Test Studio",
        "theme": "duohertz", "subgenre": "Trance", "bpm": 120,
        "duration_sec": 4, "rights_status": "internal_candidate_unreviewed",
        "files_sha256": {name: GATE.sha(directory / name) for name in GATE.FILES},
    }
    (directory / "manifest.json").write_text(json.dumps(data), encoding="utf-8")
    return root, {"track_id": "dh-test", "title": "Test Current", "subgenre": "Trance"}


def signoff_fixture(tmp_path: Path, root: Path, track: dict) -> tuple[Path, Path]:
    review_path = tmp_path / "observations.json"
    review_path.write_text('{"exportedAt":"2026-09-24T11:30:00Z"}', encoding="utf-8")
    evidence_path = tmp_path / "evidence.txt"
    evidence_path.write_text("Fixture human review document", encoding="utf-8")
    record = {
        "status": "pass", "reviewedBy": "Human Fixture",
        "reviewedAt": "2026-09-24T11:00:00Z",
        "evidence": "evidence.txt", "sha256": BUILDER.sha(evidence_path),
    }
    signoff_path = tmp_path / "signoff.json"
    signoff_path.write_text(json.dumps({
        "schema": 1, "scope": "duohertz_catalog_signoff", "catalogApproval": True,
        "approvedBy": "Release Fixture", "approvedAt": "2026-09-24T12:00:00Z",
        "observations_sha256": BUILDER.sha(review_path),
        "tracks": [{
            "track_id": track["track_id"],
            "manifest_sha256": BUILDER.sha(root / track["track_id"] / "manifest.json"),
            **{kind: record for kind in BUILDER.REVIEW_GATES},
        }],
    }), encoding="utf-8")
    return review_path, signoff_path


def test_currently_incomplete_catalog_cannot_create_output(tmp_path: Path) -> None:
    root, _ = fixture(tmp_path)
    destination = tmp_path / "staged"
    result = BUILDER.build(root, None, None, destination)
    assert result["catalog_stage_ready"] is False
    assert any("1/105 tracks" in blocker for blocker in result["blockers"])
    assert any("stream master is identical" in blocker for blocker in result["blockers"])
    assert "Missing human observation export" in result["blockers"]
    assert "Missing separate catalog signoff" in result["blockers"]
    assert not destination.exists()


def test_catalog_signoff_binds_every_track_and_evidence_hash(tmp_path: Path) -> None:
    root, track = fixture(tmp_path)
    review_path, signoff_path = signoff_fixture(tmp_path, root, track)
    assert BUILDER.verify_signoff(root, [track], review_path, signoff_path)["catalogApproval"] is True
    (tmp_path / "evidence.txt").write_text("changed", encoding="utf-8")
    with pytest.raises(ValueError, match="missing or changed evidence"):
        BUILDER.verify_signoff(root, [track], review_path, signoff_path)


def test_catalog_signoff_rejects_a_linked_evidence_file(tmp_path: Path) -> None:
    root, track = fixture(tmp_path)
    review_path, signoff_path = signoff_fixture(tmp_path, root, track)
    evidence = tmp_path / "evidence.txt"
    actual = tmp_path / "reviewed-evidence.txt"
    evidence.rename(actual)
    evidence.symlink_to(actual)
    with pytest.raises(ValueError, match="missing or changed evidence"):
        BUILDER.verify_signoff(root, [track], review_path, signoff_path)


def test_catalog_signoff_needs_explicit_approval_and_complete_track_list(tmp_path: Path) -> None:
    root, track = fixture(tmp_path)
    review_path, signoff_path = signoff_fixture(tmp_path, root, track)
    data = json.loads(signoff_path.read_text(encoding="utf-8"))
    data["catalogApproval"] = False
    signoff_path.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(ValueError, match="Missing explicit"):
        BUILDER.verify_signoff(root, [track], review_path, signoff_path)
    data["catalogApproval"] = True
    data["tracks"] = []
    signoff_path.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(ValueError, match="cover every staged track"):
        BUILDER.verify_signoff(root, [track], review_path, signoff_path)


def test_catalog_approval_must_follow_observation_export(tmp_path: Path) -> None:
    root, track = fixture(tmp_path)
    review_path, signoff_path = signoff_fixture(tmp_path, root, track)
    data = json.loads(signoff_path.read_text(encoding="utf-8"))
    data["approvedAt"] = "2026-09-24T11:00:00Z"
    signoff_path.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(ValueError, match="predates the observation export"):
        BUILDER.verify_signoff(root, [track], review_path, signoff_path)


def test_distinct_stream_master_still_needs_full_length(tmp_path: Path, monkeypatch) -> None:
    root, track = fixture(tmp_path)
    directory = root / track["track_id"]
    stream = directory / "stream.m4a"
    stream.write_bytes(b"different audio")
    data = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
    data["files_sha256"]["stream.m4a"] = GATE.sha(stream)
    (directory / "manifest.json").write_text(json.dumps(data), encoding="utf-8")
    monkeypatch.setattr(BUILDER, "module", lambda *_: SimpleNamespace(duration=lambda _: 7.1))
    blockers, _ = BUILDER.stream_master_blockers(root, [track])
    assert "shorter than game audio × 1.8" in blockers[0]
    monkeypatch.setattr(BUILDER, "module", lambda *_: SimpleNamespace(duration=lambda _: 7.2))
    blockers, lengths = BUILDER.stream_master_blockers(root, [track])
    assert blockers == []
    assert lengths["dh-test"] == 7.2


def test_catalog_audio_peak_gate_covers_stream_as_well_as_game(tmp_path: Path, monkeypatch) -> None:
    root, track = fixture(tmp_path)
    checked: list[str] = []

    def measure(path: Path):
        checked.append(path.name)
        return path, -20.0, 0.2 if path.name == "stream.m4a" else -2.0

    monkeypatch.setattr(BUILDER, "module", lambda *_: SimpleNamespace(
        AUDIO_FILES=("audio.m4a", "preview_48s.m4a", "stream.m4a"), measure=measure,
    ))
    with pytest.raises(ValueError, match="stream.m4a.*audio peak gate"):
        BUILDER.assert_audio_peak(root, [track])
    assert set(checked) == {"audio.m4a", "preview_48s.m4a", "stream.m4a"}


def test_staging_is_isolated_and_never_overwrites_existing_output(tmp_path: Path) -> None:
    root, track = fixture(tmp_path)
    review_path, signoff_path = signoff_fixture(tmp_path, root, track)
    data = BUILDER.catalog([track], root, {"dh-test": 8.0}, review_path, signoff_path)
    assert data["brand"] == "duohertz"
    assert data["tracks"][0]["chart_format"] == 2
    assert data["tracks"][0]["audio"] == "/catalog/dh-test/audio.m4a"
    assert data["tracks"][0]["cover"] == "/catalog/dh-test/cover-art.png"
    assert data["tracks"][0]["cover_thumb"] == "/catalog/dh-test/cover-thumb.webp"
    destination = tmp_path / "staged"
    BUILDER.stage(destination, root, data)
    assert (destination / "catalog.json").is_file()
    assert (destination / "catalog/dh-test/stream.m4a").is_file()
    assert (destination / data["tracks"][0]["cover"].lstrip("/")).is_file()
    assert (destination / data["tracks"][0]["cover_thumb"].lstrip("/")).is_file()
    staged_catalog = json.loads((destination / "catalog.json").read_text(encoding="utf-8"))
    assert staged_catalog["tracks"][0]["cover_thumb_sha256"] == BUILDER.sha(
        destination / "catalog/dh-test/cover-thumb.webp"
    )
    with pytest.raises(ValueError, match="new isolated directory"):
        BUILDER.stage(destination, root, data)
    with pytest.raises(ValueError, match="new isolated directory"):
        BUILDER.stage(ROOT / "apps/beatscape/public/duohertz", root, data)


def test_staging_refuses_a_source_changed_after_catalog_metadata(tmp_path: Path) -> None:
    root, track = fixture(tmp_path)
    review_path, signoff_path = signoff_fixture(tmp_path, root, track)
    data = BUILDER.catalog([track], root, {"dh-test": 8.0}, review_path, signoff_path)
    (root / "dh-test/cover-art.png").write_bytes(b"changed after manifest signing")
    output = tmp_path / "staged"
    with pytest.raises(ValueError, match="cover-art.png: asset changed while staging"):
        BUILDER.stage(output, root, data)
    assert not output.exists()
