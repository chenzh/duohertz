#!/usr/bin/env python3
"""Draft new one/two-key charts from audible onsets in a duohertz game mix.

The generated charts are technical candidates. They still need full-track
human playtesting and must pass duohertz-candidate-gate.py before staging.
"""

from __future__ import annotations

import argparse
import bisect
import importlib.util
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TIERS = ("easy", "standard", "hard")
MAX_ONSET_DISTANCE = 0.040
START_PADDING = 1.8
END_PADDING = 2.0
MAX_ESTIMATED_BPM_DEVIATION = 0.02


def load_audio_analysis():
    path = ROOT / "scripts/beatscape-audio.py"
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_duohertz", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load BeatScape audio analysis")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def nearest_onset(at: float, onsets: list[float], energies: list[float], *, max_distance: float) -> float | None:
    """Choose an audible transient close to this grid point, never a bare grid time."""
    index = bisect.bisect_left(onsets, at)
    choices = []
    for candidate in range(max(0, index - 2), min(len(onsets), index + 3)):
        distance = abs(onsets[candidate] - at)
        if distance <= max_distance:
            choices.append((energies[candidate], -distance, onsets[candidate]))
    return max(choices)[2] if choices else None


def choose_chart_bpm(target_bpm: float, estimated_bpm: float) -> float:
    """Use the audio's measured pulse only when it stays near the recipe target."""
    if not math.isfinite(target_bpm) or target_bpm <= 0 \
            or not math.isfinite(estimated_bpm) or estimated_bpm <= 0:
        raise ValueError("Target and estimated BPM must be finite and positive")
    deviation = abs(estimated_bpm - target_bpm) / target_bpm
    if deviation > MAX_ESTIMATED_BPM_DEVIATION:
        raise ValueError(
            f"Estimated audio BPM {estimated_bpm:.2f} differs from target {target_bpm:.2f} "
            f"by {deviation:.1%}; remake or inspect the master before charting"
        )
    return round(estimated_bpm, 3)


def make_chart(*, track_id: str, tier: str, bpm: float, duration: float,
               onsets: list[float], energies: list[float], phase_sec: float = 0.0) -> dict:
    if tier not in TIERS or bpm <= 0 or duration <= START_PADDING + END_PADDING:
        raise ValueError("Invalid chart tier, BPM or duration")
    if len(onsets) != len(energies) or onsets != sorted(onsets):
        raise ValueError("Onsets and energies must be sorted and paired")
    sixteenth = 60.0 / bpm / 4
    # Grid-fit allows ±6% of a beat. Keep a margin for rounded note times;
    # a fixed 40 ms search is too loose at fast DnB tempos.
    onset_distance = min(MAX_ONSET_DISTANCE, 0.05 * (60.0 / bpm))
    notes = []
    used_times: set[float] = set()
    slot = 0
    while (at := phase_sec + slot * sixteenth) < duration - END_PADDING:
        if at < START_PADDING:
            slot += 1
            continue
        selected = (tier == "easy" and slot % 8 == 0) or (tier == "standard" and slot % 4 == 0) \
            or (tier == "hard" and slot % 2 == 0)
        if selected:
            onset = nearest_onset(at, onsets, energies, max_distance=onset_distance)
            if onset is not None:
                timestamp = round(onset, 3)
                if timestamp not in used_times:
                    used_times.add(timestamp)
                    if tier == "hard" and slot % 32 == 0:
                        note = {"id": f"h-{slot}", "type": "chord", "t": timestamp, "keys": [0, 1]}
                    else:
                        key = 0 if tier == "easy" else (slot // (4 if tier == "standard" else 2)) % 2
                        note = {"id": f"{tier[0]}-{slot}", "type": "tap", "t": timestamp, "key": key}
                    notes.append(note)
        slot += 1
    if not notes:
        raise ValueError(f"No audible on-grid events for {tier}")
    return {
        "format": 2, "theme": "duohertz", "track_id": track_id, "tier": tier,
        "input_count": 1 if tier == "easy" else 2,
        "bpm": bpm, "audio_offset_ms": 0,
        "total_notes": sum(2 if note["type"] == "chord" else 1 for note in notes),
        "notes": notes,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--audio", type=Path, required=True)
    parser.add_argument("--track-id", required=True)
    parser.add_argument("--bpm", type=float, required=True)
    parser.add_argument("--use-estimated-bpm", action="store_true",
                        help="Chart to the measured AAC pulse when within 2%% of the recipe BPM")
    parser.add_argument("--phase-ms", type=float, default=0.0)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    if not math.isfinite(args.bpm) or not math.isfinite(args.phase_ms):
        parser.error("BPM and phase must be finite")
    analysis = load_audio_analysis().analyze_audio(args.audio, args.bpm)
    chart_bpm = choose_chart_bpm(args.bpm, analysis.bpm) if args.use_estimated_bpm else args.bpm
    args.out.mkdir(parents=True, exist_ok=True)
    print(f"Analyzed {args.audio}: {analysis.duration_sec:.3f}s, {len(analysis.onsets_sec)} onsets, "
          f"estimated BPM {analysis.bpm:.3f}, chart BPM {chart_bpm:.3f}, target BPM {args.bpm:.3f}")
    for tier in TIERS:
        chart = make_chart(track_id=args.track_id, tier=tier, bpm=chart_bpm,
                           duration=analysis.duration_sec, onsets=analysis.onsets_sec,
                           energies=analysis.onset_energies, phase_sec=args.phase_ms / 1000)
        path = args.out / f"{tier}.json"
        path.write_text(json.dumps(chart, indent=2) + "\n", encoding="utf-8")
        print(f"{tier}: {len(chart['notes'])} objects / {chart['total_notes']} judgments -> {path}")


if __name__ == "__main__":
    main()
