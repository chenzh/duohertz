#!/usr/bin/env python3
"""BeatScape chart generator — onset-based auto-chart from catalog audio.

Analyzes each track's m4a (BPM, first-beat offset, onsets) and places notes on
real hit points instead of a synthetic BPM grid. Regenerates chart JSON + updates
catalog BPM when detection diverges from hint.

Usage:
  python3 scripts/beatscape-chartgen.py
  python3 scripts/beatscape-chartgen.py --track bs-s1-02
  python3 scripts/beatscape-chartgen.py --analyze-only
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = ROOT / "apps" / "beatscape" / "public" / "catalog"
CATALOG_JSON = CATALOG_DIR.parent / "catalog.json"

# Load beatscape-audio from same directory (no package install required)
_spec = importlib.util.spec_from_file_location(
    "beatscape_audio", ROOT / "scripts" / "beatscape-audio.py"
)
assert _spec and _spec.loader
_audio = importlib.util.module_from_spec(_spec)
sys.modules["beatscape_audio"] = _audio
_spec.loader.exec_module(_audio)
analyze_audio = _audio.analyze_audio
AudioAnalysis = _audio.AudioAnalysis

TIER_SPEC = {
    "easy": {"approach": 1.35, "min_gap": 0.38, "nps": 2.5, "peak": 5, "hold_p": 0.12, "chord_p": 0.0},
    "standard": {"approach": 1.20, "min_gap": 0.22, "nps": 4.5, "peak": 8, "hold_p": 0.24, "chord_p": 0.16},
    "hard": {"approach": 1.00, "min_gap": 0.14, "nps": 6.4, "peak": 12, "hold_p": 0.30, "chord_p": 0.34},
}

CHORD_SHAPES = [(0, 3), (1, 2), (0, 2), (1, 3)]
CHORD_SHAPES_HARD = [(0, 3), (1, 2), (0, 3), (0, 1, 2), (1, 2, 3)]


def enforce_peak_nps(notes: list[dict], max_peak: int) -> list[dict]:
    def peak(ns: list[dict]) -> int:
        times = sorted(n["t"] for n in ns)
        best = 0
        j = 0
        for i, t0 in enumerate(times):
            while j < len(times) and times[j] <= t0 + 2.0:
                j += 1
            best = max(best, j - i)
        return best

    kept = list(notes)
    for _ in range(len(notes) + 4):
        if peak(kept) <= max_peak:
            break
        times = sorted(n["t"] for n in kept)
        best_i, best_count, j = 0, 0, 0
        for i, t0 in enumerate(times):
            while j < len(times) and times[j] <= t0 + 2.0:
                j += 1
            if j - i > best_count:
                best_count, best_i = j - i, i
        ws, we = times[best_i], times[best_i] + 2.0
        cands = [n for n in kept if ws <= n["t"] <= we and n["type"] == "tap"]
        if not cands:
            cands = [n for n in kept if ws <= n["t"] <= we]
        if not cands:
            break
        kept.remove(cands[len(cands) // 2])
    kept.sort(key=lambda n: n["t"])
    return kept


def select_onsets(analysis: AudioAnalysis, tier: str, dur: float) -> list[tuple[float, int, float]]:
    """Pick onset subset for tier: (t_sec, lane, energy)."""
    spec = TIER_SPEC[tier]
    min_gap = spec["min_gap"]
    target = int(dur * spec["nps"] * 0.92)
    ranked = sorted(
        zip(analysis.onsets_sec, analysis.onset_lanes, analysis.onset_energies),
        key=lambda x: -x[2],
    )
    picked: list[tuple[float, int, float]] = []
    for t, lane, e in ranked:
        if len(picked) >= target:
            break
        if any(abs(t - p[0]) < min_gap for p in picked):
            continue
        picked.append((t, lane, e))
    picked.sort(key=lambda x: x[0])
    if len(picked) < 12:
        # fallback: take every Nth onset
        step = max(1, len(analysis.onsets_sec) // max(12, target))
        picked = [
            (analysis.onsets_sec[i], analysis.onset_lanes[i], analysis.onset_energies[i])
            for i in range(0, len(analysis.onsets_sec), step)
        ][: target]
    return picked


def build_chart_from_onsets(
    track: dict,
    tier: str,
    analysis: AudioAnalysis,
) -> dict:
    bpm = analysis.bpm
    dur = analysis.duration_sec
    spec = TIER_SPEC[tier]
    beat = 60.0 / bpm
    rng = random.Random(f"{track['track_id']}::{tier}::onset-v1")

    candidates = select_onsets(analysis, tier, dur)
    notes: list[dict] = []
    idx = 0
    i = 0
    hold_budget = int(len(candidates) * spec["hold_p"])

    while i < len(candidates):
        t, lane, _e = candidates[i]
        phase = t / dur

        if (
            spec["chord_p"] > 0
            and phase > 0.26
            and rng.random() < spec["chord_p"]
            and i + 1 < len(candidates)
        ):
            shapes = CHORD_SHAPES_HARD if tier == "hard" else CHORD_SHAPES
            shape = list(rng.choice(shapes))
            notes.append({"id": f"n{idx}", "t": round(t, 3), "type": "chord", "lanes": shape})
            idx += 1
            i += 1
            continue

        if (
            hold_budget > 0
            and i + 1 < len(candidates)
            and candidates[i + 1][1] == lane
            and 0.45 <= candidates[i + 1][0] - t <= 0.85
            and rng.random() < 0.55
        ):
            end_t = round(candidates[i + 1][0], 3)
            notes.append({"id": f"n{idx}", "t": round(t, 3), "type": "hold", "lane": lane, "end": end_t})
            hold_budget -= 1
            idx += 1
            i += 2
            continue

        notes.append({"id": f"n{idx}", "t": round(t, 3), "type": "tap", "lane": lane})
        idx += 1
        i += 1

    notes = enforce_peak_nps(notes, spec["peak"])
    notes.sort(key=lambda n: n["t"])
    for j, n in enumerate(notes):
        n["id"] = f"n{j}"

    sections = [
        {"id": "intro", "t0": 0.0, "t1": round(dur * 0.12, 2)},
        {"id": "build", "t0": round(dur * 0.12, 2), "t1": round(dur * 0.28, 2)},
        {"id": "drop", "t0": round(dur * 0.28, 2), "t1": round(dur * 0.55, 2)},
        {"id": "groove", "t0": round(dur * 0.55, 2), "t1": round(dur * 0.78, 2)},
        {"id": "outro", "t0": round(dur * 0.78, 2), "t1": float(dur)},
    ]

    ar = round(3000.0 / (spec["approach"] * bpm), 1)
    total = sum(
        (2 if n["type"] == "hold" else len(n["lanes"]) if n["type"] == "chord" else 1)
        for n in notes
    )
    return {
        "track_id": track["track_id"],
        "tier": tier,
        "format": 1,
        "bpm": round(bpm, 1),
        "audio_offset_ms": 0,
        "ar": ar,
        "total_notes": total,
        "sections": sections,
        "notes": notes,
        "beat_map": {
            "source": "onset-v1",
            "onset_count": len(analysis.onsets_sec),
            "detected_bpm": round(bpm, 1),
            "first_beat_ms": analysis.audio_offset_ms,
        },
    }


def stats(chart: dict) -> str:
    notes = chart["notes"]
    kinds: dict[str, int] = {}
    for n in notes:
        kinds[n["type"]] = kinds.get(n["type"], 0) + 1
    return (
        f"n={len(notes)} taps={kinds.get('tap', 0)} holds={kinds.get('hold', 0)} "
        f"chords={kinds.get('chord', 0)} first_beat={chart.get('beat_map', {}).get('first_beat_ms', 0)}ms "
        f"ar={chart['ar']}"
    )


def audio_path_for_track(track: dict, base: Path) -> Path:
    rel = str(track.get("audio", "")).lstrip("/")
    return base / rel


def main() -> int:
    parser = argparse.ArgumentParser(description="BeatScape onset auto-chart")
    parser.add_argument("--track", help="Only regenerate one track_id")
    parser.add_argument("--analyze-only", action="store_true", help="Print analysis, no writes")
    parser.add_argument("--no-catalog-bpm", action="store_true", help="Do not update catalog.json bpm")
    args = parser.parse_args()

    catalog = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
    base = CATALOG_JSON.parent
    changed_bpm = False

    for tr in catalog["tracks"]:
        tid = tr["track_id"]
        if args.track and tid != args.track:
            continue
        ap = audio_path_for_track(tr, base)
        if not ap.is_file():
            print(f"SKIP {tid}: missing audio {ap}", file=sys.stderr)
            continue

        hint = float(tr.get("bpm", 120))
        print(f"\n=== {tid} {tr.get('title', '')} ===")
        analysis = analyze_audio(ap, hint)
        print(
            f"  audio: {analysis.duration_sec:.1f}s · bpm {analysis.bpm:.1f} "
            f"(hint {hint}) · offset {analysis.audio_offset_ms}ms · "
            f"onsets {len(analysis.onsets_sec)}"
        )

        if args.analyze_only:
            continue

        if abs(analysis.bpm - hint) > 0.5 and not args.no_catalog_bpm:
            tr["bpm"] = round(analysis.bpm)
            changed_bpm = True
            print(f"  catalog bpm {hint} -> {tr['bpm']}")

        for tier in ("easy", "standard", "hard"):
            chart = build_chart_from_onsets(tr, tier, analysis)
            out = CATALOG_DIR / tid / f"{tier}.json"
            out.write_text(json.dumps(chart, indent=2) + "\n", encoding="utf-8")
            print(f"  {tier:8s} {stats(chart)}")

    if changed_bpm and not args.analyze_only:
        CATALOG_JSON.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
        print(f"\nUpdated {CATALOG_JSON}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
