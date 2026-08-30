#!/usr/bin/env python3
"""Ingest Stage6 preview audio into BeatScape catalog (50 tracks → 85 total).

Usage:
  python3 scripts/beatscape-ingest-stage6.py --dry-run
  python3 scripts/beatscape-ingest-stage6.py --track bs-s6-01
  python3 scripts/beatscape-ingest-stage6.py --tracks bs-s4-11,bs-s5-01
  python3 scripts/beatscape-ingest-stage6.py --batch s6-expansion
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "data" / "beatscape-preview"
OUT = ROOT / "apps" / "beatscape" / "public"
CATALOG_PATH = OUT / "catalog.json"
ROADMAP_PATH = ROOT / "apps" / "beatscape" / "catalog-roadmap.json"

_spec = importlib.util.spec_from_file_location(
    "beatscape_stage6_specs", ROOT / "scripts" / "beatscape-stage6-specs.py"
)
assert _spec and _spec.loader
_m = importlib.util.module_from_spec(_spec)
sys.modules["beatscape_stage6_specs"] = _m
_spec.loader.exec_module(_m)

STAGE6_TRACKS = _m.stage6_tracks()


def cover_svg(track_id: str, district: str, title: str, artist: str = "", genre: str = "", bpm: int | None = None) -> str:
    spec = importlib.util.spec_from_file_location("beatscape_cover", ROOT / "scripts" / "beatscape-cover.py")
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.render_cover_svg(track_id, title, artist, district, genre, bpm)


def catalog_entry(tr: dict) -> dict:
    tid = tr["track_id"]
    return {
        "track_id": tid,
        "title": tr["title"],
        "artist": tr["artist"],
        "genre": tr["genre"],
        "bpm": tr["bpm"],
        "duration_sec": tr["duration_sec"],
        "stream_duration_sec": tr["stream_duration_sec"],
        "preset_id": tr["preset_id"],
        "engine": tr.get("engine", "stable-audio-3"),
        "job_id": f"local-preview-{tid}",
        "rights": "owned",
        "theme": "beatscape",
        "tags": tr["tags"],
        "vibe": tr.get("vibe"),
        "district": tr["district"],
        "default_mode": tr["default_mode"],
        "default_tier": tr["default_tier"],
        "allows_slide": tr.get("allows_slide", False),
        "audio": f"/catalog/{tid}/audio.m4a",
        "cover": f"/catalog/{tid}/cover.svg",
        "og": f"/catalog/{tid}/og.png",
        "charts": {
            "easy": f"/catalog/{tid}/easy.json",
            "standard": f"/catalog/{tid}/standard.json",
            "hard": f"/catalog/{tid}/hard.json",
        },
        "seo": {
            "title": f"{tr['title']} — BeatScape AI Original",
            "description": f"Own the Scape. {tr['bpm']} BPM {tr['genre']} chart.",
        },
    }


def sync_roadmap(ingested_ids: list[str]) -> None:
    if not ingested_ids or not ROADMAP_PATH.is_file():
        return
    roadmap = json.loads(ROADMAP_PATH.read_text(encoding="utf-8"))
    by_tid = {t["track_id"]: t for t in STAGE6_TRACKS}
    changed = 0
    for slot in roadmap.get("slots", []):
        tid = slot.get("track_id")
        if tid not in ingested_ids or tid not in by_tid:
            continue
        tr = by_tid[tid]
        slot["status"] = "shipped"
        slot["title"] = tr["title"]
        slot["artist"] = tr["artist"]
        slot["preset_id"] = tr["preset_id"]
        slot["district"] = tr["district"]
        slot["vibe"] = tr["vibe"]
        slot["tags"] = tr["tags"]
        changed += 1
    if changed:
        roadmap["updated"] = time.strftime("%Y-%m-%d")
        ROADMAP_PATH.write_text(json.dumps(roadmap, indent=2) + "\n", encoding="utf-8")
        print(f"Roadmap: marked {changed} Stage6 slot(s) shipped")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--track")
    parser.add_argument("--tracks", help="Comma-separated track_ids")
    parser.add_argument("--batch", help="Only ingest this batch (s4-wave-3 | s5-formal | s6-expansion)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8")) if CATALOG_PATH.is_file() else {"version": 1, "tracks": []}
    by_id = {t["track_id"]: t for t in catalog.get("tracks", [])}
    missing: list[str] = []
    ingested = 0

    tracks = STAGE6_TRACKS
    if args.track:
        tracks = [t for t in tracks if t["track_id"] == args.track]
    elif args.tracks:
        want = {x.strip() for x in args.tracks.split(",") if x.strip()}
        tracks = [t for t in tracks if t["track_id"] in want]
    elif args.batch:
        tracks = [t for t in tracks if t["batch"] == args.batch]

    for tr in tracks:
        tid = tr["track_id"]
        src = PREVIEW / tr["preview_file"]
        if not src.is_file():
            missing.append(str(src))
            print(f"MISSING {tid}: {src}")
            continue
        if args.dry_run:
            print(f"READY {tid} — {tr['title']}")
            continue
        dest = OUT / "catalog" / tid
        dest.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest / "audio.m4a")
        (dest / "cover.svg").write_text(
            cover_svg(tid, tr["district"], tr["title"], tr["artist"], tr["genre"], tr["bpm"]),
            encoding="utf-8",
        )
        by_id[tid] = catalog_entry(tr)
        ingested += 1
        print(f"OK {tid}")

    if args.dry_run:
        print(f"{len(tracks) - len(missing)}/{len(tracks)} ready")
        return 0 if not missing else 2

    if ingested == 0:
        return 2

    catalog["tracks"] = sorted(by_id.values(), key=lambda t: t["track_id"])
    CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    ingested_ids = [tr["track_id"] for tr in tracks if tr["track_id"] in by_id]
    sync_roadmap(ingested_ids)
    print(f"Wrote {CATALOG_PATH} ({len(catalog['tracks'])} tracks, +{ingested} Stage6)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
