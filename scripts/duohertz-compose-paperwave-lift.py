#!/usr/bin/env python3
"""Render an independent Future Bass candidate for internal duohertz review.

All audio is composed here from oscillators and seeded noise, without samples.
Its charts follow onsets detected in the actual rendered song.
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
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-008-paperwave-lift"
TRACK_ID = "dh-008-paperwave-lift"
RATE = 32_000
BPM = 132
BEAT = 60 / BPM
SECONDS = 60
STREAM_SECONDS = 120
STREAM_LIMITER = 0.6
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(2026092408)

COVER_PROMPT = """Use case: stylized-concept
Asset type: original square, text-free album-cover background for an internal duohertz electronic rhythm-game candidate
Primary request: Create distinctive cover art for “Paperwave Lift”, a buoyant all-ages Future Bass track. Show a diagonal ascent of translucent folded-paper sound fins, each fin lifting a tiny glowing note particle and releasing a soft angular wave into open air. The paper forms should feel musical and weightless, like a new rhythm unfolding upward; no literal book, person, or vehicle.
Style/medium: polished contemporary editorial electronic album illustration with softly textured paper edges, crisp layered geometry, rich but welcoming detail readable at thumbnail size.
Composition/framing: square; the diagonal movement rises from lower-left toward upper-right; reserve a calm dark blue-violet lower band for a separate local title overlay.
Color palette: coral, warm white, periwinkle, pale teal and soft gold over a deep blue-violet backdrop.
Constraints: no text, letters, numbers, logos, characters, cars, weapons, red neon city, strobing stripes, copied game imagery, circular interlocking rings, glass sunset horizon, aurora stepping stones, racing sky ribbons, rising helix, light-column grove, or copper lantern network."""
OG_PROMPT = """Use case: ads-marketing
Asset type: wide companion sharing card for the supplied Paperwave Lift square cover, final target 1200x630
Primary request: Recompose the translucent folded-paper sound fins, little glowing note particles, soft angular waves and blue-violet sky from the reference image into a new wide 1.9:1 landscape composition. Put the ascending paperwave forms mostly in the right two-thirds, rising toward upper-right. Keep the left third quiet deep blue-violet for two lines of copy. This must be a companion composition, not a stretched or simply cropped square.
Text (verbatim): exactly two crisp, legible lines in the left third with generous margins, clean modern sans-serif: line 1 “duohertz” all lowercase, smaller, pale teal; line 2 “Paperwave Lift” title case, larger, white. Spell both exactly. No other text or logos.
Style/mood: welcoming, buoyant, polished editorial electronic album art, readable as a small social preview.
Constraints: preserve the cover's coral, periwinkle, pale teal and warm-white paper palette; no people, characters, cars, weapons, red neon city, strobing stripes, copied game art or new unrelated objects."""


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def times(length: float) -> np.ndarray:
    return np.arange(round(length * RATE), dtype=np.float64) / RATE


def add(stereo: np.ndarray, at: float, signal: np.ndarray, pan: float = 0.0) -> None:
    origin = round(at * RATE)
    if origin < 0 or origin >= SAMPLES:
        return
    end = min(SAMPLES, origin + len(signal))
    mono = signal[:end - origin]
    stereo[0, origin:end] += mono * (1 - max(0.0, pan))
    stereo[1, origin:end] += mono * (1 + min(0.0, pan))


def saw(t: np.ndarray, frequency: float, harmonics: int = 6) -> np.ndarray:
    signal = np.zeros_like(t)
    for partial in range(1, harmonics + 1):
        signal += np.sin(math.tau * partial * frequency * t) / partial ** 1.45
    return signal / 1.65


def kick(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.29)
    phase = math.tau * (50 * t + 132 * (1 - np.exp(-36 * t)) / 36)
    click = RNG.uniform(-1, 1, len(t)) * np.exp(-170 * t) * 0.08
    add(stereo, at, ((np.sin(phase) * np.exp(-17 * t) + click) * level).astype(np.float32))


def snap(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.16)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.78
    flam = 1 + 0.42 * np.exp(-400 * np.abs(t - 0.024))
    add(stereo, at, (high * flam * np.exp(-26 * t) * level).astype(np.float32), 0.08)


def shaker(stereo: np.ndarray, at: float, level: float, pan: float) -> None:
    t = times(0.075)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.87
    add(stereo, at, (high * np.exp(-59 * t) * level).astype(np.float32), pan)


def elastic_sub(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = times(0.46)
    phase = math.tau * frequency * t + 0.12 * np.sin(math.tau * 7 * t)
    envelope = np.clip(t / 0.006, 0, 1) * np.exp(-3.8 * t)
    wave = np.sin(phase) + 0.23 * np.sin(2 * phase)
    add(stereo, at, (wave * envelope * level).astype(np.float32))


def chord_bloom(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    t = times(0.42)
    envelope = np.clip(t / 0.013, 0, 1) * np.exp(-6.2 * t)
    for index, frequency in enumerate(frequencies):
        wave = saw(t, frequency * 0.997) + saw(t, frequency * 1.003)
        add(stereo, at, (wave * envelope * level / len(frequencies)).astype(np.float32),
            (index - 1) * 0.31)


def paper_pluck(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = times(0.32)
    phase = math.tau * frequency * t
    wave = np.sin(phase + 0.32 * np.sin(3.02 * phase)) + 0.16 * np.sin(2 * phase)
    envelope = np.clip(t / 0.003, 0, 1) * np.exp(-10 * t)
    add(stereo, at, (wave * envelope * level).astype(np.float32), pan)


def air_pad(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    length = 1.9
    t = times(length)
    envelope = np.clip(t / 0.20, 0, 1) * np.clip((length - t) / 0.32, 0, 1)
    for index, frequency in enumerate(frequencies):
        wave = np.sin(math.tau * frequency * t) + 0.21 * np.sin(math.tau * frequency * 2.004 * t)
        add(stereo, at, (wave * envelope * level / len(frequencies)).astype(np.float32),
            (index - 1) * 0.30)


def render_wav(path: Path) -> None:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    # E–B–C#m–A; a half-time snap and offbeat chord lift define the new hook.
    roots = (82.407, 61.735, 69.296, 55.000)
    chords = ((329.63, 415.30, 493.88), (246.94, 311.13, 369.99),
              (277.18, 329.63, 415.30), (220.00, 277.18, 329.63))
    motifs = ((659.25, 830.61, 987.77, 830.61), (493.88, 622.25, 739.99, 622.25),
              (554.37, 659.25, 830.61, 659.25), (440.00, 554.37, 659.25, 554.37))
    for bar in range(32):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 4
        break_section = 12 <= bar < 16
        drop = 16 <= bar < 28
        outro = bar >= 28
        air_pad(stereo, start, chords[harmony], 0.026 if break_section else 0.042)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if beat_index in (0, 2) or (drop and beat_index == 3):
                kick(stereo, at, 0.23 if break_section else (0.37 if drop else 0.29))
            if beat_index == 2 and not break_section:
                snap(stereo, at, 0.24 if drop else 0.19)
            if beat_index in (0, 2):
                elastic_sub(stereo, at, roots[harmony], 0.10 if break_section else 0.19)
            if not intro and not break_section and not outro and beat_index in (0, 3):
                chord_bloom(stereo, at, chords[harmony], 0.10 if drop else 0.072)
            if beat_index in (0, 2) and not break_section and not outro:
                paper_pluck(stereo, at, motifs[harmony][beat_index],
                            0.065 if drop else 0.045, -0.17 if beat_index == 0 else 0.17)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            shaker(stereo, at, 0.11 if break_section else (0.18 if drop else 0.14),
                   -0.22 if eighth % 2 else 0.22)
            if eighth % 2 and not intro and not break_section and not outro:
                paper_pluck(stereo, at, motifs[harmony][(eighth // 2 + bar) % 4] * 2,
                            0.048 if drop else 0.034, 0.22 if eighth % 4 == 1 else -0.22)
            if drop and eighth in (3, 7):
                chord_bloom(stereo, at, chords[harmony], 0.045)

    fade_start = round(58.4 * RATE)
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
    """Extend the original lift with a distinct 32-bar Future Bass answer."""
    with wave.open(str(game_source), "rb") as source:
        if source.getnchannels() != 2 or source.getsampwidth() != 2 or source.getframerate() != RATE:
            raise ValueError("Unexpected game source format")
        first = source.readframes(SAMPLES)
    if len(first) != SAMPLES * 2 * 2:
        raise ValueError("Incomplete game source")

    second = np.zeros((2, SAMPLES), dtype=np.float32)
    # G# minor–E–B–F# takes the second movement away from E–B–C# minor–A.
    # Bloom chords now rise on offbeats; the folded-paper pluck falls in reply.
    roots = (51.913, 82.407, 61.735, 46.249)
    chords = ((207.65, 246.94, 311.13), (329.63, 415.30, 493.88),
              (246.94, 311.13, 369.99), (185.00, 233.08, 277.18))
    motifs = ((830.61, 739.99, 622.25, 493.88), (987.77, 830.61, 659.25, 554.37),
              (739.99, 622.25, 493.88, 369.99), (739.99, 659.25, 554.37, 466.16))
    for bar in range(32):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        reentry = bar < 4
        breath = 12 <= bar < 16
        drop = 16 <= bar < 28
        outro = bar >= 28
        air_pad(second, start, chords[harmony], 0.028 if breath else 0.044)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if beat_index in (0, 3) or (drop and beat_index == 2):
                kick(second, at, 0.22 if breath else (0.38 if drop else 0.30))
            if beat_index == 2 and not breath:
                snap(second, at, 0.25 if drop else 0.19)
            if beat_index in (0, 2):
                elastic_sub(second, at + BEAT / 2, roots[harmony],
                            0.11 if breath else (0.20 if drop else 0.16))
            if not reentry and not breath and not outro and beat_index in (1, 3):
                paper_pluck(second, at, motifs[harmony][beat_index],
                            0.070 if drop else 0.050, 0.19 if beat_index == 1 else -0.19)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            shaker(second, at, 0.10 if breath else (0.18 if drop else 0.14),
                   0.22 if eighth % 2 else -0.22)
            if eighth in (1, 5) and not breath and not outro:
                chord_bloom(second, at, chords[harmony],
                            0.052 if reentry else (0.11 if drop else 0.078))
            if eighth in (3, 7) and drop:
                paper_pluck(second, at, motifs[harmony][eighth // 2] * 2,
                            0.041, -0.22 if eighth == 3 else 0.22)

    fade_start = round(58.4 * RATE)
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
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_paperwave_lift", path)
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
                notes.append({"id": f"h-{eighth}", "type": "tap", "t": at, "key": eighth % 2})
    return {
        "format": 2, "theme": "duohertz", "track_id": TRACK_ID, "tier": tier,
        "input_count": 1 if tier == "easy" else 2, "bpm": BPM, "audio_offset_ms": 0,
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
  <rect y="764" width="1024" height="260" fill="#101d43" opacity="0.74" />
  <text x="72" y="854" fill="#b8f5ef" font-family="sans-serif" font-size="36" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="72" y="930" fill="white" font-family="sans-serif" font-size="72" font-weight="700">Paperwave Lift</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for art in ("cover-art.png", "og.png"):
        if not (OUT / art).is_file():
            raise FileNotFoundError(f"Generate and inspect {OUT / art} first")
    with tempfile.TemporaryDirectory(prefix="duohertz-paperwave-lift-") as temp:
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
        "title": "Paperwave Lift",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Future Bass",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Independent deterministic E–B–C# minor–A Future Bass game movement and new G# minor–E–B–F# answer movement for a 120-second stream master; generated oscillators and seeded noise only, no sampled source audio or repeated first-minute loop; stream-only 0.6 amplitude limiter without makeup gain before AAC",
        "stream_limiter": STREAM_LIMITER,
        "source_script": "scripts/duohertz-compose-paperwave-lift.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": COVER_PROMPT,
            "og_prompt": OG_PROMPT,
            "og_reference": "cover-art.png supplied to built-in imagegen as the reference image",
            "og_resize": "Built-in imagegen supplied a 1730x909 wide card; sips resized it to exactly 1200x630 without changing the composition",
            "cover_svg": "Local SVG title overlay around generated cover-art.png; bitmap source is unchanged",
        },
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
