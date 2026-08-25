#!/usr/bin/env python3
"""Ingest Stage2 preview audio into BeatScape catalog (PRD §6.0.6-B · §6.0.27).

Merges four tracks (#07–#10) into existing catalog.json without touching Stage1.
Charts are NOT generated here — run beatscape-chartgen.py after ingest.

Usage:
  python3 scripts/beatscape-ingest-stage2.py --dry-run
  python3 scripts/beatscape-ingest-stage2.py
  python3 scripts/beatscape-ingest-stage2.py --track bs-s2-01
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "data" / "beatscape-preview"
OUT = ROOT / "apps" / "beatscape" / "public"
CATALOG_PATH = OUT / "catalog.json"

_spec = importlib.util.spec_from_file_location(
    "beatscape_track_registry", ROOT / "scripts" / "beatscape-track-registry.py"
)
assert _spec and _spec.loader
_reg = importlib.util.module_from_spec(_spec)
sys.modules["beatscape_track_registry"] = _reg
_spec.loader.exec_module(_reg)
STAGE2_TRACKS = _reg.STAGE2_TRACKS
DISTRICT_COLORS = _reg.DISTRICT_COLORS


def cover_svg(track_id: str, district: str, title: str) -> str:
    color = DISTRICT_COLORS.get(district, "#3DDCFF")
    seed = sum(ord(c) for c in track_id) % 360
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0b0f14"/>
  <polygon points="256,80 380,256 256,432 132,256" fill="none" stroke="{color}" stroke-width="4" opacity="0.9" transform="rotate({seed} 256 256)"/>
  <text x="256" y="480" text-anchor="middle" fill="#8b9bb0" font-family="system-ui" font-size="22">{title}</text>
</svg>"""


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


def load_catalog() -> dict:
    if CATALOG_PATH.is_file():
        return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    return {"version": 1, "tracks": []}


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest BeatScape Stage2 tracks")
    parser.add_argument("--track", help="Only ingest one track_id")
    parser.add_argument("--dry-run", action="store_true", help="List missing preview files only")
    args = parser.parse_args()

    if not PREVIEW.is_dir() and not args.dry_run:
        raise SystemExit(f"Missing preview dir: {PREVIEW}")

    catalog = load_catalog()
    by_id = {t["track_id"]: t for t in catalog.get("tracks", [])}
    missing: list[str] = []
    ingested = 0

    for tr in STAGE2_TRACKS:
        tid = tr["track_id"]
        if args.track and tid != args.track:
            continue
        src = PREVIEW / tr["preview_file"]
        if not src.is_file():
            missing.append(str(src))
            print(f"MISSING {tid}: {src}")
            continue
        if args.dry_run:
            print(f"READY {tid}: {src}")
            continue

        dest = OUT / "catalog" / tid
        dest.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest / "audio.m4a")
        (dest / "cover.svg").write_text(
            cover_svg(tid, tr["district"], tr["title"]), encoding="utf-8"
        )
        by_id[tid] = catalog_entry(tr)
        ingested += 1
        print(f"OK {tid} -> {dest / 'audio.m4a'}")

    if args.dry_run:
        print(f"\n{len(STAGE2_TRACKS) - len(missing)}/{len(STAGE2_TRACKS)} preview files present")
        return 0 if not missing else 2

    if ingested == 0:
        print("No tracks ingested. Run with --dry-run to see missing files.", file=sys.stderr)
        return 2

    catalog["tracks"] = sorted(by_id.values(), key=lambda t: t["track_id"])
    CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    print(f"\nWrote {CATALOG_PATH} ({len(catalog['tracks'])} tracks total, +{ingested} Stage2)")
    print("Next: python3 scripts/beatscape-chartgen.py --track <id>")
    print("      python3 scripts/beatscape-ingest-stream.py")
    print("      pnpm audit:beatscape")
    return 0


if __name__ == "__main__":
    sys.exit(main())
