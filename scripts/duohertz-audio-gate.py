#!/usr/bin/env python3
"""Measure decoded AAC loudness and true peak for isolated duohertz candidates.

This is a technical screening check, not a mastering or listening approval.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import math
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / "apps/beatscape/candidates/duohertz"
AUDIO_FILES = ("audio.m4a", "preview_48s.m4a", "stream.m4a")
MEASUREMENT = re.compile(r'"input_i"\s*:\s*"([^\"]+)".*?"input_tp"\s*:\s*"([^\"]+)"', re.S)


def parse_measurement(output: str) -> tuple[float, float]:
    match = MEASUREMENT.search(output)
    if match is None:
        raise ValueError("ffmpeg did not return integrated loudness and true peak")
    loudness, true_peak = (float(value) for value in match.groups())
    if not math.isfinite(loudness) or not math.isfinite(true_peak):
        raise ValueError("ffmpeg returned non-finite loudness or true peak")
    return loudness, true_peak


def measure(path: Path) -> tuple[Path, float, float]:
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
         "-af", "loudnorm=I=-14:TP=-1:LRA=7:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    )
    return path, *parse_measurement(result.stderr)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--candidate", type=Path)
    group.add_argument("--all-staged", action="store_true")
    parser.add_argument("--limit-dbtp", type=float, default=-1.0)
    args = parser.parse_args()
    if not math.isfinite(args.limit_dbtp):
        parser.error("--limit-dbtp must be finite")
    candidates = sorted(CANDIDATES.glob("dh-*")) if args.all_staged else [args.candidate]
    if not candidates or any(not path.is_dir() or path.is_symlink() for path in candidates):
        print("FAIL No valid candidate directories")
        return 1
    files = [candidate / name for candidate in candidates for name in AUDIO_FILES]
    if any(not path.is_file() or path.is_symlink() for path in files):
        print("FAIL Missing or linked candidate audio")
        return 1
    try:
        with ThreadPoolExecutor(max_workers=6) as pool:
            measurements = list(pool.map(measure, files))
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f"FAIL Audio measurement: {error}")
        return 1
    failures = [(path, peak) for path, _, peak in measurements if peak > args.limit_dbtp]
    for path, peak in failures:
        print(f"FAIL {path.parent.name}/{path.name}: {peak:.2f} dBTP > {args.limit_dbtp:.2f} dBTP")
    print(f"Audio true-peak screen: {len(measurements) - len(failures)}/{len(measurements)} files PASS; "
          f"integrated loudness {min(item[1] for item in measurements):.2f} to "
          f"{max(item[1] for item in measurements):.2f} LUFS. Human loudness/quality review remains required.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
