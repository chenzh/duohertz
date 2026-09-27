#!/usr/bin/env python3
"""Render the independent Synthwave candidate Amberwave Relay outside the public catalog.

Requires numpy (tests/requirements.txt) and ffmpeg. Oscillators and seeded noise are
generated here without samples. Technical success does not replace listening review.
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
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-002-amberwave-relay"
TRACK_ID = "dh-002-amberwave-relay"
RATE = 32_000
BPM = 96
BEAT = 60 / BPM
SECONDS = 60
STREAM_SECONDS = 120
STREAM_LIMITER = 0.7
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(20260924)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def time_array(length: float) -> np.ndarray:
    return np.arange(round(length * RATE), dtype=np.float64) / RATE


def add(stereo: np.ndarray, at: float, signal: np.ndarray, *, pan: float = 0) -> None:
    origin = round(at * RATE)
    if origin >= SAMPLES:
        return
    end = min(SAMPLES, origin + len(signal))
    signal = signal[:end - origin]
    stereo[0, origin:end] += signal * (1 - max(0.0, pan))
    stereo[1, origin:end] += signal * (1 + min(0.0, pan))


def harmonic(t: np.ndarray, frequency: float, *, harmonics: int = 6) -> np.ndarray:
    """A short harmonic stack gives a soft analog-saw color without source samples."""
    result = np.zeros_like(t)
    for part in range(1, harmonics + 1):
        result += np.sin(math.tau * frequency * part * t) / (part ** 1.35)
    return result / 1.9


def kick(stereo: np.ndarray, at: float, level: float) -> None:
    t = time_array(0.29)
    phase = math.tau * (48 * t + 105 * (1 - np.exp(-26 * t)) / 26)
    add(stereo, at, (np.sin(phase) * np.exp(-16 * t) * level).astype(np.float32))


def snare(stereo: np.ndarray, at: float, level: float) -> None:
    t = time_array(0.19)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.65
    body = np.sin(math.tau * 185 * t) * np.exp(-24 * t)
    signal = (0.72 * high + 0.28 * body) * np.exp(-20 * t) * level
    add(stereo, at, signal.astype(np.float32))


def hat(stereo: np.ndarray, at: float, level: float, pan: float) -> None:
    t = time_array(0.082)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.87
    add(stereo, at, (high * np.exp(-50 * t) * level).astype(np.float32), pan=pan)


def pad(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    length = 2.45
    t = time_array(length)
    attack = np.clip(t / 0.24, 0, 1)
    release = np.clip((length - t) / 0.31, 0, 1)
    drift = harmonic(t, frequency * 0.997, harmonics=4) + harmonic(t, frequency * 1.003, harmonics=4)
    signal = drift * attack * release * level * 0.5
    add(stereo, at, signal.astype(np.float32), pan=pan)


def bass(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = time_array(0.55)
    envelope = np.clip(t / 0.007, 0, 1) * np.exp(-3.4 * t)
    signal = (harmonic(t, frequency, harmonics=5) * 0.82 + np.sin(math.tau * frequency / 2 * t) * 0.18)
    add(stereo, at, (signal * envelope * level).astype(np.float32), pan=-0.08)


def arp(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = time_array(0.25)
    envelope = np.clip(t / 0.003, 0, 1) * np.exp(-13 * t)
    signal = harmonic(t, frequency, harmonics=5) * envelope * level
    add(stereo, at, signal.astype(np.float32), pan=pan)


def lead(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = time_array(0.46)
    envelope = np.clip(t / 0.012, 0, 1) * np.clip((0.46 - t) / 0.14, 0, 1)
    signal = (np.sin(math.tau * frequency * t) + harmonic(t, frequency * 1.004, harmonics=3) * 0.32)
    add(stereo, at, (signal * envelope * level).astype(np.float32), pan=pan)


def render_wav(path: Path) -> None:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    # Am–F–C–G, with four-bar sections and a quiet bridge before the final lift.
    roots = (110.00, 87.31, 130.81, 98.00)
    chords = ((220.00, 261.63, 329.63), (174.61, 220.00, 261.63),
              (196.00, 261.63, 329.63), (196.00, 246.94, 293.66))
    melody = ((440.00, 523.25, 659.25, 523.25), (440.00, 523.25, 698.46, 523.25),
              (392.00, 523.25, 659.25, 783.99), (392.00, 493.88, 587.33, 493.88))
    for bar in range(24):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 4
        bridge = 12 <= bar < 16
        lift = bar >= 16
        for index, frequency in enumerate(chords[harmony]):
            pad(stereo, start, frequency, 0.040 if bridge else 0.048, (index - 1) * 0.36)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            kick(stereo, at, 0.20 if bridge else (0.27 if intro else 0.36))
            if beat_index % 2 and not bridge:
                snare(stereo, at, 0.15 if intro else 0.24)
            bass(stereo, at, roots[harmony], 0.12 if bridge else 0.19)
            if not intro and not bridge and (beat_index == 0 or (lift and beat_index == 2)):
                lead(stereo, at, melody[harmony][beat_index], 0.086 if lift else 0.064,
                     -0.12 if beat_index == 0 else 0.12)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(stereo, at, 0.105 if bridge else (0.15 if lift else 0.13),
                -0.25 if eighth % 2 else 0.25)
            if not bridge:
                arp(stereo, at, chords[harmony][(eighth + bar) % 3] * 2,
                    0.036 if intro else (0.057 if lift else 0.047),
                    0.24 if eighth % 2 else -0.24)

    # A gentle tail protects a clean stop; charts end before the fade.
    fade = round(1.2 * RATE)
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
    """Add a new 24-bar D minor answer to the original Synthwave movement."""
    with wave.open(str(game_source), "rb") as source:
        if source.getnchannels() != 2 or source.getsampwidth() != 2 or source.getframerate() != RATE:
            raise ValueError("Unexpected game source format")
        first = source.readframes(SAMPLES)
    if len(first) != SAMPLES * 2 * 2:
        raise ValueError("Incomplete game source")

    second = np.zeros((2, SAMPLES), dtype=np.float32)
    # D minor–G–C–A minor moves the relay away from the game section's
    # A minor–F–C–G cycle. Offbeat bass and descending calls answer its lead.
    roots = (73.42, 98.00, 130.81, 110.00)
    chords = ((146.83, 174.61, 220.00), (196.00, 246.94, 293.66),
              (261.63, 329.63, 392.00), (220.00, 261.63, 329.63))
    melody = ((587.33, 523.25, 440.00, 349.23), (587.33, 493.88, 392.00, 293.66),
              (783.99, 659.25, 523.25, 392.00), (659.25, 523.25, 440.00, 329.63))
    arp_pattern = (2, 1, 0, 1, 2, 0, 1, 0)
    for bar in range(24):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        reply_intro = bar < 4
        bridge = 12 <= bar < 16
        lift = 16 <= bar < 22
        outro = bar >= 22
        for index, frequency in enumerate(chords[harmony]):
            pad(second, start, frequency, 0.039 if bridge else 0.050, (index - 1) * 0.36)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if not bridge or beat_index in (0, 2):
                kick(second, at, 0.22 if bridge else (0.38 if lift else 0.32))
            if beat_index in (1, 3) and not bridge:
                snare(second, at, 0.16 if reply_intro else (0.25 if lift else 0.21))
            if not bridge and not outro:
                bass(second, at + BEAT / 2, roots[harmony], 0.17 if lift else 0.14)
            elif beat_index in (0, 2):
                bass(second, at + BEAT / 2, roots[harmony], 0.09)
            if not reply_intro and not bridge and not outro and beat_index in (1, 3):
                lead(second, at, melody[harmony][beat_index],
                     0.090 if lift else 0.070, 0.13 if beat_index == 1 else -0.13)
            if lift and beat_index == 0:
                lead(second, at, melody[harmony][0], 0.060, -0.13)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(second, at, 0.09 if bridge else (0.16 if lift else 0.13),
                0.25 if eighth % 2 else -0.25)
            if not bridge and not outro:
                arp(second, at, chords[harmony][arp_pattern[eighth]] * 2,
                    0.032 if reply_intro else (0.058 if lift else 0.045),
                    -0.24 if eighth % 2 else 0.24)

    fade = round(1.2 * RATE)
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
        for beat_index in range(4, 94):
            at = round(beat_index * BEAT, 5)
            if beat_index % 16 == 15:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT / 2, 5), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for eighth in range(8, 188):
            if eighth % 2 and (eighth < 32 or 96 <= eighth < 128):
                continue
            notes.append({"id": f"s-{eighth}", "type": "tap", "t": round(eighth * BEAT / 2, 5),
                          "key": (eighth // 2 + eighth % 2) % 2})
    else:
        for eighth in range(8, 188):
            at = round(eighth * BEAT / 2, 5)
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


def encode(source: Path, target: Path, *, seconds: int | None = None,
           limiter: float | None = None) -> None:
    command = ["ffmpeg", "-v", "error", "-y", "-i", str(source)]
    if seconds is not None:
        command.extend(["-t", str(seconds)])
    if limiter is not None:
        command.extend(["-af", f"alimiter=limit={limiter:g}:level=0"])
    command.extend(["-c:a", "aac", "-b:a", "160k", str(target)])
    subprocess.run(command, check=True)


def write_cover(path: Path) -> None:
    path.write_text("""<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" role="img" aria-labelledby="title description">
  <title id="title">Amberwave Relay — duohertz</title>
  <desc id="description">An amber pulse passes through angular relay frames as a cyan waveform crosses the cover.</desc>
  <image href="cover-art.png" xlink:href="cover-art.png" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid slice" />
  <rect x="0" y="365" width="512" height="147" fill="#111421" opacity="0.92" />
  <text x="30" y="414" fill="#67eee0" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="1">duohertz</text>
  <text x="30" y="475" fill="#fff9ef" font-family="Arial, sans-serif" font-size="43" font-weight="700">Amberwave Relay</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="duohertz-amberwave-relay-") as temp:
        source = Path(temp) / "source.wav"
        stream_source = Path(temp) / "stream.wav"
        render_wav(source)
        encode(source, OUT / "audio.m4a")
        render_stream_wav(source, stream_source)
        encode(stream_source, OUT / "stream.m4a", limiter=STREAM_LIMITER)
        encode(source, OUT / "preview_48s.m4a", seconds=48)
    for tier in ("easy", "standard", "hard"):
        (OUT / f"{tier}.json").write_text(json.dumps(chart(tier), indent=2) + "\n", encoding="utf-8")
    write_cover(OUT / "cover.svg")
    files = {path.name: sha(path) for path in sorted(OUT.iterdir()) if path.is_file() and path.name != "manifest.json"}
    manifest = {
        "track_id": TRACK_ID,
        "title": "Amberwave Relay",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Synthwave",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Independent deterministic A minor–F–C–G Synthwave game movement and new D minor–G–C–A minor answer movement for a 120-second stream master; generated oscillators and seeded noise only, no sampled source audio or repeated first-minute loop; stream-only 0.7 amplitude limiter without makeup gain before AAC",
        "stream_limiter": STREAM_LIMITER,
        "source_script": "scripts/duohertz-compose-amberwave-relay.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": json.loads((ROOT / "scripts/duohertz-art-prompts/dh-002-amberwave-relay.json").read_text(encoding="utf-8")),
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
