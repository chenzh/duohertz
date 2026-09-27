#!/usr/bin/env python3
"""Render one deterministic, original duohertz content candidate outside public/catalog.

This is a composition sketch for review, not a release or an automated way to fill
the 105-track catalog. It uses only generated oscillators/noise, no samples.
"""

from __future__ import annotations

import array
import hashlib
import json
import math
import random
import subprocess
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-001-first-frequency"
RATE = 32_000
BPM = 120
SECONDS = 64
STREAM_SECONDS = 128
STREAM_LIMITER = 0.5
FRAMES = RATE * SECONDS
TRACK_ID = "dh-001-first-frequency"
TAU = math.tau
RNG = random.Random(20260923)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def put(left: array.array, right: array.array, index: int, value: float, pan: float = 0.0) -> None:
    if 0 <= index < FRAMES:
        left[index] += value * (1 - max(0.0, pan))
        right[index] += value * (1 + min(0.0, pan))


def kick(left: array.array, right: array.array, start: float, strength: float) -> None:
    origin = round(start * RATE)
    for i in range(round(0.28 * RATE)):
        t = i / RATE
        phase = TAU * (49 * t + 96 * (1 - math.exp(-29 * t)) / 29)
        value = strength * math.sin(phase) * math.exp(-16 * t)
        put(left, right, origin + i, value)


def noise_hit(left: array.array, right: array.array, start: float, length: float,
              strength: float, pan: float = 0.0) -> None:
    origin = round(start * RATE)
    previous = 0.0
    for i in range(round(length * RATE)):
        t = i / RATE
        white = RNG.uniform(-1, 1)
        high = white - previous * 0.78
        previous = white
        value = strength * high * math.exp(-28 * t)
        put(left, right, origin + i, value, pan)


def pluck(left: array.array, right: array.array, start: float, length: float,
          frequency: float, strength: float, pan: float = 0.0) -> None:
    origin = round(start * RATE)
    for i in range(round(length * RATE)):
        t = i / RATE
        phase = TAU * frequency * t
        envelope = min(1.0, t / 0.007) * math.exp(-5.3 * t)
        value = strength * envelope * (
            math.sin(phase) + 0.23 * math.sin(phase * 2) + 0.07 * math.sin(phase * 3)
        )
        put(left, right, origin + i, value, pan)


def pad(left: array.array, right: array.array, start: float, length: float,
        frequency: float, strength: float, pan: float) -> None:
    origin = round(start * RATE)
    for i in range(round(length * RATE)):
        t = i / RATE
        attack = min(1.0, t / 0.16)
        release = min(1.0, max(0.0, length - t) / 0.24)
        phase = TAU * frequency * t
        value = strength * attack * release * (math.sin(phase) + 0.14 * math.sin(phase * 2))
        put(left, right, origin + i, value, pan)


def render_wav(path: Path) -> None:
    left = array.array("f", [0.0]) * FRAMES
    right = array.array("f", [0.0]) * FRAMES
    roots = [130.81, 98.00, 110.00, 87.31]  # C3, G2, A2, F2
    chords = [
        (261.63, 329.63, 392.00),
        (196.00, 246.94, 392.00),
        (220.00, 261.63, 329.63),
        (174.61, 220.00, 349.23),
    ]
    motifs = [
        (523.25, 659.25, 783.99, 659.25),
        (493.88, 587.33, 783.99, 587.33),
        (440.00, 523.25, 659.25, 523.25),
        (440.00, 523.25, 698.46, 523.25),
    ]
    for bar in range(32):
        start = bar * 2.0
        harmony = (bar // 2) % 4
        quiet = 16 <= bar < 20
        for index, frequency in enumerate(chords[harmony]):
            pad(left, right, start, 1.95, frequency, 0.020 if quiet else 0.030, (index - 1) * 0.32)
        for beat in range(4):
            at = start + beat * 0.5
            kick(left, right, at, 0.20 if quiet else (0.34 if beat == 0 else 0.28))
            if beat % 2 == 1 and not quiet:
                noise_hit(left, right, at, 0.14, 0.075)
            if not quiet or beat % 2 == 0:
                pluck(left, right, at, 0.33, roots[harmony], 0.10, -0.12)
            noise_hit(left, right, at + 0.25, 0.07, 0.025 if quiet else 0.040,
                      -0.22 if beat % 2 else 0.22)
            if bar >= 4 and not quiet and beat in (0, 1, 2, 3):
                pluck(left, right, at, 0.30, motifs[harmony][beat], 0.065,
                      0.18 if beat % 2 else -0.18)
        if bar % 8 == 7:
            noise_hit(left, right, start + 1.75, 0.17, 0.11)

    peak = max(max(abs(x) for x in left), max(abs(x) for x in right))
    scale = 0.84 / peak
    pcm = array.array("h")
    for l, r in zip(left, right):
        pcm.append(round(max(-1.0, min(1.0, l * scale)) * 32767))
        pcm.append(round(max(-1.0, min(1.0, r * scale)) * 32767))
    with wave.open(str(path), "wb") as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(pcm.tobytes())


def render_stream_wav(game_source: Path, path: Path) -> None:
    """Answer the game movement with a new 32-bar Melodic House movement."""
    with wave.open(str(game_source), "rb") as source:
        if source.getnchannels() != 2 or source.getsampwidth() != 2 or source.getframerate() != RATE:
            raise ValueError("Unexpected game source format")
        first = array.array("h")
        first.frombytes(source.readframes(FRAMES))
    if len(first) != FRAMES * 2:
        raise ValueError("Incomplete game source")

    left = array.array("f", [0.0]) * FRAMES
    right = array.array("f", [0.0]) * FRAMES
    # The answer starts in relative minor, changes the melodic contour and
    # places the bass and bell replies between the original downbeats.
    roots = (110.00, 87.31, 130.81, 98.00)  # A2–F2–C3–G2
    chords = (
        (220.00, 261.63, 329.63),
        (174.61, 220.00, 349.23),
        (261.63, 329.63, 392.00),
        (196.00, 246.94, 392.00),
    )
    replies = (
        (659.25, 523.25, 440.00, 523.25),
        (698.46, 523.25, 440.00, 349.23),
        (783.99, 659.25, 523.25, 392.00),
        (783.99, 587.33, 493.88, 392.00),
    )
    for bar in range(32):
        start = bar * 2.0
        harmony = (bar // 2) % 4
        opening = bar < 4
        breakaway = 12 <= bar < 16
        full = 16 <= bar < 28
        outro = bar >= 28
        for index, frequency in enumerate(chords[harmony]):
            pad(left, right, start, 1.95, frequency,
                0.024 if breakaway else (0.034 if full else 0.028), (index - 1) * 0.32)
        for beat in range(4):
            at = start + beat * 0.5
            kick(left, right, at, 0.19 if breakaway else (0.35 if full else 0.30))
            if beat in (1, 3) and not breakaway:
                noise_hit(left, right, at, 0.14, 0.09 if full else 0.07)
            noise_hit(left, right, at + 0.25, 0.07,
                      0.025 if breakaway else (0.047 if full else 0.035),
                      0.24 if beat % 2 else -0.24)
            if not breakaway and not outro:
                pluck(left, right, at + 0.25, 0.31, roots[harmony],
                      0.12 if full else 0.095, 0.12)
            elif beat in (0, 2):
                pluck(left, right, at + 0.25, 0.31, roots[harmony], 0.065, 0.12)
            if not opening and not breakaway and not outro and beat in (0, 2):
                pluck(left, right, at + 0.25, 0.31, replies[harmony][beat],
                      0.078 if full else 0.06, -0.19)
            if full and beat == 3:
                pluck(left, right, at, 0.27, replies[harmony][3], 0.047, 0.19)
        if bar % 8 == 7 and not outro:
            noise_hit(left, right, start + 1.75, 0.17, 0.10)

    peak = max(max(abs(x) for x in left), max(abs(x) for x in right))
    if not math.isfinite(peak) or peak <= 0:
        raise ValueError("Second movement is silent or invalid")
    scale = 0.84 / peak
    second = array.array("h")
    for l, r in zip(left, right):
        second.append(round(max(-1.0, min(1.0, l * scale)) * 32767))
        second.append(round(max(-1.0, min(1.0, r * scale)) * 32767))
    # A short seam fade prevents a PCM discontinuity at the new downbeat.
    seam = round(0.04 * RATE)
    ending = round(0.8 * RATE)
    for frame in range(seam):
        gain = 1 - frame / seam
        first[(FRAMES - seam + frame) * 2] = round(first[(FRAMES - seam + frame) * 2] * gain)
        first[(FRAMES - seam + frame) * 2 + 1] = round(first[(FRAMES - seam + frame) * 2 + 1] * gain)
    for frame in range(ending):
        gain = 1 - frame / ending
        second[(FRAMES - ending + frame) * 2] = round(second[(FRAMES - ending + frame) * 2] * gain)
        second[(FRAMES - ending + frame) * 2 + 1] = round(second[(FRAMES - ending + frame) * 2 + 1] * gain)
    with wave.open(str(path), "wb") as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(first.tobytes())
        out.writeframes(second.tobytes())


def chart(tier: str) -> dict:
    notes: list[dict] = []
    for beat in range(2, 126):
        time = beat / 2
        if tier == "easy":
            if beat % 2:
                continue
            if beat % 16 == 14:
                notes.append({"id": f"e-{beat}", "type": "hold", "t": time,
                              "end": time + 0.5, "key": 0})
            else:
                notes.append({"id": f"e-{beat}", "type": "tap", "t": time, "key": 0})
        elif tier == "standard":
            notes.append({"id": f"s-{beat}", "type": "tap", "t": time, "key": beat % 2})
        else:
            if beat % 16 == 0:
                notes.append({"id": f"h-{beat}", "type": "chord", "t": time, "keys": [0, 1]})
            else:
                notes.append({"id": f"h-{beat}", "type": "tap", "t": time, "key": beat % 2})
            notes.append({"id": f"h-{beat}-off", "type": "tap", "t": time + 0.25,
                          "key": 1 - beat % 2})
    return {
        "format": 2, "theme": "duohertz", "track_id": TRACK_ID, "tier": tier,
        "input_count": 1 if tier == "easy" else 2,
        "bpm": BPM, "audio_offset_ms": 0,
        "total_notes": sum(2 if note["type"] == "chord" else 1 for note in notes),
        "notes": notes,
    }


def encode(src: Path, dst: Path, *, seconds: int | None = None,
           limiter: float | None = None) -> None:
    command = ["ffmpeg", "-v", "error", "-y", "-i", str(src)]
    if seconds:
        command.extend(["-t", str(seconds)])
    if limiter is not None:
        command.extend(["-af", f"alimiter=limit={limiter:g}:level=0"])
    command.extend(["-c:a", "aac", "-b:a", "160k", str(dst)])
    subprocess.run(command, check=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="duohertz-audio-") as temp:
        wav = Path(temp) / "source.wav"
        stream_wav = Path(temp) / "stream.wav"
        render_wav(wav)
        encode(wav, OUT / "audio.m4a")
        render_stream_wav(wav, stream_wav)
        encode(stream_wav, OUT / "stream.m4a", limiter=STREAM_LIMITER)
        encode(wav, OUT / "preview_48s.m4a", seconds=48)
    for tier in ("easy", "standard", "hard"):
        (OUT / f"{tier}.json").write_text(json.dumps(chart(tier), indent=2) + "\n", encoding="utf-8")
    files = {path.name: digest(path) for path in sorted(OUT.iterdir()) if path.is_file() and path.name != "manifest.json"}
    manifest = {
        "track_id": TRACK_ID,
        "title": "First Frequency",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Melodic House",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Deterministic in-house oscillator and noise synthesis; original C–G–A minor–F game movement followed by a separately arranged A minor–F–C–G answer movement for a 128-second stream master, with no sampled source audio or first-minute loop; stream-only 0.5 amplitude limiter without makeup gain before AAC",
        "stream_limiter": STREAM_LIMITER,
        "source_script": "scripts/duohertz-compose-first-frequency.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": json.loads((ROOT / "scripts/duohertz-art-prompts/dh-001-first-frequency.json").read_text(encoding="utf-8")),
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
