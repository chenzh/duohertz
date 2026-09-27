#!/usr/bin/env python3
"""Derive small card images from hash-checked duohertz covers, entirely offline."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / "apps/beatscape/candidates/duohertz"
SIZE = 240
QUALITY = 76


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def encode(source: Path, destination: Path) -> str:
    """Return the derived-file hash. Originals and manifests are never changed."""
    if source.is_symlink() or not source.is_file():
        raise ValueError(f"Missing or linked cover source: {source}")
    if destination.is_symlink() or source.resolve() == destination.resolve():
        raise ValueError("Derived thumbnail must be separate from its source")
    if not shutil.which("cwebp"):
        raise RuntimeError("Local cwebp is required to derive card thumbnails")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="duohertz-thumb-", dir=destination.parent) as scratch:
        staged = Path(scratch) / "cover-thumb.webp"
        subprocess.run(["cwebp", "-quiet", "-q", str(QUALITY), "-m", "3", "-resize",
                        str(SIZE), str(SIZE), str(source), "-o", str(staged)],
                       check=True, capture_output=True)
        data = staged.read_bytes()
        if len(data) > 100_000 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
            raise ValueError(f"Invalid or oversized derived thumbnail: {source}")
        staged.replace(destination)
    return sha(destination)


def candidates(root: Path) -> list[dict]:
    source = ROOT / "scripts/duohertz-review-worksheet.py"
    spec = importlib.util.spec_from_file_location("duohertz_worksheet_for_thumbs", source)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load the candidate asset checker")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module.candidates(root)


def build(root: Path) -> dict:
    rows = candidates(root)
    target = root / "thumbnails"
    target.mkdir(exist_ok=True)

    def one(row: dict) -> dict:
        track_id = row["track_id"]
        source = root / track_id / "cover-art.png"
        fingerprint = row["assets_sha256"]["cover-art.png"]
        if sha(source) != fingerprint:
            raise ValueError(f"Cover changed while deriving thumbnail: {track_id}")
        output = target / f"{track_id}.webp"
        derived_hash = encode(source, output)
        if sha(source) != fingerprint:
            raise ValueError(f"Cover changed while deriving thumbnail: {track_id}")
        return {"track_id": track_id, "cover_sha256": fingerprint, "thumbnail_sha256": derived_hash,
                "thumbnail_bytes": output.stat().st_size}

    with ThreadPoolExecutor(max_workers=6) as pool:
        entries = list(pool.map(one, rows))
    report = {"schema": 1, "brand": "duohertz", "source": "cover-art.png",
              "size_px": SIZE, "quality": QUALITY, "tracks": entries}
    (target / "index.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def verify(root: Path) -> dict:
    rows = candidates(root)
    target = root / "thumbnails"
    report = json.loads((target / "index.json").read_text(encoding="utf-8"))
    if report.get("schema") != 1 or report.get("brand") != "duohertz" \
            or report.get("source") != "cover-art.png" or report.get("size_px") != SIZE \
            or report.get("quality") != QUALITY or not isinstance(report.get("tracks"), list):
        raise ValueError("Invalid thumbnail index")
    by_id = {row["track_id"]: row for row in rows}
    indexed = {entry.get("track_id") for entry in report["tracks"] if isinstance(entry, dict)}
    files = {path.stem for path in target.glob("dh-*.webp")}
    if len(report["tracks"]) != len(rows) or indexed != set(by_id) or files != set(by_id):
        raise ValueError("Thumbnail set does not match current candidates")
    for entry in report["tracks"]:
        track_id = entry["track_id"]
        source = root / track_id / "cover-art.png"
        thumb = target / f"{track_id}.webp"
        data = thumb.read_bytes()
        if entry.get("cover_sha256") != by_id[track_id]["assets_sha256"]["cover-art.png"] \
                or sha(source) != entry["cover_sha256"] \
                or sha(thumb) != entry.get("thumbnail_sha256") \
                or len(data) != entry.get("thumbnail_bytes") \
                or len(data) > 100_000 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
            raise ValueError(f"Stale or invalid thumbnail: {track_id}")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=CANDIDATES)
    parser.add_argument("--check", action="store_true", help="Verify existing thumbnails without rewriting them")
    args = parser.parse_args()
    root = args.root.resolve()
    report = verify(root) if args.check else build(root)
    original_bytes = sum((root / row["track_id"] / "cover-art.png").stat().st_size for row in report["tracks"])
    thumb_bytes = sum(row["thumbnail_bytes"] for row in report["tracks"])
    action = "Verified" if args.check else "Derived"
    print(f"{action} {len(report['tracks'])} local card images: {original_bytes:,} -> {thumb_bytes:,} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
