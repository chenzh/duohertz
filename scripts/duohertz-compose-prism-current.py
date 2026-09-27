#!/usr/bin/env python3
"""Render the independent uplifting Trance candidate Prism Current outside the catalog.

Requires numpy and ffmpeg. Oscillators and seeded noise generate every sound;
automated alignment does not replace listening, rights or visual approval.
"""

from __future__ import annotations

import hashlib
import bisect
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
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-010-prism-current"
TRACK_ID = "dh-010-prism-current"
RATE = 32_000
BPM = 140
BEAT = 60 / BPM
SECONDS = 60
STREAM_SECONDS = 120
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(2026092410)


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
    for part in range(1, 6):
        result += np.sin(math.tau * frequency * part * t) / (part ** 1.8)
    return result / 1.5


def kick(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.25)
    phase = math.tau * (56 * t + 118 * (1 - np.exp(-32 * t)) / 32)
    add(stereo, at, np.sin(phase) * np.exp(-20 * t) * level)


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
    t = times(0.24)
    envelope = np.clip(t / 0.005, 0, 1) * np.exp(-9.4 * t)
    signal = np.sin(math.tau * frequency * t) + 0.36 * np.sin(math.tau * frequency * 2 * t)
    add(stereo, at, signal * envelope * level)


def wide_pad(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    t = times(1.65)
    envelope = np.clip(t / 0.10, 0, 1) * np.clip((1.65 - t) / 0.22, 0, 1)
    for index, frequency in enumerate(frequencies):
        glass = shimmer(t, frequency * 0.999) + 0.65 * shimmer(t, frequency * 2.002)
        add(stereo, at, glass * envelope * level / len(frequencies), (index - 1) * 0.25)


def arp(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = times(0.18)
    envelope = np.clip(t / 0.002, 0, 1) * np.exp(-19 * t)
    signal = shimmer(t, frequency) + 0.34 * np.sin(math.tau * frequency * 3.001 * t)
    add(stereo, at, signal * envelope * level, pan)


def lead(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = times(0.52)
    envelope = np.clip(t / 0.014, 0, 1) * np.clip((0.52 - t) / 0.12, 0, 1)
    signal = shimmer(t, frequency * 0.997) + shimmer(t, frequency * 1.003)
    add(stereo, at, signal * envelope * level * 0.50)


def render_wav(path: Path) -> None:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    # Thirty-five 140-BPM bars = 60 seconds. Four-bar harmonic changes,
    # sixteenth glass arpeggios and a half-time opening differ from Dawnwave.
    roots = (98.00, 61.74, 65.41, 73.42)  # G2–B1–C2–D2
    chords = ((196.00, 246.94, 293.66), (246.94, 293.66, 369.99),
              (261.63, 329.63, 392.00), (293.66, 369.99, 440.00))
    melody = ((392.00, 493.88, 587.33, 783.99), (493.88, 587.33, 739.99, 587.33),
              (523.25, 659.25, 783.99, 659.25), (587.33, 739.99, 880.00, 739.99))
    arp_pattern = (0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 1, 0, 2, 1, 2)
    for bar in range(35):
        start = bar * 4 * BEAT
        harmony = (bar // 4) % 4
        intro = bar < 4
        build = 12 <= bar < 16
        breakdown = 16 <= bar < 20
        lift = 20 <= bar < 31
        outro = bar >= 31
        wide_pad(stereo, start, chords[harmony], 0.048 if breakdown else 0.063)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if not breakdown or beat_index in (0, 2):
                kick(stereo, at, 0.25 if breakdown else (0.37 if lift else 0.32))
            if beat_index % 2 and not breakdown:
                clap(stereo, at, 0.15 if intro else (0.23 if lift else 0.19))
            if not breakdown and not intro:
                rolling_bass(stereo, at + BEAT / 2, roots[harmony], 0.17 if lift else 0.13)
            elif beat_index in (0, 2):
                rolling_bass(stereo, at + BEAT / 2, roots[harmony], 0.07)
            if not intro and not breakdown and not outro and beat_index in (0, 1, 3):
                lead(stereo, at, melody[harmony][beat_index], 0.060 if lift else 0.042)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(stereo, at, 0.085 if breakdown else (0.155 if lift else 0.12),
                -0.30 if eighth % 2 else 0.30)
        if not breakdown:
            for sixteenth, pitch_index in enumerate(arp_pattern):
                at = start + sixteenth * BEAT / 4
                arp(stereo, at, chords[harmony][pitch_index] * (2 if sixteenth % 4 else 1),
                    0.024 if intro else (0.049 if build or lift else 0.037),
                    -0.24 if sixteenth % 2 else 0.24)

    fade = round(0.8 * RATE)
    stereo[:, -fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    peak = float(np.max(np.abs(stereo)))
    if peak <= 0 or not math.isfinite(peak):
        raise ValueError("Rendered audio is silent or invalid")
    pcm = (np.clip(stereo.T * (0.72 / peak), -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm.tobytes())


def render_stream_wav(game_source: Path, path: Path) -> None:
    """Keep the authored game movement, then add a new 60-second answer movement."""
    with wave.open(str(game_source), "rb") as source:
        if source.getnchannels() != 2 or source.getsampwidth() != 2 or source.getframerate() != RATE:
            raise ValueError("Unexpected game source format")
        first = source.readframes(SAMPLES)
    if len(first) != SAMPLES * 2 * 2:
        raise ValueError("Incomplete game source")

    second = np.zeros((2, SAMPLES), dtype=np.float32)
    # Relative-minor answer: E minor–C–A minor–D. The melody reverses the
    # first movement's rising prism sequence; no first-minute audio is looped.
    roots = (82.41, 65.41, 55.00, 73.42)
    chords = ((164.81, 196.00, 246.94), (261.63, 329.63, 392.00),
              (220.00, 261.63, 329.63), (293.66, 369.99, 440.00))
    melody = ((659.25, 783.99, 987.77, 783.99), (523.25, 659.25, 783.99, 659.25),
              (440.00, 523.25, 659.25, 523.25), (587.33, 739.99, 880.00, 739.99))
    arp_pattern = (2, 1, 0, 2, 1, 0, 1, 2, 2, 0, 1, 2, 0, 1, 2, 1)
    for bar in range(35):
        start = bar * 4 * BEAT
        harmony = (bar // 4) % 4
        restart = bar < 4
        breakdown = 12 <= bar < 16
        lift = 16 <= bar < 30
        outro = bar >= 30
        wide_pad(second, start, chords[harmony], 0.055 if breakdown else 0.063)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if not breakdown or beat_index in (0, 2):
                kick(second, at, 0.24 if breakdown else (0.36 if lift else 0.30))
            if beat_index in (1, 3) and not breakdown:
                clap(second, at, 0.17 if restart else (0.22 if lift else 0.19))
            if not breakdown:
                rolling_bass(second, at + BEAT / 2, roots[harmony], 0.11 if restart else (0.16 if lift else 0.13))
            if not restart and not breakdown and not outro and beat_index in (0, 2, 3):
                lead(second, at, melody[harmony][beat_index], 0.059 if lift else 0.041)
        for eighth in range(8):
            hat(second, start + eighth * BEAT / 2, 0.075 if breakdown else (0.15 if lift else 0.11),
                0.26 if eighth % 2 else -0.26)
        if not breakdown:
            for sixteenth, pitch_index in enumerate(arp_pattern):
                arp(second, start + sixteenth * BEAT / 4,
                    chords[harmony][pitch_index] * (2 if sixteenth % 4 else 1),
                    0.020 if restart else (0.045 if lift else 0.034),
                    0.26 if sixteenth % 2 else -0.26)

    fade = round(0.9 * RATE)
    second[:, -fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    peak = float(np.max(np.abs(second)))
    if peak <= 0 or not math.isfinite(peak):
        raise ValueError("Second movement is silent or invalid")
    pcm = (np.clip(second.T * (0.72 / peak), -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(first)
        output.writeframes(pcm.tobytes())


def observed_onsets(audio: Path) -> list[float]:
    """Chart against audible transients reported by the BS-D002 analyzer."""
    path = ROOT / "scripts/beatscape-audio.py"
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_prism_current", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load audio onset analyzer")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module.analyze_audio(audio, BPM).onsets_sec


def has_onset(at: float, onsets: list[float]) -> bool:
    index = bisect.bisect_left(onsets, at)
    distances = [abs(onsets[next_index] - at) for next_index in (index - 1, index)
                 if 0 <= next_index < len(onsets)]
    return bool(distances) and min(distances) <= 0.055


def chart(tier: str, onsets: list[float]) -> dict:
    notes: list[dict] = []
    if tier == "easy":
        for beat_index in range(8, 138, 2):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            if beat_index % 16 == 14:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT / 2, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for beat_index in range(8, 138):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            notes.append({"id": f"s-{beat_index}", "type": "tap", "t": at,
                          "key": beat_index % 2})
    else:
        for eighth in range(16, 276):
            at = round(eighth * BEAT / 2, 6)
            if not has_onset(at, onsets):
                continue
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
    command.extend(["-c:a", "aac", "-b:a", "160k", str(target)])
    subprocess.run(command, check=True)


def write_cover(path: Path) -> None:
    path.write_text("""<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <image href="cover-art.png" width="1024" height="1024" preserveAspectRatio="xMidYMid slice" />
  <rect y="766" width="1024" height="258" fill="#171a43" opacity="0.76" />
  <text x="80" y="857" fill="#c7fff1" font-family="sans-serif" font-size="35" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="80" y="934" fill="white" font-family="sans-serif" font-size="65" font-weight="700">Prism Current</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="duohertz-prism-current-") as temp:
        source = Path(temp) / "source.wav"
        stream_source = Path(temp) / "stream.wav"
        render_wav(source)
        onsets = observed_onsets(source)
        encode(source, OUT / "audio.m4a")
        render_stream_wav(source, stream_source)
        encode(stream_source, OUT / "stream.m4a")
        encode(source, OUT / "preview_48s.m4a", seconds=48)
    for tier in ("easy", "standard", "hard"):
        (OUT / f"{tier}.json").write_text(json.dumps(chart(tier, onsets), indent=2) + "\n", encoding="utf-8")
    write_cover(OUT / "cover.svg")
    files = {path.name: sha(path) for path in sorted(OUT.iterdir()) if path.is_file() and path.name != "manifest.json"}
    manifest = {
        "track_id": TRACK_ID,
        "title": "Prism Current",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Trance",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Independent deterministic G–Bm–C–D uplifting Trance game movement and new E minor–C–A minor–D answer movement for a 120-second stream master; sixteenth glass arpeggios, oscillators and seeded noise only, no sampled source audio or repeated first-minute loop",
        "source_script": "scripts/duohertz-compose-prism-current.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": "Use case: stylized-concept\nAsset type: original square, text-free album-cover background for an internal duohertz electronic rhythm-game candidate\nPrimary request: Create distinctive art for “Prism Current”, an uplifting all-ages Trance track. Show a suspended procession of translucent faceted prisms passing a soft continuous wave of violet and mint light from one prism to the next, like a current of sound moving horizontally then rising gently. Let tiny starlike frequency particles emerge at each transfer point. This is an abstract musical scene, not literal crystals for mining or a fantasy weapon.\nStyle/medium: polished contemporary editorial electronic album illustration with subtly refracted light, clear big shapes and fine ambient particles, welcoming to children and adults, legible at thumbnail size.\nComposition/framing: square; main prism chain runs across the upper and middle image; lower third is calm dark indigo space for a separate local title overlay.\nColor palette: cool violet, mint, icy white, peach glints, deep indigo.\nConstraints: no text, letters, numbers, logos, people, characters, weapons, vehicles, food, red neon city, flashing or strobing stripes, copied game imagery, rising helix, racing ribbons, paper fins, copper lanterns, citrus tiles, interlocking circular rings, sunset glass horizon or aurora stepping stones.",
            "og_prompt": "Use case: ads-marketing\nAsset type: wide companion sharing card for the supplied Prism Current square cover, final target 1200x630\nPrimary request: Recompose the supplied translucent violet-and-mint prisms, connected continuous luminous current, tiny frequency particles and deep indigo atmosphere into a wide 1.9:1 horizontal illustration. Move the prism chain mainly through the right two-thirds, flowing slightly upward. Keep the left third calm deep indigo for typography. Make a companion composition rather than stretching or simply cropping the square.\nText (verbatim): exactly two crisp, highly legible lines in the left third with generous margins, clean modern sans-serif: line 1 “duohertz” all lowercase, smaller, pale mint; line 2 “Prism Current” title case, larger, white. Spell both exactly. No other text or logos.\nStyle/mood: uplifting all-ages Trance music, polished contemporary editorial electronic album art, readable as a small social preview.\nConstraints: preserve the reference’s violet, mint, icy white and indigo palette; no people, vehicles, weapons, red neon city, flashing stripes, copied game art or new unrelated objects.",
            "og_reference": "cover-art.png supplied to built-in imagegen as the reference image",
            "og_resize": "Built-in imagegen supplied a wide card; sips resized it to exactly 1200x630 without changing the composition",
            "cover_svg": "Local SVG title overlay around the generated cover-art.png; bitmap source is unchanged",
        },
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
