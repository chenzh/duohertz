#!/usr/bin/env python3
"""Audit staged duohertz catalog structure without granting release approval.

This is a fast structural/hash check. Run duohertz-candidate-gate.py per song
for BS-D002 audio alignment; human listening, rights, art and release signoff
are separate requirements.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CANDIDATES = ROOT / "apps/beatscape/candidates/duohertz"
STYLES = ("Melodic House", "Synthwave", "Future Bass", "Drum & Bass", "Trance")
EXPECTED_PER_STYLE = 21


def candidate_gate():
    spec = importlib.util.spec_from_file_location(
        "duohertz_candidate_gate_for_inventory", ROOT / "scripts/duohertz-candidate-gate.py"
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load duohertz chart validator")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def inspect(root: Path) -> list[dict]:
    gate = candidate_gate()
    tracks: list[dict] = []
    seen_ids: set[str] = set()
    seen_titles: set[str] = set()
    seen_music_hashes: dict[str, str] = {}
    for directory in sorted(root.glob("dh-*/")):
        if directory.is_symlink():
            raise ValueError(f"Symlink candidate directory: {directory}")
        manifest_path = directory / "manifest.json"
        if not manifest_path.is_file() or manifest_path.is_symlink():
            raise ValueError(f"Missing candidate manifest: {directory}")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        track_id = manifest.get("track_id")
        title = manifest.get("title")
        style = manifest.get("subgenre")
        bpm = manifest.get("bpm")
        duration = manifest.get("duration_sec")
        if not isinstance(track_id, str) or not re.fullmatch(r"dh-[a-z0-9-]+", track_id) or directory.name != track_id \
                or track_id in seen_ids or manifest.get("theme") != "duohertz":
            raise ValueError(f"Invalid or duplicate duohertz identity: {directory}")
        if not isinstance(title, str) or not title.strip() or title.strip().casefold() in seen_titles:
            raise ValueError(f"Missing or duplicate title: {track_id}")
        if style not in STYLES:
            raise ValueError(f"Unexpected electronic style: {track_id}")
        if not isinstance(manifest.get("artist"), str) or not manifest["artist"].strip():
            raise ValueError(f"Missing artist: {track_id}")
        if type(bpm) not in (int, float) or type(duration) not in (int, float) \
                or not math.isfinite(bpm) or not math.isfinite(duration) or bpm <= 0 or duration <= 0:
            raise ValueError(f"Invalid BPM/duration: {track_id}")
        assets = manifest.get("files_sha256")
        if not isinstance(assets, dict) or set(assets) != gate.FILES:
            raise ValueError(f"Incomplete asset hashes: {track_id}")
        for name, expected in assets.items():
            path = directory / name
            if not isinstance(expected, str) or not path.is_file() or path.is_symlink() or gate.sha(path) != expected:
                raise ValueError(f"Missing or changed asset: {track_id}/{name}")
        for name in ("audio.m4a", "stream.m4a"):
            digest = assets[name]
            previous = seen_music_hashes.get(digest)
            if previous and not previous.startswith(f"{track_id}/"):
                raise ValueError(f"Duplicate music bytes: {previous} and {track_id}/{name}")
            seen_music_hashes.setdefault(digest, f"{track_id}/{name}")
        for tier in gate.TIERS:
            chart = json.loads((directory / f"{tier}.json").read_text(encoding="utf-8"))
            gate.validate_chart(chart, tier=tier, track_id=track_id, bpm=bpm, track_duration=duration)
        seen_ids.add(track_id)
        seen_titles.add(title.strip().casefold())
        tracks.append({"track_id": track_id, "title": title, "subgenre": style})
    return tracks


def assess(tracks: list[dict]) -> dict:
    counts = Counter(track["subgenre"] for track in tracks)
    by_style = {style: counts[style] for style in STYLES}
    missing = {style: max(0, EXPECTED_PER_STYLE - counts[style]) for style in STYLES}
    over = {style: counts[style] - EXPECTED_PER_STYLE for style in STYLES if counts[style] > EXPECTED_PER_STYLE}
    return {
        "schema": 1,
        "scope": "duohertz_staged_catalog_structure_and_hashes",
        "target_tracks": EXPECTED_PER_STYLE * len(STYLES),
        "target_charts": EXPECTED_PER_STYLE * len(STYLES) * 3,
        "staged_tracks": len(tracks),
        "staged_charts": len(tracks) * 3,
        "staged_by_subgenre": by_style,
        "missing_by_subgenre": missing,
        "excess_by_subgenre": over,
        "technical_structure_pass": len(tracks) == EXPECTED_PER_STYLE * len(STYLES) and not any(missing.values()) and not over,
        "audio_alignment": "not_assessed_here",
        "human_review_and_release_signoff": "not_assessed_here",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=DEFAULT_CANDIDATES)
    args = parser.parse_args()
    try:
        report = assess(inspect(args.root.resolve()))
    except (ValueError, OSError, json.JSONDecodeError, KeyError) as exc:
        print(f"FAIL {exc}", file=sys.stderr)
        return 1
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["technical_structure_pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
