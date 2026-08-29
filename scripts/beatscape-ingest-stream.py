#!/usr/bin/env python3
"""Attach streaming-app full masters to BeatScape catalog (PRD §6.0.27).

Stage1 may omit `stream_audio` (game clip only). When a full master exists, copy it
into the track folder and update catalog.json fields:

  stream_audio      -> /catalog/{id}/stream.m4a
  stream_duration_sec -> measured length (target 150–210s)
  stream_app_url    -> optional deep link (or set VITE_STREAM_APP_URL in the web app)

Source lookup (first match per track):
  1. data/beatscape-preview/stream/{track_id}-stream.m4a
  2. data/beatscape-preview/stream/{preview_stem}-full.m4a
  3. data/beatscape-preview/masters/{preview_stem}.wav  (must be longer than game clip)

Usage:
  python3 scripts/beatscape-ingest-stream.py
  python3 scripts/beatscape-ingest-stream.py --track bs-s1-01
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("beatscape_audio", ROOT / "scripts" / "beatscape-audio.py")
_audio = importlib.util.module_from_spec(_spec)
sys.modules["beatscape_audio"] = _audio
assert _spec.loader is not None
_spec.loader.exec_module(_audio)
load_audio = _audio.load_audio
PREVIEW = ROOT / "data" / "beatscape-preview"
STREAM_DIR = PREVIEW / "stream"
MASTERS = PREVIEW / "masters"
CATALOG_PATH = ROOT / "apps" / "beatscape" / "public" / "catalog.json"
PUBLIC = ROOT / "apps" / "beatscape" / "public"

# Align preview stems with beatscape-track-registry.py
_spec = importlib.util.spec_from_file_location(
    "beatscape_track_registry", ROOT / "scripts" / "beatscape-track-registry.py"
)
_reg = importlib.util.module_from_spec(_spec)
sys.modules["beatscape_track_registry"] = _reg
assert _spec.loader is not None
_spec.loader.exec_module(_reg)
TRACK_PREVIEW: dict[str, str] = _reg.PREVIEW_STEM_BY_ID

MIN_STREAM_RATIO = 1.8  # stream_duration_sec >= duration_sec * ratio (Stage2+ gate)


def m4a_duration_sec(path: Path) -> float:
    _, _, _, dur = load_audio(path)
    return dur


def wav_to_m4a(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "afconvert",
            "-f",
            "m4af",
            "-d",
            "aac",
            "-b",
            "256000",
            str(src),
            str(dest),
        ],
        check=True,
    )


def find_stream_source(track_id: str) -> Path | None:
    stem = TRACK_PREVIEW.get(track_id)
    candidates: list[Path] = []
    candidates.append(STREAM_DIR / f"{track_id}-stream.m4a")
    if stem:
        candidates.append(STREAM_DIR / f"{stem}-full.m4a")
        candidates.append(STREAM_DIR / f"{stem}-stream.m4a")
        candidates.append(MASTERS / f"{stem}.wav")
        candidates.append(PREVIEW / f"{stem}-full.m4a")
    candidates.append(MASTERS / f"{track_id}.wav")
    for p in candidates:
        if p.is_file():
            return p
    return None


def attach_stream(entry: dict, dry_run: bool = False) -> bool:
    track_id = entry["track_id"]
    src = find_stream_source(track_id)
    if not src:
        print(f"SKIP {track_id}: no stream master in preview")
        return False

    dest_dir = PUBLIC / "catalog" / track_id
    dest_m4a = dest_dir / "stream.m4a"
    game_sec = float(entry.get("duration_sec", 0))

    if src.suffix.lower() == ".wav":
        if dry_run:
            print(f"WOULD transcode {src} -> {dest_m4a}")
            return True
        tmp = dest_dir / "_stream_src.wav"
        shutil.copy2(src, tmp)
        wav_to_m4a(tmp, dest_m4a)
        tmp.unlink(missing_ok=True)
    else:
        if dry_run:
            print(f"WOULD copy {src} -> {dest_m4a}")
            return True
        dest_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest_m4a)

    stream_sec = round(m4a_duration_sec(dest_m4a), 1)
    if game_sec and stream_sec < game_sec * MIN_STREAM_RATIO:
        print(
            f"WARN {track_id}: stream {stream_sec}s < {game_sec * MIN_STREAM_RATIO:.0f}s "
            f"(game clip may be same file — need a longer master)"
        )

    entry["stream_audio"] = f"/catalog/{track_id}/stream.m4a"
    entry["stream_duration_sec"] = int(round(stream_sec))
    print(f"OK {track_id}: stream {stream_sec}s from {src.name}")
    return True


def set_planned_targets(catalog: dict) -> None:
    """Stage1 marketing targets when full masters are not ingested yet."""
    for entry in catalog.get("tracks", []):
        if entry.get("stream_audio"):
            continue
        game = int(entry.get("duration_sec", 75))
        target = 198 if game >= 70 else 180
        if not entry.get("stream_duration_sec"):
            entry["stream_duration_sec"] = target


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest streaming full masters into BeatScape catalog")
    parser.add_argument("--track", help="Single track_id (default: all in catalog)")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--targets-only", action="store_true", help="Only set planned stream_duration_sec")
    args = parser.parse_args()

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    tracks = catalog.get("tracks", [])
    if args.track:
        tracks = [t for t in tracks if t.get("track_id") == args.track]
        if not tracks:
            raise SystemExit(f"track not in catalog: {args.track}")

    attached = 0
    if not args.targets_only:
        for entry in tracks:
            if attach_stream(entry, dry_run=args.dry_run):
                attached += 1

    set_planned_targets(catalog)

    if args.dry_run:
        print(f"Dry run — would write {CATALOG_PATH}")
        return

    CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {CATALOG_PATH} ({attached} stream files attached)")


if __name__ == "__main__":
    main()
