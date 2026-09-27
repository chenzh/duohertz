#!/usr/bin/env python3
"""Render the independent Synthwave candidate Lantern Circuit for internal review.

The arrangement uses generated oscillators and seeded noise, without samples.
Charts are selected from attacks detected in the rendered audio itself.
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
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-007-lantern-circuit"
TRACK_ID = "dh-007-lantern-circuit"
RATE = 32_000
BPM = 108
BEAT = 60 / BPM
SECONDS = 64
STREAM_SECONDS = 128
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(2026092407)

COVER_PROMPT = """Use case: stylized-concept
Asset type: original square album cover background for an internal candidate electronic rhythm-game track
Primary request: Create a text-free cover illustration for “Lantern Circuit”, a bright all-ages Synthwave song in duohertz. Picture a suspended network of small frosted copper-and-cream lantern modules linked by thin luminous mint circuit paths; a clear central pulse lights one node while gentle polygonal frequency ripples travel outward. The visual metaphor is musical call-and-response, not a street or a vehicle.
Style/medium: polished contemporary editorial electronic album art, crisp geometric forms with tactile translucent glass and warm metallic edges; joyful, airy, detailed yet readable at thumbnail size.
Composition/framing: square, main lantern network in upper two-thirds; quiet dark-plum lower third for a separate local title overlay.
Color palette: warm copper, pale peach, mint green, soft lavender on deep plum.
Constraints: no text, letters, numerals, logos, human characters, cars, weapons, red neon city, strobing stripes, copied game art, or resemblance to existing duohertz covers featuring interlocking rings, sunset glass horizon, stepping stones, racing sky ribbons, rising helix, or a light-column grove."""
OG_PROMPT = """Use case: ads-marketing
Asset type: 1200x630-style wide sharing card companion to the supplied square album artwork (reference image)
Primary request: Recompose the supplied Lantern Circuit art into a polished wide social card for the all-ages duohertz electronic rhythm-game song. Preserve the frosted copper lantern network, luminous mint circuit lines, pale peach highlights, and gentle polygonal sound waves. Place the main luminous lantern network on the right two-thirds with a quiet, dark-plum left third for typography. This should be a new horizontal composition, not a stretch or crop of the square.
Text (verbatim): exactly two lines in the left third, generous margins, clean crisp modern sans-serif: line 1 “duohertz” (all lowercase, smaller, pale mint); line 2 “Lantern Circuit” (title case, larger, white). Spell them exactly with no other words.
Composition/framing: approximately 1.9:1 wide horizontal, readable at thumbnail size; keep all typography inside the frame.
Constraints: no other text, numbers, logos, characters, cars, weapons, red neon city, strobing stripes, or copied game art."""


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


def kick(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.30)
    phase = math.tau * (46 * t + 125 * (1 - np.exp(-34 * t)) / 34)
    click = RNG.uniform(-1, 1, len(t)) * np.exp(-180 * t) * 0.09
    add(stereo, at, ((np.sin(phase) * np.exp(-17 * t) + click) * level).astype(np.float32))


def clap(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.19)
    noise = RNG.uniform(-1, 1, len(t))
    bright = noise - np.concatenate(([0.0], noise[:-1])) * 0.82
    ring = np.sin(math.tau * 197 * t) * np.exp(-35 * t)
    envelope = np.exp(-21 * t) * (1 + 0.34 * np.exp(-240 * np.abs(t - 0.025)))
    add(stereo, at, ((bright * 0.8 + ring * 0.2) * envelope * level).astype(np.float32), 0.10)


def hat(stereo: np.ndarray, at: float, level: float, pan: float) -> None:
    t = times(0.09)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.88
    add(stereo, at, (high * np.exp(-48 * t) * level).astype(np.float32), pan)


def bass(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = times(0.42)
    envelope = np.clip(t / 0.005, 0, 1) * np.exp(-5.4 * t)
    phase = math.tau * frequency * t
    wave = np.sin(phase) + 0.35 * np.sin(2 * phase) + 0.12 * np.sin(3 * phase)
    add(stereo, at, (wave * envelope * level).astype(np.float32), -0.06)


def glass_keys(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = times(0.39)
    phase = math.tau * frequency * t
    wave = np.sin(phase + 0.42 * np.sin(2.01 * phase)) + 0.22 * np.sin(3 * phase)
    envelope = np.clip(t / 0.004, 0, 1) * np.exp(-9.0 * t)
    add(stereo, at, (wave * envelope * level).astype(np.float32), pan)


def pulse_lead(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = times(0.44)
    phase = math.tau * frequency * t
    wave = np.sin(phase) + 0.44 * np.sin(2 * phase) + 0.19 * np.sin(4 * phase)
    envelope = np.clip(t / 0.013, 0, 1) * np.exp(-5.8 * t)
    add(stereo, at, (wave * envelope * level).astype(np.float32), pan)


def airy_pad(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    length = 2.45
    t = times(length)
    envelope = np.clip(t / 0.28, 0, 1) * np.clip((length - t) / 0.35, 0, 1)
    wave = np.sin(math.tau * frequency * t) + 0.26 * np.sin(math.tau * frequency * 1.003 * t)
    add(stereo, at, (wave * envelope * level).astype(np.float32), pan)


def render_wav(path: Path) -> None:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    # B–G#m–E–F#: contrasting lantern calls above a warm, steady dance pulse.
    roots = (61.735, 51.913, 82.407, 46.249)
    chords = ((246.94, 311.13, 369.99), (207.65, 246.94, 311.13),
              (164.81, 207.65, 246.94), (185.00, 233.08, 277.18))
    motifs = ((493.88, 622.25, 739.99, 622.25), (415.30, 493.88, 622.25, 493.88),
              (329.63, 415.30, 493.88, 415.30), (369.99, 466.16, 554.37, 466.16))
    for bar in range(28):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 4
        bridge = 12 <= bar < 16
        lift = 16 <= bar < 24
        outro = bar >= 24
        for index, frequency in enumerate(chords[harmony]):
            airy_pad(stereo, start, frequency, 0.020 if bridge else 0.030,
                     (index - 1) * 0.30)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            kick(stereo, at, 0.25 if bridge or outro else (0.30 if intro else 0.38))
            if beat_index in (1, 3) and not bridge:
                clap(stereo, at, 0.13 if intro or outro else 0.23)
            if beat_index in (0, 2) or lift:
                bass(stereo, at + BEAT / 2, roots[harmony], 0.10 if bridge else 0.18)
            if not intro and not bridge and not outro and beat_index in (0, 2):
                pulse_lead(stereo, at, motifs[harmony][beat_index],
                           0.070 if lift else 0.051, -0.22 if beat_index == 0 else 0.22)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(stereo, at, 0.11 if bridge else (0.18 if lift else 0.15),
                -0.20 if eighth % 2 else 0.20)
            if eighth % 2 and not bridge and not outro:
                glass_keys(stereo, at, chords[harmony][(eighth // 2 + bar) % 3] * 2,
                           0.060 if lift else 0.041, 0.24 if eighth % 4 == 1 else -0.24)
            if lift and eighth in (2, 6):
                pulse_lead(stereo, at, motifs[harmony][eighth // 2], 0.046,
                           -0.16 if eighth == 2 else 0.16)

    fade_start = round(61.8 * RATE)
    stereo[:, fade_start:] *= np.linspace(1, 0, SAMPLES - fade_start, dtype=np.float32)
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
    """Answer the original lantern pulse with a new 28-bar Synthwave passage."""
    with wave.open(str(game_source), "rb") as source:
        if source.getnchannels() != 2 or source.getsampwidth() != 2 or source.getframerate() != RATE:
            raise ValueError("Unexpected game source format")
        first = source.readframes(SAMPLES)
    if len(first) != SAMPLES * 2 * 2:
        raise ValueError("Incomplete game source")

    second = np.zeros((2, SAMPLES), dtype=np.float32)
    # C# minor–A–E–B changes the original B–G# minor–E–F# centre. The
    # answer moves the lead between the backbeats and lets short glass keys
    # respond from the opposite side of the stereo image.
    roots = (69.30, 55.00, 82.407, 61.735)
    chords = ((277.18, 329.63, 415.30), (220.00, 277.18, 329.63),
              (164.81, 207.65, 246.94), (246.94, 311.13, 369.99))
    motifs = ((830.61, 659.25, 554.37, 415.30), (659.25, 554.37, 440.00, 329.63),
              (739.99, 622.25, 493.88, 415.30), (739.99, 622.25, 493.88, 369.99))
    for bar in range(28):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        reentry = bar < 4
        bridge = 12 <= bar < 16
        lift = 16 <= bar < 24
        outro = bar >= 24
        for index, frequency in enumerate(chords[harmony]):
            airy_pad(second, start, frequency, 0.021 if bridge else 0.032,
                     (index - 1) * 0.30)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if not bridge or beat_index in (0, 2):
                kick(second, at, 0.24 if bridge else (0.39 if lift else 0.32))
            if beat_index in (1, 3) and not bridge:
                clap(second, at, 0.13 if reentry or outro else (0.24 if lift else 0.21))
            if not bridge and not outro:
                bass(second, at + BEAT / 2, roots[harmony], 0.17 if lift else 0.14)
            elif beat_index in (0, 2):
                bass(second, at + BEAT / 2, roots[harmony], 0.09)
            if not reentry and not bridge and not outro and beat_index in (1, 3):
                pulse_lead(second, at, motifs[harmony][beat_index],
                           0.074 if lift else 0.053, 0.22 if beat_index == 1 else -0.22)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(second, at, 0.10 if bridge else (0.18 if lift else 0.14),
                0.20 if eighth % 2 else -0.20)
            if eighth in (0, 3, 6) and not bridge and not outro:
                glass_keys(second, at, chords[harmony][eighth % 3] * 2,
                           0.062 if lift else 0.043, -0.24 if eighth % 2 else 0.24)

    fade_start = round(61.8 * RATE)
    second[:, fade_start:] *= np.linspace(1, 0, SAMPLES - fade_start, dtype=np.float32)
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
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_lantern_circuit", path)
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
        for beat_index in range(8, 110, 2):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            if beat_index % 16 == 14:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT / 2, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for beat_index in range(8, 110):
            at = round(beat_index * BEAT, 6)
            if has_onset(at, onsets):
                notes.append({"id": f"s-{beat_index}", "type": "tap", "t": at,
                              "key": beat_index % 2})
    else:
        for eighth in range(16, 220):
            at = round(eighth * BEAT / 2, 6)
            if not has_onset(at, onsets):
                continue
            if eighth % 32 == 0:
                notes.append({"id": f"h-{eighth}", "type": "chord", "t": at, "keys": [0, 1]})
            else:
                notes.append({"id": f"h-{eighth}", "type": "tap", "t": at, "key": eighth % 2})
    return {
        "format": 2, "theme": "duohertz", "track_id": TRACK_ID, "tier": tier,
        "input_count": 1 if tier == "easy" else 2, "bpm": BPM, "audio_offset_ms": 0,
        "total_notes": sum(2 if note["type"] == "chord" else 1 for note in notes),
        "notes": notes,
    }


def encode(source: Path, target: Path, *, seconds: int | None = None) -> None:
    command = ["ffmpeg", "-v", "error", "-y", "-i", str(source)]
    if seconds is not None:
        command.extend(["-t", str(seconds)])
    command.extend(["-af", "volume=-2dB", "-c:a", "aac", "-b:a", "160k", str(target)])
    subprocess.run(command, check=True)


def write_cover(path: Path) -> None:
    path.write_text("""<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <image href="cover-art.png" width="1024" height="1024" preserveAspectRatio="xMidYMid slice" />
  <rect y="764" width="1024" height="260" fill="#2c1932" opacity="0.72" />
  <text x="72" y="856" fill="#c8f8d9" font-family="sans-serif" font-size="36" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="72" y="930" fill="white" font-family="sans-serif" font-size="70" font-weight="700">Lantern Circuit</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for art in ("cover-art.png", "og.png"):
        if not (OUT / art).is_file():
            raise FileNotFoundError(f"Generate and inspect {OUT / art} first")
    with tempfile.TemporaryDirectory(prefix="duohertz-lantern-circuit-") as temp:
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
        "title": "Lantern Circuit",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Synthwave",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Independent deterministic B–G# minor–E–F# Synthwave game movement and new C# minor–A–E–B answer movement for a 128-second stream master; generated oscillators and seeded noise only, no sampled source audio or repeated first-minute loop; -2 dB linear gain before AAC encoding",
        "audio_gain_db": -2.0,
        "source_script": "scripts/duohertz-compose-lantern-circuit.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": COVER_PROMPT,
            "og_prompt": OG_PROMPT,
            "og_reference": "cover-art.png supplied to built-in imagegen as the reference image",
            "og_resize": "Built-in imagegen supplied a 1729x910 wide card; sips resized it to exactly 1200x630 without changing the composition",
            "cover_svg": "Local SVG title overlay around generated cover-art.png; bitmap source is unchanged",
        },
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
