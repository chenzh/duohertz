#!/usr/bin/env python3
"""Clip game slice m4a from a WAV master (PRD §6.0.8 · §6.0.27).

Usage:
  python3 scripts/beatscape-clip-game.py --track bs-s1-01 --t0 0 --duration 75
  python3 scripts/beatscape-clip-game.py --track bs-s2-01 --t0 12 --duration 90
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "data" / "beatscape-preview"
MASTERS = PREVIEW / "masters"
CATALOG = ROOT / "apps" / "beatscape" / "public" / "catalog.json"

_spec = importlib.util.spec_from_file_location(
    "beatscape_track_registry", ROOT / "scripts" / "beatscape-track-registry.py"
)
_reg = importlib.util.module_from_spec(_spec)
sys.modules["beatscape_track_registry"] = _reg
assert _spec.loader is not None
_spec.loader.exec_module(_reg)
PREVIEW_STEM = _reg.PREVIEW_STEM_BY_ID
LOCKED = _reg.LOCKED_BY_ID


def find_master(track_id: str) -> Path | None:
    stem = PREVIEW_STEM.get(track_id, "")
    for p in (MASTERS / f"{track_id}.wav", MASTERS / f"{stem}.wav", PREVIEW / f"{stem}.wav"):
        if p.is_file():
            return p
    return None


def normalize_pcm_wav(src: Path) -> tuple[Path, Path | None]:
    """Return PCM wav path; second value is temp dir to clean up (or None)."""
    try:
        with wave.open(str(src), "rb") as r:
            if r.getsampwidth() == 2:
                return src, None
    except wave.Error:
        pass
    tmp_dir = Path(tempfile.mkdtemp(prefix="bs-clip-"))
    out = tmp_dir / f"{src.stem}-pcm.wav"
    subprocess.run(
        ["afconvert", "-f", "WAVE", "-d", "LEI16@44100", str(src), str(out)],
        check=True,
    )
    return out, tmp_dir


def clip_wav(src: Path, dest: Path, t0: float, duration: float) -> float:
    pcm_src, cleanup = normalize_pcm_wav(src)
    try:
        with wave.open(str(pcm_src), "rb") as r:
            params = r.getparams()
            rate = r.getframerate()
            frame_bytes = params.sampwidth * params.nchannels
            start_frame = int(round(t0 * rate))
            nframes = int(round(duration * rate))
            r.setpos(min(start_frame, r.getnframes()))
            chunk = r.readframes(nframes)
        dest.parent.mkdir(parents=True, exist_ok=True)
        with wave.open(str(dest), "wb") as w:
            w.setparams(params)
            w.writeframes(chunk)
        return len(chunk) / frame_bytes / rate
    finally:
        if cleanup:
            import shutil

            shutil.rmtree(cleanup, ignore_errors=True)


def wav_to_m4a(src: Path, dest: Path) -> None:
    subprocess.run(
        ["afconvert", "-f", "m4af", "-d", "aac", "-b", "256000", str(src), str(dest)],
        check=True,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Clip BeatScape game slice from master WAV")
    parser.add_argument("--track", required=True, help="track_id e.g. bs-s1-01")
    parser.add_argument("--t0", type=float, default=None, help="Clip start (seconds); default 0 or track clip_t0")
    parser.add_argument("--duration", type=float, help="Clip length (default: catalog duration_sec)")
    parser.add_argument("--out", type=Path, help="Output m4a (default: preview/{stem}.m4a)")
    parser.add_argument("--copy-catalog", action="store_true", help="Also copy to public/catalog/{id}/audio.m4a")
    args = parser.parse_args()

    meta = LOCKED.get(args.track)
    if not meta:
        raise SystemExit(f"unknown track: {args.track}")

    stem = meta.get("preview_stem") or PREVIEW_STEM.get(args.track, args.track)
    master = find_master(args.track)
    if not master:
        raise SystemExit(f"master not found for {args.track}")

    dur = args.duration
    if dur is None:
        if CATALOG.is_file():
            cat = json.loads(CATALOG.read_text(encoding="utf-8"))
            for t in cat.get("tracks", []):
                if t.get("track_id") == args.track:
                    dur = float(t.get("duration_sec", meta.get("duration_sec", 75)))
                    break
        if dur is None:
            dur = float(meta.get("duration_sec", 75))

    t0 = 0.0 if args.t0 is None else args.t0
    if args.t0 is None and meta.get("clip_t0") is not None:
        t0 = float(meta["clip_t0"])

    out_m4a = args.out or (PREVIEW / meta.get("preview_file", f"{stem}.m4a"))
    tmp_wav = PREVIEW / "clips" / f"{stem}-game.wav"
    clipped = clip_wav(master, tmp_wav, t0, dur)
    wav_to_m4a(tmp_wav, out_m4a)
    print(f"OK {args.track}: {clipped:.2f}s (t0={t0}) -> {out_m4a}")

    if args.copy_catalog:
        dest = ROOT / "apps" / "beatscape" / "public" / "catalog" / args.track / "audio.m4a"
        dest.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["cp", str(out_m4a), str(dest)], check=True)
        print(f"  copied -> {dest}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
