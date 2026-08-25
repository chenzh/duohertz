#!/usr/bin/env python3
"""BeatScape chart generator — groove-based (replaces the metronome generator).

Design goals (see PRD §4.6, §4.10):
  * Musical rhythm, not a metronome: notes are placed by an accent-weighted
    groove grid (downbeats > quarter beats > 8th off-beats > 16th syncopation),
    so the chart breathes with the song instead of hitting every tick.
  * Section intensity arcs: intro < build < drop > groove > outro, matching the
    generated song structure (sections are already stored in each chart).
  * Note variety: taps + holds + chords (Stage1 forbids slides — audit gate).
  * Playable lanes: a two-hand flow model avoids impossible overlaps and
    three-in-a-row pokes, and creates left/right runs that feel like motion.
  * Readable approach: AR is back-computed per track/tier so a note is on
    screen ~`approach` seconds (PRD §4.10 approach = 3000/(AR*BPM)).

Regenerates apps/beatscape/public/catalog/<id>/<tier>.json in place.
Audio / covers / og are untouched. Deterministic per (track, tier) seed.

Usage: python3 scripts/beatscape-chartgen.py
"""
from __future__ import annotations

import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = ROOT / "apps" / "beatscape" / "public" / "catalog"

# Target average density (notes/sec) per tier, kept just under peak/2 so the
# 2s-peak cap doesn't shave the average back below the PRD band floor.
TIER_SPEC = {
    "easy": {"approach": 1.35, "sub": 2, "nps": 2.5, "peak": 5, "hold_p": 0.12, "chord_p": 0.0},
    "standard": {"approach": 1.20, "sub": 4, "nps": 4.5, "peak": 8, "hold_p": 0.24, "chord_p": 0.16},
    "hard": {"approach": 1.00, "sub": 4, "nps": 6.4, "peak": 12, "hold_p": 0.30, "chord_p": 0.34},
}

# Section intensity arc (fraction of duration -> density multiplier). Gentle
# enough that the 2s peak stays under cap while the drop still feels bigger.
SECTION_ARC = [
    (0.00, 0.12, 0.80),  # intro
    (0.12, 0.28, 0.92),  # build
    (0.28, 0.55, 1.00),  # drop — densest
    (0.55, 0.78, 0.92),  # groove
    (0.78, 1.01, 0.82),  # outro
]

# Chord shapes. 2-note on standard, up to 3-note on hard.
CHORD_SHAPES = [(0, 3), (1, 2), (0, 2), (1, 3)]
CHORD_SHAPES_HARD = [(0, 3), (1, 2), (0, 3), (0, 1, 2), (1, 2, 3)]


def section_mult(phase: float) -> float:
    for t0, t1, m in SECTION_ARC:
        if t0 <= phase < t1:
            return m
    return 0.7


def accent_weight(slot: int, sub: int) -> float:
    """How strong a rhythmic position is (drives placement probability)."""
    if slot == 0:
        return 1.0  # bar downbeat
    if slot % sub == 0:
        return 0.88  # quarter-note beats
    if slot % (sub // 2) == 0:
        return 0.66  # 8th off-beats
    return 0.46  # 16th syncopation


def enforce_peak_nps(notes: list[dict], max_peak: int) -> list[dict]:
    """Drop tap notes in the densest 2s windows until peak event count <= max_peak."""
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


def build_chart(track: dict, tier: str) -> dict:
    bpm = track["bpm"]
    dur = float(track["duration_sec"])
    spec = TIER_SPEC[tier]
    sub = spec["sub"]
    beat = 60.0 / bpm
    step = beat / sub  # grid resolution (8th for easy, 16th otherwise)
    slots_per_bar = 4 * sub

    rng = random.Random(f"{track['track_id']}::{tier}::groove-v3")

    # Normalize the section arc so the average density lands on target nps.
    mean_section = sum(m * (t1 - t0) for t0, t1, m in SECTION_ARC)

    notes: list[dict] = []
    busy_until = [0.0, 0.0, 0.0, 0.0]
    last_lane = -1
    same_run = 0
    hand = 0
    idx = 0

    def pick_lane(t: float) -> int:
        nonlocal last_lane, same_run, hand
        if rng.random() < 0.42:
            hand ^= 1
        pool = [0, 1] if hand == 0 else [2, 3]
        free = [l for l in pool if t >= busy_until[l] - 1e-6]
        if not free:
            free = [l for l in range(4) if t >= busy_until[l] - 1e-6]
        if not free:
            return -1
        cand = [l for l in free if not (l == last_lane and same_run >= 2)] or free
        lane = rng.choice(cand)
        if lane == last_lane:
            same_run += 1
        else:
            same_run = 1
        last_lane = lane
        return lane

    # Per-bar quota placed on the strongest-accent slots: even density (no
    # random clusters to trip the peak cap) with a real groove and section arc.
    bar_dur = 4 * beat
    lead = 2.0
    end_limit = dur - beat * 1.5
    acc = 0.0
    bar = 0
    while True:
        bar_start = lead + bar * bar_dur
        if bar_start >= end_limit:
            break
        phase = bar_start / dur
        rel = section_mult(phase) / mean_section
        acc += spec["nps"] * bar_dur * rel
        quota = int(acc)
        acc -= quota

        # Strongest-accent slots first, with jitter so bars don't repeat identically.
        cand = sorted(
            range(slots_per_bar),
            key=lambda s: -(accent_weight(s, sub) + rng.random() * 0.18),
        )
        placed = 0
        for s in cand:
            if placed >= quota:
                break
            t = round(bar_start + s * step, 3)
            if t >= end_limit:
                break
            strong = s % sub == 0
            if spec["chord_p"] > 0 and strong and phase > 0.26 and rng.random() < spec["chord_p"]:
                shapes = CHORD_SHAPES_HARD if tier == "hard" else CHORD_SHAPES
                shape = list(rng.choice(shapes))
                if all(t >= busy_until[l] - 1e-6 for l in shape):
                    notes.append({"id": f"n{idx}", "t": t, "type": "chord", "lanes": shape})
                    for l in shape:
                        busy_until[l] = t + step
                    idx += 1
                    placed += 1
                    continue
            if strong and phase > 0.18 and rng.random() < spec["hold_p"]:
                lane = pick_lane(t)
                if lane >= 0:
                    hold_beats = rng.choice([1, 2]) if bpm < 120 else rng.choice([2, 3])
                    end_t = round(t + max(0.45, hold_beats * beat), 3)
                    if end_t < end_limit:
                        notes.append(
                            {"id": f"n{idx}", "t": t, "type": "hold", "lane": lane, "end": end_t}
                        )
                        busy_until[lane] = end_t + step
                        idx += 1
                        placed += 1
                        continue
            lane = pick_lane(t)
            if lane >= 0:
                notes.append({"id": f"n{idx}", "t": t, "type": "tap", "lane": lane})
                busy_until[lane] = t + step
                idx += 1
                placed += 1
        bar += 1

    notes = enforce_peak_nps(notes, spec["peak"])
    notes.sort(key=lambda n: n["t"])
    for i, n in enumerate(notes):
        n["id"] = f"n{i}"

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
        "bpm": bpm,
        "audio_offset_ms": 0,
        "ar": ar,
        "total_notes": total,
        "sections": sections,
        "notes": notes,
    }


def stats(chart: dict) -> str:
    notes = chart["notes"]
    kinds = {}
    for n in notes:
        kinds[n["type"]] = kinds.get(n["type"], 0) + 1
    dur = max(n["t"] for n in notes) - min(n["t"] for n in notes) if notes else 1
    return (
        f"n={len(notes)} taps={kinds.get('tap', 0)} holds={kinds.get('hold', 0)} "
        f"chords={kinds.get('chord', 0)} ar={chart['ar']} approach={3000/(chart['ar']*chart['bpm']):.2f}s"
    )


def main() -> None:
    catalog = json.loads((CATALOG_DIR.parent / "catalog.json").read_text(encoding="utf-8"))
    for tr in catalog["tracks"]:
        tid = tr["track_id"]
        for tier in ("easy", "standard", "hard"):
            chart = build_chart(tr, tier)
            out = CATALOG_DIR / tid / f"{tier}.json"
            out.write_text(json.dumps(chart, indent=2) + "\n", encoding="utf-8")
            print(f"{tid:9s} {tier:8s} {stats(chart)}")


if __name__ == "__main__":
    main()
