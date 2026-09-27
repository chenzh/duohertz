#!/usr/bin/env python3
"""Compose the isolated Orbit Lattice Trance candidate from generated tones.

The game movement and the radio answer use different harmony and lead phrases.
Automated checks do not stand in for listening, rights, art, or release review.
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
TRACK_ID = "dh-015-orbit-lattice"
OUT = ROOT / "apps/beatscape/candidates/duohertz" / TRACK_ID
RATE = 32_000
BPM = 136
BEAT = 60 / BPM
SECONDS = 60
STREAM_SECONDS = 120
SAMPLES = SECONDS * RATE
RNG = np.random.default_rng(2026092415)

COVER_PROMPT = """Use case: stylized-concept
Asset type: original square album-cover illustration for an INTERNAL duohertz electronic rhythm-game Trance track candidate titled Orbit Lattice
Primary request: depict a single off-center orbital pathway made of thin intersecting circular frequency rails, with small luminous note-pulses moving through the intersections; one bright crossing forms the focal point. The rails should suggest musical 3-3-2 rhythmic cycles and a calm sense of forward motion, without showing a literal planet or solar system.
Style/medium: polished contemporary editorial comic-collage illustration, bold silhouette and crisp layered cut-paper geometry, subtle halftone texture, clean at a tiny music-card thumbnail. Distinct from existing duohertz prism, helix, ring-pair, jetstream, mosaic and lantern covers.
Composition/framing: square 1:1; primary crossing in upper center, several open dark areas around it, no busy fine-line maze. Dark lower third can support a separate local title overlay.
Color palette: near-black ink, warm ivory, coral red strokes, electric cyan pulses, restrained amber glints.
Constraints: all-ages; no people, faces, masks, characters, text, letters, numbers, logos, watermarks, flashing/strobing stripes, copied game imagery, literal planets, sci-fi spacecraft, gem prisms, helices or split jetstream ribbons. High-resolution PNG."""
OG_PROMPT = """Use case: ads-marketing
Asset type: original 1200:630 social sharing card for the INTERNAL duohertz Trance candidate Orbit Lattice
Input image: supplied Orbit Lattice square cover is the visual reference; preserve its original orbital frequency rails, luminous crossings, halftone and palette.
Primary request: recompose the same musical orbital rail subject into a wide landscape layout. Keep the rail crossing and pulse details mainly in the right two-thirds and leave a calm near-black panel at left for title typography; do not simply stretch or crop the square.
Text (verbatim): exactly two crisp sans-serif lines in the left third with safe margins: smaller lowercase 'duohertz'; below it larger title-case 'Orbit Lattice'. Spell both exactly.
Color palette: near-black, warm ivory, coral red, electric cyan, restrained amber.
Constraints: readable at social thumbnail size, all-ages, no other text, logos, characters, faces, planets, spacecraft, prisms, strobing stripes or copied game imagery."""


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def time_axis(length: float) -> np.ndarray:
    return np.arange(round(length * RATE), dtype=np.float64) / RATE


def add(stereo: np.ndarray, at: float, signal: np.ndarray, pan: float = 0.0) -> None:
    start = round(at * RATE)
    if start < 0 or start >= SAMPLES:
        return
    end = min(SAMPLES, start + len(signal))
    signal = signal[:end - start]
    stereo[0, start:end] += signal * (1 - max(0, pan))
    stereo[1, start:end] += signal * (1 + min(0, pan))


def kick(stereo: np.ndarray, at: float, level: float, *, answer: bool) -> None:
    t = time_axis(0.28)
    base, sweep = (48, 119) if answer else (53, 105)
    phase = math.tau * (base * t + sweep * (1 - np.exp(-39 * t)) / 39)
    click = RNG.uniform(-1, 1, len(t)) * np.exp(-160 * t)
    add(stereo, at, (np.sin(phase) * np.exp(-17 * t) + 0.045 * click) * level)


def clap(stereo: np.ndarray, at: float, level: float) -> None:
    t = time_axis(0.18)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.78
    tail = (np.sin(math.tau * 193 * t) * 0.19 + high * 0.81) * np.exp(-26 * t)
    add(stereo, at, tail * level)


def hat(stereo: np.ndarray, at: float, level: float, pan: float) -> None:
    t = time_axis(0.055)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.91
    add(stereo, at, high * np.exp(-72 * t) * level, pan)


def bass(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = time_axis(0.30)
    phase = math.tau * frequency * t
    signal = np.sin(phase) + 0.27 * np.sin(2.003 * phase)
    envelope = np.clip(t / 0.006, 0, 1) * np.exp(-10 * t)
    add(stereo, at, signal * envelope * level)


def air_pad(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    t = time_axis(1.64)
    envelope = np.clip(t / 0.12, 0, 1) * np.clip((1.64 - t) / 0.30, 0, 1)
    for index, frequency in enumerate(frequencies):
        phase = math.tau * frequency * t
        tone = np.sin(phase) + 0.21 * np.sin(2.005 * phase) + 0.09 * np.sin(3.006 * phase)
        add(stereo, at, tone * envelope * level / len(frequencies), (index - 1.5) * 0.16)


def orbit_pluck(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = time_axis(0.29)
    phase = math.tau * frequency * t
    tone = np.sin(phase + 0.55 * np.sin(1.997 * phase)) + 0.16 * np.sin(4.01 * phase)
    envelope = np.clip(t / 0.003, 0, 1) * np.exp(-13 * t)
    add(stereo, at, tone * envelope * level, pan)


def bell_reply(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = time_axis(0.54)
    phase = math.tau * frequency * t
    tone = np.sin(phase) + 0.32 * np.sin(2.414 * phase) + 0.13 * np.sin(3.827 * phase)
    envelope = np.clip(t / 0.012, 0, 1) * np.exp(-5.8 * t)
    add(stereo, at, tone * envelope * level, pan)


def movement(*, answer: bool) -> bytes:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    if answer:
        # Bbmaj9–Fadd9–C6–Gm9, a descending counterline and shifted 2-5-7 pulse.
        roots = (58.27, 87.31, 65.41, 98.00)
        chords = (
            (116.54, 146.83, 174.61, 220.00),
            (174.61, 220.00, 261.63, 392.00),
            (130.81, 164.81, 196.00, 220.00),
            (196.00, 233.08, 293.66, 349.23),
        )
        motif = (
            (880.00, 783.99, 698.46),
            (783.99, 698.46, 587.33),
            (783.99, 659.25, 523.25),
            (698.46, 587.33, 466.16),
        )
        pulse_steps = (2, 5, 7)
    else:
        # Dm9–G13–Cmaj9–Am9, rising modal three-note orbit.
        roots = (73.42, 98.00, 65.41, 55.00)
        chords = (
            (146.83, 174.61, 220.00, 261.63),
            (196.00, 246.94, 293.66, 329.63),
            (130.81, 164.81, 196.00, 246.94),
            (110.00, 130.81, 164.81, 196.00),
        )
        motif = (
            (587.33, 698.46, 880.00),
            (493.88, 587.33, 783.99),
            (523.25, 659.25, 783.99),
            (440.00, 523.25, 659.25),
        )
        pulse_steps = (0, 3, 6)

    # 34 bars at 136 BPM fill exactly 60 seconds. Six-bar introduction and a
    # short central air break leave a distinct contour across each movement.
    for bar in range(34):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 4
        breakbar = 15 <= bar < 19 if not answer else 12 <= bar < 16
        lift = 19 <= bar < 31 if not answer else 16 <= bar < 30
        outro = bar >= 31 if not answer else bar >= 30
        air_pad(stereo, start, chords[harmony], 0.072 if breakbar else 0.085)
        if bar % 2 and not breakbar:
            air_pad(stereo, start + 2 * BEAT, chords[harmony], 0.039)

        for beat_index in range(4):
            at = start + beat_index * BEAT
            answer_half_time = answer and bar < 16
            if (not breakbar and not answer_half_time) or beat_index in (0, 2):
                kick(stereo, at, 0.22 if breakbar else (0.36 if lift else 0.31), answer=answer)
            if (beat_index in ((2,) if answer_half_time else (1, 3))) and not breakbar:
                clap(stereo, at, 0.18 if intro else (0.26 if lift else 0.21))
            if not breakbar and not outro:
                bass(stereo, at + (0.75 if answer else 0.5) * BEAT,
                     roots[harmony], 0.16 if lift else 0.12)
            elif beat_index in (0, 2):
                bass(stereo, at + (0.75 if answer else 0.5) * BEAT, roots[harmony], 0.065)
        for eighth in range(8):
            hat(stereo, start + (eighth + (0.5 if answer else 0)) * BEAT / 2,
                0.078 if breakbar else (0.14 if lift else 0.105),
                -0.24 if eighth % 2 else 0.24)
        if not intro and not breakbar and not outro:
            for index, step in enumerate(pulse_steps):
                orbit_pluck(stereo, start + step * BEAT / 2,
                            motif[harmony][index], 0.10 if lift else 0.077,
                            -0.28 if index % 2 else 0.28)
            if bar % 2 == 1:
                bell_reply(stereo, start + 3.5 * BEAT, motif[harmony][-1] / 2,
                           0.042 if lift else 0.031, -0.16 if answer else 0.16)
        if breakbar and bar % 2 == 0:
            bell_reply(stereo, start, motif[harmony][0] / 2, 0.046, 0.16)

    fade = round(0.85 * RATE)
    stereo[:, -fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    peak = float(np.max(np.abs(stereo)))
    if peak <= 0 or not math.isfinite(peak):
        raise ValueError("Rendered movement is silent or invalid")
    return (np.clip(stereo.T * (0.76 / peak), -1, 1) * 32767).astype("<i2").tobytes()


def write_wav(path: Path, pcm: bytes) -> None:
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm)


def onsets(audio: Path) -> list[float]:
    path = ROOT / "scripts/beatscape-audio.py"
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_orbit_lattice", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load audio onset analyzer")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module.analyze_audio(audio, BPM).onsets_sec


def has_onset(at: float, observed: list[float]) -> bool:
    position = bisect.bisect_left(observed, at)
    distances = [abs(observed[index] - at) for index in (position - 1, position)
                 if 0 <= index < len(observed)]
    return bool(distances) and min(distances) <= 0.055


def chart(tier: str, observed: list[float]) -> dict:
    notes: list[dict] = []
    if tier == "easy":
        for beat_index in range(8, 132, 2):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, observed):
                continue
            if beat_index % 24 == 22:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for beat_index in range(8, 132):
            at = round(beat_index * BEAT, 6)
            if has_onset(at, observed):
                notes.append({"id": f"s-{beat_index}", "type": "tap", "t": at,
                              "key": (beat_index // 2) % 2})
    else:
        for eighth in range(16, 264):
            if eighth % 2 != 0 and eighth % 8 not in (3, 5, 7):
                continue
            at = round(eighth * BEAT / 2, 6)
            if not has_onset(at, observed):
                continue
            if eighth % 32 == 0:
                notes.append({"id": f"h-{eighth}", "type": "chord", "t": at, "keys": [0, 1]})
            else:
                notes.append({"id": f"h-{eighth}", "type": "tap", "t": at,
                              "key": (eighth // 2) % 2})
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
        command += ["-t", str(seconds)]
    command += ["-c:a", "aac", "-b:a", "160k", str(target)]
    subprocess.run(command, check=True)


def write_cover(path: Path) -> None:
    path.write_text("""<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <image href="cover-art.png" width="1024" height="1024" preserveAspectRatio="xMidYMid slice" />
  <rect y="766" width="1024" height="258" fill="#111421" opacity="0.80" />
  <text x="80" y="857" fill="#67eee0" font-family="sans-serif" font-size="35" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="80" y="934" fill="#fff9ef" font-family="sans-serif" font-size="65" font-weight="700">Orbit Lattice</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("cover-art.png", "og.png"):
        if not (OUT / name).is_file():
            raise FileNotFoundError(f"Generated art is required before manifest: {OUT / name}")
    with tempfile.TemporaryDirectory(prefix="duohertz-orbit-lattice-") as temp:
        tempdir = Path(temp)
        game = movement(answer=False)
        answer = movement(answer=True)
        source = tempdir / "game.wav"
        stream = tempdir / "stream.wav"
        write_wav(source, game)
        write_wav(stream, game + answer)
        detected = onsets(source)
        encode(source, OUT / "audio.m4a")
        encode(stream, OUT / "stream.m4a")
        encode(source, OUT / "preview_48s.m4a", seconds=48)
    for tier in ("easy", "standard", "hard"):
        (OUT / f"{tier}.json").write_text(json.dumps(chart(tier, detected), indent=2) + "\n", encoding="utf-8")
    write_cover(OUT / "cover.svg")
    files = {path.name: sha(path) for path in sorted(OUT.iterdir()) if path.is_file() and path.name != "manifest.json"}
    manifest = {
        "track_id": TRACK_ID,
        "title": "Orbit Lattice",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Trance",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Independent deterministic D minor modal 3-3-2 orbital pluck game movement and new Bb–F–C–G minor shifted-answer radio movement with a half-time opening, retuned kick and displaced hats; oscillator, bell synthesis and seeded noise only, no sampled audio or repeated first-minute loop",
        "source_script": "scripts/duohertz-compose-orbit-lattice.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": COVER_PROMPT,
            "og_prompt": OG_PROMPT,
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
