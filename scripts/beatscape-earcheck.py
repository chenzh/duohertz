#!/usr/bin/env python3
"""Automated ear-check signals from catalog charts (T1 acceptance helper).

Usage:
  python3 scripts/beatscape-earcheck.py
  python3 scripts/beatscape-earcheck.py --json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "apps" / "beatscape" / "public" / "catalog.json"
PUBLIC = CATALOG.parent


def first_note_t(chart: dict) -> float | None:
    notes = chart.get("notes") or []
    if not notes:
        return None
    return min(float(n["t"]) for n in notes)


def drop_t0(chart: dict) -> float | None:
    for s in chart.get("sections") or []:
        if s.get("id") == "drop":
            return float(s.get("t0", 0))
    return None


def check_track(entry: dict) -> dict:
    tid = entry["track_id"]
    charts = entry.get("charts") or {}
    std_path = PUBLIC / str(charts.get("standard", "")).lstrip("/")
    out: dict = {"track_id": tid, "title": entry.get("title"), "checks": []}

    if not std_path.is_file():
        out["checks"].append({"id": "A0", "status": "FAIL", "msg": "missing standard chart"})
        return out

    chart = json.loads(std_path.read_text(encoding="utf-8"))
    first = first_note_t(chart)
    drop = drop_t0(chart)

    if first is not None and 1.0 <= first <= 2.5:
        out["checks"].append({"id": "A2-first", "status": "PASS", "msg": f"first note {first:.2f}s"})
    elif first is not None:
        out["checks"].append({"id": "A2-first", "status": "WARN", "msg": f"first note {first:.2f}s outside 1.0-2.5s"})

    if tid == "bs-s1-01" and drop is not None:
        if drop <= 8.0:
            out["checks"].append({"id": "A2-drop", "status": "PASS", "msg": f"drop t0={drop:.2f}s"})
        else:
            out["checks"].append({"id": "A2-drop", "status": "WARN", "msg": f"drop t0={drop:.2f}s > 8s"})

    slides = [n for n in chart.get("notes", []) if n.get("type") == "slide"]
    if tid.startswith("bs-s1-") and slides:
        out["checks"].append({"id": "G3-s1", "status": "FAIL", "msg": f"Stage1 has {len(slides)} slide(s)"})
    elif tid == "bs-s2-01" and not slides:
        out["checks"].append({"id": "F4-slide", "status": "WARN", "msg": "Slide City standard has no slides"})

    for n in slides:
        if abs(int(n.get("to", 0)) - int(n.get("lane", 0))) != 1:
            out["checks"].append({"id": "G1", "status": "FAIL", "msg": "invalid slide lane delta"})

    intro_end = float(entry.get("duration_sec", 75)) * 0.12
    bad = [n for n in slides if float(n.get("t", 0)) < intro_end]
    if bad:
        out["checks"].append({"id": "G3-intro", "status": "FAIL", "msg": f"{len(bad)} slide(s) in intro"})

    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    results = [check_track(t) for t in catalog.get("tracks", [])]

    if args.json:
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        print("BeatScape automated ear-check (chart signals)")
        for r in results:
            worst = "PASS"
            for c in r["checks"]:
                if c["status"] == "FAIL":
                    worst = "FAIL"
                elif c["status"] == "WARN" and worst == "PASS":
                    worst = "WARN"
            print(f"\n{r['track_id']} {r.get('title','')} — {worst}")
            for c in r["checks"]:
                print(f"  [{c['status']}] {c['id']}: {c['msg']}")

    fails = sum(1 for r in results for c in r["checks"] if c["status"] == "FAIL")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
