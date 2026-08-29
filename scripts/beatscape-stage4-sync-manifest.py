#!/usr/bin/env python3
"""Rewrite beatscape-stage4-manifest.json from beatscape-stage4-specs.py."""

from __future__ import annotations

import importlib.util
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
MANIFEST = SCRIPTS / "beatscape-stage4-manifest.json"


def main() -> int:
    spec = importlib.util.spec_from_file_location("s4", SCRIPTS / "beatscape-stage4-specs.py")
    m = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(m)
    tracks = m.stage4_tracks()
    payload = {
        "version": 1,
        "stage": 4,
        "wave": "resonance-1",
        "authority": "docs/BEATSCAPE-STAGE4-RESONANCE-MUSIC.md",
        "updated": date.today().isoformat(),
        "tracks": tracks,
    }
    MANIFEST.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {MANIFEST} ({len(tracks)} tracks)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
