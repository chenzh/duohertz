#!/usr/bin/env python3
"""BeatScape chart generator — onset-based auto-chart from catalog audio.

Analyzes each track's m4a (BPM, first-beat offset, onsets) and places notes on
real hit points instead of a synthetic BPM grid. Regenerates chart JSON + updates
catalog BPM when detection diverges from hint.

单跑本脚本不做质量门禁（便于调参实验）；stage3/4/6 pipeline 在 chartgen 之后、
catalog 入库之前会跑 beatscape-chart-gate.py 卡谱面-音频匹配质量。

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
    # grid_w 由 scripts/ 下的参数扫描定出（见 beatscape-chart-gridfit.py 的说明）：
    # easy 最贴拍（新手要能锁住脉冲），hard 只轻度拉一把、保留切分加花。
    "easy": {"approach": 1.35, "min_gap": 0.38, "nps": 2.5, "peak": 5, "hold_p": 0.12, "chord_p": 0.0, "slide_max": 0, "grid_w": 0.60},
    "standard": {"approach": 1.20, "min_gap": 0.22, "nps": 4.5, "peak": 8, "hold_p": 0.24, "chord_p": 0.16, "slide_max": 2, "grid_w": 0.50},
    "hard": {"approach": 1.00, "min_gap": 0.14, "nps": 6.4, "peak": 12, "hold_p": 0.30, "chord_p": 0.34, "slide_max": 8, "grid_w": 0.40},
}

# --- beat-grid affinity ---------------------------------------------------
# Onset 检测密度（约 11/s）远高于八分音符网格（90 BPM 仅 3/s），所以"纯按能量
# 挑最响的 onset"会把音符撒在拍与拍之间的微位置上：每个音都确实踩在真实声音上，
# 但相邻间隔忽长忽短，玩家锁不住脉冲 —— 听感就是"不跟拍"。
# 这里给排序键加一项"贴网格"加成：正拍 1.0、八分反拍 0.78、十六分 0.5、格间 0。
# grid_w 越大越贴拍（easy 最贴，让人能跟上；hard 保留切分加花）。
GRID_TOL_SEC = 0.022  # 判为"在格上"的容差，取 onset 检测抖动的量级
GRID_LEVELS = (  # (到最近整拍的距离，单位=拍) -> 加成权重
    (0.0, 1.00),
    (0.5, 0.78),
    (0.25, 0.50),
)


def grid_affinity(t_sec: float, beat: float, offset_sec: float) -> float:
    """0..1：音符落在检测到的拍网格上的程度；落在格间返回 0。"""
    if beat <= 0:
        return 0.0
    tol = GRID_TOL_SEC / beat  # 容差换算成"拍"
    rel = (t_sec - offset_sec) / beat
    frac = abs(rel - round(rel))  # 到最近整拍的距离，0..0.5 拍
    best = 0.0
    for center, weight in GRID_LEVELS:
        if abs(frac - center) <= tol:
            best = max(best, weight)
    return best

CHORD_SHAPES = [(0, 3), (1, 2), (0, 2), (1, 3)]
CHORD_SHAPES_HARD = [(0, 3), (1, 2), (0, 3), (0, 1, 2), (1, 2, 3)]

# A single press can resolve only one judgment object. Keep same-lane press
# windows from overlapping (Arcade Good is ±50ms), including generated Slide
# tails that otherwise can land almost exactly on the next Tap/Chord head.
MIN_SAME_LANE_PRESS_GAP_SEC = 0.100
MIN_SLIDE_DURATION_SEC = 0.250
MAX_SLIDE_DURATION_SEC = 0.550


def track_allows_slide(track: dict) -> bool:
    if track.get("allows_slide"):
        return True
    tid = str(track.get("track_id", ""))
    return tid == "bs-s2-01"


def make_slide(rng: random.Random, t: float, lane: int, beat: float) -> dict | None:
    candidates = [lane - 1, lane + 1]
    to_lane = rng.choice([c for c in candidates if 0 <= c <= 3])
    end_t = round(t + min(0.55, max(0.35, beat * 0.5)), 3)
    return {"id": "slide", "t": round(t, 3), "type": "slide", "lane": lane, "to": to_lane, "end": end_t}


def resolve_slide_tail_conflicts(notes: list[dict]) -> None:
    """Retimes Slide tails minimally so every same-lane press stays unambiguous."""
    occupied: list[list[float]] = [[], [], [], []]
    for note in notes:
        lanes = note["lanes"] if note["type"] == "chord" else [note["lane"]]
        for lane in lanes:
            occupied[lane].append(float(note["t"]))

    for slide in sorted((n for n in notes if n["type"] == "slide"), key=lambda n: n["t"]):
        original = float(slide["end"])
        chosen: float | None = None
        # Charts use millisecond precision. Search nearest-first and prefer a
        # slightly shorter gesture when both directions are equally safe.
        for distance_ms in range(0, 301):
            signs = (0,) if distance_ms == 0 else (-1, 1)
            for sign in signs:
                candidate = round(original + sign * distance_ms / 1000.0, 3)
                duration = candidate - float(slide["t"])
                if duration + 1e-9 < MIN_SLIDE_DURATION_SEC or duration - 1e-9 > MAX_SLIDE_DURATION_SEC:
                    continue
                if all(
                    abs(candidate - event_t) + 1e-9 >= MIN_SAME_LANE_PRESS_GAP_SEC
                    for event_t in occupied[int(slide["to"])]
                ):
                    chosen = candidate
                    break
            if chosen is not None:
                break
        if chosen is None:
            raise RuntimeError(f"No playable Slide tail slot for {slide.get('id', 'unknown')}")
        slide["end"] = chosen
        occupied[int(slide["to"])].append(chosen)


def enforce_peak_nps(
    notes: list[dict], max_peak: int, beat: float = 0.0, offset: float = 0.0
) -> list[dict]:
    """Cull notes to keep peak NPS in check.

    beat > 0 时优先砍掉**最不贴拍**的那个，而不是窗口正中那个 —— 否则刚按网格
    搭起来的节拍骨架会被随机拆掉一两根，前功尽弃。
    """
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
        affs = [grid_affinity(n["t"], beat, offset) for n in cands] if beat > 0 else []
        # 只有窗口内的贴格程度**有差异**时才按 aff 挑，否则退回原来的"取中间"
        # 行为（全部离格时按 aff 挑会退化成"删最早的"，白白改变既有谱面）。
        if affs and max(affs) - min(affs) > 1e-9:
            victim = min(zip(affs, [n["t"] for n in cands], cands))[2]
        else:
            victim = cands[len(cands) // 2]
        kept.remove(victim)
    kept.sort(key=lambda n: n["t"])
    return kept


def select_onsets(analysis: AudioAnalysis, tier: str, dur: float) -> list[tuple[float, int, float]]:
    """Pick onset subset for tier: (t_sec, lane, energy).

    排序键 = 归一化能量 + grid_w × 网格亲和力。纯按能量排会把音符撒在拍与拍
    之间的微位置上（onset 密度远高于拍密度），间隔忽长忽短 = 玩起来不跟拍。
    能量归一化到 0..1 后仍是主导项，grid 只是加成，所以不会出现"贴格但听不见"
    的音符盖过"响亮但离格"的音符（除非 grid_w 开得很大）。
    """
    spec = TIER_SPEC[tier]
    min_gap = spec["min_gap"]
    grid_w = float(spec["grid_w"])
    target = int(dur * spec["nps"] * 1.05)
    beat = 60.0 / analysis.bpm if analysis.bpm > 0 else 0.5
    offset = (analysis.audio_offset_ms or 0) / 1000.0

    triples = list(
        zip(analysis.onsets_sec, analysis.onset_lanes, analysis.onset_energies)
    )
    energies = [e for _, _, e in triples] or [0.0]
    lo = min(energies)
    span = (max(energies) - lo) or 1.0

    def score(t: float, e: float) -> float:
        return (e - lo) / span + grid_w * grid_affinity(t, beat, offset)

    ranked = sorted(triples, key=lambda x: -score(x[0], x[2]))
    picked: list[tuple[float, int, float]] = []
    for t, lane, e in ranked:
        if len(picked) >= target:
            break
        if any(abs(t - p[0]) < min_gap for p in picked):
            continue
        picked.append((t, lane, e))
    picked.sort(key=lambda x: x[0])
    # PRD §6.0.8: first playable note 1.0–2.5s after chart t=0 (post-countdown)
    picked = [p for p in picked if p[0] >= 1.0]
    if len(picked) < max(12, int(target * 0.85)):
        fill_gap = min_gap * 0.72
        for t, lane, e in ranked:
            if len(picked) >= target:
                break
            if t < 1.0:
                continue
            if any(abs(t - p[0]) < fill_gap for p in picked):
                continue
            picked.append((t, lane, e))
        picked.sort(key=lambda x: x[0])
    if len(picked) < 12:
        step = max(1, len(analysis.onsets_sec) // max(12, target))
        picked = [
            (analysis.onsets_sec[i], analysis.onset_lanes[i], analysis.onset_energies[i])
            for i in range(0, len(analysis.onsets_sec), step)
            if analysis.onsets_sec[i] >= 1.0
        ][:target]
    return picked


def build_sections(analysis: AudioAnalysis, dur: float, track: dict) -> list[dict]:
    """Section map; Instant/Hot Chart tracks get an early drop (≤8s)."""
    tags = [str(t) for t in track.get("tags") or []]
    instant = track.get("track_id") == "bs-s1-01" or any(
        "Instant" in t or "Hot Chart" in t for t in tags
    )
    if instant and dur >= 60:
        pairs = list(zip(analysis.onsets_sec, analysis.onset_energies))
        win = [(t, e) for t, e in pairs if 4.0 <= t <= 8.0]
        drop_t0 = round(max(win, key=lambda x: x[1])[0], 2) if win else 6.0
        drop_t0 = min(drop_t0, 7.8)
        intro_t1 = round(max(1.0, drop_t0 - 3.5), 2)
        drop_t1 = round(min(dur * 0.55, drop_t0 + dur * 0.24), 2)
        groove_t0 = drop_t1
        groove_t1 = round(dur * 0.78, 2)
        return [
            {"id": "intro", "t0": 0.0, "t1": intro_t1},
            {"id": "build", "t0": intro_t1, "t1": drop_t0},
            {"id": "drop", "t0": drop_t0, "t1": drop_t1},
            {"id": "groove", "t0": groove_t0, "t1": groove_t1},
            {"id": "outro", "t0": groove_t1, "t1": float(dur)},
        ]
    return [
        {"id": "intro", "t0": 0.0, "t1": round(dur * 0.12, 2)},
        {"id": "build", "t0": round(dur * 0.12, 2), "t1": round(dur * 0.28, 2)},
        {"id": "drop", "t0": round(dur * 0.28, 2), "t1": round(dur * 0.55, 2)},
        {"id": "groove", "t0": round(dur * 0.55, 2), "t1": round(dur * 0.78, 2)},
        {"id": "outro", "t0": round(dur * 0.78, 2), "t1": float(dur)},
    ]


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
    slides_used = 0
    allow_slide = track_allows_slide(track)

    while i < len(candidates):
        t, lane, _e = candidates[i]
        phase = t / dur

        if (
            allow_slide
            and slides_used < spec["slide_max"]
            and tier != "easy"
            and phase > 0.28
            and phase < 0.78
            and rng.random() < (0.22 if tier == "standard" else 0.35)
            and i + 1 < len(candidates)
        ):
            slide = make_slide(rng, t, lane, beat)
            if slide:
                slide["id"] = f"n{idx}"
                notes.append(slide)
                slides_used += 1
                idx += 1
                i += 1
                continue

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

    notes = enforce_peak_nps(notes, spec["peak"], beat, (analysis.audio_offset_ms or 0) / 1000.0)
    resolve_slide_tail_conflicts(notes)
    notes.sort(key=lambda n: n["t"])
    for j, n in enumerate(notes):
        n["id"] = f"n{j}"

    sections = build_sections(analysis, dur, track)

    ar = round(3000.0 / (spec["approach"] * bpm), 1)
    total = sum(
        (
            2
            if n["type"] == "hold"
            else len(n["lanes"])
            if n["type"] == "chord"
            else 1
        )
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
        f"chords={kinds.get('chord', 0)} slides={kinds.get('slide', 0)} first_beat={chart.get('beat_map', {}).get('first_beat_ms', 0)}ms "
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
