#!/usr/bin/env python3
"""BeatScape audio analysis — decode m4a, detect BPM, onsets, first-beat anchor.

Pure stdlib + macOS `afconvert` (no numpy). Used by beatscape-chartgen / audit.
"""

from __future__ import annotations

import array
import math
import shutil
import subprocess
import tempfile
import wave
from dataclasses import dataclass
from pathlib import Path


@dataclass
class AudioAnalysis:
    path: Path
    duration_sec: float
    sample_rate: int
    bpm: float
    bpm_hint: float
    audio_offset_ms: int
    onsets_sec: list[float]
    onset_energies: list[float]
    onset_lanes: list[int]


def _afconvert_to_wav(src: Path) -> Path:
    if shutil.which("afconvert") is None:
        raise RuntimeError("afconvert not found (macOS required for m4a decode)")
    tmp = Path(tempfile.mkdtemp(prefix="bs-audio-")) / "decoded.wav"
    subprocess.run(
        ["afconvert", "-f", "WAVE", "-d", "LEI16@44100", str(src), str(tmp)],
        check=True,
        capture_output=True,
    )
    return tmp


def read_wav_stereo(path: Path) -> tuple[list[float], list[float], int]:
    with wave.open(str(path), "rb") as w:
        n, rate, ch, sw = w.getnframes(), w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(n)
    if sw != 2:
        raise ValueError(f"unsupported sample width {sw}")
    samples = array.array("h")
    samples.frombytes(raw)
    if ch == 1:
        mono = [float(x) for x in samples]
        return mono, mono, rate
    left = [float(samples[i]) for i in range(0, len(samples), 2)]
    right = [float(samples[i + 1]) for i in range(0, len(samples), 2)]
    return left, right, rate


def load_audio(path: Path) -> tuple[list[float], list[float], int, float]:
    """Return (left, right, sample_rate, duration_sec). Decodes m4a via afconvert."""
    wav_path = path
    cleanup: Path | None = None
    if path.suffix.lower() == ".m4a":
        wav_path = _afconvert_to_wav(path)
        cleanup = wav_path.parent
    try:
        left, right, rate = read_wav_stereo(wav_path)
        dur = len(left) / rate
        return left, right, rate, dur
    finally:
        if cleanup and cleanup.exists():
            shutil.rmtree(cleanup, ignore_errors=True)


def _envelope(mono: list[float], rate: int, hop: int) -> list[float]:
    out: list[float] = []
    for i in range(0, len(mono), hop):
        chunk = mono[i : i + hop]
        if not chunk:
            break
        out.append(math.sqrt(sum(x * x for x in chunk) / len(chunk)))
    return out


def detect_onsets(
    left: list[float],
    right: list[float],
    rate: int,
    *,
    hop: int | None = None,
    flux_thresh: float = 0.018,
) -> tuple[list[float], list[float]]:
    """Return (onset_times_sec, per-onset energy)."""
    hop = hop or max(256, rate // 100)
    mono = [(left[i] + right[i]) / 2 for i in range(min(len(left), len(right)))]
    env = _envelope(mono, rate, hop)
    if not env:
        return [], []
    mx = max(env) or 1.0
    env_n = [e / mx for e in env]
    flux = [max(0.0, env_n[i] - env_n[i - 1]) for i in range(1, len(env_n))]
    scale = rate / hop
    onsets: list[float] = []
    energies: list[float] = []
    min_gap = 0.06
    last_t = -1.0
    for i, f in enumerate(flux):
        if f < flux_thresh:
            continue
        t = (i + 1) / scale
        if t - last_t < min_gap:
            continue
        idx = int(t * rate)
        l = abs(left[min(idx, len(left) - 1)])
        r = abs(right[min(idx, len(right) - 1)])
        onsets.append(t)
        energies.append(l + r)
        last_t = t
    return onsets, energies


def estimate_bpm_from_onsets(onsets: list[float], hint: float) -> float:
    if len(onsets) < 6:
        return hint
    intervals: list[float] = []
    for i in range(1, min(len(onsets), 80)):
        d = (onsets[i] - onsets[i - 1]) * 1000
        if 200 < d < 1200:
            intervals.append(d)
    if not intervals:
        return hint
    intervals.sort()
    median_ms = intervals[len(intervals) // 2]
    bpm = 60000.0 / median_ms
    quantized = _fold_octave(round(bpm / 2) * 2, hint)
    if abs(quantized - hint) <= 18:
        return float(hint)
    return float(max(60, min(200, quantized)))


def _fold_octave(bpm: float, hint: float) -> float:
    """Fold a detected BPM into the octave closest to the hint.

    Onset-density estimation reads subdivisions (8ths / 16ths) as the beat, so a
    94 BPM track can report 188. Folding by powers of two toward the hint keeps
    the reported tempo on the tactus instead of the subdivision grid.
    """
    best, best_dist = bpm, abs(bpm - hint)
    for factor in (0.5, 0.25, 2.0, 4.0):
        cand = bpm * factor
        if not 60 <= cand <= 200:
            continue
        dist = abs(cand - hint)
        if dist < best_dist - 1e-6:
            best, best_dist = cand, dist
    return round(best / 2) * 2


def estimate_bpm_autocorr(mono: list[float], rate: int, hint: float) -> float | None:
    hop = max(1, rate // 100)
    env = _envelope(mono, rate, hop)
    if len(env) < 40:
        return None
    mx = max(env) or 1.0
    env = [e / mx for e in env]
    onset = [max(0.0, env[i] - env[i - 1]) for i in range(1, len(env))]
    scale = rate / hop
    min_lag = int(60 / hint * scale * 0.82)
    max_lag = int(60 / hint * scale * 1.18)
    best_lag, best_score = None, -1.0
    for lag in range(max(2, min_lag), min(max_lag, len(onset) // 2)):
        score = sum(onset[i] * onset[i + lag] for i in range(len(onset) - lag))
        if score > best_score:
            best_score, best_lag = score, lag
    if not best_lag:
        return None
    return 60.0 / (best_lag / scale)


def first_audible_sec(mono: list[float], rate: int, win_s: float = 0.05) -> float:
    """When meaningful audio starts (after leading silence)."""
    win = max(1, int(rate * win_s))
    rms = _envelope(mono, rate, win)
    if not rms:
        return 0.0
    peak = max(rms) or 1.0
    thresh = peak * 0.08
    for i, v in enumerate(rms):
        if v >= thresh:
            return i * win_s
    return 0.0


def lane_at_sample(left: list[float], right: list[float], idx: int) -> int:
    l = abs(left[min(idx, len(left) - 1)])
    r = abs(right[min(idx, len(right) - 1)])
    if l >= r * 1.25:
        return 0 if l > r * 1.5 else 1
    if r >= l * 1.25:
        return 3 if r > l * 1.5 else 2
    return 1 if l >= r else 2


def snap_to_grid(t: float, bpm: float, subdiv: int = 4, max_ms: float = 45) -> float:
    beat = 60.0 / bpm
    step = beat / subdiv
    q = round(t / step) * step
    if abs(q - t) * 1000 <= max_ms:
        return round(q, 3)
    return round(t, 3)


def analyze_audio(path: Path, bpm_hint: float) -> AudioAnalysis:
    left, right, rate, dur = load_audio(path)
    mono = [(left[i] + right[i]) / 2 for i in range(min(len(left), len(right)))]
    onsets, energies = detect_onsets(left, right, rate)
    bpm_onset = estimate_bpm_from_onsets(onsets, bpm_hint)
    bpm_ac = estimate_bpm_autocorr(mono, rate, bpm_hint)
    if bpm_ac and abs(bpm_ac - bpm_hint) <= abs(bpm_onset - bpm_hint):
        bpm = bpm_ac if abs(bpm_ac - bpm_hint) <= 18 else bpm_onset
    else:
        bpm = bpm_onset

    audible = first_audible_sec(mono, rate)
    strong = [t for t, e in zip(onsets, energies) if t >= audible - 0.02 and e > 0]
    first_beat = strong[0] if strong else audible
    offset_ms = int(round(first_beat * 1000))

    filtered_onsets: list[float] = []
    filtered_energy: list[float] = []
    filtered_lanes: list[int] = []
    for t, e in zip(onsets, energies):
        if t < first_beat - 0.02:
            continue
        if t > dur - 1.0:
            continue
        st = snap_to_grid(t, bpm)
        idx = int(t * rate)
        filtered_onsets.append(st)
        filtered_energy.append(e)
        filtered_lanes.append(lane_at_sample(left, right, idx))

    return AudioAnalysis(
        path=path,
        duration_sec=dur,
        sample_rate=rate,
        bpm=bpm,
        bpm_hint=bpm_hint,
        audio_offset_ms=offset_ms,
        onsets_sec=filtered_onsets,
        onset_energies=filtered_energy,
        onset_lanes=filtered_lanes,
    )


def nearest_onset_distance(note_t: float, onsets: list[float]) -> float:
    if not onsets:
        return 999.0
    return min(abs(note_t - o) for o in onsets) * 1000
