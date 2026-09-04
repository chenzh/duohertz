#!/usr/bin/env python3
"""诊断：谱面音符与音频能量包络的对齐。

为什么不用「最近 onset」：一首 120s 的曲子常有 1300+ 个 onset（平均每 88ms
一个），任意时间点附近都能找到一个 onset，所以「最近距离 18ms」跟随机猜测
差不多，是个假阳性指标。

这里改用**互相关**：把音符时间和 onset 能量都打成 10ms 分辨率的序列，在
±1.2s 里滑动求相关，看最佳对齐落在哪个 lag。
  · 峰值在 lag≈0 且明显高于周围 → 谱面与音频同步
  · 峰值在 lag=d → 存在系统性错位 d 秒（音符整体早/晚于音乐）
  · 没有明显峰值   → 音符没踩在音乐的能量点上（谱面与音频不匹配）
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_JSON = ROOT / "apps" / "beatscape" / "public" / "catalog.json"
BASE = CATALOG_JSON.parent  # catalog.json 里的路径相对 public/
BIN = 0.010  # 10ms 分辨率
LAG_BINS = 120  # ±1.2s

_spec = importlib.util.spec_from_file_location("beatscape_audio", ROOT / "scripts" / "beatscape-audio.py")
assert _spec and _spec.loader
_audio = importlib.util.module_from_spec(_spec)
sys.modules["beatscape_audio"] = _audio
_spec.loader.exec_module(_audio)
analyze_audio = _audio.analyze_audio


def envelope(onsets: list[float], energies: list[float], n: int, dur: float) -> list[float]:
    """把 (时间, 能量) 打成定长能量序列；能量按 onset 强度加权。"""
    env = [0.0] * n
    for t, e in zip(onsets, energies):
        i = int(t / BIN)
        if 0 <= i < n:
            env[i] += e
    return env


def norm(v: list[float]) -> list[float]:
    m = sum(v) / len(v)
    c = [x - m for x in v]
    s = sum(x * x for x in c) ** 0.5
    return [x / s for x in c] if s > 0 else c


def corr_at(a: list[float], b: list[float], lag: int) -> float:
    """corr(a[i], b[i+lag]) —— lag>0 表示 b 相对 a 延后。"""
    n = len(a)
    lo = max(0, -lag)
    hi = min(n, n - lag)
    if hi - lo < n // 4:
        return 0.0
    return sum(a[i] * b[i + lag] for i in range(lo, hi)) / (hi - lo)


def check(tid: str, tier: str) -> None:
    catalog = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
    tr = next((t for t in catalog["tracks"] if t["track_id"] == tid), None)
    if tr is None:
        print(f"{tid}: not in catalog")
        return

    ap = BASE / str(tr["audio"]).lstrip("/")
    chart = json.loads((BASE / str(tr["charts"][tier]).lstrip("/")).read_text(encoding="utf-8"))
    a = analyze_audio(ap, float(tr.get("bpm", 120)))

    dur = a.duration_sec
    n = int(dur / BIN) + 1
    env = norm(envelope(a.onsets_sec, a.onset_energies, n, dur))

    notes = [x for x in chart["notes"] if x.get("type") != "slide"]
    nb = [0.0] * n
    for x in notes:
        i = int(x["t"] / BIN)
        if 0 <= i < n:
            nb[i] += 1.0
    nb = norm(nb)

    cors = [(lag, corr_at(nb, env, lag)) for lag in range(-LAG_BINS, LAG_BINS + 1)]
    best_lag, best = max(cors, key=lambda kv: kv[1])
    at_zero = dict(cors)[0]
    peak_ratio = best / at_zero if at_zero > 0 else float("inf")

    print(f"\n=== {tid} {tr.get('title','')} [{tier}] ===")
    print(f"  chart bpm {chart['bpm']} · audio bpm {a.bpm:.1f} · {dur:.1f}s · onsets {len(a.onsets_sec)}")
    print(f"  notes {len(notes)} · chart audio_offset_ms {chart['audio_offset_ms']} · detected first_beat {a.audio_offset_ms}ms")
    print(f"  best lag {best_lag*BIN*1000:+.0f}ms (corr {best:.4f}) · lag0 corr {at_zero:.4f} · peak/0 = {peak_ratio:.2f}x")

    if abs(best_lag * BIN) <= 0.02:
        print("  >> 同步：最佳对齐在 lag≈0")
    elif peak_ratio > 1.15:
        d = best_lag * BIN
        print(f"  >> 系统性错位 {d*1000:+.0f}ms：音符整体{'偏晚' if d > 0 else '偏早'}于音乐（峰值比 lag0 高 {(peak_ratio-1)*100:.0f}%）")
    else:
        print("  >> 无明显峰值：音符没踩在音乐能量点上（疑似谱面与该音频不匹配）")


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print("usage: beatscape-chart-sync-check.py <track_id|--all> [tier]")
        sys.exit(1)
    if args[0] == "--all":
        cat = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
        tier = args[1] if len(args) > 1 else "easy"
        bad = 0
        for t in cat["tracks"]:
            try:
                check(t["track_id"], tier)
            except Exception as e:  # noqa: BLE001
                print(f"{t['track_id']}: ERROR {e}")
                bad += 1
        print(f"\n(扫描完成，异常 {bad} 首)")
    else:
        check(args[0], args[1] if len(args) > 1 else "easy")
