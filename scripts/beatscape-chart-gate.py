#!/usr/bin/env python3
"""BeatScape chart gate — 新曲入库门禁：谱面必须与音频匹配。

三道检查（每首曲子分析一次音频，三个档位各查一遍谱面）：
  1. onset-lock 踩点率：≥95% 的音符距真实 onset ≤60ms。
     谱面由 onset 生成，健康谱面接近 100%；这项抓"谱面与音频文件不匹配"的灾难错配
     （如音频被替换后谱面没重生成），且不依赖互相关，onset 稀疏/不规整的曲子也能测。
     注意"最近 onset 距离"单独用会有假阳性（onset 密时随机点也能命中），所以它只做
     兜底与灾难检测，主指标是第 2 项。
  2. 互相关偏移：音符序列与 onset 能量包络在 ±1.2s 内求互相关（同
     beatscape-chart-sync-check.py 的算法）。
     存在显著峰（峰值/lag0 > 1.15）且 |lag| > 50ms → 音符整体系统性错位，FAIL。
     相关退化（无明显峰）不算失败 —— 交给第 1 项兜底（实测 bs-p3-08 / bs-s6-07
     这类 onset 间隔不规整的曲子会退化，但踩点率 100%）。
  3. gridfit 贴格率：复用 beatscape-chart-gridfit.gridfit()，音符落在判定网格 ±6% 拍内
     的占比须达到档位下限（默认 easy/standard 55、hard 85，--min-* 可覆盖）。
     下限参考现库分布（中位 easy 81.7 / standard 79.6 / hard 97.1），卡的是"新曲至少
     不比现库中低分位差"，不是现库最低分 —— 老曲有一批慢速不规整音频的谱面
     （33~60%）属音频硬上限（见 gridfit 脚本头部文档）；重跑老曲时用 --min-* 放宽。

任何一项 FAIL → 退出码 1，管线在 beatscape-ingest-stream.py（写 catalog.json）之前
被拦下，坏谱不会进入曲库。

用法：
  python3 scripts/beatscape-chart-gate.py --track bs-s7-01 [--track ...]
  python3 scripts/beatscape-chart-gate.py --all
  python3 scripts/beatscape-chart-gate.py --track bs-p4-09 --min-easy 30   # 老曲放宽示例
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "apps" / "beatscape" / "public"
CATALOG_JSON = PUBLIC / "catalog.json"
TIERS = ("easy", "standard", "hard")

MIN_ONGRID = {"easy": 55.0, "standard": 55.0, "hard": 85.0}
LOCK_MS = 60.0  # 音符距 onset 视为"踩上"的阈值（chartgen snap 上限 45ms + 舍入余量）
LOCK_PCT = 95.0
BIN = 0.010  # 互相关分辨率（秒）
LAG_BINS = 120  # ±1.2s
MISALIGN_MS = 50.0  # 系统性错位判定阈值
PEAK_RATIO = 1.15  # 显著峰判定：最佳 lag 相关 / lag0 相关
DEGENERATE = 0.05  # 全程相关低于此值视为退化，不做错位判定


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


_audio = _load("beatscape_audio", ROOT / "scripts" / "beatscape-audio.py")
_gridfit = _load("beatscape_chart_gridfit", ROOT / "scripts" / "beatscape-chart-gridfit.py")
analyze_audio = _audio.analyze_audio
nearest_onset_distance = _audio.nearest_onset_distance
gridfit_score = _gridfit.gridfit


def _norm(v: list[float]) -> list[float]:
    m = sum(v) / len(v)
    c = [x - m for x in v]
    s = sum(x * x for x in c) ** 0.5
    return [x / s for x in c] if s > 0 else c


def _corr_at(a: list[float], b: list[float], lag: int) -> float:
    n = len(a)
    lo, hi = max(0, -lag), min(n, n - lag)
    if hi - lo < n // 4:
        return 0.0
    return sum(a[i] * b[i + lag] for i in range(lo, hi)) / (hi - lo)


def _best_lag(note_bins: list[float], env: list[float]) -> tuple[int, float, float]:
    cors = {lag: _corr_at(note_bins, env, lag) for lag in range(-LAG_BINS, LAG_BINS + 1)}
    best_lag = max(cors, key=lambda k: cors[k])
    return best_lag, cors[best_lag], cors[0]


def check_chart(tier: str, chart: dict, analysis) -> list[str]:
    """返回该档位的失败原因列表（空 = 通过）。"""
    fails: list[str] = []
    notes = [x for x in chart.get("notes") or [] if x.get("t") is not None]
    if not notes:
        return ["no notes in chart"]
    onsets = analysis.onsets_sec

    # 1. onset-lock 踩点率
    d = [nearest_onset_distance(x["t"], onsets) for x in notes]
    lock_pct = 100.0 * sum(1 for x in d if x <= LOCK_MS) / len(d)
    if lock_pct < LOCK_PCT:
        p90 = sorted(d)[int(len(d) * 0.9)] if len(d) >= 10 else max(d)
        fails.append(
            f"onset-lock {lock_pct:.1f}% < {LOCK_PCT:.0f}%（距最近 onset ≤{LOCK_MS:.0f}ms 的音符占比，p90={p90:.0f}ms）"
            " —— 谱面疑似不是由该音频生成"
        )

    # 2. 互相关系统性错位
    dur = analysis.duration_sec
    n = int(dur / BIN) + 1
    env = _norm(_audio_envelope(onsets, analysis.onset_energies, n))
    nb = [0.0] * n
    for x in notes:
        i = int(x["t"] / BIN)
        if 0 <= i < n:
            nb[i] += 1.0
    nb = _norm(nb)
    lag, best, at0 = _best_lag(nb, env)
    lag_ms = lag * BIN * 1000
    ratio = best / at0 if at0 > 0 else float("inf")
    if best >= DEGENERATE and abs(lag_ms) > MISALIGN_MS and ratio > PEAK_RATIO:
        fails.append(
            f"系统性错位 {lag_ms:+.0f}ms（corr {best:.3f} @lag, {at0:.3f} @0, 峰值比 {ratio:.2f}）"
            f" —— 音符整体{'偏晚' if lag_ms > 0 else '偏早'}于音乐"
        )

    # 3. gridfit 贴格率
    sc = gridfit_score(chart, tier)
    floor = MIN_ONGRID[tier]
    if sc is not None:
        if sc["ongrid"] < floor:
            fails.append(
                f"gridfit 贴格率 {sc['ongrid']:.1f}% < 档位下限 {floor:.0f}%"
                f"（离格中位 {sc['med']}% 拍，相位 {sc['phase']}ms）"
            )
    # 音符太少（<20）gridfit 返回 None，跳过第 3 项，前两项仍有效
    return fails


def _audio_envelope(onsets: list[float], energies: list[float], n: int) -> list[float]:
    env = [0.0] * n
    for t, e in zip(onsets, energies):
        i = int(t / BIN)
        if 0 <= i < n:
            env[i] += e
    return env


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--track", action="append", default=[], help="track_id，可重复")
    ap.add_argument("--all", action="store_true", help="检查 catalog 全部曲目")
    ap.add_argument("--min-easy", type=float, default=MIN_ONGRID["easy"])
    ap.add_argument("--min-standard", type=float, default=MIN_ONGRID["standard"])
    ap.add_argument("--min-hard", type=float, default=MIN_ONGRID["hard"])
    args = ap.parse_args()
    MIN_ONGRID.update(easy=args.min_easy, standard=args.min_standard, hard=args.min_hard)

    cat = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
    tracks = cat["tracks"]
    if args.track:
        wanted = set(args.track)
        tracks = [t for t in tracks if t["track_id"] in wanted]
        missing = wanted - {t["track_id"] for t in tracks}
        for tid in sorted(missing):
            print(f"FAIL {tid}: not in catalog")
        if missing:
            return 1
    elif not args.all:
        ap.error("need --track <id> (repeatable) or --all")

    n_fail = 0
    for tr in tracks:
        tid = tr["track_id"]
        ap_path = PUBLIC / str(tr["audio"]).lstrip("/")
        if not ap_path.is_file():
            print(f"FAIL {tid}: audio missing -> {ap_path.name}")
            n_fail += 1
            continue
        analysis = analyze_audio(ap_path, float(tr.get("bpm", 120)))
        for tier in TIERS:
            cp = PUBLIC / str(tr["charts"][tier]).lstrip("/")
            if not cp.is_file():
                print(f"FAIL {tid} [{tier}]: chart missing")
                n_fail += 1
                continue
            chart = json.loads(cp.read_text(encoding="utf-8"))
            fails = check_chart(tier, chart, analysis)
            if fails:
                n_fail += 1
                print(f"FAIL {tid} [{tier}] {tr.get('title', '')}")
                for f in fails:
                    print(f"     - {f}")
            else:
                print(f"pass {tid} [{tier}]")

    total = len(tracks) * len(TIERS)
    print(f"\n{total} charts checked, {n_fail} failed")
    return 1 if n_fail else 0


if __name__ == "__main__":
    sys.exit(main())
