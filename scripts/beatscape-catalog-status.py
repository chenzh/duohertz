#!/usr/bin/env python3
"""BeatScape catalog roadmap vs shipped inventory — gap report (PRD §6.0.1 · §6.0.5).

Usage:
  python3 scripts/beatscape-catalog-status.py
  python3 scripts/beatscape-catalog-status.py --json
  python3 scripts/beatscape-catalog-status.py --stage 2

Exit codes: 0 = on track, 1 = catalog has unknown track_ids.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ROADMAP = ROOT / "apps/beatscape/catalog-roadmap.json"
DEFAULT_CATALOG = ROOT / "apps/beatscape/public/catalog.json"
GENRES = ("EDM", "Pop", "Hip-hop", "R&B", "Rock")


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def stage_from_track_id(track_id: str) -> int | None:
    m = __import__("re").match(r"^bs-s(\d+)-\d+$", track_id)
    return int(m.group(1)) if m else None


def shipped_ids(catalog: dict[str, Any], public_dir: Path) -> set[str]:
    ids: set[str] = set()
    for track in catalog.get("tracks", []):
        tid = str(track.get("track_id", ""))
        if not tid:
            continue
        audio = track.get("audio", "")
        if audio and (public_dir / audio.lstrip("/")).exists():
            ids.add(tid)
    return ids


def count_by_genre(slots: list[dict[str, Any]], *, stage_max: int | None = None) -> Counter[str]:
    out: Counter[str] = Counter()
    for slot in slots:
        stage = int(slot["stage"])
        if stage_max is not None and stage > stage_max:
            continue
        genre = str(slot.get("genre", ""))
        if genre in GENRES:
            out[genre] += 1
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="BeatScape catalog roadmap gap report")
    parser.add_argument("--roadmap", type=Path, default=DEFAULT_ROADMAP)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--stage", type=int, default=None, help="Report up to this stage gate")
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()

    roadmap = load_json(args.roadmap)
    catalog = load_json(args.catalog)
    public_dir = args.catalog.parent
    slots: list[dict[str, Any]] = roadmap["slots"]
    slot_by_id = {s["track_id"]: s for s in slots}
    shipped = shipped_ids(catalog, public_dir)

    for tid in shipped:
        if tid in slot_by_id:
            slot_by_id[tid]["_live"] = True

    catalog_ids = {str(t.get("track_id")) for t in catalog.get("tracks", [])}
    unknown = sorted(catalog_ids - set(slot_by_id.keys()))
    stage_gate = args.stage or max(int(k) for k in roadmap["stage_targets"])

    targets_total = int(roadmap["stage_targets"][str(stage_gate)])
    targets_genre = roadmap["genre_targets"]["by_stage"][str(stage_gate)]
    planned_slots = [s for s in slots if int(s["stage"]) <= stage_gate]
    live_in_gate = [s for s in planned_slots if s["track_id"] in shipped]

    live_genre = Counter(str(t.get("genre", "")) for t in catalog.get("tracks", []) if t.get("track_id") in shipped)
    planned_genre = count_by_genre(planned_slots)

    gaps = {
        "total": {
            "target": targets_total,
            "shipped": len(live_in_gate),
            "remaining": targets_total - len(live_in_gate),
        },
        "by_genre": {},
    }
    for genre in GENRES:
        target = int(targets_genre.get(genre, 0))
        have = int(live_genre.get(genre, 0))
        gaps["by_genre"][genre] = {
            "target": target,
            "shipped": have,
            "remaining": target - have,
        }

    next_slots = [
        s for s in planned_slots
        if s["track_id"] not in shipped and s.get("status") != "shipped"
    ][:8]

    report = {
        "roadmap": str(args.roadmap.relative_to(ROOT)),
        "catalog": str(args.catalog.relative_to(ROOT)),
        "stage_gate": stage_gate,
        "formal_target": roadmap["stage_targets"]["5"],
        "shipped_total": len(shipped),
        "gaps": gaps,
        "unknown_track_ids": unknown,
        "next_slots": [
            {
                "track_id": s["track_id"],
                "stage": s["stage"],
                "genre": s["genre"],
                "title": s.get("title"),
                "batch": s.get("batch"),
            }
            for s in next_slots
        ],
    }

    if args.as_json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print(f"BeatScape catalog status (gate: Stage {stage_gate})")
        print(f"  Roadmap: {report['roadmap']}")
        print(f"  Catalog: {report['catalog']}")
        print()
        g = gaps["total"]
        print(f"  Total: {g['shipped']}/{g['target']} shipped · {g['remaining']} remaining to Stage {stage_gate}")
        print(f"  Formal v1 target: {report['formal_target']} tracks (Stage 5)")
        print()
        print("  By genre:")
        for genre in GENRES:
            row = gaps["by_genre"][genre]
            print(f"    {genre:8} {row['shipped']:2}/{row['target']:2}  (need {row['remaining']})")
        print()
        if unknown:
            print(f"  WARN: catalog has {len(unknown)} track_id(s) not in roadmap: {', '.join(unknown)}")
        if next_slots:
            print("  Next slots:")
            for s in next_slots:
                title = s.get("title") or "(TBD)"
                batch = f" · {s['batch']}" if s.get("batch") else ""
                print(f"    {s['track_id']}  {title}  [{s['genre']}]{batch}")

    return 1 if unknown else 0


if __name__ == "__main__":
    sys.exit(main())
