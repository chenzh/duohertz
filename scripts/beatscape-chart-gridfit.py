#!/usr/bin/env python3
"""BeatScape chart grid-fit report — 谱面"跟拍感"体检。

背景：谱面是 onset 自动生成的，音符必然踩在真实声音上，但**踩在声音上 ≠ 踩在拍上**。
onset 检测密度（约 11/s）远高于八分音符网格（90 BPM 仅 3/s），若只按"最响"挑 onset，
音符会撒在拍与拍之间的微位置上 —— 每个音都有声，但相邻间隔忽长忽短，玩家锁不住脉冲，
听感就是"不跟拍"。本脚本量化这件事。

指标（以检测到的 bpm 为基准，相位**自动搜索最优值**，见下）：
  网格内%   音符落在八分音符网格 ±6% 拍以内的占比 —— 主指标，越高越跟拍
  规整%     相邻间隔落在 1/2/4/8 拍 ±12% 内的占比 —— 只在低密度档（easy）有意义；
            standard/hard 密度超过八分网格，间隔本就不是整数拍，这项天然低，别拿它判好坏
  离格%     到最近整拍距离的中位数（% 拍）—— 越小越跟拍
  相位ms    最优相位相对 beat_map.first_beat_ms 的偏移
  响度x     选中 onset 的平均能量 / 全曲 onset 平均能量。<1 说明音符平均比"随便挑一个
            onset"还安静，会出现踩空感；改 chartgen 的 grid_w 时不建议低于 0.95
            （响度需要读音频，加 --loud 才统计，慢）

重要：相位必须搜索最优值，不能直接拿 beat_map.first_beat_ms 当基准。
  · first_beat_ms **运行时根本不读**（PlayField 只读顶层 audio_offset_ms，而生成器
    恒定输出 0），它纯粹是元数据；
  · 它的检测经常偏 —— 实测 bs-s5-01 偏了 2 秒，导致该曲在原相位下只有 21.7% 贴格，
    扫到最优相位是 84.0%。拿它当基准会把"很跟拍的谱"误判成"不跟拍"。
  · 玩家感知的是"音符间隔规不规律、能否预期下一个音"，不是"对齐到某个绝对时钟"。
    所以本脚本衡量的是"音符是否构成一个规整的脉冲网格"，这才对应真实手感。

用法：
  python3 scripts/beatscape-chart-gridfit.py
  python3 scripts/beatscape-chart-gridfit.py --tier easy --worst 15
  python3 scripts/beatscape-chart-gridfit.py --track bs-s6-13 --loud
  python3 scripts/beatscape-chart-gridfit.py --tier easy --fail-under 55   # CI 门禁
"""

from __future__ import annotations

import argparse
import json
import statistics as st
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = ROOT / "apps" / "beatscape" / "public" / "catalog"
CATALOG_JSON = CATALOG_DIR.parent / "catalog.json"

TIERS = ("easy", "standard", "hard")

# --catalog-dir 在 main() 里改写它，load_chart / loudness 都读这个
ACTIVE_DIR = CATALOG_DIR


PHASE_STEPS = 2000  # 相位搜索分辨率（在一个八分音符周期内取 2000 个候选）
ONGRID_THR = 0.06  # 判定"贴格"的阈值，单位=拍


def best_phase(notes: list[float], beat: float) -> tuple[int, float]:
    """在 [0, 八分音符周期) 上扫相位，返回 (最多有多少音符贴格, 该相位的秒数)。

    用差分数组做区间投票，O(n + steps)。对每个候选相位重算一遍是 O(n·steps)，
    315 张谱会跑到分钟级。
    """
    grid = beat / 2.0
    thr = ONGRID_THR * beat  # 阈值换算成秒
    diff = [0] * (PHASE_STEPS + 1)

    for t in notes:
        base = t % grid
        i0 = int((base - thr) / grid * PHASE_STEPS) % PHASE_STEPS
        i1 = int((base + thr) / grid * PHASE_STEPS) % PHASE_STEPS
        if i0 <= i1:
            diff[i0] += 1
            diff[i1 + 1] -= 1
        else:  # 区间横跨周期边界，拆成首尾两段
            diff[i0] += 1
            diff[PHASE_STEPS] -= 1
            diff[0] += 1
            diff[i1 + 1] -= 1

    best_count, best_i, run = -1, 0, 0
    for i in range(PHASE_STEPS):
        run += diff[i]
        if run > best_count:
            best_count, best_i = run, i
    return best_count, best_i / PHASE_STEPS * grid


def gridfit(chart: dict) -> dict | None:
    notes = [n["t"] for n in chart.get("notes") or [] if n.get("t") is not None]
    if len(notes) < 20:
        return None
    bpm = chart.get("bpm") or 120.0
    beat = 60.0 / bpm
    declared = (chart.get("beat_map", {}).get("first_beat_ms") or 0) / 1000.0

    on_count, phase = best_phase(notes, beat)

    grid = beat / 2.0
    devs = []
    for t in notes:
        ph = ((t - phase) / grid) % 1.0
        devs.append(min(ph, 1.0 - ph) / 2.0)  # 0..0.25 拍

    iv = [notes[i + 1] - notes[i] for i in range(len(notes) - 1)]
    reg = sum(
        1 for d in iv if min(abs(d - k * beat) for k in (1, 2, 4, 8)) < beat * 0.12
    ) / len(iv)

    return {
        "n": len(notes),
        "med": round(st.median(devs) * 100, 1),
        "ongrid": round(100.0 * on_count / len(notes), 1),
        "reg": round(reg * 100, 1),
        "phase": round(((phase - declared) % grid) * 1000),
    }


def load_chart(tid: str, tier: str) -> dict | None:
    p = ACTIVE_DIR / tid / f"{tier}.json"
    if not p.is_file():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def main() -> int:
    ap = argparse.ArgumentParser(description="BeatScape chart grid-fit report")
    ap.add_argument("--track", help="Only report one track_id")
    ap.add_argument("--tier", choices=TIERS, help="Only report one tier")
    ap.add_argument("--worst", type=int, default=0, help="Only show the N worst (by 网格内%)")
    ap.add_argument("--loud", action="store_true", help="Also measure onset loudness (needs audio decode, slow)")
    ap.add_argument("--fail-under", type=float, metavar="PCT", help="Exit 1 if any chart's 网格内% < PCT")
    ap.add_argument(
        "--catalog-dir",
        type=Path,
        default=CATALOG_DIR,
        help="读另一份谱面目录（配合 catalog.json 用，用于对比改动前后）",
    )
    args = ap.parse_args()

    global ACTIVE_DIR
    ACTIVE_DIR = args.catalog_dir
    catalog = json.loads((ACTIVE_DIR.parent / "catalog.json").read_text(encoding="utf-8"))
    tiers = (args.tier,) if args.tier else TIERS

    # --loud 需要解码音频做 onset 检测，很慢，所以按 track 缓存、且只在要它时才 import
    audio = None
    if args.loud:
        import importlib.util

        spec = importlib.util.spec_from_file_location(
            "beatscape_audio", ROOT / "scripts" / "beatscape-audio.py"
        )
        assert spec and spec.loader
        audio = importlib.util.module_from_spec(spec)
        sys.modules["beatscape_audio"] = audio
        spec.loader.exec_module(audio)

    def loudness(tr: dict, chart: dict) -> float:
        assert audio is not None
        rel = str(tr.get("audio", "")).lstrip("/")
        ap = ACTIVE_DIR.parent / rel
        an = audio.analyze_audio(ap, float(tr.get("bpm", 120)))
        avg_all = st.fmean(an.onset_energies) or 1.0
        sel = [
            an.onset_energies[
                min(
                    range(len(an.onsets_sec)),
                    key=lambda i: abs(an.onsets_sec[i] - n["t"]),
                )
            ]
            for n in chart["notes"]
            if n.get("t") is not None
        ]
        return round(st.fmean(sel) / avg_all, 2)

    rows: list[tuple[str, str, str, dict]] = []
    for tr in catalog["tracks"]:
        tid = tr["track_id"]
        if args.track and tid != args.track:
            continue
        for tier in tiers:
            chart = load_chart(tid, tier)
            if chart is None:
                continue
            m = gridfit(chart)
            if not m:
                continue
            if args.loud:
                try:
                    m["loud"] = loudness(tr, chart)
                except Exception as exc:  # noqa: BLE001 - 单曲失败不该中断整份报告
                    print(f"  (loudness failed for {tid}/{tier}: {exc})", file=sys.stderr)
            rows.append((tid, str(tr.get("title", "")), tier, m))

    if not rows:
        print("no charts matched", file=sys.stderr)
        return 1

    rows.sort(key=lambda r: r[3]["ongrid"])
    shown = rows[: args.worst] if args.worst else rows

    hdr = (
        f"{'track_id':<12}{'title':<24}{'tier':<10}{'n':>5}"
        f"{'离格%':>8}{'网格内%':>9}{'规整%':>8}{'相位ms':>8}"
    )
    if args.loud:
        hdr += f"{'响度x':>8}"
    if args.worst:
        print(f"--- worst {len(shown)} of {len(rows)} (by 网格内%) ---")
    print(hdr)
    for tid, title, tier, m in shown:
        line = (
            f"{tid:<12}{title:<24}{tier:<10}{m['n']:>5}"
            f"{m['med']:>8}{m['ongrid']:>9}{m['reg']:>8}{m['phase']:>8}"
        )
        if args.loud:
            line += f"{m.get('loud', float('nan')):>8}"
        print(line)

    vals = [m["ongrid"] for _, _, _, m in rows]
    print(
        f"\n{len(rows)} charts · 网格内% min={min(vals):.1f} "
        f"median={st.median(vals):.1f} mean={st.fmean(vals):.1f} max={max(vals):.1f}"
    )

    if args.fail_under is not None:
        bad = [r for r in rows if r[3]["ongrid"] < args.fail_under]
        if bad:
            print(f"\nFAIL: {len(bad)} chart(s) below {args.fail_under}% 网格内", file=sys.stderr)
            for tid, title, tier, m in bad[:25]:
                print(f"  {tid} {title} {tier} {m['ongrid']}%", file=sys.stderr)
            return 1
        print(f"PASS: all {len(rows)} chart(s) >= {args.fail_under}% 网格内")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
