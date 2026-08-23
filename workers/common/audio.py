"""Shared WAV synthesis for local MLX workers (MVP)."""

from __future__ import annotations

import os
import struct
import time
import wave
from typing import Literal

import numpy as np

EngineKind = Literal["ace", "sa3"]


def _synthesize(engine: EngineKind, duration_sec: int, seed_text: str) -> np.ndarray:
    sr = 44100
    duration_sec = max(5, min(duration_sec, 240))
    t = np.linspace(0, duration_sec, int(sr * duration_sec), endpoint=False)
    rng = np.random.default_rng(abs(hash(seed_text)) % (2**32))

    if engine == "sa3":
        # Instrumental BGM: layered pads, no vocal formants
        base = np.sin(2 * np.pi * 110 * t) * 0.08
        base += np.sin(2 * np.pi * 165 * t) * 0.06
        base += np.sin(2 * np.pi * 220 * t) * 0.04
        mod = 0.5 + 0.5 * np.sin(2 * np.pi * 0.25 * t)
        audio = base * mod
    else:
        # ACE vocal track: add formant-like modulation
        carrier = np.sin(2 * np.pi * 220 * t)
        vibrato = 1 + 0.02 * np.sin(2 * np.pi * 5.5 * t)
        vocal = np.sin(2 * np.pi * 440 * t * vibrato) * 0.12
        backing = np.sin(2 * np.pi * 110 * t) * 0.05
        audio = carrier * 0.06 + vocal + backing

    noise = rng.normal(0, 0.002, audio.shape)
    audio = np.clip(audio + noise, -1.0, 1.0)
    return (audio * 32767).astype(np.int16)


def write_wav(path: str, engine: EngineKind, duration_sec: int, seed_text: str) -> int:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    samples = _synthesize(engine, duration_sec, seed_text)
    with wave.open(path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(44100)
        wf.writeframes(samples.tobytes())
    return len(samples)


def maybe_run_real_inference(engine: EngineKind, payload: dict) -> bool:
    """Optional hook when official MLX repos are installed on Mac."""
    if engine != "ace":
        return False
    if os.getenv("WORKER_MODE", "synth") != "mlx":
        return False
    if os.getenv("ACE_API_URL") or os.getenv("ACE_STEP_REPO"):
        return True
    return False
