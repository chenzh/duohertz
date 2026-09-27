#!/usr/bin/env python3
"""Render the original Cobalt Switchback Synthwave candidate for internal review.

Every sound is synthesized from oscillators or deterministic noise. The stream
master has a newly arranged answer movement, not a repeated game movement.
Technical analysis cannot replace earcheck, rights or visual signoff.
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
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-012-cobalt-switchback"
TRACK_ID = "dh-012-cobalt-switchback"
RATE = 32_000
BPM = 90
BEAT = 60 / BPM
SECONDS = 64
STREAM_SECONDS = 128
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(2026092412)

INITIAL_COVER_PROMPT = """Use case: stylized-concept. Asset type: original square album-cover artwork for an internal all-ages Synthwave song candidate called Cobalt Switchback in the duohertz electronic rhythm game. Primary visual: a playful ascending zigzag staircase made of translucent cobalt-blue glass sound-wave segments, bending twice across a soft apricot dawn sky. Tiny lime and pale cyan musical light particles collect at each bend. Friendly, optimistic, modern editorial album-art illustration with depth and tactile glass reflections; one clear focal shape, readable as a small thumbnail. Palette emphasizes cobalt, ice cyan, gentle peach and a few warm yellow accents. Entire scene is original; avoid circular rings, kites, lanterns, roads, cars, city skylines, people, characters, weapons, high-frequency flashing stripes, copied game art. No text, letters, numbers, logos or watermark. Square 1:1 composition."""
INITIAL_OG_PROMPT = """Use case: ads-marketing. Edit the supplied square Cobalt Switchback cover art into a wide landscape social card for the same internal duohertz Synthwave candidate. Preserve the original cobalt glass zigzag sound-wave staircase, soft peach dawn clouds, small musical light particles and optimistic painterly style; recompose the staircase on the right two-thirds with dark navy/cobalt atmospheric space on the left third. In the dark left third place exactly TWO crisp text lines, both fully inside with generous margins: small pale-cyan lowercase 'duohertz' (spell d-u-o-h-e-r-t-z); below it larger white title-case 'Cobalt Switchback' (spell C-o-b-a-l-t space S-w-i-t-c-h-b-a-c-k). Clean modern sans-serif typography, excellent legibility at small thumbnail size. No additional text, icon, logo, watermark, characters, cars, cities or flashing stripes. Wide 1200:630 aspect ratio, social-card composition distinct from the square cover."""
COVER_PROMPT = """Use case: style-transfer. Edit target: the supplied square Cobalt Switchback cover art. Preserve its unique ascending twice-bending cobalt-glass sound-wave staircase and scattered musical light particles as the main recognizable subject. Transform the soft painted dawn scene into an original high-contrast editorial comic-collage album illustration for the all-ages duohertz game: near-black ink backdrop, large warm-white cut-paper planes, bold coral-red diagonal rhythm slashes, electric-cyan accents and visible halftone texture. Keep the cobalt stair motif dimensional and easy to recognize at thumbnail size, with clear silhouette, dynamic asymmetrical composition, a few crisp frequency ticks and no strobing pattern. The result should feel energetic, playful and musical. No text, letters, numbers, logos, characters, masks, thieves, existing game symbols or watermark. Square 1:1 image."""
OG_PROMPT = """Use case: ads-marketing. Edit the supplied high-contrast Cobalt Switchback square artwork into a wide companion social card for the all-ages duohertz electronic rhythm game. Preserve the cobalt glass zigzag sound-wave staircase, warm-white torn-paper planes, near-black ink, coral-red diagonal rhythm slashes, halftone texture and electric-cyan frequency marks. Recompose the staircase toward the right half, leaving a quiet near-black or warm-white graphic panel on the left for clear typography. Add exactly two lines of text on the left, fully inside the frame with wide safe margins: small lowercase 'duohertz' (spell d-u-o-h-e-r-t-z) and larger title-case 'Cobalt Switchback' (spell C-o-b-a-l-t space S-w-i-t-c-h-b-a-c-k). Bold clean sans-serif, high contrast at thumbnail size. No other text, number, logo, character, mask, thief symbol or watermark. Wide 1200:630 social-card aspect ratio."""


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
    t = times(0.32)
    phase = math.tau * (51 * t + 102 * (1 - np.exp(-29 * t)) / 29)
    click = RNG.uniform(-1, 1, len(t)) * np.exp(-180 * t) * 0.07
    add(stereo, at, (np.sin(phase) * np.exp(-17 * t) + click) * level)


def snare(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.20)
    noise = RNG.uniform(-1, 1, len(t))
    bright = noise - np.concatenate(([0.0], noise[:-1])) * 0.76
    body = np.sin(math.tau * 175 * t) * np.exp(-22 * t)
    add(stereo, at, (bright * 0.76 + body * 0.24) * np.exp(-21 * t) * level, 0.12)


def hat(stereo: np.ndarray, at: float, level: float, pan: float) -> None:
    t = times(0.075)
    noise = RNG.uniform(-1, 1, len(t))
    bright = noise - np.concatenate(([0.0], noise[:-1])) * 0.89
    add(stereo, at, bright * np.exp(-51 * t) * level, pan)


def rounded_bass(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = times(0.46)
    envelope = np.clip(t / 0.006, 0, 1) * np.exp(-4.9 * t)
    phase = math.tau * frequency * t
    tone = np.sin(phase) + 0.31 * np.sin(2 * phase) + 0.12 * np.sin(4 * phase)
    add(stereo, at, tone * envelope * level, -0.07)


def glass_pluck(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = times(0.34)
    phase = math.tau * frequency * t
    tone = np.sin(phase + 0.63 * np.sin(2.006 * phase)) + 0.17 * np.sin(4 * phase)
    envelope = np.clip(t / 0.003, 0, 1) * np.exp(-10.2 * t)
    add(stereo, at, tone * envelope * level, pan)


def stepped_lead(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = times(0.58)
    phase = math.tau * frequency * t
    vibrato = 0.0016 * np.sin(math.tau * 5.2 * t)
    tone = np.sin(phase * (1 + vibrato)) + 0.23 * np.sin(2 * phase)
    envelope = np.clip(t / 0.014, 0, 1) * np.clip((0.58 - t) / 0.13, 0, 1)
    add(stereo, at, tone * envelope * level, pan)


def gated_chord(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    t = times(0.76)
    envelope = np.clip(t / 0.032, 0, 1) * np.clip((0.76 - t) / 0.16, 0, 1)
    gate = 0.77 + 0.23 * np.sin(math.tau * 3 * t)
    for index, frequency in enumerate(frequencies):
        phase = math.tau * frequency * t
        tone = np.sin(phase) + 0.28 * np.sin(2 * phase) + 0.10 * np.sin(3 * phase)
        add(stereo, at, tone * envelope * gate * level / len(frequencies),
            (index - 1.5) * 0.15)


def movement(*, answer: bool) -> bytes:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    if answer:
        # A new F#m7–Dmaj9–Amaj7–Eadd9 response, with descending lead answers
        # and syncopated bass instead of the game movement's rising switchback.
        roots = (92.50, 73.42, 55.00, 82.41)
        chords = (
            (185.00, 220.00, 277.18, 329.63),
            (146.83, 185.00, 220.00, 277.18),
            (220.00, 277.18, 329.63, 415.30),
            (164.81, 207.65, 246.94, 369.99),
        )
        motif = (
            (880.00, 739.99, 659.25, 554.37),
            (739.99, 659.25, 554.37, 440.00),
            (830.61, 739.99, 659.25, 554.37),
            (739.99, 622.25, 554.37, 493.88),
        )
    else:
        # Emaj7–C#m7–Amaj9–Bsus2; a slower 90-BPM, 24-bar Synthwave pulse.
        roots = (82.41, 69.30, 55.00, 61.74)
        chords = (
            (164.81, 207.65, 246.94, 311.13),
            (138.59, 164.81, 207.65, 246.94),
            (110.00, 138.59, 164.81, 207.65),
            (123.47, 138.59, 185.00, 246.94),
        )
        motif = (
            (659.25, 739.99, 830.61, 987.77),
            (554.37, 659.25, 739.99, 830.61),
            (554.37, 659.25, 830.61, 1108.73),
            (493.88, 622.25, 739.99, 987.77),
        )

    for bar in range(24):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 4
        bridge = 12 <= bar < 16
        lift = 16 <= bar < 22
        outro = bar >= 22
        gated_chord(stereo, start, chords[harmony], 0.092 if bridge else 0.13)
        gated_chord(stereo, start + 2 * BEAT, chords[harmony], 0.055 if bridge else 0.083)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if not bridge or beat_index in (0, 2):
                kick(stereo, at, 0.22 if bridge else (0.36 if lift else 0.30))
            if beat_index in (1, 3) and not bridge:
                snare(stereo, at, 0.14 if intro or outro else (0.26 if lift else 0.21))
            if answer:
                if not bridge and not outro and beat_index in (0, 2):
                    rounded_bass(stereo, at + BEAT / 2, roots[harmony], 0.19 if lift else 0.15)
                if not intro and not bridge and not outro and beat_index in (1, 3):
                    stepped_lead(stereo, at, motif[harmony][beat_index], 0.090 if lift else 0.067,
                                 -0.16 if beat_index == 1 else 0.16)
            else:
                if beat_index in (0, 2) or (lift and beat_index == 3):
                    rounded_bass(stereo, at, roots[harmony], 0.11 if bridge else (0.20 if lift else 0.16))
                if not intro and not bridge and not outro and beat_index in (0, 2):
                    stepped_lead(stereo, at + BEAT / 2, motif[harmony][beat_index],
                                 0.083 if lift else 0.061, -0.16 if beat_index == 0 else 0.16)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(stereo, at, 0.075 if bridge else (0.14 if lift else 0.11),
                0.26 if eighth % 2 else -0.26)
            if answer:
                if eighth in (1, 2, 5, 7) and not bridge and not outro:
                    glass_pluck(stereo, at, chords[harmony][(7 - eighth) % 4] * 2,
                                0.068 if lift else 0.049, 0.25 if eighth % 2 else -0.25)
            elif eighth in (1, 3, 4, 7) and not bridge and not outro:
                glass_pluck(stereo, at, chords[harmony][(eighth + bar) % 4] * 2,
                            0.069 if lift else 0.050, -0.25 if eighth % 2 else 0.25)

    fade_start = round(62.3 * RATE)
    stereo[:, fade_start:] *= np.linspace(1, 0, SAMPLES - fade_start, dtype=np.float32)
    peak = float(np.max(np.abs(stereo)))
    if peak <= 0 or not math.isfinite(peak):
        raise ValueError("Rendered audio is silent or invalid")
    return (np.clip(stereo.T * (0.78 / peak), -1, 1) * 32767).astype("<i2").tobytes()


def write_wav(path: Path, pcm: bytes) -> None:
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm)


def observed_onsets(audio: Path) -> list[float]:
    path = ROOT / "scripts/beatscape-audio.py"
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_cobalt_switchback", path)
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
        for beat_index in range(6, 92, 2):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            if beat_index % 16 == 14:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT / 2, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for beat_index in range(6, 92):
            at = round(beat_index * BEAT, 6)
            if has_onset(at, onsets):
                notes.append({"id": f"s-{beat_index}", "type": "tap", "t": at,
                              "key": beat_index % 2})
    else:
        for eighth in range(12, 184):
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
    command.extend(["-c:a", "aac", "-b:a", "160k", str(target)])
    subprocess.run(command, check=True)


def write_cover(path: Path) -> None:
    path.write_text("""<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <image href="cover-art.png" width="1024" height="1024" preserveAspectRatio="xMidYMid slice" />
  <rect y="768" width="1024" height="256" fill="#102447" opacity="0.74" />
  <text x="62" y="850" fill="#c5f7ff" font-family="sans-serif" font-size="36" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="62" y="920" fill="white" font-family="sans-serif" font-size="61" font-weight="700">Cobalt Switchback</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("cover-art.png", "og.png"):
        if not (OUT / name).is_file():
            raise FileNotFoundError(f"Generate and inspect {OUT / name} first")
    with tempfile.TemporaryDirectory(prefix="duohertz-cobalt-switchback-") as temp:
        game_wav = Path(temp) / "game.wav"
        stream_wav = Path(temp) / "stream.wav"
        game_pcm = movement(answer=False)
        write_wav(game_wav, game_pcm)
        onsets = observed_onsets(game_wav)
        encode(game_wav, OUT / "audio.m4a")
        write_wav(stream_wav, game_pcm + movement(answer=True))
        encode(stream_wav, OUT / "stream.m4a")
        encode(game_wav, OUT / "preview_48s.m4a", seconds=48)
    for tier in ("easy", "standard", "hard"):
        (OUT / f"{tier}.json").write_text(json.dumps(chart(tier, onsets), indent=2) + "\n", encoding="utf-8")
    write_cover(OUT / "cover.svg")
    files = {path.name: sha(path) for path in sorted(OUT.iterdir()) if path.is_file() and path.name != "manifest.json"}
    manifest = {
        "track_id": TRACK_ID,
        "title": "Cobalt Switchback",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Synthwave",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Original deterministic Emaj7–C#m7–Amaj9–Bsus2 game movement with a new F#m7–Dmaj9–Amaj7–Eadd9 answer movement; 90 BPM Synthwave built from generated oscillators and seeded noise, with no sampled audio or repeated first-minute loop",
        "source_script": "scripts/duohertz-compose-cobalt-switchback.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": COVER_PROMPT,
            "og_prompt": OG_PROMPT,
            "initial_cover_prompt": INITIAL_COVER_PROMPT,
            "initial_og_prompt": INITIAL_OG_PROMPT,
            "art_revision": "The first soft dawn cover and its wide card were superseded after the duohertz visual-direction update; the current cover edits the original and the current OG edits that revised cover.",
            "cover_reference": "Initial square artwork supplied to built-in imagegen as the edit target",
            "og_reference": "Revised cover-art.png supplied to built-in imagegen as the edit target",
            "og_resize": "Built-in imagegen supplied a 1730x909 wide card; sips resized it to exactly 1200x630",
            "cover_svg": "Local SVG title overlay around generated cover-art.png; bitmap source is unchanged",
        },
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
