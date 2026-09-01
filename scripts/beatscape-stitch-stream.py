#!/usr/bin/env python3
"""Loop a WAV master to a target stream duration (PRD §6.0.27 MVP).

When a full 3-minute SA3 master is not yet available, loop the game-grade
master to reach stream_duration_sec (≥ game × 1.8) for catalog / audit gates.

Usage:
  python3 scripts/beatscape-stitch-stream.py --track bs-s1-01
  python3 scripts/beatscape-stitch-stream.py --all-stage1
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
STREAM_DIR = PREVIEW / "stream"
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
STAGE1 = _reg.STAGE1_TRACKS
STAGE2 = _reg.STAGE2_TRACKS

_s3 = importlib.util.spec_from_file_location(
    "beatscape_stage3_specs", ROOT / "scripts" / "beatscape-stage3-specs.py"
)
_m3 = importlib.util.module_from_spec(_s3)
sys.modules["beatscape_stage3_specs"] = _m3
assert _s3.loader is not None
_s3.loader.exec_module(_m3)
STAGE3 = _m3.stage3_tracks()

_s4 = importlib.util.spec_from_file_location(
    "beatscape_stage4_specs", ROOT / "scripts" / "beatscape-stage4-specs.py"
)
_m4 = importlib.util.module_from_spec(_s4)
sys.modules["beatscape_stage4_specs"] = _m4
assert _s4.loader is not None
_s4.loader.exec_module(_m4)
STAGE4 = _m4.stage4_tracks()

_s6 = importlib.util.spec_from_file_location(
    "beatscape_stage6_specs", ROOT / "scripts" / "beatscape-stage6-specs.py"
)
_m6 = importlib.util.module_from_spec(_s6)
sys.modules["beatscape_stage6_specs"] = _m6
assert _s6.loader is not None
_s6.loader.exec_module(_m6)
STAGE6 = _m6.stage6_tracks()

_p3 = importlib.util.spec_from_file_location(
    "beatscape_p3_specs", ROOT / "scripts" / "beatscape-p3-specs.py"
)
_m3p = importlib.util.module_from_spec(_p3)
sys.modules["beatscape_p3_specs"] = _m3p
assert _p3.loader is not None
_p3.loader.exec_module(_m3p)
STAGE_P3 = _m3p.p3_tracks()


def find_master(track_id: str, stem: str) -> Path | None:
    for p in (
        MASTERS / f"{track_id}.wav",
        MASTERS / f"{stem}.wav",
        PREVIEW / f"{stem}.wav",
    ):
        if p.is_file():
            return p
    return None


def normalize_pcm_wav(src: Path) -> tuple[Path, Path | None]:
    try:
        with wave.open(str(src), "rb") as r:
            if r.getsampwidth() == 2:
                return src, None
    except wave.Error:
        pass
    tmp_dir = Path(tempfile.mkdtemp(prefix="bs-stitch-"))
    out = tmp_dir / f"{src.stem}-pcm.wav"
    subprocess.run(
        ["afconvert", "-f", "WAVE", "-d", "LEI16@44100", str(src), str(out)],
        check=True,
    )
    return out, tmp_dir


def loop_wav(src: Path, dest: Path, target_sec: float) -> float:
    pcm_src, cleanup = normalize_pcm_wav(src)
    try:
        dest.parent.mkdir(parents=True, exist_ok=True)
        with wave.open(str(pcm_src), "rb") as r:
            params = r.getparams()
            rate = r.getframerate()
            frames = r.readframes(r.getnframes())
        if not frames:
            raise ValueError(f"empty wav: {src}")
        sampwidth = params.sampwidth
        nchannels = params.nchannels
        frame_bytes = sampwidth * nchannels
        target_frames = int(round(target_sec * rate))
        need_bytes = target_frames * frame_bytes
        loops = (need_bytes + len(frames) - 1) // len(frames)
        out = (frames * loops)[:need_bytes]
        with wave.open(str(dest), "wb") as w:
            w.setparams(params)
            w.writeframes(out)
        return len(out) / frame_bytes / rate
    finally:
        if cleanup:
            import shutil

            shutil.rmtree(cleanup, ignore_errors=True)


def wav_to_m4a(src: Path, dest: Path) -> None:
    subprocess.run(
        ["afconvert", "-f", "m4af", "-d", "aac", "-b", "256000", str(src), str(dest)],
        check=True,
    )


def stream_target_sec(track: dict) -> int:
    game = int(track.get("duration_sec", 75))
    min_stream = max(180, int(game * 1.8 + 0.999))
    planned = int(track.get("stream_duration_sec") or 0)
    if planned >= min_stream:
        return planned
    return min_stream


def stitch_track(track_id: str, meta: dict, dry_run: bool = False) -> bool:
    stem = PREVIEW_STEM.get(track_id, track_id)
    master = find_master(track_id, stem)
    if not master:
        print(f"SKIP {track_id}: no master wav")
        return False
    target = stream_target_sec(meta)
    out_wav = STREAM_DIR / f"{stem}-full.wav"
    out_m4a = STREAM_DIR / f"{stem}-full.m4a"
    if dry_run:
        print(f"WOULD stitch {master.name} -> {target}s at {out_m4a}")
        return True
    dur = loop_wav(master, out_wav, target)
    wav_to_m4a(out_wav, out_m4a)
    print(f"OK {track_id}: stream {dur:.1f}s -> {out_m4a.name}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Stitch looped stream masters for BeatScape")
    parser.add_argument("--track", help="Single track_id")
    parser.add_argument("--all-stage1", action="store_true")
    parser.add_argument("--all-stage2", action="store_true")
    parser.add_argument("--all-stage3", action="store_true")
    parser.add_argument("--all-stage4", action="store_true")
    parser.add_argument("--all-stage6", action="store_true")
    parser.add_argument("--all-p3", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    catalog_meta = {}
    if CATALOG.is_file():
        cat = json.loads(CATALOG.read_text(encoding="utf-8"))
        catalog_meta = {t["track_id"]: t for t in cat.get("tracks", [])}

    tracks: list[dict] = []
    if args.all_stage1:
        tracks.extend(STAGE1)
    if args.all_stage2:
        tracks.extend(STAGE2)
    if args.all_stage3:
        tracks.extend(STAGE3)
    if args.all_stage4:
        tracks.extend(STAGE4)
    if args.all_stage6:
        tracks.extend(STAGE6)
    if args.all_p3:
        tracks.extend(STAGE_P3)
    if args.track:
        hit = next(
            (t for t in STAGE1 + STAGE2 + STAGE3 + STAGE4 + STAGE6 + STAGE_P3 if t["track_id"] == args.track),
            None,
        )
        if not hit:
            raise SystemExit(f"unknown track: {args.track}")
        tracks = [hit]
    if not tracks:
        parser.error("specify --track, --all-stage1, --all-stage2, --all-stage3, --all-stage4, --all-stage6, or --all-p3")

    ok = 0
    for tr in tracks:
        tid = tr["track_id"]
        meta = {**tr, **catalog_meta.get(tid, {})}
        if stitch_track(tid, meta, dry_run=args.dry_run):
            ok += 1
    return 0 if ok == len(tracks) else 1


if __name__ == "__main__":
    sys.exit(main())
