#!/usr/bin/env python3
"""Ingest Stage1 preview audio into apps/beatscape/public/catalog (PRD §6.0.26)."""

from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "data" / "beatscape-preview"
OUT = ROOT / "apps" / "beatscape" / "public"

TRACKS = [
    {
        "track_id": "bs-s1-01",
        "title": "Neon Pulse",
        "artist": "Pulse Atlas",
        "genre": "EDM",
        "bpm": 160,
        "duration_sec": 75,
        "preset_id": "bs-edm-main",
        "district": "Pulse Core",
        "tags": ["Hot Chart Style"],
        "default_mode": "casual",
        "default_tier": "easy",
        "preview_file": "01-Neon-Pulse.m4a",
        "hold_bias": 0.1,
        "chord_bias": 0.04,
        "beginner_pick": True,
    },
    {
        "track_id": "bs-s1-02",
        "title": "Glass Horizon",
        "artist": "Soft Circuit",
        "genre": "Pop",
        "bpm": 118,
        "duration_sec": 75,
        "preset_id": "bs-pop-hook",
        "district": "Glass Rim",
        "tags": ["Viral Style"],
        "default_mode": "casual",
        "default_tier": "easy",
        "preview_file": "02-Glass-Horizon.m4a",
        "hold_bias": 0.12,
        "chord_bias": 0.0,
        "beginner_pick": True,
        "guide_duration_sec": 45,
    },
    {
        "track_id": "bs-s1-03",
        "title": "Night Drive 808",
        "artist": "Low Voltage",
        "genre": "Hip-hop",
        "bpm": 95,
        "duration_sec": 75,
        "preset_id": "bs-hiphop-808",
        "district": "Night Grid",
        "tags": ["Classic Style"],
        "default_mode": "casual",
        "default_tier": "easy",
        "preview_file": "03-Night-Drive-808.m4a",
        "hold_bias": 0.08,
        "chord_bias": 0.03,
    },
    {
        "track_id": "bs-s1-04",
        "title": "Velvet Afterhours",
        "artist": "Mira Lane",
        "genre": "R&B",
        "bpm": 88,
        "duration_sec": 75,
        "preset_id": "bs-rnb-groove",
        "district": "Afterhours Lane",
        "tags": ["Classic Style"],
        "default_mode": "casual",
        "default_tier": "easy",
        "preview_file": "04-Velvet-Afterhours.m4a",
        "hold_bias": 0.35,
        "chord_bias": 0.0,
        "beginner_pick": True,
    },
    {
        "track_id": "bs-s1-05",
        "title": "Voltage Drop",
        "artist": "Gridline",
        "genre": "EDM",
        "bpm": 170,
        "duration_sec": 60,
        "preset_id": "bs-edm-climax",
        "district": "Pulse Core",
        "tags": ["Hot Chart Style"],
        "default_mode": "casual",
        "default_tier": "easy",
        "preview_file": "05-Voltage-Drop.m4a",
        "hold_bias": 0.08,
        "chord_bias": 0.06,
    },
    {
        "track_id": "bs-s1-06",
        "title": "Chrome Riff",
        "artist": "Iron Echo",
        "genre": "Rock",
        "bpm": 132,
        "duration_sec": 75,
        "preset_id": "bs-rock-drive",
        "district": "Chrome Yard",
        "tags": ["New Release"],
        "default_mode": "casual",
        "default_tier": "easy",
        "preview_file": "06-Chrome-Riff.m4a",
        "hold_bias": 0.1,
        "chord_bias": 0.04,
    },
]

TIER = {
    "easy": {"ar": 18, "grid": 1, "hold_mul": 1.0, "step_mul": 1.0, "peak_cap": 5},
    "standard": {"ar": 24, "grid": 1, "hold_mul": 1.0, "step_mul": 1.15, "peak_cap": 8},
    "hard": {"ar": 32, "grid": 0.5, "hold_mul": 0.85, "step_mul": 1.0, "peak_cap": 12},
}

DISTRICT_COLORS = {
    "Pulse Core": "#3DDCFF",
    "Glass Rim": "#A8C4E8",
    "Night Grid": "#5B6EFF",
    "Afterhours Lane": "#C084FC",
    "Chrome Yard": "#94A3B8",
}


def snap(t: float, bpm: int, div: float) -> float:
    beat = 60.0 / bpm
    step = beat * div
    return round(t / step) * step


def measure_peak_nps(notes: list[dict]) -> int:
    times = sorted(n["t"] for n in notes)
    peak = 0
    if not times:
        return 0
    j = 0
    for i, t0 in enumerate(times):
        while j < len(times) and times[j] <= t0 + 2.0:
            j += 1
        peak = max(peak, j - i)
    return peak


def enforce_peak_nps(notes: list[dict], *, max_peak: int = 12) -> list[dict]:
    """Drop tap notes in the densest 2s windows until peak event count <= max_peak."""
    kept = list(notes)
    for _ in range(len(notes)):
        if measure_peak_nps(kept) <= max_peak:
            break
        times = sorted(n["t"] for n in kept)
        best_i, best_count = 0, 0
        j = 0
        for i, t0 in enumerate(times):
            while j < len(times) and times[j] <= t0 + 2.0:
                j += 1
            count = j - i
            if count > best_count:
                best_count, best_i = count, i
        window_start = times[best_i]
        window_end = window_start + 2.0
        candidates = [
            n for n in kept if window_start <= n["t"] <= window_end and n["type"] == "tap"
        ]
        if not candidates:
            candidates = [n for n in kept if window_start <= n["t"] <= window_end]
        if not candidates:
            break
        kept.remove(candidates[len(candidates) // 2])
    kept.sort(key=lambda n: n["t"])
    for i, note in enumerate(kept):
        note["id"] = f"n{i}"
    return kept


def count_notes(notes: list[dict]) -> int:
    n = 0
    for note in notes:
        t = note["type"]
        if t in ("tap", "slide"):
            n += 1
        elif t == "hold":
            n += 2
        elif t == "chord":
            n += len(note["lanes"])
    return n


def peak_nps_at(notes: list[dict], center_t: float, window = 2.0) -> float:
    count = sum(1 for n in notes if center_t - window <= n["t"] <= center_t + window)
    return count / window


def build_chart(track: dict, tier: str) -> dict:
    bpm = track["bpm"]
    dur = track["duration_sec"]
    if tier == "easy" and track.get("guide_duration_sec"):
        dur = min(dur, track["guide_duration_sec"])
    spec = TIER[tier]
    beat = 60.0 / bpm
    step = beat * spec["grid"]
    notes: list[dict] = []
    # First playable note ~2s after GO (countdown ends at t=0)
    t = 2.0
    idx = 0
    while t < dur - beat * 2:
        phase = t / dur
        # Density by section — tier-tuned for audit ranges + newbie readability
        if tier == "easy":
            if phase < 0.2:
                density = 1 if idx % 3 != 2 else 0
            elif phase < 0.55:
                density = 1 if idx % 2 == 0 else 0
            else:
                density = 1 if idx % 3 == 0 else 0
        elif tier == "standard":
            if phase < 0.12:
                density = 1
            elif phase < 0.28:
                density = 1 if idx % 2 == 0 else 1
            elif phase < 0.55:
                density = 2 if idx % 4 == 0 else 1
            elif phase < 0.78:
                density = 1
            else:
                density = 1 if idx % 2 == 0 else 0
        else:
            if phase < 0.12:
                density = 1
            elif phase < 0.28:
                density = 1 if idx % 2 == 0 else 1
            elif phase < 0.55:
                density = 2 if tier == "hard" else 1
            elif phase < 0.78:
                density = 1
            else:
                density = 1 if idx % 2 == 0 else 0

        # PRD §6.0.25: kick→0, snare→3, hats→1/2
        beat_i = round(t / beat)
        if beat_i % 2 == 0:
            lane = 0  # kick
        elif beat_i % 4 == 1:
            lane = 3  # snare
        else:
            lane = 1 if beat_i % 2 else 2

        st = round(snap(t, bpm, spec["grid"]), 3)
        peak = peak_nps_at(notes, st)
        if peak >= spec["peak_cap"]:
            density = 0

        if (
            density
            and idx % 9 == 0
            and track["hold_bias"] > 0.15
            and tier != "hard"
            and phase > 0.2
        ):
            hold_dur = max(0.5, beat * 2 * spec["hold_mul"])
            notes.append(
                {
                    "id": f"n{idx}",
                    "t": st,
                    "type": "hold",
                    "lane": 1 if track["hold_bias"] > 0.2 else lane,
                    "end": round(snap(t + hold_dur, bpm, spec["grid"]), 3),
                }
            )
        elif (
            density >= 2
            and track["chord_bias"] > 0
            and tier == "hard"
            and idx % 8 == 0
            and peak < spec["peak_cap"] - 1
        ):
            notes.append({"id": f"n{idx}", "t": st, "type": "chord", "lanes": [0, 3]})
        elif density:
            notes.append({"id": f"n{idx}", "t": st, "type": "tap", "lane": lane})
        idx += 1
        # Hard: full grid step (BS-001); Easy/Standard: LOCA-21 step_mul spacing.
        step_mul = spec["step_mul"]
        if tier == "hard":
            t += step
        else:
            if tier == "easy" and track.get("guide_duration_sec"):
                step_mul *= 1.2
            elif tier == "easy":
                step_mul *= 0.85
            t += step * step_mul

    notes.sort(key=lambda n: n["t"])
    if tier == "hard":
        notes = enforce_peak_nps(notes, max_peak=12)
    sections = [
        {"id": "intro", "t0": 0.0, "t1": round(dur * 0.12, 2)},
        {"id": "build", "t0": round(dur * 0.12, 2), "t1": round(dur * 0.28, 2)},
        {"id": "drop", "t0": round(dur * 0.28, 2), "t1": round(dur * 0.55, 2)},
        {"id": "groove", "t0": round(dur * 0.55, 2), "t1": round(dur * 0.78, 2)},
        {"id": "outro", "t0": round(dur * 0.78, 2), "t1": float(dur)},
    ]
    total = count_notes(notes)
    return {
        "track_id": track["track_id"],
        "tier": tier,
        "format": 1,
        "bpm": bpm,
        "audio_offset_ms": 0,
        "ar": spec["ar"],
        "total_notes": total,
        "sections": sections,
        "notes": notes,
    }


def cover_svg(track_id: str, district: str, title: str) -> str:
    color = DISTRICT_COLORS.get(district, "#3DDCFF")
    seed = sum(ord(c) for c in track_id) % 360
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0b0f14"/>
  <polygon points="256,80 380,256 256,432 132,256" fill="none" stroke="{color}" stroke-width="4" opacity="0.9" transform="rotate({seed} 256 256)"/>
  <text x="256" y="480" text-anchor="middle" fill="#8b9bb0" font-family="system-ui" font-size="22">{title}</text>
</svg>"""


def main() -> None:
    if not PREVIEW.is_dir():
        raise SystemExit(f"Missing preview dir: {PREVIEW}")

    catalog_tracks = []
    for tr in TRACKS:
        tid = tr["track_id"]
        dest = OUT / "catalog" / tid
        dest.mkdir(parents=True, exist_ok=True)
        src = PREVIEW / tr["preview_file"]
        if not src.is_file():
            raise SystemExit(f"Missing audio: {src}")
        shutil.copy2(src, dest / "audio.m4a")
        (dest / "cover.svg").write_text(cover_svg(tid, tr["district"], tr["title"]), encoding="utf-8")
        charts = {}
        for tier in ("easy", "standard", "hard"):
            chart = build_chart(tr, tier)
            name = f"{tier}.json"
            (dest / name).write_text(json.dumps(chart, indent=2) + "\n", encoding="utf-8")
            charts[tier] = f"/catalog/{tid}/{name}"
        catalog_tracks.append(
            {
                "track_id": tid,
                "title": tr["title"],
                "artist": tr["artist"],
                "genre": tr["genre"],
                "bpm": tr["bpm"],
                "duration_sec": tr["duration_sec"],
                "preset_id": tr["preset_id"],
                "engine": "stable-audio-3",
                "job_id": f"local-preview-{tid}",
                "rights": "owned",
                "theme": "beatscape",
                "tags": tr["tags"] + (["Beginner Pick"] if tr.get("beginner_pick") else []),
                "district": tr["district"],
                "default_mode": tr["default_mode"],
                "default_tier": tr["default_tier"],
                "audio": f"/catalog/{tid}/audio.m4a",
                "cover": f"/catalog/{tid}/cover.svg",
                "og": f"/catalog/{tid}/og.png",
                "charts": charts,
                "seo": {
                    "title": f"{tr['title']} — BeatScape AI Original",
                    "description": f"Own the Scape. {tr['bpm']} BPM {tr['genre']} chart.",
                },
            }
        )
        print(f"OK {tid} notes std={count_notes(build_chart(tr, 'standard')['notes'])}")

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "catalog.json").write_text(
        json.dumps({"version": 1, "tracks": catalog_tracks}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT / 'catalog.json'} ({len(catalog_tracks)} tracks)")

    # PRD §6.0.24 / §6.0.26 — og.png next to cover
    import runpy

    ns = runpy.run_path(str(ROOT / "scripts" / "beatscape-generate-og.py"))
    ns["main"]()


if __name__ == "__main__":
    main()
