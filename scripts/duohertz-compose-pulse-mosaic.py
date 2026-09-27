#!/usr/bin/env python3
"""Render the original Pulse Mosaic Future Bass candidate for internal review.

The two movements use different harmony and melodies; every sound is made from
oscillators or seeded noise. Technical checks do not replace human earcheck.
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
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-013-pulse-mosaic"
TRACK_ID = "dh-013-pulse-mosaic"
RATE = 32_000
BPM = 100
BEAT = 60 / BPM
SECONDS = 60
STREAM_SECONDS = 120
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(2026092413)

COVER_PROMPT = "Use case: stylized-concept. Asset type: square album-cover artwork for an internal, all-ages Future Bass track candidate named Pulse Mosaic in the original duohertz electronic rhythm game. Make one distinctive musical subject: a rising mosaic of floating geometric sound tiles, with each tile acting like a small illuminated frequency pulse; the tiles assemble into one broad upward syncopated wave. Original high-contrast editorial comic-collage illustration with near-black ink background, warm-white torn-paper planes, coral-red diagonal rhythm accents, electric-cyan and lavender glowing tiles, subtle halftone texture. Dynamic asymmetry, readable focal shape at small thumbnail, energetic yet friendly for children and adults. No people, character, mask, thief motif, existing game symbol, city skyline, flashing/strobing lines, text, letters, numerals, logos, or watermark. Exactly square 1:1 composition."
OG_PROMPT = "Use case: ads-marketing. Edit the supplied Pulse Mosaic square cover (edit target) into a wide social card for the same internal all-ages duohertz Future Bass track. Preserve the recognizable cyan-lavender rising frequency-tile mosaic, warm-white torn paper, coral diagonal rhythm slashes, near-black ink and halftone collage style. Recompose naturally to a wide 1200:630 landscape card: mosaic sweeps up through the right two-thirds, leaving the left third a quiet near-black ink panel. On that left panel add exactly two crisp, high-contrast sans-serif text lines with broad safe margins: small lowercase 'duohertz' (spell d-u-o-h-e-r-t-z); below it larger title-case 'Pulse Mosaic' (spell P-u-l-s-e space M-o-s-a-i-c). No other text, letters, numerals, logos, watermark, characters, masks or copied game symbols. Retain all-ages energy, thumbnail readability, no strobing pattern."


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def clock(length: float) -> np.ndarray:
    return np.arange(round(length * RATE), dtype=np.float64) / RATE


def add(stereo: np.ndarray, at: float, sound: np.ndarray, pan: float = 0.0) -> None:
    begin = round(at * RATE)
    if begin < 0 or begin >= SAMPLES:
        return
    end = min(SAMPLES, begin + len(sound))
    sound = sound[:end - begin]
    stereo[0, begin:end] += sound * (1 - max(0, pan))
    stereo[1, begin:end] += sound * (1 + min(0, pan))


def kick(stereo: np.ndarray, at: float, level: float) -> None:
    t = clock(0.34)
    phase = math.tau * (49 * t + 115 * (1 - np.exp(-32 * t)) / 32)
    snap = RNG.uniform(-1, 1, len(t)) * np.exp(-160 * t)
    add(stereo, at, (np.sin(phase) * np.exp(-15 * t) + snap * 0.05) * level)


def clap(stereo: np.ndarray, at: float, level: float) -> None:
    t = clock(0.21)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.75
    envelope = np.exp(-25 * t) * (0.7 + 0.3 * np.sin(math.tau * 32 * t) ** 2)
    add(stereo, at, high * envelope * level, 0.10)


def tick(stereo: np.ndarray, at: float, level: float, pan: float) -> None:
    t = clock(0.075)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.88
    add(stereo, at, high * np.exp(-57 * t) * level, pan)


def bass(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = clock(0.44)
    phase = math.tau * frequency * t
    tone = np.sin(phase) + 0.24 * np.sin(2 * phase) + 0.06 * np.sin(3 * phase)
    envelope = np.clip(t / 0.008, 0, 1) * np.exp(-5.4 * t)
    add(stereo, at, tone * envelope * level, -0.06)


def tile_pluck(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = clock(0.32)
    phase = math.tau * frequency * t
    tone = np.sin(phase + 0.78 * np.sin(2.02 * phase)) + 0.16 * np.sin(3 * phase)
    envelope = np.clip(t / 0.003, 0, 1) * np.exp(-11 * t)
    add(stereo, at, tone * envelope * level, pan)


def ribbon_lead(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = clock(0.68)
    phase = math.tau * frequency * t
    vibrato = 0.0013 * np.sin(math.tau * 5.5 * t)
    tone = np.sin(phase * (1 + vibrato)) + 0.18 * np.sin(2 * phase)
    envelope = np.clip(t / 0.013, 0, 1) * np.clip((0.68 - t) / 0.18, 0, 1)
    add(stereo, at, tone * envelope * level, pan)


def cloud_chord(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    t = clock(1.25)
    envelope = np.clip(t / 0.09, 0, 1) * np.clip((1.25 - t) / 0.24, 0, 1)
    shimmer = 0.88 + 0.12 * np.sin(math.tau * 2.5 * t)
    for index, frequency in enumerate(frequencies):
        phase = math.tau * frequency * t
        tone = np.sin(phase) + 0.15 * np.sin(2 * phase)
        add(stereo, at, tone * envelope * shimmer * level / len(frequencies),
            (index - 1.5) * 0.13)


def movement(*, answer: bool) -> bytes:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    if answer:
        # A new Dm9–Bbmaj7–Fadd9–C movement with a falling, offbeat reply.
        roots = (73.42, 58.27, 43.65, 65.41)
        chords = (
            (146.83, 174.61, 220.00, 261.63),
            (116.54, 146.83, 174.61, 220.00),
            (174.61, 220.00, 261.63, 392.00),
            (130.81, 164.81, 196.00, 261.63),
        )
        melody = (
            (880.00, 783.99, 698.46, 587.33),
            (698.46, 587.33, 523.25, 440.00),
            (880.00, 783.99, 698.46, 523.25),
            (783.99, 659.25, 587.33, 523.25),
        )
    else:
        # Cmaj9–Am7–Fmaj7–G6, ascending tile steps over a half-time pulse.
        roots = (65.41, 55.00, 43.65, 49.00)
        chords = (
            (130.81, 164.81, 196.00, 246.94),
            (110.00, 130.81, 164.81, 196.00),
            (174.61, 220.00, 261.63, 329.63),
            (196.00, 246.94, 293.66, 329.63),
        )
        melody = (
            (523.25, 659.25, 783.99, 987.77),
            (440.00, 523.25, 659.25, 783.99),
            (523.25, 698.46, 880.00, 1046.50),
            (493.88, 587.33, 783.99, 987.77),
        )

    for bar in range(25):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 3
        breath = 11 <= bar < 15
        lift = 15 <= bar < 23
        outro = bar >= 23
        cloud_chord(stereo, start, chords[harmony], 0.11 if breath else 0.16)
        cloud_chord(stereo, start + 2 * BEAT, chords[harmony], 0.045 if breath else 0.075)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if not breath or beat_index in (0, 2):
                kick(stereo, at, 0.25 if breath else (0.39 if lift else 0.32))
            if beat_index == 2 and not breath:
                clap(stereo, at, 0.26 if lift else 0.20)
            if answer:
                if not breath and not outro and beat_index in (0, 2):
                    bass(stereo, at + BEAT / 2, roots[harmony], 0.21 if lift else 0.16)
                if not intro and not breath and not outro and beat_index in (1, 3):
                    ribbon_lead(stereo, at, melody[harmony][beat_index],
                                0.084 if lift else 0.064, 0.18 if beat_index == 1 else -0.18)
            else:
                if beat_index in (0, 2) or (lift and beat_index == 3):
                    bass(stereo, at, roots[harmony], 0.12 if breath else (0.22 if lift else 0.17))
                if not intro and not breath and not outro and beat_index in (0, 2):
                    ribbon_lead(stereo, at + BEAT / 2, melody[harmony][beat_index],
                                0.08 if lift else 0.06, -0.18 if beat_index == 0 else 0.18)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            tick(stereo, at, 0.07 if breath else (0.15 if lift else 0.11),
                 0.23 if eighth % 2 else -0.23)
            if not intro and not breath and not outro:
                steps = (1, 2, 5, 7) if answer else (1, 3, 4, 7)
                if eighth in steps:
                    index = (7 - eighth) % 4 if answer else (eighth + bar) % 4
                    tile_pluck(stereo, at, melody[harmony][index],
                               0.066 if lift else 0.048, -0.25 if eighth % 2 else 0.25)

    fade_start = round(58.8 * RATE)
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
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_pulse_mosaic", path)
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
        for beat_index in range(6, 94, 2):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            if beat_index % 16 == 14:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT / 2, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for beat_index in range(6, 94):
            at = round(beat_index * BEAT, 6)
            if has_onset(at, onsets):
                notes.append({"id": f"s-{beat_index}", "type": "tap", "t": at,
                              "key": beat_index % 2})
    else:
        for eighth in range(12, 188):
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
  <rect y="768" width="1024" height="256" fill="#111421" opacity="0.76" />
  <text x="62" y="850" fill="#67eee0" font-family="sans-serif" font-size="36" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="62" y="920" fill="white" font-family="sans-serif" font-size="64" font-weight="700">Pulse Mosaic</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("cover-art.png", "og.png"):
        if not (OUT / name).is_file():
            raise FileNotFoundError(f"Generate and inspect {OUT / name} first")
    with tempfile.TemporaryDirectory(prefix="duohertz-pulse-mosaic-") as temp:
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
        "title": "Pulse Mosaic",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Future Bass",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Original deterministic Cmaj9–Am7–Fmaj7–G6 half-time game movement with an independent Dm9–Bbmaj7–Fadd9–C offbeat answer for the 120-second stream; generated oscillators and seeded noise, no sampled source or repeated game movement",
        "source_script": "scripts/duohertz-compose-pulse-mosaic.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": COVER_PROMPT,
            "og_prompt": OG_PROMPT,
            "cover_reference": "New cover-art.png supplied to built-in imagegen as the OG edit target",
            "cover_resize": "Built-in imagegen supplied a 1254px square PNG; sips resized it to 1024px square",
            "og_resize": "Built-in imagegen supplied a 1733x907 wide card; sips resized it to 1200x630",
            "cover_svg": "Local SVG title overlay around generated cover-art.png; bitmap source is unchanged",
        },
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
