#!/usr/bin/env python3
"""Sync Stage6 truth files from beatscape-stage6-specs.py.

Writes / updates:
  * scripts/beatscape-stage6-manifest.json  — MusicSaas job truth (50 tracks)
  * scripts/beatscape-track-vibes.json      — vibe lookup for all 85 tracks
  * apps/beatscape/catalog-roadmap.json     — Stage6 slots + Stage 6 targets

Usage:
  python3 scripts/beatscape-stage6-sync-manifest.py
  python3 scripts/beatscape-stage6-sync-manifest.py --dry-run
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
MANIFEST = SCRIPTS / "beatscape-stage6-manifest.json"
VIBES = SCRIPTS / "beatscape-track-vibes.json"
ROADMAP = ROOT / "apps" / "beatscape" / "catalog-roadmap.json"

SPEC_PATH = SCRIPTS / "beatscape-stage6-specs.py"


def load_specs():
    spec = importlib.util.spec_from_file_location("s6", SPEC_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write_manifest(tracks: list[dict], dry_run: bool) -> None:
    payload = {
        "version": 1,
        "stage": 6,
        "wave": "expansion-50",
        "authority": "docs/BEATSCAPE-STAGE6-EXPANSION-MUSIC.md",
        "updated": date.today().isoformat(),
        "tracks": tracks,
    }
    if dry_run:
        print(f"WOULD write {MANIFEST} ({len(tracks)} tracks)")
        return
    MANIFEST.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {MANIFEST} ({len(tracks)} tracks)")


def write_vibes(tracks: list[dict], dry_run: bool) -> None:
    current = json.loads(VIBES.read_text(encoding="utf-8")) if VIBES.is_file() else {}
    for tr in tracks:
        current[tr["track_id"]] = tr["vibe"]
    ordered = {k: current[k] for k in sorted(current)}
    if dry_run:
        print(f"WOULD write {VIBES} ({len(ordered)} entries, +{len(tracks)} Stage6)")
        return
    VIBES.write_text(json.dumps(ordered, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {VIBES} ({len(ordered)} entries, +{len(tracks)} Stage6)")


def write_roadmap(tracks: list[dict], dry_run: bool) -> None:
    roadmap = json.loads(ROADMAP.read_text(encoding="utf-8"))
    by_id = {s["track_id"]: s for s in roadmap.get("slots", [])}
    added = 0
    updated = 0

    for tr in tracks:
        tid = tr["track_id"]
        slot = by_id.get(tid)
        if slot is None:
            slot = {
                "track_id": tid,
                "stage": 6,
                "seq": tr["seq"],
                "genre": tr["genre"],
                "status": "planned",
                "title": None,
                "preset_id": tr["preset_id"],
                "game_duration_sec": tr["duration_sec"],
                "batch": tr["batch"],
            }
            roadmap["slots"].append(slot)
            by_id[tid] = slot
            added += 1
        else:
            # Re-point pre-allocated slots at the RESONANCE preset truth.
            if slot.get("preset_id") != tr["preset_id"]:
                slot["preset_id"] = tr["preset_id"]
                updated += 1
            if slot.get("batch") != tr["batch"]:
                slot["batch"] = tr["batch"]
                updated += 1

    roadmap["slots"].sort(key=lambda s: int(s["seq"]))
    roadmap["stage_targets"]["6"] = 85
    roadmap["genre_targets"]["by_stage"]["6"] = {
        "EDM": 20, "Pop": 17, "Hip-hop": 17, "R&B": 14, "Rock": 17,
    }
    roadmap["tag_targets_stage6"] = {
        "Hot Chart Style": 26,
        "Viral Style": 20,
        "Classic Style": 20,
        "New Release": 19,
    }
    roadmap["updated"] = date.today().isoformat()

    if dry_run:
        print(f"WOULD write {ROADMAP} (+{added} slots, {updated} re-pointed)")
        return
    ROADMAP.write_text(json.dumps(roadmap, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {ROADMAP} (+{added} slots, {updated} re-pointed, {len(roadmap['slots'])} total)")


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync Stage6 truth files")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    module = load_specs()
    problems = module.validate()
    if problems:
        for p in problems:
            print("FAIL", p, file=sys.stderr)
        return 1

    tracks = module.stage6_tracks()
    write_manifest(tracks, args.dry_run)
    write_vibes(tracks, args.dry_run)
    write_roadmap(tracks, args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
