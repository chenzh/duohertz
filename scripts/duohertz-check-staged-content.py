#!/usr/bin/env python3
"""Locally recheck the two isolated duohertz content stages before site review.

This verifies staged bytes against their staged manifests. With all four
source inputs, it also reruns the human-record and signoff format/hash gates.
It cannot verify reviewer identities or grant site/deployment approval.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HASH = re.compile(r"[a-f0-9]{64}\Z")
TRACK_ID = re.compile(r"dh-\d{3}-[a-z0-9-]+\Z")
CHARACTER_ID = re.compile(r"dh-char-[a-z0-9]+(?:-[a-z0-9]+)*\Z")
GENRES = ("Melodic House", "Synthwave", "Future Bass", "Drum & Bass", "Trance")
TIERS = ("easy", "standard", "hard")
TRACK_FILES = (
    "audio.m4a", "stream.m4a", "preview_48s.m4a",
    "easy.json", "standard.json", "hard.json",
    "cover-art.png", "cover.svg", "og.png",
)


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def source_file(path: Path, label: str) -> Path:
    if path.is_symlink() or not path.is_file():
        raise ValueError(f"{label}: missing or linked file")
    return path


def source_directory(path: Path, label: str) -> Path:
    if path.is_symlink() or not path.is_dir():
        raise ValueError(f"{label}: missing or linked directory")
    return path


def read_json(path: Path, label: str) -> dict:
    try:
        value = json.loads(source_file(path, label).read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ValueError(f"{label}: unreadable JSON") from error
    if not isinstance(value, dict):
        raise ValueError(f"{label}: expected JSON object")
    return value


def sha_field(value: object, label: str) -> str:
    if not isinstance(value, str) or not HASH.fullmatch(value):
        raise ValueError(f"{label}: invalid SHA-256")
    return value


def expect_file(path: Path, expected: object, label: str) -> None:
    fingerprint = sha_field(expected, label)
    if digest(source_file(path, label)) != fingerprint:
        raise ValueError(f"{label}: changed bytes")


def check_catalog(stage: Path, *, catalog_filename: str = "catalog.json",
                  expected_approval: bool = False) -> int:
    source_directory(stage, "catalog stage")
    data = read_json(stage / catalog_filename, catalog_filename)
    if data.get("version") != 2 or data.get("brand") != "duohertz" \
            or data.get("site_and_deployment_approval") is not expected_approval:
        state = "approved" if expected_approval else "unapproved"
        raise ValueError(f"{catalog_filename}: expected an {state} duohertz v2 stage")
    sha_field(data.get("source_observations_sha256"), "catalog observations source")
    sha_field(data.get("source_catalog_signoff_sha256"), "catalog signoff source")
    tracks = data.get("tracks")
    if not isinstance(tracks, list) or len(tracks) != 105:
        raise ValueError("catalog.json: expected exactly 105 tracks")
    source_directory(stage / "catalog", "catalog asset directory")
    seen: set[str] = set()
    counts = {genre: 0 for genre in GENRES}
    for track in tracks:
        if not isinstance(track, dict):
            raise ValueError("catalog.json: invalid track entry")
        track_id = track.get("track_id")
        if not isinstance(track_id, str) or not TRACK_ID.fullmatch(track_id) or track_id in seen:
            raise ValueError(f"catalog.json: invalid or duplicate track ID {track_id}")
        seen.add(track_id)
        label = f"catalog/{track_id}"
        directory = source_directory(stage / label, label)
        manifest = read_json(directory / "manifest.json", f"{label}/manifest.json")
        expect_file(directory / "manifest.json", track.get("manifest_sha256"), f"{label}/manifest.json")
        files = manifest.get("files_sha256")
        if not isinstance(files, dict) or manifest.get("track_id") != track_id:
            raise ValueError(f"{label}: invalid manifest identity")
        if track.get("theme") != "duohertz" or track.get("chart_format") != 2 \
                or track.get("rights") != "signed_catalog_candidate" \
                or any(track.get(field) != manifest.get(source) for field, source in (
                    ("title", "title"), ("artist", "artist"), ("genre", "subgenre"),
                    ("bpm", "bpm"), ("duration_sec", "duration_sec"),
                )):
            raise ValueError(f"{label}: catalog and manifest disagree")
        genre = track["genre"]
        if genre not in counts:
            raise ValueError(f"{label}: invalid electronic genre")
        counts[genre] += 1
        bpm = track.get("bpm")
        duration = track.get("duration_sec")
        stream_duration = track.get("stream_duration_sec")
        if type(bpm) not in (int, float) or not math.isfinite(bpm) or bpm <= 0 \
                or type(duration) not in (int, float) or not math.isfinite(duration) or duration <= 0 \
                or type(stream_duration) not in (int, float) or not math.isfinite(stream_duration) \
                or stream_duration < duration * 1.8:
            raise ValueError(f"{label}: invalid BPM or game/stream duration")
        for filename in TRACK_FILES:
            expect_file(directory / filename, files.get(filename), f"{label}/{filename}")
        expect_file(directory / "cover-thumb.webp", track.get("cover_thumb_sha256"),
                    f"{label}/cover-thumb.webp")
        base = f"/catalog/{track_id}/"
        for field, filename in (
            ("audio", "audio.m4a"), ("stream_audio", "stream.m4a"),
            ("preview", "preview_48s.m4a"), ("cover", "cover-art.png"),
            ("cover_thumb", "cover-thumb.webp"), ("og", "og.png"),
        ):
            if track.get(field) != base + filename:
                raise ValueError(f"{label}: invalid {field} path")
        charts = track.get("charts")
        if not isinstance(charts, dict):
            raise ValueError(f"{label}: missing charts")
        for tier in TIERS:
            if charts.get(tier) != base + tier + ".json":
                raise ValueError(f"{label}: invalid {tier} chart path")
            chart = read_json(directory / f"{tier}.json", f"{label}/{tier}.json")
            if chart.get("format") != 2 or chart.get("theme") != "duohertz" \
                    or chart.get("track_id") != track_id or chart.get("tier") != tier \
                    or chart.get("bpm") != track["bpm"]:
                raise ValueError(f"{label}/{tier}.json: chart identity mismatch")
    if any(count != 21 for count in counts.values()):
        raise ValueError("catalog.json: expected 21 tracks in each electronic genre")
    return len(seen)


def check_characters(stage: Path, *, characters_filename: str = "characters.json",
                     expected_approval: bool = False) -> int:
    source_directory(stage, "character stage")
    data = read_json(stage / characters_filename, characters_filename)
    if data.get("version") != 1 or data.get("brand") != "duohertz" \
            or data.get("site_and_deployment_approval") is not expected_approval:
        state = "approved" if expected_approval else "unapproved"
        raise ValueError(f"{characters_filename}: expected an {state} duohertz character stage")
    sha_field(data.get("source_character_signoff_sha256"), "character signoff source")
    characters = data.get("characters")
    if not isinstance(characters, list) or len(characters) != 3:
        raise ValueError("characters.json: expected exactly three characters")
    source_directory(stage / "characters", "character art directory")
    ids: set[str] = set()
    names: set[str] = set()
    roles: set[str] = set()
    for character in characters:
        if not isinstance(character, dict):
            raise ValueError("characters.json: invalid character entry")
        character_id = character.get("id")
        name = character.get("name")
        role = character.get("role")
        if not isinstance(character_id, str) or not CHARACTER_ID.fullmatch(character_id) \
                or character_id in ids or not isinstance(name, str) or not name.strip() \
                or name.strip().casefold() in names or role not in ("Attacker", "Support", "Buffer") \
                or role in roles:
            raise ValueError("characters.json: duplicate or invalid character identity")
        ids.add(character_id)
        names.add(name.strip().casefold())
        roles.add(role)
        story = character.get("story")
        if not isinstance(story, str) or not 120 <= len(story.split()) <= 180:
            raise ValueError(f"{character_id}: story must contain 120–180 words")
        for field in ("title", "region", "height", "identity", "traits", "quote", "alt", "side_alt"):
            if not isinstance(character.get(field), str) or not character[field].strip():
                raise ValueError(f"{character_id}: missing {field}")
        directory = source_directory(stage / "characters" / character_id, f"characters/{character_id}")
        for field, filename in (("art", "front.png"), ("side_art", "side.png")):
            if character.get(field) != f"/characters/{character_id}/{filename}":
                raise ValueError(f"{character_id}: invalid {field} path")
            expect_file(directory / filename, character.get(f"{field}_sha256"),
                        f"characters/{character_id}/{filename}")
    return len(ids)


def module(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    if spec is None or spec.loader is None:
        raise ValueError(f"Cannot load {filename}")
    loaded = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = loaded
    spec.loader.exec_module(loaded)
    return loaded


def check_sources(catalog_stage: Path, character_stage: Path, observations: Path,
                  catalog_signoff: Path, roster: Path, character_signoff: Path) -> None:
    catalog = read_json(catalog_stage / "catalog.json", "catalog.json")
    characters = read_json(character_stage / "characters.json", "characters.json")
    expect_file(observations, catalog["source_observations_sha256"], "catalog observations source")
    expect_file(catalog_signoff, catalog["source_catalog_signoff_sha256"], "catalog signoff source")
    expect_file(character_signoff, characters["source_character_signoff_sha256"],
                "character signoff source")
    source_file(roster, "reviewed character roster")

    review = module("duohertz_review_for_stage_recheck", "duohertz-review-audit.py")
    observation_report = review.audit(catalog_stage / "catalog", read_json(observations, "observations"))
    if not observation_report["all_observations_pass"] or observation_report["staged_tracks"] != 105:
        raise ValueError("catalog observations are incomplete or require revision")
    catalog_builder = module("duohertz_catalog_for_stage_recheck", "duohertz-build-catalog.py")
    catalog_builder.verify_signoff(catalog_stage / "catalog", catalog["tracks"],
                                   observations, catalog_signoff)

    character_builder = module("duohertz_characters_for_stage_recheck", "duohertz-build-characters.py")
    reviewed = character_builder.roster(roster)
    character_builder.signoff(character_signoff, roster, reviewed)
    expected = [{field: entry[field] for field in character_builder.PUBLIC_FIELDS} for entry in reviewed]
    if characters["characters"] != expected:
        raise ValueError("staged characters differ from the reviewed roster")


def audit(catalog_stage: Path | None, character_stage: Path | None, *,
          observations: Path | None = None, catalog_signoff: Path | None = None,
          roster: Path | None = None, character_signoff: Path | None = None,
          integrity_only: bool = False) -> dict:
    blockers: list[str] = []
    counts = {"tracks": 0, "characters": 0}
    for label, stage, checker, count in (
        ("catalog", catalog_stage, check_catalog, "tracks"),
        ("character", character_stage, check_characters, "characters"),
    ):
        if stage is None:
            blockers.append(f"Missing {label} stage")
            continue
        try:
            counts[count] = checker(stage)
        except (OSError, ValueError, TypeError, KeyError) as error:
            blockers.append(f"{label} stage: {error}")
    stage_integrity = not blockers
    sources = (observations, catalog_signoff, roster, character_signoff)
    source_verified = False
    if integrity_only and any(source is not None for source in sources):
        blockers.append("--integrity-only cannot be combined with source evidence inputs")
    if not integrity_only:
        for label, source in zip(("observations", "catalog signoff", "reviewed roster", "character signoff"), sources):
            if source is None:
                blockers.append(f"Missing {label} source")
        if stage_integrity and all(source is not None for source in sources):
            assert catalog_stage is not None and character_stage is not None
            assert observations is not None and catalog_signoff is not None
            assert roster is not None and character_signoff is not None
            try:
                check_sources(catalog_stage, character_stage, observations, catalog_signoff,
                              roster, character_signoff)
                source_verified = True
            except (OSError, ValueError, TypeError, KeyError) as error:
                blockers.append(f"source evidence: {error}")
    return {
        "staged_content_integrity": stage_integrity,
        "source_evidence_verified": source_verified,
        **counts,
        "blockers": blockers,
        "site_and_deployment_approval": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--catalog-stage", type=Path)
    parser.add_argument("--character-stage", type=Path)
    parser.add_argument("--observations", type=Path)
    parser.add_argument("--catalog-signoff", type=Path)
    parser.add_argument("--roster", type=Path)
    parser.add_argument("--character-signoff", type=Path)
    parser.add_argument("--integrity-only", action="store_true",
                        help="Check only staged package consistency; success is not source-evidence verification")
    args = parser.parse_args()
    report = audit(args.catalog_stage, args.character_stage, observations=args.observations,
                   catalog_signoff=args.catalog_signoff, roster=args.roster,
                   character_signoff=args.character_signoff, integrity_only=args.integrity_only)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if not report["blockers"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
