#!/usr/bin/env python3
"""End-to-end Stage4 wave-1: generate → clip → stitch → ingest → chart → stream → QA."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
MANIFEST = SCRIPTS / "beatscape-stage4-manifest.json"


def load_stage4() -> list[dict]:
    spec = importlib.util.spec_from_file_location("s4", SCRIPTS / "beatscape-stage4-specs.py")
    m = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(m)
    return m.stage4_tracks()


def write_manifest() -> None:
    tracks = load_stage4()
    MANIFEST.write_text(
        json.dumps(
            {
                "version": 1,
                "stage": 4,
                "wave": "resonance-1",
                "authority": "docs/BEATSCAPE-STAGE4-RESONANCE-MUSIC.md",
                "updated": tracks[0]["track_id"] if tracks else "",
                "tracks": tracks,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, cwd=ROOT, check=True)


def main() -> int:
    write_manifest()
    tracks = load_stage4()
    for tr in tracks:
        run(["python3", str(SCRIPTS / "beatscape-generate-tracks.py"), "--manifest", str(MANIFEST), "--track", tr["track_id"]])
        run([
            "python3",
            str(SCRIPTS / "beatscape-clip-game.py"),
            "--track",
            tr["track_id"],
            "--t0",
            "0",
            "--duration",
            str(tr["duration_sec"]),
        ])
    run(["python3", str(SCRIPTS / "beatscape-stitch-stream.py"), "--all-stage4"])
    run(["python3", str(SCRIPTS / "beatscape-ingest-stage4.py")])
    for tr in tracks:
        run(["python3", str(SCRIPTS / "beatscape-chartgen.py"), "--track", tr["track_id"]])
    run(["python3", str(SCRIPTS / "beatscape-ingest-stream.py")])
    run(["python3", str(SCRIPTS / "beatscape-cover.py"), "--all-catalog"])
    run(["python3", str(SCRIPTS / "beatscape-generate-og.py"), "--all-catalog"])
    run(["python3", str(SCRIPTS / "beatscape-audit.py"), "--dir", "apps/beatscape/public", "--catalog", "apps/beatscape/public/catalog.json"])
    run(["python3", str(SCRIPTS / "beatscape-earcheck.py")])
    run(["python3", str(SCRIPTS / "beatscape-catalog-status.py"), "--stage", "4"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
