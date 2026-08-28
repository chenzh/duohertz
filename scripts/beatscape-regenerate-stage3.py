#!/usr/bin/env python3
"""Regenerate Stage3 masters with locked TRACK_PROMPTS, then re-ingest catalog."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
MANIFEST = SCRIPTS / "beatscape-stage3-manifest.json"
LOG = ROOT / "worklog" / "stage3-regenerate.log"


def load_stage3() -> list[dict]:
    spec = importlib.util.spec_from_file_location("s3", SCRIPTS / "beatscape-stage3-specs.py")
    m = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(m)
    return m.stage3_tracks()


def run(cmd: list[str]) -> None:
    line = "+ " + " ".join(cmd) + "\n"
    print(line, end="")
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(line)
        subprocess.run(cmd, cwd=ROOT, check=True, stdout=f, stderr=subprocess.STDOUT)


def main() -> int:
    tracks = load_stage3()
    MANIFEST.write_text(
        json.dumps({"version": 1, "stage": 3, "tracks": tracks}, indent=2) + "\n",
        encoding="utf-8",
    )
    LOG.write_text(f"# Stage3 regenerate — {len(tracks)} tracks\n", encoding="utf-8")

    for tr in tracks:
        tid = tr["track_id"]
        run([
            "python3",
            str(SCRIPTS / "beatscape-generate-tracks.py"),
            "--manifest",
            str(MANIFEST),
            "--track",
            tid,
            "--force",
        ])
        t0 = str(tr.get("clip_t0", 0))
        run([
            "python3",
            str(SCRIPTS / "beatscape-clip-game.py"),
            "--track",
            tid,
            "--t0",
            t0,
            "--duration",
            str(tr["duration_sec"]),
        ])

    run(["python3", str(SCRIPTS / "beatscape-stitch-stream.py"), "--all-stage3"])
    run(["python3", str(SCRIPTS / "beatscape-ingest-stage3.py")])
    run(["python3", str(SCRIPTS / "beatscape-chartgen.py")])
    run(["python3", str(SCRIPTS / "beatscape-ingest-stream.py")])
    run([
        "python3",
        str(SCRIPTS / "beatscape-audit.py"),
        "--dir",
        "apps/beatscape/public",
        "--catalog",
        "apps/beatscape/public/catalog.json",
    ])
    run(["python3", str(SCRIPTS / "beatscape-earcheck.py")])
    run(["python3", str(SCRIPTS / "beatscape-catalog-status.py"), "--stage", "3"])
    print(f"Done — log: {LOG}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
