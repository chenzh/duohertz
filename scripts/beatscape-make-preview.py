#!/usr/bin/env python3
"""Create preview_48s.m4a marketing clips from game or stream audio."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "apps" / "beatscape" / "public" / "catalog.json"
PUBLIC = CATALOG.parent
PREVIEW_SEC = 48.0


def clip_wav_to_m4a(src_wav: Path, dest_m4a: Path, duration: float = PREVIEW_SEC) -> None:
    with wave.open(str(src_wav), "rb") as r:
        params = r.getparams()
        rate = r.getframerate()
        n = min(int(duration * rate), r.getnframes())
        chunk = r.readframes(n)
    tmp = dest_m4a.with_suffix(".wav")
    tmp.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(tmp), "wb") as w:
        w.setparams(params)
        w.writeframes(chunk)
    subprocess.run(
        ["afconvert", "-f", "m4af", "-d", "aac", "-b", "192000", str(tmp), str(dest_m4a)],
        check=True,
    )
    tmp.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--track", help="Single track_id")
    args = parser.parse_args()

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    tracks = catalog.get("tracks", [])
    if args.track:
        tracks = [t for t in tracks if t.get("track_id") == args.track]

    for entry in tracks:
        tid = entry["track_id"]
        audio_rel = entry.get("stream_audio") or entry.get("audio")
        if not audio_rel:
            print(f"SKIP {tid}: no audio")
            continue
        src = PUBLIC / str(audio_rel).lstrip("/")
        if not src.is_file():
            print(f"SKIP {tid}: missing {src}")
            continue
        dest = PUBLIC / "catalog" / tid / "preview_48s.m4a"
        # decode m4a via afconvert round-trip
        tmp_wav = dest.parent / "_preview_src.wav"
        subprocess.run(
            ["afconvert", "-f", "WAVE", "-d", "LEI16@44100", str(src), str(tmp_wav)],
            check=True,
        )
        clip_wav_to_m4a(tmp_wav, dest)
        tmp_wav.unlink(missing_ok=True)
        entry["preview"] = f"/catalog/{tid}/preview_48s.m4a"
        print(f"OK {tid} -> {dest.name}")

    CATALOG.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
