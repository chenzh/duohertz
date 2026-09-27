#!/usr/bin/env python3
"""Render the independent Future Bass candidate Aurora Skipline outside the catalog.

Requires numpy and ffmpeg. All sound comes from oscillators and seeded noise;
technical alignment does not replace listening or rights review.
"""

from __future__ import annotations

import hashlib
import json
import math
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-003-aurora-skipline"
TRACK_ID = "dh-003-aurora-skipline"
RATE = 32_000
BPM = 128
BEAT = 60 / BPM
SECONDS = 60
STREAM_SECONDS = 120
AAC_GAIN_DB = -2.0
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(2026092403)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def times(length: float) -> np.ndarray:
    return np.arange(round(length * RATE), dtype=np.float64) / RATE


def add(stereo: np.ndarray, at: float, signal: np.ndarray, pan: float = 0) -> None:
    origin = round(at * RATE)
    if origin >= SAMPLES:
        return
    end = min(SAMPLES, origin + len(signal))
    mono = signal[:end - origin]
    stereo[0, origin:end] += mono * (1 - max(0, pan))
    stereo[1, origin:end] += mono * (1 + min(0, pan))


def saw(t: np.ndarray, frequency: float, harmonics: int = 7) -> np.ndarray:
    result = np.zeros_like(t)
    for part in range(1, harmonics + 1):
        result += np.sin(math.tau * frequency * part * t) / (part ** 1.35)
    return result / 1.75


def kick(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.33)
    phase = math.tau * (49 * t + 125 * (1 - np.exp(-31 * t)) / 31)
    add(stereo, at, np.sin(phase) * np.exp(-15 * t) * level)


def clap(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.22)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.72
    flutter = 0.65 + 0.35 * np.cos(math.tau * 36 * t) ** 2
    add(stereo, at, high * np.exp(-19 * t) * flutter * level)


def tick(stereo: np.ndarray, at: float, level: float, pan: float) -> None:
    t = times(0.07)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.85
    add(stereo, at, high * np.exp(-63 * t) * level, pan)


def sub(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = times(0.45)
    envelope = np.clip(t / 0.005, 0, 1) * np.exp(-3.1 * t)
    signal = np.sin(math.tau * frequency * t) + 0.24 * np.sin(math.tau * 2 * frequency * t)
    add(stereo, at, signal * envelope * level)


def chord_stab(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    t = times(0.39)
    envelope = np.clip(t / 0.008, 0, 1) * np.exp(-6.6 * t)
    for index, frequency in enumerate(frequencies):
        wobble = saw(t, frequency * 0.997, 6) + saw(t, frequency * 1.003, 6)
        add(stereo, at, wobble * envelope * level / len(frequencies), (index - 1) * 0.28)


def glass_lead(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = times(0.36)
    envelope = np.clip(t / 0.004, 0, 1) * np.exp(-8.5 * t)
    signal = np.sin(math.tau * frequency * t) + 0.38 * np.sin(math.tau * 2.01 * frequency * t)
    add(stereo, at, signal * envelope * level, pan)


def air_pad(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    t = times(1.81)
    envelope = np.clip(t / 0.18, 0, 1) * np.clip((1.81 - t) / 0.32, 0, 1)
    for index, frequency in enumerate(frequencies):
        signal = np.sin(math.tau * frequency * t) + 0.25 * np.sin(math.tau * frequency * 2 * t)
        add(stereo, at, signal * envelope * level / len(frequencies), (index - 1) * 0.3)


def render_wav(path: Path) -> None:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    # D–Bm–G–A. The half-time clap and bouncing chord stabs distinguish this
    # arrangement from the straight house and slow analog Synthwave candidates.
    roots = (73.42, 61.74, 49.00, 55.00)
    chords = ((293.66, 369.99, 440.00), (246.94, 293.66, 369.99),
              (196.00, 246.94, 293.66), (220.00, 277.18, 329.63))
    melody = ((587.33, 659.25, 739.99, 880.00), (493.88, 587.33, 739.99, 587.33),
              (392.00, 493.88, 587.33, 659.25), (440.00, 554.37, 659.25, 739.99))
    for bar in range(32):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 4
        break_section = 12 <= bar < 16
        chorus = 16 <= bar < 28
        outro = bar >= 28
        air_pad(stereo, start, chords[harmony], 0.04 if break_section else 0.053)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            kick(stereo, at, 0.23 if break_section else (0.36 if chorus else 0.30))
            if beat_index == 2 and not break_section:
                clap(stereo, at, 0.26 if chorus else 0.21)
            sub(stereo, at, roots[harmony], 0.11 if break_section else 0.19)
            if not intro and not break_section:
                chord_stab(stereo, at, chords[harmony], 0.10 if chorus else 0.073)
            if beat_index in (0, 2) and not intro and not outro:
                glass_lead(stereo, at, melody[harmony][beat_index], 0.07 if chorus else 0.05,
                           -0.12 if beat_index == 0 else 0.12)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            tick(stereo, at, 0.10 if break_section else (0.17 if chorus else 0.13),
                 -0.23 if eighth % 2 else 0.23)
            if eighth % 2 and not intro and not break_section and not outro:
                glass_lead(stereo, at, melody[harmony][(eighth // 2) % 4] * 2,
                           0.041 if chorus else 0.029, -0.2 if eighth % 4 == 1 else 0.2)

    fade = round(0.8 * RATE)
    stereo[:, -fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    peak = float(np.max(np.abs(stereo)))
    if peak <= 0 or not math.isfinite(peak):
        raise ValueError("Rendered audio is silent or invalid")
    pcm = (np.clip(stereo.T * (0.88 / peak), -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm.tobytes())


def render_stream_wav(game_source: Path, path: Path) -> None:
    """Extend the game section with a newly arranged 32-bar Future Bass answer."""
    with wave.open(str(game_source), "rb") as source:
        if source.getnchannels() != 2 or source.getsampwidth() != 2 or source.getframerate() != RATE:
            raise ValueError("Unexpected game source format")
        first = source.readframes(SAMPLES)
    if len(first) != SAMPLES * 2 * 2:
        raise ValueError("Incomplete game source")

    second = np.zeros((2, SAMPLES), dtype=np.float32)
    # E minor–G–D–A answers the game's D–B minor–G–A movement. Bass and
    # chord stabs move between beats; the glass hook now falls and replies.
    roots = (41.20, 49.00, 73.42, 55.00)
    chords = ((164.81, 196.00, 246.94), (196.00, 246.94, 293.66),
              (293.66, 369.99, 440.00), (220.00, 277.18, 329.63))
    melody = ((783.99, 659.25, 587.33, 493.88), (739.99, 587.33, 493.88, 392.00),
              (880.00, 739.99, 659.25, 587.33), (739.99, 659.25, 554.37, 440.00))
    for bar in range(32):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        reentry = bar < 4
        breath = 12 <= bar < 16
        lift = 16 <= bar < 28
        outro = bar >= 28
        air_pad(second, start, chords[harmony], 0.043 if breath else 0.057)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if not breath or beat_index in (0, 2):
                kick(second, at, 0.23 if breath else (0.37 if lift else 0.31))
            if beat_index == 2 and not breath:
                clap(second, at, 0.28 if lift else 0.21)
            if not breath and not outro:
                sub(second, at + BEAT / 2, roots[harmony], 0.20 if lift else 0.15)
            elif beat_index in (0, 2):
                sub(second, at, roots[harmony], 0.10)
            if not reentry and not breath and not outro and beat_index in (1, 3):
                glass_lead(second, at, melody[harmony][beat_index],
                           0.075 if lift else 0.055, -0.14 if beat_index == 1 else 0.14)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            tick(second, at, 0.095 if breath else (0.18 if lift else 0.13),
                 0.25 if eighth % 2 else -0.25)
            if eighth % 2 and not breath and not outro:
                chord_stab(second, at, chords[harmony],
                           0.12 if lift else (0.055 if reentry else 0.085))
            if eighth in (1, 5) and lift:
                glass_lead(second, at, melody[harmony][(eighth + 1) // 2] * 2,
                           0.028, -0.20 if eighth == 1 else 0.20)

    fade = round(0.9 * RATE)
    second[:, -fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    peak = float(np.max(np.abs(second)))
    if peak <= 0 or not math.isfinite(peak):
        raise ValueError("Second movement is silent or invalid")
    pcm = (np.clip(second.T * (0.88 / peak), -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(first)
        output.writeframes(pcm.tobytes())


def chart(tier: str) -> dict:
    notes: list[dict] = []
    if tier == "easy":
        for beat_index in range(4, 124, 2):
            at = round(beat_index * BEAT, 6)
            if beat_index % 16 == 14:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT / 2, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for beat_index in range(4, 124):
            notes.append({"id": f"s-{beat_index}", "type": "tap", "t": round(beat_index * BEAT, 6),
                          "key": beat_index % 2})
    else:
        for eighth in range(8, 248):
            at = round(eighth * BEAT / 2, 6)
            if eighth % 32 == 0:
                notes.append({"id": f"h-{eighth}", "type": "chord", "t": at, "keys": [0, 1]})
            else:
                notes.append({"id": f"h-{eighth}", "type": "tap", "t": at, "key": eighth % 2})
    return {
        "format": 2, "theme": "duohertz", "track_id": TRACK_ID, "tier": tier,
        "input_count": 1 if tier == "easy" else 2,
        "bpm": BPM, "audio_offset_ms": 0,
        "total_notes": sum(2 if note["type"] == "chord" else 1 for note in notes),
        "notes": notes,
    }


def encode(source: Path, target: Path, *, seconds: int | None = None) -> None:
    command = ["ffmpeg", "-v", "error", "-y", "-i", str(source)]
    if seconds is not None:
        command.extend(["-t", str(seconds)])
    command.extend(["-af", f"volume={AAC_GAIN_DB:g}dB", "-c:a", "aac", "-b:a", "160k", str(target)])
    subprocess.run(command, check=True)


def write_cover(path: Path) -> None:
    path.write_text("""<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <image href="cover-art.png" width="1024" height="1024" preserveAspectRatio="xMidYMid slice" />
  <rect y="766" width="1024" height="258" fill="#111421" opacity="0.9" />
  <text x="80" y="857" fill="#67eee0" font-family="sans-serif" font-size="35" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="80" y="934" fill="#fff9ef" font-family="sans-serif" font-size="65" font-weight="700">Aurora Skipline</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="duohertz-aurora-skipline-") as temp:
        source = Path(temp) / "source.wav"
        stream_source = Path(temp) / "stream.wav"
        render_wav(source)
        encode(source, OUT / "audio.m4a")
        render_stream_wav(source, stream_source)
        encode(stream_source, OUT / "stream.m4a")
        encode(source, OUT / "preview_48s.m4a", seconds=48)
    for tier in ("easy", "standard", "hard"):
        (OUT / f"{tier}.json").write_text(json.dumps(chart(tier), indent=2) + "\n", encoding="utf-8")
    write_cover(OUT / "cover.svg")
    files = {path.name: sha(path) for path in sorted(OUT.iterdir()) if path.is_file() and path.name != "manifest.json"}
    manifest = {
        "track_id": TRACK_ID,
        "title": "Aurora Skipline",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Future Bass",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Independent deterministic D–B minor–G–A half-time Future Bass game movement and new E minor–G–D–A answer movement for a 120-second stream master; generated oscillators and seeded noise only, no sampled source audio or repeated first-minute loop; -2 dB linear gain before AAC encoding",
        "audio_gain_db": AAC_GAIN_DB,
        "source_script": "scripts/duohertz-compose-aurora-skipline.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": json.loads((ROOT / "scripts/duohertz-art-prompts/dh-003-aurora-skipline.json").read_text(encoding="utf-8")),
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
