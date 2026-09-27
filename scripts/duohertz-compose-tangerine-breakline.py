#!/usr/bin/env python3
"""Render the independent Drum & Bass candidate Tangerine Breakline outside the catalog.

Requires numpy and ffmpeg. Uses in-house oscillators and seeded noise without
sampled audio. Automated gates do not replace human listening or rights review.
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
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-009-tangerine-breakline"
TRACK_ID = "dh-009-tangerine-breakline"
RATE = 32_000
BPM = 164
BEAT = 60 / BPM
SECONDS = 60
STREAM_SECONDS = 120
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(2026092409)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def times(seconds: float) -> np.ndarray:
    return np.arange(round(seconds * RATE), dtype=np.float64) / RATE


def add(stereo: np.ndarray, at: float, signal: np.ndarray, pan: float = 0) -> None:
    origin = round(at * RATE)
    if origin >= SAMPLES:
        return
    end = min(SAMPLES, origin + len(signal))
    signal = signal[:end - origin]
    stereo[0, origin:end] += signal * (1 - max(0, pan))
    stereo[1, origin:end] += signal * (1 + min(0, pan))


def kick(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.26)
    phase = math.tau * (54 * t + 115 * (1 - np.exp(-30 * t)) / 30)
    click = RNG.uniform(-1, 1, len(t)) * np.exp(-180 * t) * 0.06
    add(stereo, at, (np.sin(phase) * np.exp(-18 * t) + click) * level)


def snare(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.19)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.68
    body = np.sin(math.tau * 205 * t) * np.exp(-24 * t)
    add(stereo, at, (0.72 * high + 0.28 * body) * np.exp(-23 * t) * level)


def hat(stereo: np.ndarray, at: float, level: float, pan: float) -> None:
    t = times(0.065)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.9
    add(stereo, at, high * np.exp(-70 * t) * level, pan)


def bass(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = times(0.30)
    phase = math.tau * (frequency * t + 0.33 * (1 - np.exp(-19 * t)))
    envelope = np.clip(t / 0.003, 0, 1) * np.exp(-7.3 * t)
    signal = np.sin(phase) + 0.38 * np.sin(2 * phase)
    add(stereo, at, signal * envelope * level)


def keys(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    t = times(0.58)
    envelope = np.clip(t / 0.009, 0, 1) * np.exp(-4.8 * t)
    for index, frequency in enumerate(frequencies):
        fundamental = np.sin(math.tau * frequency * t)
        shimmer = 0.24 * np.sin(math.tau * frequency * 2.004 * t)
        add(stereo, at, (fundamental + shimmer) * envelope * level / len(frequencies),
            (index - 1) * 0.32)


def ping(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = times(0.32)
    envelope = np.clip(t / 0.002, 0, 1) * np.exp(-12 * t)
    signal = np.sin(math.tau * frequency * t) + 0.54 * np.sin(math.tau * frequency * 2.8 * t)
    add(stereo, at, signal * envelope * level, pan)


def render_wav(path: Path) -> None:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    # Forty-one 164-BPM bars. Offbeat bass and shuffled mallet responses
    # distinguish this break from Kitewire's straight eighth-hat sprint.
    roots = (34.65, 55.00, 41.20, 61.74)  # C#1–A1–E1–B1
    chords = ((138.59, 164.81, 207.65), (220.00, 261.63, 329.63),
              (164.81, 207.65, 246.94), (246.94, 311.13, 369.99))
    melody = ((554.37, 659.25, 830.61, 659.25), (440.00, 523.25, 659.25, 523.25),
              (659.25, 830.61, 987.77, 830.61), (493.88, 622.25, 739.99, 622.25))
    for bar in range(41):
        start = bar * 4 * BEAT
        harmony = (bar // 4) % 4
        intro = bar < 4
        rest = 20 <= bar < 25
        lift = 25 <= bar < 37
        outro = bar >= 37
        keys(stereo, start, chords[harmony], 0.052 if rest else 0.077)
        if not rest and bar % 2 == 1:
            keys(stereo, start + 2.5 * BEAT, chords[harmony], 0.043)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if beat_index in (0, 2) or (lift and beat_index == 3):
                kick(stereo, at, 0.24 if rest else (0.36 if lift else 0.31))
            if beat_index in (1, 3):
                snare(stereo, at, 0.13 if rest else (0.23 if lift else 0.19))
            if beat_index in (0, 2):
                bass(stereo, at, roots[harmony], 0.10 if rest else 0.17)
            if not intro and not rest and not outro and beat_index in (0, 1, 3):
                ping(stereo, at, melody[harmony][beat_index], 0.054 if lift else 0.041,
                     0.24 if beat_index % 2 else -0.24)
        # Shuffled eighths and late bass accents supply the breakline.
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(stereo, at, (0.13 if eighth % 2 else 0.10) if rest else
                (0.19 if eighth % 2 else 0.13), -0.32 if eighth % 2 else 0.32)
            if eighth in (3, 6) and not rest:
                snare(stereo, at, 0.048 if intro else 0.072)
            if eighth in (3, 7) and not intro and not rest:
                bass(stereo, at, roots[harmony], 0.075 if eighth == 3 else 0.11)
            if eighth in (1, 4, 7) and not intro and not rest and not outro:
                ping(stereo, at, melody[harmony][eighth // 2],
                     0.035 if lift else 0.026, -0.31 if eighth == 7 else 0.31)

    fade = round(0.65 * RATE)
    stereo[:, -fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    peak = float(np.max(np.abs(stereo)))
    if peak <= 0 or not math.isfinite(peak):
        raise ValueError("Rendered audio is silent or invalid")
    pcm = (np.clip(stereo.T * (0.76 / peak), -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm.tobytes())


def render_stream_wav(game_source: Path, path: Path) -> None:
    """Add a new half-time answer break to the original Drum & Bass game cut."""
    with wave.open(str(game_source), "rb") as source:
        if source.getnchannels() != 2 or source.getsampwidth() != 2 or source.getframerate() != RATE:
            raise ValueError("Unexpected game source format")
        first = source.readframes(SAMPLES)
    if len(first) != SAMPLES * 2 * 2:
        raise ValueError("Incomplete game source")

    second = np.zeros((2, SAMPLES), dtype=np.float32)
    # F# minor–D–A–E answers C# minor–A–E–B. Snare on beat three and
    # displaced bass accents recast the original shuffled breakline.
    roots = (46.25, 36.71, 55.00, 41.20)
    chords = ((185.00, 220.00, 277.18), (146.83, 185.00, 220.00),
              (220.00, 277.18, 329.63), (164.81, 207.65, 246.94))
    melody = ((830.61, 739.99, 659.25, 554.37), (739.99, 659.25, 587.33, 440.00),
              (880.00, 830.61, 659.25, 554.37), (830.61, 659.25, 554.37, 415.30))
    for bar in range(41):
        start = bar * 4 * BEAT
        harmony = (bar // 4) % 4
        reentry = bar < 4
        breath = 16 <= bar < 21
        lift = 21 <= bar < 37
        outro = bar >= 37
        keys(second, start, chords[harmony], 0.050 if breath else 0.078)
        if lift and bar % 2 == 0:
            keys(second, start + 2.5 * BEAT, chords[harmony], 0.041)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if beat_index in (0, 3) or (lift and beat_index == 2):
                kick(second, at, 0.23 if breath else (0.37 if lift else 0.31))
            if beat_index == 2:
                snare(second, at, 0.14 if breath else (0.25 if lift else 0.21))
            if not reentry and not breath and not outro and beat_index in (1, 3):
                ping(second, at, melody[harmony][beat_index],
                     0.056 if lift else 0.043, -0.25 if beat_index == 1 else 0.25)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(second, at, 0.095 if breath else (0.17 if lift else 0.13),
                0.31 if eighth % 2 else -0.31)
            if eighth in (1, 4, 7) and not breath and not outro:
                bass(second, at, roots[harmony], 0.17 if lift else 0.13)
            if eighth in (3, 7) and not breath:
                snare(second, at, 0.062 if lift else 0.048)
            if eighth in (0, 5) and lift:
                ping(second, at, melody[harmony][eighth // 2] * 2,
                     0.029, 0.27 if eighth == 0 else -0.27)

    fade = round(0.8 * RATE)
    second[:, -fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    peak = float(np.max(np.abs(second)))
    if peak <= 0 or not math.isfinite(peak):
        raise ValueError("Second movement is silent or invalid")
    pcm = (np.clip(second.T * (0.76 / peak), -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(first)
        output.writeframes(pcm.tobytes())


def observed_onsets(audio: Path) -> list[float]:
    """Use the same audio analysis as BS-D002 to chart audible transients."""
    path = ROOT / "scripts/beatscape-audio.py"
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_tangerine", path)
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
        for beat_index in range(8, 160, 2):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            if beat_index % 24 == 22:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT / 2, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for beat_index in range(8, 160):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            notes.append({"id": f"s-{beat_index}", "type": "tap", "t": at,
                          "key": beat_index % 2})
    else:
        for eighth in range(16, 320):
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
  <rect y="766" width="1024" height="258" fill="#063c43" opacity="0.78" />
  <text x="80" y="857" fill="#a2fff4" font-family="sans-serif" font-size="35" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="80" y="934" fill="white" font-family="sans-serif" font-size="59" font-weight="700">Tangerine Breakline</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="duohertz-tangerine-breakline-") as temp:
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
        "title": "Tangerine Breakline",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Drum & Bass",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Independent deterministic C# minor–A–E–B Drum & Bass game movement and new F# minor–D–A–E half-time answer movement for a 120-second stream master; generated oscillators and seeded noise only, no sampled source audio or repeated first-minute loop",
        "source_script": "scripts/duohertz-compose-tangerine-breakline.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": "Use case: stylized-concept\nAsset type: original square, text-free album-cover background for an internal duohertz electronic rhythm-game candidate\nPrimary request: Create distinctive cover art for “Tangerine Breakline”, a joyful all-ages Drum & Bass track. Show a sequence of floating tangerine-orange percussive tiles making a syncopated zigzag path through a deep teal sound field. Small cyan wave dots and short soft gold pulses leap between the offset tiles, suggesting a playful fast breakbeat. This is abstract music geometry, not literal fruit or a vehicle.\nStyle/medium: polished contemporary editorial electronic album illustration with tactile luminous tiles, subtle depth and crisp readable forms at small thumbnail size.\nComposition/framing: square; the zigzag begins lower left and climbs toward upper right, with a calm dark teal lower band reserved for a separate local title overlay.\nColor palette: tangerine, soft coral, cyan, pale cream and deep teal.\nConstraints: no text, letters, numbers, logos, people, characters, cars, weapons, food, red neon city, flashing or strobing stripes, copied game imagery, sky racing ribbons, helixes, paper fins, copper lanterns, aurora stones, interlocking circular rings or sunset glass horizon.",
            "og_prompt": "Use case: ads-marketing\nAsset type: wide companion sharing card for the supplied Tangerine Breakline square cover, final target 1200x630\nPrimary request: Recompose the glowing tangerine percussive tiles, cyan dotted sound waves, cream pulses and deep teal field from the reference into a new wide 1.9:1 landscape composition. Place the syncopated zigzag of offset tiles mostly in the right two-thirds, moving upward. Keep the left third calm dark teal for typography. This should be a companion composition, not a stretched or simply cropped square.\nText (verbatim): exactly two crisp, legible lines in the left third with generous margins, clean modern sans-serif: line 1 “duohertz” all lowercase, smaller, pale cyan; line 2 “Tangerine Breakline” title case, larger, warm white. Spell both exactly. No other text or logos.\nStyle/mood: friendly all-ages, upbeat fast electronic music, polished editorial album art, readable as a small social preview.\nConstraints: preserve the cover’s tangerine, cyan and deep teal palette; no fruit, people, vehicles, weapons, red neon city, flashing stripes, copied game art or new unrelated objects.",
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
