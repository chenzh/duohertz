#!/usr/bin/env python3
"""Sync BeatScape catalog into Scape Music (apps/scapemusic).

Single source of truth: apps/beatscape/public/catalog.json (85 owned tracks,
dual assets: game slice + streaming full length). This script:

  1. emits apps/scapemusic/src/data/catalog.json — streaming metadata subset
     plus The Late Static call-in quotes (trackRequests.json),
  2. ensures apps/scapemusic/public/catalog symlinks to the BeatScape catalog
     dir (audio/covers served in place — no asset duplication in git),
  3. validates integrity (unique ids, sane stream durations, files on disk).

Usage:
  python3 scripts/scapemusic-sync-catalog.py            # sync (writes)
  python3 scripts/scapemusic-sync-catalog.py --check    # exit 1 on drift
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BS_PUBLIC = ROOT / "apps/beatscape/public"
BS_CATALOG = BS_PUBLIC / "catalog.json"
BS_REQUESTS = ROOT / "apps/beatscape/src/data/trackRequests.json"
APP_DIR = ROOT / "apps/scapemusic"
OUT_JSON = APP_DIR / "src/data/catalog.json"
CATALOG_LINK = APP_DIR / "public/catalog"

STREAM_MIN_SEC = 150
STREAM_MAX_SEC = 240


def ensure_symlink() -> str:
    """Point apps/scapemusic/public/catalog at the BeatScape catalog dir."""
    target = os.path.relpath(BS_PUBLIC / "catalog", CATALOG_LINK.parent)
    if CATALOG_LINK.is_symlink():
        if os.readlink(CATALOG_LINK) == target:
            return "ok"
        CATALOG_LINK.unlink()
    elif CATALOG_LINK.exists():
        raise SystemExit(f"refusing to replace non-symlink: {CATALOG_LINK}")
    CATALOG_LINK.parent.mkdir(parents=True, exist_ok=True)
    os.symlink(target, CATALOG_LINK)
    return "created"


def build_stream_catalog() -> list[dict]:
    raw = json.loads(BS_CATALOG.read_text(encoding="utf-8"))
    tracks = raw["tracks"] if isinstance(raw, dict) else raw
    quotes: dict[str, str] = {}
    if BS_REQUESTS.exists():
        quotes = json.loads(BS_REQUESTS.read_text(encoding="utf-8"))

    out: list[dict] = []
    for t in tracks:
        entry = {
            "track_id": t["track_id"],
            "title": t["title"],
            "artist": t["artist"],
            "genre": t["genre"],
            "bpm": t["bpm"],
            "vibe": t["vibe"],
            "district": t["district"],
            "tags": t.get("tags", []),
            "cover": t["cover"],
            "og": t["og"],
            "stream_audio": t["stream_audio"],
            "stream_duration_sec": t["stream_duration_sec"],
        }
        quote = quotes.get(t["track_id"])
        if quote:
            entry["quote"] = quote
        out.append(entry)
    out.sort(key=lambda e: e["track_id"])
    return out


def validate(entries: list[dict]) -> list[str]:
    problems: list[str] = []
    ids = [e["track_id"] for e in entries]
    if len(set(ids)) != len(ids):
        problems.append("duplicate track_id in catalog")
    for e in entries:
        tid = e["track_id"]
        if not STREAM_MIN_SEC <= e["stream_duration_sec"] <= STREAM_MAX_SEC:
            problems.append(
                f"{tid}: stream_duration_sec {e['stream_duration_sec']} out of range"
            )
        for field in ("stream_audio", "cover", "og"):
            f = BS_PUBLIC / e[field].lstrip("/")
            if not f.exists():
                problems.append(f"{tid}: missing {field} asset {f}")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--check", action="store_true", help="exit 1 if generated file is missing or drifted"
    )
    args = ap.parse_args()

    entries = build_stream_catalog()
    problems = validate(entries)
    if problems:
        for p in problems:
            print(f"FAIL {p}", file=sys.stderr)
        return 1
    payload = json.dumps(entries, ensure_ascii=False, indent=2) + "\n"

    if args.check:
        if not OUT_JSON.exists():
            print(f"FAIL missing {OUT_JSON}", file=sys.stderr)
            return 1
        if OUT_JSON.read_text(encoding="utf-8") != payload:
            print(
                f"FAIL drift between BeatScape catalog and {OUT_JSON} (rerun sync)",
                file=sys.stderr,
            )
            return 1
        print(f"check ok: {len(entries)} tracks in sync")
        return 0

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(payload, encoding="utf-8")
    status = ensure_symlink()
    print(f"synced {len(entries)} tracks -> {OUT_JSON.relative_to(ROOT)}")
    print(f"catalog symlink: {status}  ({CATALOG_LINK} -> {os.readlink(CATALOG_LINK)})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
