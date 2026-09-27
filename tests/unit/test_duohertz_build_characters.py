"""Character staging binds reviewed copy, art bytes and human evidence without site approval."""

from __future__ import annotations

import binascii
import importlib.util
import json
from pathlib import Path
import struct
import zlib

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "duohertz_build_characters_test", ROOT / "scripts/duohertz-build-characters.py"
)
assert SPEC and SPEC.loader
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


def png_chunk(name: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + name + data + struct.pack(">I", binascii.crc32(name + data))


def transparent_png() -> bytes:
    width, height = 512, 768
    empty = b"\x00" + b"\x00\x00\x00\x00" * width
    body = b"\x00" + b"\x00\x00\x00\x00" * 128 + b"\x67\xee\xe0\xff" * 256 \
        + b"\x00\x00\x00\x00" * 128
    compressed = zlib.compress(empty * 192 + body * 384 + empty * 192, level=9)
    return b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)) \
        + png_chunk(b"IDAT", compressed) + png_chunk(b"IEND", b"")


def fixture(tmp_path: Path) -> tuple[Path, Path]:
    source = tmp_path / "reviewed"
    # Split words must stay within the PRD's 120–180-word character story range.
    story = " ".join(["A small beat travels through the soundfield and invites another player to answer with a bright wave."] * 8)
    assert 120 <= len(story.split()) <= 180
    characters = []
    for index, role in enumerate(("Attacker", "Support", "Buffer"), start=1):
        character_id = f"dh-char-{index}"
        art_dir = source / "characters" / character_id
        art_dir.mkdir(parents=True)
        for name in ("front.png", "side.png"):
            (art_dir / name).write_bytes(transparent_png())
        characters.append({
            "id": character_id, "name": f"Fixture {index}", "title": f"The {role} Wave", "role": role,
            "region": "The Soundfield", "height": "165 cm", "identity": "Invites everyone into the music.",
            "traits": "Curious · patient · kind", "quote": "Play your own beat.", "story": story,
            "art": f"/characters/{character_id}/front.png",
            "side_art": f"/characters/{character_id}/side.png",
            "alt": f"Fixture {index} front", "side_alt": f"Fixture {index} side",
            "art_sha256": BUILDER.sha(art_dir / "front.png"),
            "side_art_sha256": BUILDER.sha(art_dir / "side.png"),
        })
    roster = source / "roster.json"
    roster.write_text(json.dumps({"schema": 1, "brand": "duohertz", "characters": characters}), encoding="utf-8")

    evidence = tmp_path / "review.txt"
    evidence.write_text("Human review fixture", encoding="utf-8")
    record = {"status": "pass", "reviewedBy": "Human Fixture", "reviewedAt": "2026-09-25T10:00:00Z",
              "evidence": "review.txt", "sha256": BUILDER.sha(evidence)}
    signoff = tmp_path / "signoff.json"
    signoff.write_text(json.dumps({
        "schema": 1, "scope": "duohertz_character_signoff", "charactersApproval": True,
        "approvedBy": "Release Fixture", "approvedAt": "2026-09-25T11:00:00Z",
        "roster_sha256": BUILDER.sha(roster),
        "characters": [{"id": item["id"], **{kind: record for kind in BUILDER.REVIEW_GATES}}
                       for item in characters],
    }), encoding="utf-8")
    return roster, signoff


def test_missing_review_never_creates_character_artifact(tmp_path: Path) -> None:
    destination = tmp_path / "output"
    result = BUILDER.build(None, None, destination)
    assert result["character_stage_ready"] is False
    assert len(result["blockers"]) == 2
    assert not destination.exists()


def test_reviewed_roster_stages_isolated_unapproved_artifact(tmp_path: Path) -> None:
    roster, signoff = fixture(tmp_path)
    destination = tmp_path / "output"
    result = BUILDER.build(roster, signoff, destination)
    assert result["character_stage_ready"] is True
    assert result["site_and_deployment_approval"] is False
    catalog = json.loads((destination / "characters.json").read_text(encoding="utf-8"))
    assert catalog["source_character_signoff_sha256"] == BUILDER.sha(signoff)
    assert catalog["site_and_deployment_approval"] is False
    assert [character["role"] for character in catalog["characters"]] == ["Attacker", "Support", "Buffer"]
    for character in catalog["characters"]:
        for field in ("art", "side_art"):
            asset = destination / character[field].lstrip("/")
            assert BUILDER.sha(asset) == character[f"{field}_sha256"]
    with pytest.raises(ValueError, match="new isolated directory"):
        BUILDER.stage(destination, roster.parent, catalog)
    with pytest.raises(ValueError, match="new isolated directory"):
        BUILDER.stage(ROOT / "apps/beatscape/public/duohertz-v2", roster.parent, catalog)


def test_stale_art_or_copy_blocks_staging(tmp_path: Path) -> None:
    roster, signoff = fixture(tmp_path)
    art = roster.parent / "characters/dh-char-1/front.png"
    art.write_bytes(art.read_bytes() + b"changed")
    with pytest.raises(ValueError, match="missing or changed art"):
        BUILDER.build(roster, signoff)
    art.write_bytes(art.read_bytes()[:-7])
    data = json.loads(roster.read_text(encoding="utf-8"))
    data["characters"][0]["name"] = "Changed after review"
    roster.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(ValueError, match="stale duohertz character signoff"):
        BUILDER.build(roster, signoff)


def test_human_evidence_and_all_three_signoffs_are_required(tmp_path: Path) -> None:
    roster, signoff = fixture(tmp_path)
    (tmp_path / "review.txt").write_text("Changed", encoding="utf-8")
    with pytest.raises(ValueError, match="missing or changed evidence"):
        BUILDER.build(roster, signoff)
    (tmp_path / "review.txt").write_text("Human review fixture", encoding="utf-8")
    data = json.loads(signoff.read_text(encoding="utf-8"))
    data["characters"].pop()
    signoff.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(ValueError, match="cover all three"):
        BUILDER.build(roster, signoff)


def test_roster_rejects_duplicate_roles_unsafe_paths_and_short_stories(tmp_path: Path) -> None:
    roster, _ = fixture(tmp_path)
    original = json.loads(roster.read_text(encoding="utf-8"))
    for field, value, message in (
        ("role", "Attacker", "identity or copy"),
        ("art", "https://example.com/old.png", "invalid art path"),
        ("story", "Too short.", "120–180 words"),
    ):
        data = json.loads(json.dumps(original))
        data["characters"][1][field] = value
        roster.write_text(json.dumps(data), encoding="utf-8")
        with pytest.raises(ValueError, match=message):
            BUILDER.roster(roster)
