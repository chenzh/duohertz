#!/usr/bin/env python3
"""Compose the isolated Jetstream Fracture Drum & Bass review candidate.

Both movements are written here from oscillators and seeded noise. Technical
checks cannot replace listening, visual review, rights review, or signoff.
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
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-014-jetstream-fracture"
TRACK_ID = "dh-014-jetstream-fracture"
RATE = 32_000
BPM = 168
BEAT = 60 / BPM
SECONDS = 60
STREAM_SECONDS = 120
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(2026092414)

COVER_PROMPT = "Create a polished, original square 1:1 album-cover illustration for an INTERNAL, all-ages electronic rhythm game track candidate titled Jetstream Fracture in the duohertz brand. This Drum & Bass cover has one striking subject: a broad paper-like jetstream ribbon splitting into staggered rhythmic air currents, then rejoining into a clean forward spiral. Translate rapid syncopated beats into abstract airflow, frequency contours, small luminous particles and angled cut-paper layers. Editorial comic-collage energy with original near-black ink, warm-white paper, coral red accents and electric cyan light, subtle halftone, and a strong central silhouette readable as a tiny thumbnail. Dynamic but friendly to children and adults. No people, faces, masks, thief motifs, existing game logos, city skyline, text, letters, numerals, watermark, strobe patterns or copied album imagery. Avoid square mosaic tiles; this cover's identity is flowing split jetstream bands. High-resolution square PNG."
OG_PROMPT = "Use the supplied Jetstream Fracture square album cover as the edit target. Recompose it into a polished wide social card for the SAME internal duohertz Drum & Bass track. Preserve the distinct split-and-rejoining warm-white jetstream ribbons, black ink field, coral strokes, cyan glow, scattered particles and paper-collage texture. Wide 1200:630 landscape composition: put the energetic spiral and flowing bands on the right two-thirds and reserve a quiet near-black panel at left with clear safe margins. On the left add exactly two crisp, correctly spelled, high-contrast sans-serif text lines: smaller lowercase 'duohertz' and below it larger title-case 'Jetstream Fracture'. No other words, numerals, letters, logo, character, mask, skyline, watermark or strobe pattern. Maintain all-ages appeal and legibility at thumbnail size."


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
    t = clock(0.29)
    phase = math.tau * (52 * t + 98 * (1 - np.exp(-36 * t)) / 36)
    snap = RNG.uniform(-1, 1, len(t)) * np.exp(-170 * t)
    add(stereo, at, (np.sin(phase) * np.exp(-17 * t) + snap * 0.045) * level)


def snare(stereo: np.ndarray, at: float, level: float, ghost: bool = False) -> None:
    t = clock(0.16 if ghost else 0.24)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.83
    body = np.sin(math.tau * 188 * t) * np.exp(-27 * t)
    decay = 36 if ghost else 23
    add(stereo, at, (0.68 * high + 0.32 * body) * np.exp(-decay * t) * level,
        0.11 if ghost else 0.0)


def hat(stereo: np.ndarray, at: float, level: float, pan: float) -> None:
    t = clock(0.058)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.91
    add(stereo, at, high * np.exp(-76 * t) * level, pan)


def reese(stereo: np.ndarray, at: float, frequency: float, level: float, length: float) -> None:
    t = clock(length)
    phase = math.tau * frequency * t
    tone = np.sin(phase) + 0.24 * np.sin(2.011 * phase) + 0.13 * np.sin(2.022 * phase)
    envelope = np.clip(t / 0.013, 0, 1) * np.clip((length - t) / 0.075, 0, 1)
    add(stereo, at, tone * envelope * level)


def glass(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = clock(0.35)
    phase = math.tau * frequency * t
    tone = np.sin(phase + 0.43 * np.sin(2.35 * phase)) + 0.13 * np.sin(3 * phase)
    envelope = np.clip(t / 0.003, 0, 1) * np.exp(-10 * t)
    add(stereo, at, tone * envelope * level, pan)


def pad(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    t = clock(1.35)
    envelope = np.clip(t / 0.065, 0, 1) * np.clip((1.35 - t) / 0.25, 0, 1)
    for index, frequency in enumerate(frequencies):
        phase = math.tau * frequency * t
        tone = np.sin(phase) + 0.11 * np.sin(2.002 * phase)
        add(stereo, at, tone * envelope * level / len(frequencies), (index - 1.5) * 0.15)


def movement(*, answer: bool) -> bytes:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    if answer:
        # Em7–Cmaj7–Gadd9–D6, descending replies and displaced half-time snare.
        roots = (41.20, 32.70, 49.00, 36.71)
        chords = (
            (164.81, 196.00, 246.94, 293.66),
            (130.81, 164.81, 196.00, 246.94),
            (196.00, 246.94, 293.66, 440.00),
            (146.83, 185.00, 220.00, 293.66),
        )
        melody = (
            (987.77, 880.00, 739.99, 659.25),
            (783.99, 739.99, 659.25, 493.88),
            (880.00, 783.99, 739.99, 587.33),
            (739.99, 659.25, 587.33, 493.88),
        )
    else:
        # Bm9–Gmaj7–Dadd9–A6 with ascending four-note jetstream calls.
        roots = (30.87, 49.00, 36.71, 55.00)
        chords = (
            (123.47, 146.83, 185.00, 220.00),
            (196.00, 246.94, 293.66, 369.99),
            (146.83, 185.00, 220.00, 329.63),
            (220.00, 277.18, 329.63, 369.99),
        )
        melody = (
            (493.88, 587.33, 739.99, 880.00),
            (392.00, 493.88, 587.33, 739.99),
            (440.00, 554.37, 659.25, 880.00),
            (554.37, 659.25, 739.99, 987.77),
        )

    for bar in range(42):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 4
        breakbar = 19 <= bar < 23
        lift = 23 <= bar < 39
        outro = bar >= 39
        pad(stereo, start, chords[harmony], 0.060 if breakbar else 0.10)
        if bar % 2 == 1 and not breakbar:
            pad(stereo, start + 2 * BEAT, chords[harmony], 0.045)

        # A hand-built cut-up rhythm: three displaced kicks, a backbeat and
        # tiny ghost snare pickup. The answer is a distinct half-time phrase.
        kick_steps = (0, 7, 10, 13) if not answer else (0, 5, 11, 14)
        snare_steps = (4, 12) if not answer else (8,)
        for step in range(16):
            at = start + step * BEAT / 4
            if step in kick_steps:
                kick(stereo, at, 0.23 if breakbar else (0.36 if lift else 0.30))
            if step in snare_steps:
                snare(stereo, at, 0.11 if breakbar else (0.25 if lift else 0.20))
            if step in ((3, 11, 15) if not answer else (7, 13)) and not breakbar:
                snare(stereo, at, 0.055 if intro else 0.075, ghost=True)
            if step % 2 == 0:
                hat(stereo, at, 0.09 if breakbar else (0.15 if lift else 0.12),
                    -0.30 if step % 4 == 0 else 0.30)
            elif step in (3, 7, 11, 15) and lift:
                hat(stereo, at, 0.065, 0.25 if step % 8 == 3 else -0.25)

        if not breakbar and not outro:
            bass_steps = (0, 6, 11) if not answer else (2, 8, 13)
            for step in bass_steps:
                reese(stereo, start + step * BEAT / 4, roots[harmony],
                      0.17 if lift else 0.13, 0.45 if step == bass_steps[0] else 0.24)
        if not intro and not breakbar and not outro:
            lead_steps = (2, 5, 9, 14) if not answer else (1, 6, 10, 15)
            for index, step in enumerate(lead_steps):
                note_index = index if not answer else 3 - index
                glass(stereo, start + step * BEAT / 4, melody[harmony][note_index],
                      0.074 if lift else 0.055, -0.24 if index % 2 else 0.24)
        if breakbar and bar % 2 == 0:
            glass(stereo, start, melody[harmony][0], 0.035, -0.22)

    fade = round(0.85 * RATE)
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


def observed_onsets(audio: Path) -> list[float]:
    path = ROOT / "scripts/beatscape-audio.py"
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_jetstream", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load audio onset analyzer")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module.analyze_audio(audio, BPM).onsets_sec


def has_onset(at: float, onsets: list[float]) -> bool:
    index = bisect.bisect_left(onsets, at)
    distances = [abs(onsets[i] - at) for i in (index - 1, index) if 0 <= i < len(onsets)]
    return bool(distances) and min(distances) <= 0.050


def chart(tier: str, onsets: list[float]) -> dict:
    notes: list[dict] = []
    if tier == "easy":
        for beat_index in range(8, 160, 2):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            if beat_index % 32 == 30:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for eighth in range(16, 320):
            if eighth % 2 != 0 and eighth % 8 not in (3, 7):
                continue
            at = round(eighth * BEAT / 2, 6)
            if has_onset(at, onsets):
                notes.append({"id": f"s-{eighth}", "type": "tap", "t": at,
                              "key": (eighth // 2) % 2})
    else:
        for sixteenth in range(32, 640):
            if sixteenth % 4 != 0 and sixteenth % 16 not in (3, 7, 11, 15):
                continue
            at = round(sixteenth * BEAT / 4, 6)
            if not has_onset(at, onsets):
                continue
            if sixteenth % 64 == 0:
                notes.append({"id": f"h-{sixteenth}", "type": "chord", "t": at,
                              "keys": [0, 1]})
            else:
                notes.append({"id": f"h-{sixteenth}", "type": "tap", "t": at,
                              "key": (sixteenth // 2) % 2})
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
  <text x="62" y="920" fill="white" font-family="sans-serif" font-size="58" font-weight="700">Jetstream Fracture</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("cover-art.png", "og.png"):
        if not (OUT / name).is_file():
            raise FileNotFoundError(f"Generate and inspect {OUT / name} first")
    with tempfile.TemporaryDirectory(prefix="duohertz-jetstream-") as temp:
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
        "title": "Jetstream Fracture",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Drum & Bass",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Original deterministic Bm9–Gmaj7–Dadd9–A6 syncopated cut-up game movement with reese bass and ascending glass calls; independent Em7–Cmaj7–Gadd9–D6 half-time answer for 120-second stream; generated oscillators and seeded noise, no sampled source or repeated game movement",
        "source_script": "scripts/duohertz-compose-jetstream-fracture.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": COVER_PROMPT,
            "og_prompt": OG_PROMPT,
            "cover_reference": "New cover-art.png supplied to built-in imagegen as the OG edit target",
            "cover_resize": "Built-in imagegen supplied a 1254px square PNG; sips resized it to 1024px square",
            "og_resize": "Built-in imagegen supplied a 1733x908 wide card; sips resized it to 1200x630",
            "cover_svg": "Local SVG title overlay around generated cover-art.png; bitmap source is unchanged",
        },
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
