#!/usr/bin/env python3
"""Render the independent uplifting Trance candidate Dawnwave Helix outside the catalog.

Requires numpy and ffmpeg. Oscillators and seeded noise generate every sound;
automated alignment does not replace listening, rights or visual approval.
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
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-005-dawnwave-helix"
TRACK_ID = "dh-005-dawnwave-helix"
RATE = 32_000
BPM = 135
BEAT = 60 / BPM
SECONDS = 64
STREAM_SECONDS = 128
STREAM_LIMITER = 0.7
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(2026092405)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def times(length: float) -> np.ndarray:
    return np.arange(round(length * RATE), dtype=np.float64) / RATE


def add(stereo: np.ndarray, at: float, signal: np.ndarray, pan: float = 0) -> None:
    origin = round(at * RATE)
    if origin >= SAMPLES:
        return
    end = min(SAMPLES, origin + len(signal))
    signal = signal[:end - origin]
    stereo[0, origin:end] += signal * (1 - max(0, pan))
    stereo[1, origin:end] += signal * (1 + min(0, pan))


def shimmer(t: np.ndarray, frequency: float) -> np.ndarray:
    result = np.zeros_like(t)
    for part in range(1, 7):
        result += np.sin(math.tau * frequency * part * t) / (part ** 1.55)
    return result / 1.6


def kick(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.28)
    phase = math.tau * (52 * t + 112 * (1 - np.exp(-27 * t)) / 27)
    add(stereo, at, np.sin(phase) * np.exp(-16 * t) * level)


def clap(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.16)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.74
    add(stereo, at, high * np.exp(-24 * t) * level)


def hat(stereo: np.ndarray, at: float, level: float, pan: float) -> None:
    t = times(0.072)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.83
    add(stereo, at, high * np.exp(-56 * t) * level, pan)


def rolling_bass(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = times(0.30)
    envelope = np.clip(t / 0.006, 0, 1) * np.exp(-7.0 * t)
    signal = np.sin(math.tau * frequency * t) + 0.25 * np.sin(math.tau * frequency * 2 * t)
    add(stereo, at, signal * envelope * level)


def wide_pad(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    t = times(1.82)
    envelope = np.clip(t / 0.20, 0, 1) * np.clip((1.82 - t) / 0.28, 0, 1)
    for index, frequency in enumerate(frequencies):
        detuned = shimmer(t, frequency * 0.998) + shimmer(t, frequency * 1.002)
        add(stereo, at, detuned * envelope * level / (len(frequencies) * 2),
            (index - 1) * 0.32)


def arp(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = times(0.25)
    envelope = np.clip(t / 0.003, 0, 1) * np.exp(-13 * t)
    signal = shimmer(t, frequency) + 0.25 * np.sin(math.tau * frequency * 2.004 * t)
    add(stereo, at, signal * envelope * level, pan)


def lead(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = times(0.62)
    envelope = np.clip(t / 0.022, 0, 1) * np.clip((0.62 - t) / 0.16, 0, 1)
    signal = shimmer(t, frequency * 0.996) + shimmer(t, frequency * 1.004)
    add(stereo, at, signal * envelope * level * 0.55)


def render_wav(path: Path) -> None:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    # Thirty-six bars at 135 BPM = 64 seconds. Evolving 8-bar phrase and
    # open breakdown contrast the other four candidate arrangements.
    roots = (110.00, 82.41, 92.50, 73.42)  # A–E–F#m–D
    chords = ((220.00, 277.18, 329.63), (164.81, 207.65, 246.94),
              (185.00, 220.00, 277.18), (146.83, 185.00, 220.00))
    melody = ((440.00, 554.37, 659.25, 739.99), (415.30, 493.88, 659.25, 554.37),
              (369.99, 440.00, 554.37, 659.25), (369.99, 440.00, 587.33, 659.25))
    for bar in range(36):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 4
        build = 12 <= bar < 16
        breakdown = 16 <= bar < 20
        lift = 20 <= bar < 32
        outro = bar >= 32
        wide_pad(stereo, start, chords[harmony], 0.045 if breakdown else 0.065)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            kick(stereo, at, 0.21 if breakdown else (0.37 if lift else 0.31))
            if beat_index % 2 and not breakdown:
                clap(stereo, at, 0.17 if intro else (0.24 if lift else 0.20))
            if not breakdown or beat_index % 2 == 0:
                rolling_bass(stereo, at + BEAT / 2, roots[harmony],
                             0.09 if intro else (0.17 if lift else 0.13))
            if not intro and not breakdown and not outro and beat_index in (0, 2):
                lead(stereo, at, melody[harmony][beat_index], 0.063 if lift else 0.043)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(stereo, at, 0.10 if breakdown else (0.16 if lift else 0.13),
                -0.23 if eighth % 2 else 0.23)
            if not breakdown:
                arp(stereo, at, chords[harmony][(eighth + bar) % 3] * 2,
                    0.035 if intro else (0.065 if build or lift else 0.050),
                    0.18 if eighth % 2 else -0.18)

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
    """Add a new B minor answer to the original 64-second Trance movement."""
    with wave.open(str(game_source), "rb") as source:
        if source.getnchannels() != 2 or source.getsampwidth() != 2 or source.getframerate() != RATE:
            raise ValueError("Unexpected game source format")
        first = source.readframes(SAMPLES)
    if len(first) != SAMPLES * 2 * 2:
        raise ValueError("Incomplete game source")

    second = np.zeros((2, SAMPLES), dtype=np.float32)
    # B minor–G–D–A answers A–E–F# minor–D. A descending helix hook and
    # reversed arpeggio contour distinguish the new movement from the game.
    roots = (61.74, 98.00, 73.42, 110.00)
    chords = ((246.94, 293.66, 369.99), (196.00, 246.94, 293.66),
              (293.66, 369.99, 440.00), (220.00, 277.18, 329.63))
    melody = ((739.99, 659.25, 587.33, 493.88), (783.99, 659.25, 587.33, 493.88),
              (880.00, 739.99, 659.25, 587.33), (659.25, 554.37, 440.00, 369.99))
    arp_pattern = (2, 1, 0, 2, 0, 1, 2, 1)
    for bar in range(36):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        reentry = bar < 4
        breakdown = 12 <= bar < 16
        lift = 16 <= bar < 32
        outro = bar >= 32
        wide_pad(second, start, chords[harmony], 0.048 if breakdown else 0.067)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if not breakdown or beat_index in (0, 2):
                kick(second, at, 0.22 if breakdown else (0.38 if lift else 0.32))
            if beat_index % 2 and not breakdown:
                clap(second, at, 0.15 if reentry else (0.24 if lift else 0.20))
            if not breakdown and not outro:
                rolling_bass(second, at + BEAT / 2, roots[harmony],
                             0.11 if reentry else (0.18 if lift else 0.14))
            elif beat_index in (0, 2):
                rolling_bass(second, at + BEAT / 2, roots[harmony], 0.075)
            if not reentry and not breakdown and not outro and beat_index in (1, 3):
                lead(second, at, melody[harmony][beat_index], 0.068 if lift else 0.046)
            if lift and beat_index == 0:
                lead(second, at, melody[harmony][0], 0.037)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(second, at, 0.095 if breakdown else (0.17 if lift else 0.13),
                0.23 if eighth % 2 else -0.23)
            if not breakdown and not outro:
                arp(second, at, chords[harmony][arp_pattern[eighth]] * 2,
                    0.029 if reentry else (0.064 if lift else 0.049),
                    -0.18 if eighth % 2 else 0.18)

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
        for beat_index in range(4, 142, 2):
            at = round(beat_index * BEAT, 6)
            if beat_index % 16 == 14:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT / 2, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for beat_index in range(4, 142):
            notes.append({"id": f"s-{beat_index}", "type": "tap", "t": round(beat_index * BEAT, 6),
                          "key": beat_index % 2})
    else:
        for eighth in range(8, 284):
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
    path.write_text("""<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <image href="cover-art.png" width="1024" height="1024" preserveAspectRatio="xMidYMid slice" />
  <rect y="766" width="1024" height="258" fill="#261936" opacity="0.76" />
  <text x="80" y="857" fill="#e3c5ff" font-family="sans-serif" font-size="35" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="80" y="934" fill="white" font-family="sans-serif" font-size="65" font-weight="700">Dawnwave Helix</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="duohertz-dawnwave-helix-") as temp:
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
        "title": "Dawnwave Helix",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Trance",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Independent deterministic A–E–F# minor–D uplifting Trance game movement and new B minor–G–D–A answer movement for a 128-second stream master; generated oscillators and seeded noise only, no sampled source audio or repeated first-minute loop; stream-only 0.7 amplitude limiter without makeup gain before AAC",
        "stream_limiter": STREAM_LIMITER,
        "source_script": "scripts/duohertz-compose-dawnwave-helix.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": "Use case: stylized-concept. Create one original square album-cover illustration for “Dawnwave Helix”, an all-ages uplifting Trance music candidate in the electronic rhythm game duohertz. Visual concept: two delicate rose-gold and lavender sound-wave ribbons spiral upward together from a single calm frequency point, forming an open luminous helix above a field of low translucent geometric light pillars at dawn. Small musical particles mark the pulse, with an airy sense of sustained build and release. Contemporary editorial electronic album art, clear elegant silhouette and legible at thumbnail size, optimistic for children and adults. Palette: warm rose, pale gold, lavender, pearly teal and deep plum shadow; leave unobtrusive dark space in the lower third for a local title overlay. Distinct from the blue-sky racing ribbons, stepping-stone aurora, circular rings and indigo-glass sunset covers already made. Absolutely no text, letters, logos, characters, vehicles, weapons, copied game imagery, strobing stripes or red neon city. Square image.",
            "og_base_prompt": "Use case: ads-marketing. Edit the supplied Dawnwave Helix square cover into a companion wide, text-free social card for the family-friendly duohertz Trance track. Preserve the two distinct rose-gold and lavender sound-wave ribbons forming an open luminous helix, small musical particles, the low translucent light pillars and warm dawn atmosphere. Recompose naturally for a horizontal 1200x630-style landscape: put the glowing helix mostly in the right two-thirds and give the left third calm deep-plum negative space for later title typography. Polished contemporary electronic album art, legible at thumbnail size. No text, letters, logos, characters, vehicles, weapons, copied game art, flashing stripes or red neon city.",
            "og_prompt": "Use case: ads-marketing. Edit the supplied wide, text-free Dawnwave Helix social card. Keep the rose-gold/lavender helix and warm dawn scene on the right. In the quiet deep-plum left third add exactly two lines of crisp, legible modern sans-serif type with generous margins: line 1 \"duohertz\" all lowercase in pale lavender, smaller; line 2 \"Dawnwave Helix\" in white, larger. Spell both lines exactly, with no other words, letters, icons, logos or marks. Preserve the wide landscape composition suitable for a 1200x630 social card.",
            "og_resize": "Built-in imagegen supplied a wide card; sips resized it to exactly 1200x630 without changing the composition",
            "cover_svg": "Local SVG title overlay around the generated cover-art.png; bitmap source is unchanged",
        },
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
