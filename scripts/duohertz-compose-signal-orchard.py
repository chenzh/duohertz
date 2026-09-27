#!/usr/bin/env python3
"""Render the independent Melodic House candidate Signal Orchard for review only.

The arrangement uses local oscillators and seeded noise, with no sampled audio.
Its charts are selected from detected attacks in the actual rendered waveform.
"""

from __future__ import annotations

import bisect
import hashlib
import importlib.util
import json
import math
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-006-signal-orchard"
TRACK_ID = "dh-006-signal-orchard"
RATE = 32_000
BPM = 124
BEAT = 60 / BPM
SECONDS = 64
STREAM_SECONDS = 128
STREAM_LIMITER = 0.7
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(2026092406)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def times(length: float) -> np.ndarray:
    return np.arange(round(length * RATE), dtype=np.float64) / RATE


def add(stereo: np.ndarray, at: float, signal: np.ndarray, pan: float = 0.0) -> None:
    origin = round(at * RATE)
    if origin < 0 or origin >= SAMPLES:
        return
    end = min(SAMPLES, origin + len(signal))
    signal = signal[:end - origin]
    stereo[0, origin:end] += signal * (1 - max(0.0, pan))
    stereo[1, origin:end] += signal * (1 + min(0.0, pan))


def kick(stereo: np.ndarray, at: float, strength: float) -> None:
    t = times(0.28)
    phase = math.tau * (48 * t + 110 * (1 - np.exp(-31 * t)) / 31)
    add(stereo, at, (np.sin(phase) * np.exp(-17 * t) * strength).astype(np.float32))


def clap(stereo: np.ndarray, at: float, strength: float) -> None:
    t = times(0.17)
    noise = RNG.uniform(-1, 1, len(t))
    bright = noise - np.concatenate(([0.0], noise[:-1])) * 0.79
    body = np.sin(math.tau * 205 * t) * np.exp(-31 * t)
    envelope = np.exp(-23 * t) * (1 + 0.38 * np.exp(-370 * np.maximum(0, t - 0.019)))
    add(stereo, at, ((bright * 0.76 + body * 0.24) * envelope * strength).astype(np.float32))


def hat(stereo: np.ndarray, at: float, strength: float, pan: float) -> None:
    t = times(0.095)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.86
    add(stereo, at, (high * np.exp(-49 * t) * strength).astype(np.float32), pan)


def bass(stereo: np.ndarray, at: float, frequency: float, strength: float) -> None:
    t = times(0.38)
    envelope = np.clip(t / 0.006, 0, 1) * np.exp(-6.0 * t)
    phase = math.tau * frequency * t
    signal = np.sin(phase) + 0.28 * np.sin(2 * phase) + 0.11 * np.sin(3 * phase)
    add(stereo, at, (signal * envelope * strength).astype(np.float32), -0.06)


def soft_keys(stereo: np.ndarray, at: float, frequency: float, strength: float, pan: float) -> None:
    t = times(0.56)
    envelope = np.clip(t / 0.008, 0, 1) * np.exp(-6.8 * t)
    phase = math.tau * frequency * t
    signal = np.sin(phase) + 0.36 * np.sin(2 * phase) + 0.10 * np.sin(4 * phase)
    add(stereo, at, (signal * envelope * strength).astype(np.float32), pan)


def pad(stereo: np.ndarray, at: float, frequency: float, strength: float, pan: float) -> None:
    length = 2.0
    t = times(length)
    envelope = np.clip(t / 0.24, 0, 1) * np.clip((length - t) / 0.30, 0, 1)
    # Slight beating between partials makes the sustained layer distinct from the keys.
    signal = np.sin(math.tau * frequency * t) + 0.27 * np.sin(math.tau * frequency * 1.004 * t)
    add(stereo, at, (signal * envelope * strength).astype(np.float32), pan)


def render_wav(path: Path) -> None:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    # D–Bm–G–A; offbeat glassy keys and soft sidechained pads form a playful response.
    roots = (73.42, 61.74, 98.00, 110.00)
    chords = ((293.66, 369.99, 440.00), (246.94, 293.66, 369.99),
              (196.00, 246.94, 392.00), (220.00, 277.18, 329.63))
    melody = ((587.33, 739.99, 880.00, 739.99), (493.88, 587.33, 739.99, 587.33),
              (392.00, 493.88, 783.99, 493.88), (440.00, 554.37, 659.25, 554.37))
    for bar in range(32):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 4
        bridge = 12 <= bar < 16
        lift = 16 <= bar < 30
        outro = bar >= 30
        pad_level = 0.020 if bridge else (0.035 if lift else 0.029)
        for index, frequency in enumerate(chords[harmony]):
            pad(stereo, start, frequency, pad_level, (index - 1) * 0.34)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            kick(stereo, at, 0.23 if bridge or outro else (0.29 if intro else 0.37))
            if beat_index in (1, 3) and not bridge:
                clap(stereo, at, 0.13 if intro or outro else 0.23)
            bass(stereo, at, roots[harmony], 0.11 if bridge else (0.16 if intro else 0.21))
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(stereo, at, 0.095 if bridge else (0.16 if lift else 0.13),
                0.20 if eighth % 2 else -0.20)
            if eighth % 2 and not bridge and not outro:
                note = melody[harmony][eighth // 2]
                soft_keys(stereo, at, note, 0.042 if intro else (0.084 if lift else 0.062),
                          0.24 if eighth % 4 == 1 else -0.24)
            if lift and eighth in (0, 3, 6):
                soft_keys(stereo, at, chords[harmony][eighth % 3] * 2,
                          0.050, -0.15 if eighth % 2 else 0.15)

    fade = round(1.3 * RATE)
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
    """Add a new 32-bar call-and-response Melodic House movement."""
    with wave.open(str(game_source), "rb") as source:
        if source.getnchannels() != 2 or source.getsampwidth() != 2 or source.getframerate() != RATE:
            raise ValueError("Unexpected game source format")
        first = source.readframes(SAMPLES)
    if len(first) != SAMPLES * 2 * 2:
        raise ValueError("Incomplete game source")

    second = np.zeros((2, SAMPLES), dtype=np.float32)
    # F# minor–D–A–E shifts the original D–B minor–G–A harmony. The short
    # descending replies and delayed low notes leave more air between pulses.
    roots = (92.50, 73.42, 110.00, 82.41)
    chords = ((185.00, 220.00, 277.18), (146.83, 185.00, 220.00),
              (220.00, 277.18, 329.63), (164.81, 207.65, 246.94))
    replies = ((739.99, 659.25, 554.37, 440.00), (659.25, 587.33, 440.00, 369.99),
               (880.00, 739.99, 659.25, 554.37), (659.25, 554.37, 493.88, 415.30))
    for bar in range(32):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        reentry = bar < 4
        clearing = 12 <= bar < 16
        lift = 16 <= bar < 30
        outro = bar >= 30
        pad_level = 0.023 if clearing else (0.038 if lift else 0.030)
        for index, frequency in enumerate(chords[harmony]):
            pad(second, start, frequency, pad_level, (index - 1) * 0.34)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if not clearing or beat_index in (0, 2):
                kick(second, at, 0.22 if clearing else (0.38 if lift else 0.31))
            if beat_index in (1, 3) and not clearing:
                clap(second, at, 0.14 if reentry else (0.24 if lift else 0.20))
            if not clearing and not outro:
                bass(second, at + BEAT / 2, roots[harmony],
                     0.13 if reentry else (0.22 if lift else 0.18))
            elif beat_index in (0, 2):
                bass(second, at + BEAT / 2, roots[harmony], 0.085)
            if not reentry and not clearing and not outro and beat_index in (0, 2):
                soft_keys(second, at, replies[harmony][beat_index],
                          0.067 if lift else 0.047, -0.20 if beat_index == 0 else 0.20)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(second, at, 0.09 if clearing else (0.16 if lift else 0.13),
                -0.20 if eighth % 2 else 0.20)
            if eighth in (3, 7) and not reentry and not clearing and not outro:
                soft_keys(second, at, replies[harmony][eighth // 2] * 2,
                          0.058 if lift else 0.040, 0.22 if eighth == 3 else -0.22)

    fade = round(1.0 * RATE)
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


def observed_onsets(audio: Path) -> list[float]:
    path = ROOT / "scripts/beatscape-audio.py"
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_signal_orchard", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load audio onset analyzer")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module.analyze_audio(audio, BPM).onsets_sec


def has_onset(at: float, onsets: list[float]) -> bool:
    index = bisect.bisect_left(onsets, at)
    distances = [abs(onsets[i] - at) for i in (index - 1, index) if 0 <= i < len(onsets)]
    return bool(distances) and min(distances) <= 0.052


def chart(tier: str, onsets: list[float]) -> dict:
    notes: list[dict] = []
    if tier == "easy":
        for beat_index in range(8, 124, 2):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            if beat_index % 16 == 14:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT / 2, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for beat_index in range(8, 124):
            at = round(beat_index * BEAT, 6)
            if has_onset(at, onsets):
                notes.append({"id": f"s-{beat_index}", "type": "tap", "t": at,
                              "key": beat_index % 2})
    else:
        for eighth in range(16, 248):
            at = round(eighth * BEAT / 2, 6)
            if not has_onset(at, onsets):
                continue
            if eighth % 32 == 0:
                notes.append({"id": f"h-{eighth}", "type": "chord", "t": at, "keys": [0, 1]})
            else:
                notes.append({"id": f"h-{eighth}", "type": "tap", "t": at,
                              "key": eighth % 2})
    return {
        "format": 2, "theme": "duohertz", "track_id": TRACK_ID, "tier": tier,
        "input_count": 1 if tier == "easy" else 2, "bpm": BPM, "audio_offset_ms": 0,
        "total_notes": sum(2 if note["type"] == "chord" else 1 for note in notes),
        "notes": notes,
    }


def encode(source: Path, target: Path, seconds: int | None = None,
           *, limiter: float | None = None) -> None:
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
  <rect y="768" width="1024" height="256" fill="#073a48" opacity="0.76" />
  <text x="76" y="854" fill="#b5fcfa" font-family="sans-serif" font-size="35" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="76" y="930" fill="white" font-family="sans-serif" font-size="68" font-weight="700">Signal Orchard</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="duohertz-signal-orchard-") as temp:
        source = Path(temp) / "source.wav"
        stream_source = Path(temp) / "stream.wav"
        render_wav(source)
        onsets = observed_onsets(source)
        encode(source, OUT / "audio.m4a")
        render_stream_wav(source, stream_source)
        encode(stream_source, OUT / "stream.m4a", limiter=STREAM_LIMITER)
        encode(source, OUT / "preview_48s.m4a", seconds=48)
    for tier in ("easy", "standard", "hard"):
        (OUT / f"{tier}.json").write_text(json.dumps(chart(tier, onsets), indent=2) + "\n", encoding="utf-8")
    write_cover(OUT / "cover.svg")
    files = {path.name: sha(path) for path in sorted(OUT.iterdir()) if path.is_file() and path.name != "manifest.json"}
    manifest = {
        "track_id": TRACK_ID,
        "title": "Signal Orchard",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Melodic House",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Independent deterministic D–B minor–G–A Melodic House game movement and new F# minor–D–A–E answer movement for a 128-second stream master; generated oscillators and seeded noise only, no sampled source audio or repeated first-minute loop; stream-only 0.7 amplitude limiter without makeup gain before AAC",
        "stream_limiter": STREAM_LIMITER,
        "source_script": "scripts/duohertz-compose-signal-orchard.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": "Use case: stylized-concept. Create one original square, text-free album-cover illustration for “Signal Orchard”, a bright all-ages Melodic House music candidate in the electronic rhythm game duohertz. A playful grove of small translucent geometric light columns, each column emitting a gentle circular sound wave when touched by a glowing note particle; interlaced cyan, citrus-yellow and soft coral frequency ribbons travel through the grove and meet at a warm central pulse. Contemporary editorial electronic album art, crisp rhythmic structure and a joyful airy atmosphere, readable at thumbnail size, rich detail without visual clutter. Leave calm deep teal negative space in the lower third for a separate local title overlay. Visually distinct from existing duohertz candidates: no twin interlocking rings, no indigo-glass sunset, no aurora stepping stones, no racing sky ribbons, no rising helix. No text, letters, logos, characters, vehicles, weapons, copied game art, strobing stripes or red neon city. Square composition.",
            "og_base_prompt": "Use case: ads-marketing. Edit the supplied Signal Orchard square cover into an original companion wide, text-free social card for the family-friendly duohertz Melodic House song. Preserve the translucent cyan/citrus/coral light columns, glowing note particles and one warm central frequency pulse, but recompose for a horizontal 1200x630-style landscape. Place the glowing grove and crossing sound-wave ribbons in the right two-thirds, with calm deep teal negative space in the left third for later local typography. Keep the illustration crisp and readable at thumbnail size. No text, letters, logos, characters, vehicles, weapons, copied game art or strobing stripes. Do not simply stretch or crop the square image.",
            "og_prompt": "Use case: ads-marketing. Edit the supplied wide, text-free Signal Orchard social card. Preserve the glowing cyan, citrus and coral frequency grove on the right, the calm deep-teal left third, and the wide landscape composition. In the dark left third add exactly two crisp, legible lines of modern sans-serif text with generous margins: line 1 “duohertz” all lowercase, smaller and pale cyan; line 2 “Signal Orchard” title case, larger and white. Spell both lines exactly. No other words, letters, icons, logos or marks. Keep 1200x630-style horizontal aspect ratio.",
            "og_resize": "Built-in imagegen supplied a wide card; sips resized it to exactly 1200x630 without changing the composition",
            "cover_svg": "Local SVG title overlay around generated cover-art.png; bitmap source is unchanged",
        },
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
