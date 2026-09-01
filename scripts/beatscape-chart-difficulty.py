#!/usr/bin/env python3
"""BeatScape chart difficulty profiler.

Reports note density (NPS), chord load, and **same-hand chords** across the
catalog. Same-hand chords (both lanes under one thumb: 0+1 or 2+3) are the ones
a mobile player physically cannot hit, so they get flagged separately.

    python3 scripts/beatscape-chart-difficulty.py [--tier hard] [--csv out.csv]
"""

from __future__ import annotations

import argparse
import csv
import glob
import json
import os
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG_DIR = os.path.join(ROOT, "apps", "beatscape", "public", "catalog")
TIERS = ("easy", "standard", "hard")

# Lanes 0-1 are the left thumb, 2-3 the right thumb.
LEFT = {0, 1}
RIGHT = {2, 3}


def lanes_of(note: dict) -> list[int]:
    """A note's lanes. `chord` carries `lanes`; everything else carries `lane`."""
    if "lanes" in note:
        return list(note["lanes"])
    return [note["lane"]]


def profile(path: str) -> dict | None:
    data = json.load(open(path, encoding="utf-8"))
    notes = data.get("notes") or []
    if not notes:
        return None

    times = sorted(n["t"] for n in notes)
    span = times[-1] - times[0]
    dur = max(span, 1e-6)

    # Peak NPS over a 1-second sliding window.
    peak = 0
    j = 0
    for i in range(len(times)):
        while times[i] - times[j] > 1.0:
            j += 1
        peak = max(peak, i - j + 1)

    sizes: Counter[int] = Counter()
    same_hand = 0
    cross_hand = 0
    for n in notes:
        ls = lanes_of(n)
        sizes[len(ls)] += 1
        if len(ls) >= 2:
            # The real mobile constraint is per-hand, not per-chord: a thumb
            # covers one lane, so a chord is unplayable whenever EITHER hand is
            # asked for two lanes. A 3-note chord like (0,1,2) splits across
            # hands but still needs the left thumb on two lanes.
            s = set(ls)
            if len(s & LEFT) >= 2 or len(s & RIGHT) >= 2:
                same_hand += 1
            else:
                cross_hand += 1

    judge_notes = sum(len(lanes_of(n)) for n in notes)

    return {
        "track_id": data.get("track_id") or os.path.basename(os.path.dirname(path)),
        "tier": data.get("tier") or os.path.basename(path).replace(".json", ""),
        "bpm": data.get("bpm"),
        "notes": len(notes),
        "judge_notes": judge_notes,
        "duration": round(dur, 1),
        "nps_avg": round(judge_notes / dur, 2),
        "nps_peak": peak,
        "chord_rate": round(1 - sizes[1] / len(notes), 3),
        "c2": sizes[2],
        "c3": sizes[3],
        "c4": sizes[4],
        "same_hand": same_hand,
        "cross_hand": cross_hand,
        # Share of chords that force one thumb onto two lanes. Generator theory
        # value is ~40% on hard (2 of 5 CHORD_SHAPES_HARD); absolute same-hand
        # counts scale with chart length/onset density, so compare this, not counts.
        "same_hand_rate": round(same_hand / (same_hand + cross_hand), 3)
        if (same_hand + cross_hand)
        else 0.0,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Profile BeatScape chart difficulty")
    ap.add_argument("--tier", choices=TIERS, help="only one tier")
    ap.add_argument("--csv", help="write per-chart rows to CSV")
    args = ap.parse_args()

    rows: list[dict] = []
    for p in sorted(glob.glob(os.path.join(CATALOG_DIR, "*", "*.json"))):
        tier = os.path.basename(p).replace(".json", "")
        if tier not in TIERS or (args.tier and tier != args.tier):
            continue
        r = profile(p)
        if r:
            rows.append(r)

    if not rows:
        print("No charts found")
        return 2

    if args.csv:
        with open(args.csv, "w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=list(rows[0]))
            w.writeheader()
            w.writerows(rows)
        print(f"Wrote {args.csv}")

    by_tier: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_tier[r["tier"]].append(r)

    print(f"{'tier':9s} {'charts':>6s} {'notes':>7s} {'NPS avg':>8s} {'NPS peak':>9s} "
          f"{'chord%':>7s} {'2键':>6s} {'3键':>5s} {'4键':>5s} {'同手':>6s} {'跨手':>6s} {'同手率':>6s}")
    for tier in TIERS:
        rs = by_tier.get(tier)
        if not rs:
            continue
        a = lambda k: sum(r[k] for r in rs) / len(rs)  # noqa: E731
        print(f"{tier:9s} {len(rs):6d} {a('judge_notes'):7.0f} {a('nps_avg'):8.2f} "
              f"{a('nps_peak'):9.1f} {a('chord_rate')*100:6.1f}% "
              f"{a('c2'):6.1f} {a('c3'):5.1f} {a('c4'):5.1f} "
              f"{a('same_hand'):6.1f} {a('cross_hand'):6.1f} {a('same_hand_rate')*100:5.1f}%")

    worst = sorted(rows, key=lambda r: r["same_hand"], reverse=True)[:5]
    print("\n同手和弦最多（移动端最难）:")
    for r in worst:
        print(f"  {r['track_id']:10s} {r['tier']:9s} 同手 {r['same_hand']:3d}  "
              f"跨手 {r['cross_hand']:3d}  NPS峰值 {r['nps_peak']:3d}")

    peakiest = sorted(rows, key=lambda r: r["nps_peak"], reverse=True)[:5]
    print("\nNPS 峰值最高:")
    for r in peakiest:
        print(f"  {r['track_id']:10s} {r['tier']:9s} 峰值 {r['nps_peak']:3d}  "
              f"均值 {r['nps_avg']:5.2f}  {r['bpm']} BPM")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
