#!/usr/bin/env python3
"""Compose an isolated Melodic House candidate and three audio-aligned charts.

Only synthesized oscillators and seeded noise are used. This is a technical
candidate; listening, content, rights, art and release review remain human work.
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
TRACK_ID = "dh-016-kinetic-sundial"
OUT = ROOT / "apps/beatscape/candidates/duohertz" / TRACK_ID
RATE = 32_000
BPM = 122
BEAT = 60 / BPM
SECONDS = 64
SAMPLES = SECONDS * RATE
RNG = np.random.default_rng(2026092416)

COVER_PROMPT = """Use case: stylized-concept. Create an original square, text-free album cover for an INTERNAL all-ages duohertz Melodic House rhythm-game track candidate titled Kinetic Sundial. Depict a kinetic sundial made from a bold off-center ivory semicircle and one long coral frequency-hand casting three stepped cyan sound-wave shadows across a dark ink ground. Suggest one-key beats becoming two-key counter-rhythms, not literal time numerals or a real clock face. Strong original editorial comic collage: cut-paper planes, sparse halftone dots, precise angular shadows, one memorable silhouette at thumbnail scale, warm optimistic energy. Palette near-black #111421, warm ivory, vivid coral #f34d65, electric cyan #67eee0, restrained golden highlights. Square 1:1 composition, keep the lower fifth quiet enough for a separate local title overlay. No words, letters, numbers, logos, watermarks, people, faces, characters, masks, weapons, copied game motifs, flashing stripes, planets, orbital rails, faceted prisms, zigzag staircases or jetstream ribbons. High resolution PNG."""
OG_PROMPT = """Use case: ads-marketing. Edit the supplied square Kinetic Sundial cover into an ORIGINAL wide 1200:630 social sharing card for the internal duohertz Melodic House track. Preserve the recognizable warm ivory cut-paper semicircle, long coral frequency-hand, three cyan wave shadows and sparse halftone on dark ink; recompose them toward the right half instead of stretching or cropping. Reserve a calm near-black left third for typography. Text verbatim, exactly two crisp highly legible sans-serif lines with wide safe margins: smaller lowercase 'duohertz'; below it larger title-case 'Kinetic Sundial'. Spell both exactly. All-ages original editorial comic collage. Palette near-black, warm ivory, coral, electric cyan, restrained gold. No other text, numerals, people, logos, watermarks, copied game motifs, clocks with tick numbers, orbital rails, prisms, zigzag stairs, or flashing stripes."""


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def midi(note: float) -> float:
    return 440 * 2 ** ((note - 69) / 12)


def time_axis(seconds: float) -> np.ndarray:
    return np.arange(round(seconds * RATE), dtype=np.float64) / RATE


def add(stereo: np.ndarray, at: float, signal: np.ndarray, pan: float = 0) -> None:
    start = round(at * RATE)
    if start < 0 or start >= SAMPLES:
        return
    end = min(SAMPLES, start + len(signal))
    signal = signal[:end - start]
    stereo[0, start:end] += signal * (1 - max(0, pan))
    stereo[1, start:end] += signal * (1 + min(0, pan))


def kick(stereo: np.ndarray, at: float, level: float, *, answer: bool) -> None:
    t = time_axis(0.34)
    base = 49 if answer else 53
    phase = math.tau * (base * t + 92 * (1 - np.exp(-34 * t)) / 34)
    click = RNG.uniform(-1, 1, len(t)) * np.exp(-150 * t)
    add(stereo, at, (np.sin(phase) * np.exp(-15 * t) + 0.042 * click) * level)


def snare(stereo: np.ndarray, at: float, level: float, *, answer: bool) -> None:
    t = time_axis(0.21)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * (0.71 if answer else 0.78)
    tone = np.sin(math.tau * (167 if answer else 195) * t)
    add(stereo, at, (high * 0.84 + tone * 0.16) * np.exp(-23 * t) * level)


def hat(stereo: np.ndarray, at: float, level: float, pan: float) -> None:
    t = time_axis(0.065)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.9
    add(stereo, at, high * np.exp(-64 * t) * level, pan)


def bass(stereo: np.ndarray, at: float, note: int, level: float, *, answer: bool) -> None:
    t = time_axis(0.37 if answer else 0.28)
    phase = math.tau * midi(note) * t
    signal = np.sin(phase) + (0.19 if answer else 0.28) * np.sin(2.004 * phase)
    envelope = np.clip(t / 0.008, 0, 1) * np.exp((-7.8 if answer else -10.5) * t)
    add(stereo, at, signal * envelope * level)


def warm_key(stereo: np.ndarray, at: float, note: int, level: float, pan: float) -> None:
    t = time_axis(0.42)
    phase = math.tau * midi(note) * t
    tone = np.sin(phase + 0.22 * np.sin(2.01 * phase)) + 0.20 * np.sin(3.003 * phase)
    envelope = np.clip(t / 0.004, 0, 1) * np.exp(-8.6 * t)
    add(stereo, at, tone * envelope * level, pan)


def glass_answer(stereo: np.ndarray, at: float, note: int, level: float, pan: float) -> None:
    t = time_axis(0.70)
    phase = math.tau * midi(note) * t
    tone = np.sin(phase) + 0.27 * np.sin(2.413 * phase) + 0.10 * np.sin(3.996 * phase)
    envelope = np.clip(t / 0.014, 0, 1) * np.exp(-5.4 * t)
    add(stereo, at, tone * envelope * level, pan)


def pad(stereo: np.ndarray, at: float, notes: tuple[int, ...], level: float) -> None:
    t = time_axis(1.72)
    envelope = np.clip(t / 0.15, 0, 1) * np.clip((1.72 - t) / 0.32, 0, 1)
    for index, note in enumerate(notes):
        phase = math.tau * midi(note) * t
        tone = np.sin(phase) + 0.16 * np.sin(2.002 * phase)
        add(stereo, at, tone * envelope * level / len(notes), (index - 1.5) * 0.14)


def movement(*, answer: bool) -> bytes:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    if answer:
        # A minor–E minor–G major–D7: descending reply over a broken-beat house groove.
        roots = (45, 40, 43, 38)
        chords = ((57, 60, 64, 67), (52, 55, 59, 62),
                  (55, 59, 62, 66), (50, 54, 57, 60))
        motif = ((76, 72, 69, 67), (74, 71, 67, 64),
                 (79, 74, 71, 67), (76, 72, 69, 66))
        melody_steps = (0.75, 1.75, 2.25, 3.25)
    else:
        # Gmaj9–D/F#–Em9–Cmaj9: upward warm-key call on offbeat house accents.
        roots = (43, 42, 40, 36)
        chords = ((55, 59, 62, 66), (54, 57, 62, 64),
                  (52, 55, 59, 62), (48, 52, 55, 59))
        motif = ((69, 71, 74, 76), (66, 69, 71, 74),
                 (67, 71, 74, 79), (64, 67, 71, 76))
        melody_steps = (0.5, 1.5, 2.5, 3.5)

    # Thirty-two four-beat bars at 122 BPM leave a gentle one-second tail.
    for bar in range(32):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 4
        breakbar = (14 <= bar < 18) if answer else (16 <= bar < 20)
        lift = (18 <= bar < 28) if answer else (20 <= bar < 29)
        outro = bar >= 29
        pad(stereo, start, chords[harmony], 0.092 if breakbar else 0.078)
        if bar % 2 and not breakbar:
            pad(stereo, start + 2 * BEAT, chords[harmony], 0.035)

        for beat_index in range(4):
            at = start + beat_index * BEAT
            if not breakbar or beat_index in (0, 2):
                if not answer or bar >= 18 or beat_index in (0, 2):
                    kick(stereo, at, 0.34 if lift else (0.22 if breakbar else 0.29), answer=answer)
            if beat_index in ((2,) if answer and bar < 18 else (1, 3)) and not breakbar:
                snare(stereo, at, 0.22 if lift else 0.17, answer=answer)
            if not intro and not breakbar and not outro:
                bass(stereo, at + (0.75 if answer else 0.5) * BEAT,
                     roots[harmony], 0.14 if lift else 0.11, answer=answer)
            elif beat_index in (0, 2):
                bass(stereo, at + 0.5 * BEAT, roots[harmony], 0.060, answer=answer)
        for eighth in range(8):
            offset = 0.25 if answer else 0
            hat(stereo, start + (eighth + offset) * BEAT / 2,
                0.065 if breakbar else (0.13 if lift else 0.10),
                -0.25 if eighth % 2 else 0.25)
        if not intro and not breakbar and not outro:
            for index, step in enumerate(melody_steps):
                note = motif[harmony][index]
                if answer:
                    glass_answer(stereo, start + step * BEAT, note,
                                 0.060 if lift else 0.044, -0.20 if index % 2 else 0.20)
                else:
                    warm_key(stereo, start + step * BEAT, note,
                             0.089 if lift else 0.070, -0.24 if index % 2 else 0.24)
        if breakbar and bar % 2 == 0:
            glass_answer(stereo, start + 0.5 * BEAT, motif[harmony][0] - 12, 0.035, 0.14)

    fade = round(0.96 * RATE)
    stereo[:, -fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    peak = float(np.max(np.abs(stereo)))
    if peak <= 0 or not math.isfinite(peak):
        raise ValueError("Rendered movement is silent or invalid")
    return (np.clip(stereo.T * (0.77 / peak), -1, 1) * 32767).astype("<i2").tobytes()


def write_wav(path: Path, pcm: bytes) -> None:
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm)


def onsets(audio: Path) -> list[float]:
    path = ROOT / "scripts/beatscape-audio.py"
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_kinetic_sundial", path)
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
    # The published AAC is reanalyzed by BS-D002; leave headroom for codec
    # onset drift instead of accepting barely matching WAV transients.
    return bool(distances) and min(distances) <= 0.040


def chart(tier: str, observed: list[float]) -> dict:
    notes: list[dict] = []
    if tier == "easy":
        for beat_index in range(8, 128, 2):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, observed):
                continue
            if beat_index % 28 == 26:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for beat_index in range(8, 128):
            at = round(beat_index * BEAT, 6)
            if has_onset(at, observed):
                notes.append({"id": f"s-{beat_index}", "type": "tap", "t": at,
                              "key": (beat_index // 2) % 2})
    else:
        for eighth in range(16, 256):
            if eighth % 2 and eighth % 8 not in (1, 3, 7):
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
  <rect y="774" width="1024" height="250" fill="#111421" opacity="0.83" />
  <text x="72" y="858" fill="#67eee0" font-family="sans-serif" font-size="35" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="72" y="935" fill="#fff9ef" font-family="sans-serif" font-size="63" font-weight="700">Kinetic Sundial</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("cover-art.png", "og.png"):
        if not (OUT / name).is_file():
            raise FileNotFoundError(f"Generated art is required before manifest: {OUT / name}")
    with tempfile.TemporaryDirectory(prefix="duohertz-kinetic-sundial-") as temp:
        tempdir = Path(temp)
        game = movement(answer=False)
        reply = movement(answer=True)
        source = tempdir / "game.wav"
        stream = tempdir / "stream.wav"
        write_wav(source, game)
        write_wav(stream, game + reply)
        encode(source, OUT / "audio.m4a")
        encode(stream, OUT / "stream.m4a")
        encode(source, OUT / "preview_48s.m4a", seconds=48)
        detected = onsets(OUT / "audio.m4a")
    for tier in ("easy", "standard", "hard"):
        (OUT / f"{tier}.json").write_text(json.dumps(chart(tier, detected), indent=2) + "\n", encoding="utf-8")
    write_cover(OUT / "cover.svg")
    files = {path.name: sha(path) for path in sorted(OUT.iterdir()) if path.is_file() and path.name != "manifest.json"}
    manifest = {
        "track_id": TRACK_ID,
        "title": "Kinetic Sundial",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Melodic House",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": SECONDS * 2,
        "creation_method": "Independent 122 BPM G-major warm-key offbeat house game movement and A-minor descending glass reply with retuned kick, half-time opening and displaced hats; deterministic oscillator and seeded-noise synthesis only, no samples or duplicated first-minute loop",
        "source_script": "scripts/duohertz-compose-kinetic-sundial.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": COVER_PROMPT,
            "og_prompt": OG_PROMPT,
            "og_reference": "cover-art.png supplied to built-in imagegen as the reference image",
            "og_resize": "Built-in imagegen wide card resized with sips to exactly 1200x630",
            "cover_svg": "Local SVG title overlay around the generated cover-art.png; bitmap source is unchanged",
        },
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
