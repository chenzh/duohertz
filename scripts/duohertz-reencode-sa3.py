#!/usr/bin/env python3
"""Re-encode one staged SA3 candidate when original art sources are unavailable.

Copies the candidate to a separate output root, verifies the source WAV hash,
and updates audio/chart hashes. The original candidate remains untouched.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
STAGE_SPEC = importlib.util.spec_from_file_location("duohertz_stage_sa3_reencode", ROOT / "scripts/duohertz-stage-sa3.py")
assert STAGE_SPEC and STAGE_SPEC.loader
STAGE = importlib.util.module_from_spec(STAGE_SPEC)
STAGE_SPEC.loader.exec_module(STAGE)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def reencode(candidate: Path, master: Path, output_root: Path, *, gain_db: float,
             stream_limiter: float | None = None, game_gain_db: float | None = None) -> Path:
    if not math.isfinite(gain_db) or not -30 <= gain_db <= 0:
        raise ValueError("Invalid stream gain")
    if game_gain_db is not None and (not math.isfinite(game_gain_db) or not -30 <= game_gain_db <= 0):
        raise ValueError("Invalid game gain")
    if stream_limiter is not None and (not math.isfinite(stream_limiter)
                                       or not 0.1 <= stream_limiter <= 1.0):
        raise ValueError("Invalid stream limiter")
    manifest = json.loads((candidate / "manifest.json").read_text(encoding="utf-8"))
    if candidate.name != manifest.get("track_id") or not candidate.is_dir() or candidate.is_symlink():
        raise ValueError("Candidate identity mismatch")
    if manifest.get("source_master_sha256") != sha(master):
        raise ValueError("Source master hash does not match candidate provenance")
    target = output_root / candidate.name
    if target.exists():
        raise FileExistsError(f"Refusing to overwrite rebuild: {target}")
    shutil.copytree(candidate, target)
    try:
        STAGE.encode(master, target / "stream.m4a", gain_db=gain_db, limiter=stream_limiter)
        if game_gain_db is not None:
            duration = float(manifest["duration_sec"])
            STAGE.encode(master, target / "audio.m4a", duration, gain_db=game_gain_db)
            STAGE.encode(master, target / "preview_48s.m4a", min(duration, 48), gain_db=game_gain_db)
            subprocess.run([
                "python3", str(ROOT / "scripts/duohertz-chartgen.py"),
                "--audio", str(target / "audio.m4a"), "--track-id", candidate.name,
                "--bpm", str(manifest.get("target_bpm", manifest["bpm"])),
                "--use-estimated-bpm", "--out", str(target),
            ], check=True)
            manifest["bpm"] = json.loads((target / "easy.json").read_text(encoding="utf-8"))["bpm"]
        manifest["audio_rework"] = {
            "source_master_sha256": sha(master),
            "stream_gain_db": gain_db,
            "stream_limiter": stream_limiter,
            "game_gain_db": game_gain_db,
            "source_script": "scripts/duohertz-reencode-sa3.py",
            "reason": "Decoded AAC true-peak screen",
        }
        manifest["creation_method"] += (f" Re-encoded from the same source WAV: stream gain {gain_db:g} dB"
                                        + (f", stream limiter {stream_limiter:g} amplitude without makeup gain"
                                           if stream_limiter is not None else "")
                                        + (f", game/preview gain {game_gain_db:g} dB and regenerated charts"
                                           if game_gain_db is not None else "") + ".")
        manifest["files_sha256"] = {name: sha(target / name) for name in manifest["files_sha256"]}
        (target / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        subprocess.run(["python3", str(ROOT / "scripts/duohertz-candidate-gate.py"),
                        "--candidate", str(target)], check=True)
        subprocess.run(["python3", str(ROOT / "scripts/duohertz-audio-gate.py"),
                        "--candidate", str(target)], check=True)
    except BaseException:
        shutil.rmtree(target)
        raise
    print(f"Rebuilt candidate at {target}; original unchanged")
    return target


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--master", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--gain-db", type=float, required=True)
    parser.add_argument("--stream-limiter", type=float)
    parser.add_argument("--game-gain-db", type=float)
    args = parser.parse_args()
    reencode(args.candidate.resolve(), args.master.resolve(), args.output_root.resolve(),
             gain_db=args.gain_db, stream_limiter=args.stream_limiter, game_gain_db=args.game_gain_db)


if __name__ == "__main__":
    main()
