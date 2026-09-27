"""Staged-content preflight is local, read-only, and never grants site approval."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import shutil
import struct
import zlib

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "duohertz_check_staged_content_test", ROOT / "scripts/duohertz-check-staged-content.py"
)
assert SPEC and SPEC.loader
CHECK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECK)
HASH = "a" * 64


def write_json(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value), encoding="utf-8")


def png_chunk(name: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data))


def transparent_character_png() -> bytes:
    width, height = 512, 768
    blank = b"\x00" + b"\x00\x00\x00\x00" * width
    center = b"\x00" + b"\x00\x00\x00\x00" * 128 + b"\x67\xee\xe0\xff" * 256 \
        + b"\x00\x00\x00\x00" * 128
    compressed = zlib.compress(blank * 192 + center * 384 + blank * 192, level=9)
    return b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)) \
        + png_chunk(b"IDAT", compressed) + png_chunk(b"IEND", b"")


def stages(tmp_path: Path) -> tuple[Path, Path]:
    catalog_stage = tmp_path / "music"
    character_stage = tmp_path / "cast"
    genre_list = [genre for genre in CHECK.GENRES for _ in range(21)]
    tracks = []
    for number, genre in enumerate(genre_list, start=1):
        track_id = f"dh-{number:03d}-fixture"
        directory = catalog_stage / "catalog" / track_id
        directory.mkdir(parents=True)
        for filename in CHECK.TRACK_FILES:
            if filename.endswith(".json"):
                tier = filename.removesuffix(".json")
                write_json(directory / filename, {
                    "format": 2, "theme": "duohertz", "track_id": track_id,
                    "tier": tier, "bpm": 120, "notes": [{"id": "one", "t": 1, "type": "tap", "key": 0}],
                })
            else:
                (directory / filename).write_bytes(f"{track_id}/{filename}".encode())
        (directory / "cover-thumb.webp").write_bytes(f"{track_id}/thumbnail".encode())
        manifest = {
            "track_id": track_id, "title": f"Fixture {number}", "artist": "Fixture Artist",
            "subgenre": genre, "bpm": 120, "duration_sec": 64,
            "rights_status": "internal_candidate_unreviewed",
            "files_sha256": {name: CHECK.digest(directory / name) for name in CHECK.TRACK_FILES},
        }
        write_json(directory / "manifest.json", manifest)
        base = f"/catalog/{track_id}/"
        tracks.append({
            "track_id": track_id, "title": manifest["title"], "artist": manifest["artist"],
            "genre": genre, "bpm": 120, "duration_sec": 64, "stream_duration_sec": 128,
            "theme": "duohertz", "chart_format": 2, "rights": "signed_catalog_candidate",
            "audio": base + "audio.m4a", "stream_audio": base + "stream.m4a",
            "preview": base + "preview_48s.m4a", "cover": base + "cover-art.png",
            "cover_thumb": base + "cover-thumb.webp", "og": base + "og.png",
            "charts": {tier: base + tier + ".json" for tier in CHECK.TIERS},
            "manifest_sha256": CHECK.digest(directory / "manifest.json"),
            "cover_thumb_sha256": CHECK.digest(directory / "cover-thumb.webp"),
        })
    write_json(catalog_stage / "catalog.json", {
        "version": 2, "brand": "duohertz", "tracks": tracks,
        "source_observations_sha256": HASH, "source_catalog_signoff_sha256": HASH,
        "site_and_deployment_approval": False,
    })

    characters = []
    story = " ".join(["Every pulse invites another player to answer through a bright wave of sound."] * 10)
    assert 120 <= len(story.split()) <= 180
    for number, role in enumerate(("Attacker", "Support", "Buffer"), start=1):
        character_id = f"dh-char-{number}"
        directory = character_stage / "characters" / character_id
        directory.mkdir(parents=True)
        (directory / "front.png").write_bytes(transparent_character_png())
        (directory / "side.png").write_bytes(transparent_character_png())
        characters.append({
            "id": character_id, "name": f"Fixture {number}", "role": role,
            "title": "The Wave", "region": "Soundfield", "height": "165 cm",
            "identity": "Finds a beat", "traits": "Kind and curious", "quote": "Play along",
            "story": story, "alt": "Front portrait", "side_alt": "Side portrait",
            "art": f"/characters/{character_id}/front.png",
            "side_art": f"/characters/{character_id}/side.png",
            "art_sha256": CHECK.digest(directory / "front.png"),
            "side_art_sha256": CHECK.digest(directory / "side.png"),
        })
    write_json(character_stage / "characters.json", {
        "version": 1, "brand": "duohertz", "characters": characters,
        "source_character_signoff_sha256": HASH,
        "site_and_deployment_approval": False,
    })
    return catalog_stage, character_stage


def sources(tmp_path: Path, catalog_stage: Path, character_stage: Path) -> dict[str, Path]:
    worksheet = CHECK.module("duohertz_worksheet_test", "duohertz-review-worksheet.py")
    candidates = worksheet.candidates(catalog_stage / "catalog")
    observations = tmp_path / "observations.json"
    write_json(observations, {
        "schema": 1, "scope": "duohertz_candidate_observations", "releaseApproval": False,
        "reviewer": "Fixture reviewer", "exportedAt": "2026-09-25T11:00:00Z",
        "tracks": [{**track, "verdicts": {key: "pass" for key in (
            "audioQuality", "distinctness", "allAges", "subgenreFit", "chartFeel", "visual",
        )}, "notes": "", "reviewedAt": "2026-09-25T10:00:00Z"} for track in candidates],
    })
    evidence = tmp_path / "evidence.txt"
    evidence.write_text("Synthetic test fixture only", encoding="utf-8")
    record = {"status": "pass", "reviewedBy": "Fixture reviewer",
              "reviewedAt": "2026-09-25T10:00:00Z", "evidence": "evidence.txt",
              "sha256": CHECK.digest(evidence)}
    catalog_signoff = tmp_path / "catalog-signoff.json"
    write_json(catalog_signoff, {
        "schema": 1, "scope": "duohertz_catalog_signoff", "catalogApproval": True,
        "approvedBy": "Fixture approver", "approvedAt": "2026-09-25T12:00:00Z",
        "observations_sha256": CHECK.digest(observations),
        "tracks": [{"track_id": track["track_id"], "manifest_sha256": track["manifest_sha256"],
                    **{kind: record for kind in ("earcheck", "content", "rights", "art")}}
                   for track in candidates],
    })
    reviewed = tmp_path / "reviewed"
    reviewed.mkdir()
    character_data = json.loads((character_stage / "characters.json").read_text(encoding="utf-8"))
    for character in character_data["characters"]:
        character_id = character["id"]
        target = reviewed / "characters" / character_id
        target.mkdir(parents=True)
        for filename in ("front.png", "side.png"):
            shutil.copyfile(character_stage / "characters" / character_id / filename, target / filename)
    roster = reviewed / "roster.json"
    write_json(roster, {"schema": 1, "brand": "duohertz", "characters": character_data["characters"]})
    character_signoff = tmp_path / "character-signoff.json"
    write_json(character_signoff, {
        "schema": 1, "scope": "duohertz_character_signoff", "charactersApproval": True,
        "approvedBy": "Fixture approver", "approvedAt": "2026-09-25T12:00:00Z",
        "roster_sha256": CHECK.digest(roster),
        "characters": [{"id": character["id"],
                        **{kind: record for kind in ("name", "rights", "art", "copy")}}
                       for character in character_data["characters"]],
    })
    catalog_data = json.loads((catalog_stage / "catalog.json").read_text(encoding="utf-8"))
    catalog_data["source_observations_sha256"] = CHECK.digest(observations)
    catalog_data["source_catalog_signoff_sha256"] = CHECK.digest(catalog_signoff)
    write_json(catalog_stage / "catalog.json", catalog_data)
    character_data["source_character_signoff_sha256"] = CHECK.digest(character_signoff)
    write_json(character_stage / "characters.json", character_data)
    return {"observations": observations, "catalog_signoff": catalog_signoff,
            "roster": roster, "character_signoff": character_signoff}


def test_missing_stages_report_both_blockers_without_writing(tmp_path: Path) -> None:
    report = CHECK.audit(None, None, integrity_only=True)
    assert report["staged_content_integrity"] is False
    assert report["blockers"] == ["Missing catalog stage", "Missing character stage"]
    assert report["site_and_deployment_approval"] is False
    assert list(tmp_path.iterdir()) == []


def test_complete_synthetic_stages_have_intact_bytes_but_no_site_approval(tmp_path: Path) -> None:
    catalog_stage, character_stage = stages(tmp_path)
    report = CHECK.audit(catalog_stage, character_stage, integrity_only=True)
    assert report == {
        "staged_content_integrity": True, "source_evidence_verified": False,
        "tracks": 105, "characters": 3,
        "blockers": [], "site_and_deployment_approval": False,
    }


def test_original_observations_and_both_signoffs_revalidate_a_stage(tmp_path: Path) -> None:
    catalog_stage, character_stage = stages(tmp_path)
    source_paths = sources(tmp_path, catalog_stage, character_stage)
    report = CHECK.audit(catalog_stage, character_stage, **source_paths)
    assert report["staged_content_integrity"] is True
    assert report["source_evidence_verified"] is True
    assert report["blockers"] == []
    assert report["site_and_deployment_approval"] is False


def test_partial_source_inputs_fail_instead_of_silently_skipping_signoff(tmp_path: Path) -> None:
    catalog_stage, character_stage = stages(tmp_path)
    observations = tmp_path / "observations.json"
    observations.write_text("{}", encoding="utf-8")
    report = CHECK.audit(catalog_stage, character_stage, observations=observations)
    assert report["staged_content_integrity"] is True
    assert report["source_evidence_verified"] is False
    assert len(report["blockers"]) == 3


def test_default_preflight_requires_sources_even_when_both_stages_are_intact(tmp_path: Path) -> None:
    catalog_stage, character_stage = stages(tmp_path)
    report = CHECK.audit(catalog_stage, character_stage)
    assert report["staged_content_integrity"] is True
    assert report["source_evidence_verified"] is False
    assert len(report["blockers"]) == 4


def test_joint_manifest_and_catalog_rewrite_still_fails_source_binding(tmp_path: Path) -> None:
    catalog_stage, character_stage = stages(tmp_path)
    source_paths = sources(tmp_path, catalog_stage, character_stage)
    directory = catalog_stage / "catalog/dh-001-fixture"
    (directory / "audio.m4a").write_bytes(b"rewritten asset")
    manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
    manifest["files_sha256"]["audio.m4a"] = CHECK.digest(directory / "audio.m4a")
    write_json(directory / "manifest.json", manifest)
    data = json.loads((catalog_stage / "catalog.json").read_text(encoding="utf-8"))
    data["tracks"][0]["manifest_sha256"] = CHECK.digest(directory / "manifest.json")
    write_json(catalog_stage / "catalog.json", data)
    report = CHECK.audit(catalog_stage, character_stage, **source_paths)
    assert report["staged_content_integrity"] is True
    assert report["source_evidence_verified"] is False
    assert "source evidence" in " ".join(report["blockers"])


def test_changed_human_evidence_fails_source_recheck(tmp_path: Path) -> None:
    catalog_stage, character_stage = stages(tmp_path)
    source_paths = sources(tmp_path, catalog_stage, character_stage)
    (tmp_path / "evidence.txt").write_text("changed", encoding="utf-8")
    report = CHECK.audit(catalog_stage, character_stage, **source_paths)
    assert report["staged_content_integrity"] is True
    assert report["source_evidence_verified"] is False
    assert "missing or changed evidence" in " ".join(report["blockers"])


def test_rewritten_character_copy_still_fails_reviewed_roster_binding(tmp_path: Path) -> None:
    catalog_stage, character_stage = stages(tmp_path)
    source_paths = sources(tmp_path, catalog_stage, character_stage)
    data = json.loads((character_stage / "characters.json").read_text(encoding="utf-8"))
    data["characters"][0]["name"] = "Changed after review"
    write_json(character_stage / "characters.json", data)
    report = CHECK.audit(catalog_stage, character_stage, **source_paths)
    assert report["staged_content_integrity"] is True
    assert report["source_evidence_verified"] is False
    assert "differ from the reviewed roster" in " ".join(report["blockers"])


@pytest.mark.parametrize("change,expected", [
    ("audio", "changed bytes"),
    ("thumbnail", "changed bytes"),
    ("catalog_path", "invalid audio path"),
    ("character_art", "changed bytes"),
    ("approval", "expected an unapproved"),
])
def test_changed_stages_fail_closed(tmp_path: Path, change: str, expected: str) -> None:
    catalog_stage, character_stage = stages(tmp_path)
    first_track = catalog_stage / "catalog/dh-001-fixture"
    if change == "audio":
        (first_track / "audio.m4a").write_bytes(b"changed")
    elif change == "thumbnail":
        (first_track / "cover-thumb.webp").write_bytes(b"changed")
    elif change == "catalog_path":
        data = json.loads((catalog_stage / "catalog.json").read_text(encoding="utf-8"))
        data["tracks"][0]["audio"] = "https://example.com/audio.m4a"
        write_json(catalog_stage / "catalog.json", data)
    elif change == "character_art":
        (character_stage / "characters/dh-char-1/front.png").write_bytes(b"changed")
    else:
        data = json.loads((catalog_stage / "catalog.json").read_text(encoding="utf-8"))
        data["site_and_deployment_approval"] = True
        write_json(catalog_stage / "catalog.json", data)
    report = CHECK.audit(catalog_stage, character_stage, integrity_only=True)
    assert report["staged_content_integrity"] is False
    assert expected in " ".join(report["blockers"])
    assert report["site_and_deployment_approval"] is False


def test_linked_track_directory_is_rejected(tmp_path: Path) -> None:
    catalog_stage, character_stage = stages(tmp_path)
    actual = catalog_stage / "catalog/dh-001-fixture"
    other = tmp_path / "moved-track"
    actual.rename(other)
    actual.symlink_to(other, target_is_directory=True)
    report = CHECK.audit(catalog_stage, character_stage, integrity_only=True)
    assert report["staged_content_integrity"] is False
    assert "linked directory" in report["blockers"][0]
