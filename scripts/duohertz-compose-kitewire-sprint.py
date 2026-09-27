#!/usr/bin/env python3
"""Render the independent Drum & Bass candidate Kitewire Sprint outside the catalog.

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
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-004-kitewire-sprint"
TRACK_ID = "dh-004-kitewire-sprint"
RATE = 32_000
BPM = 160
BEAT = 60 / BPM
SECONDS = 60
STREAM_SECONDS = 120
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(2026092404)


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
    t = times(0.34)
    phase = math.tau * (frequency * t + 0.45 * (1 - np.exp(-14 * t)))
    envelope = np.clip(t / 0.004, 0, 1) * np.exp(-5.6 * t)
    signal = np.sin(phase) + 0.28 * np.sin(2 * phase)
    add(stereo, at, signal * envelope * level)


def keys(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    t = times(0.72)
    envelope = np.clip(t / 0.012, 0, 1) * np.exp(-3.5 * t)
    for index, frequency in enumerate(frequencies):
        fundamental = np.sin(math.tau * frequency * t)
        shimmer = 0.36 * np.sin(math.tau * frequency * 2.002 * t)
        add(stereo, at, (fundamental + shimmer) * envelope * level / len(frequencies),
            (index - 1) * 0.32)


def ping(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = times(0.24)
    envelope = np.clip(t / 0.002, 0, 1) * np.exp(-14 * t)
    signal = np.sin(math.tau * frequency * t) + 0.42 * np.sin(math.tau * frequency * 3.01 * t)
    add(stereo, at, signal * envelope * level, pan)


def render_wav(path: Path) -> None:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    # Forty 160-BPM bars. The kick/snare break and syncopated subline are
    # deliberately different from the other four-on-the-floor candidates.
    roots = (49.00, 41.20, 32.70, 36.71)  # G1–E1–C1–D1
    chords = ((196.00, 246.94, 293.66), (164.81, 196.00, 246.94),
              (130.81, 164.81, 196.00), (146.83, 185.00, 220.00))
    melody = ((392.00, 493.88, 587.33, 659.25), (329.63, 392.00, 493.88, 587.33),
              (261.63, 329.63, 392.00, 493.88), (293.66, 369.99, 440.00, 587.33))
    for bar in range(40):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 4
        rest = 20 <= bar < 24
        lift = 24 <= bar < 36
        outro = bar >= 36
        keys(stereo, start, chords[harmony], 0.045 if rest else 0.066)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if beat_index in (0, 2):
                kick(stereo, at, 0.25 if rest else (0.38 if lift else 0.32))
            if beat_index in (1, 3):
                snare(stereo, at, 0.13 if rest else (0.24 if lift else 0.20))
            if beat_index in (0, 2) or (lift and beat_index == 3):
                bass(stereo, at, roots[harmony], 0.11 if rest else 0.19)
            if not intro and not rest and not outro and beat_index in (0, 2, 3):
                ping(stereo, at, melody[harmony][beat_index], 0.057 if lift else 0.042,
                     -0.2 if beat_index % 2 else 0.2)
        # Eighth hats anchor every Hard note; brighter ghost hits create the break.
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(stereo, at, 0.10 if rest else (0.16 if lift else 0.135),
                -0.28 if eighth % 2 else 0.28)
            if eighth in (3, 7) and not rest:
                snare(stereo, at, 0.055 if intro else 0.079)
            if eighth == 5 and not intro and not rest:
                bass(stereo, at, roots[harmony], 0.11)
            if eighth % 2 and not intro and not rest and not outro:
                ping(stereo, at, melody[harmony][eighth // 2] * 2, 0.029 if lift else 0.022,
                     0.2 if eighth % 4 else -0.2)

    fade = round(0.65 * RATE)
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
    """Follow the game section with a new syncopated Drum & Bass answer."""
    with wave.open(str(game_source), "rb") as source:
        if source.getnchannels() != 2 or source.getsampwidth() != 2 or source.getframerate() != RATE:
            raise ValueError("Unexpected game source format")
        first = source.readframes(SAMPLES)
    if len(first) != SAMPLES * 2 * 2:
        raise ValueError("Incomplete game source")

    second = np.zeros((2, SAMPLES), dtype=np.float32)
    # E minor–C–G–D answers the original G–E minor–C–D. A displaced second
    # kick, descending key hook and offbeat subline reshape the break.
    roots = (41.20, 32.70, 49.00, 36.71)
    chords = ((164.81, 196.00, 246.94), (130.81, 164.81, 196.00),
              (196.00, 246.94, 293.66), (146.83, 185.00, 220.00))
    melody = ((659.25, 587.33, 493.88, 392.00), (587.33, 493.88, 392.00, 329.63),
              (739.99, 659.25, 587.33, 493.88), (587.33, 440.00, 369.99, 293.66))
    for bar in range(40):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        pickup = bar < 4
        breath = 16 <= bar < 20
        lift = 20 <= bar < 36
        outro = bar >= 36
        keys(second, start, chords[harmony], 0.043 if breath else 0.069)
        if lift:
            keys(second, start + 2 * BEAT, chords[harmony], 0.038)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            if beat_index == 0 or (lift and beat_index == 2):
                kick(second, at, 0.22 if breath else (0.38 if lift else 0.32))
            if beat_index in (1, 3):
                snare(second, at, 0.12 if breath else (0.25 if lift else 0.20))
            if not pickup and not breath and not outro and beat_index in (1, 3):
                ping(second, at, melody[harmony][beat_index],
                     0.062 if lift else 0.046, 0.2 if beat_index == 1 else -0.2)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(second, at, 0.09 if breath else (0.17 if lift else 0.13),
                0.28 if eighth % 2 else -0.28)
            if eighth in (1, 4, 7) and not breath and not outro:
                bass(second, at, roots[harmony], 0.18 if lift else 0.14)
            if eighth == 5 and not pickup and not breath and not outro:
                kick(second, at, 0.27 if lift else 0.22)
            if eighth in (2, 6) and lift:
                ping(second, at, melody[harmony][eighth // 2] * 2, 0.024,
                     -0.18 if eighth == 2 else 0.18)

    fade = round(0.7 * RATE)
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
    """Use the same audio analysis as BS-D002 to chart audible transients."""
    path = ROOT / "scripts/beatscape-audio.py"
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_kitewire", path)
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
        for beat_index in range(8, 156, 2):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            if beat_index % 24 == 22:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT / 2, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for beat_index in range(8, 156):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            notes.append({"id": f"s-{beat_index}", "type": "tap", "t": at,
                          "key": beat_index % 2})
    else:
        for eighth in range(16, 312):
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
    command.extend(["-af", "volume=-2dB", "-c:a", "aac", "-b:a", "160k", str(target)])
    subprocess.run(command, check=True)


def write_cover(path: Path) -> None:
    path.write_text("""<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <image href="cover-art.png" width="1024" height="1024" preserveAspectRatio="xMidYMid slice" />
  <rect y="766" width="1024" height="258" fill="#06325c" opacity="0.75" />
  <text x="80" y="857" fill="#a2fff4" font-family="sans-serif" font-size="35" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="80" y="934" fill="white" font-family="sans-serif" font-size="65" font-weight="700">Kitewire Sprint</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="duohertz-kitewire-sprint-") as temp:
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
        "title": "Kitewire Sprint",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Drum & Bass",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Independent deterministic G–E minor–C–D Drum & Bass game movement and new E minor–C–G–D displaced-break answer movement for a 120-second stream master; generated oscillators and seeded noise only, no sampled source audio or repeated first-minute loop; -2 dB linear gain before AAC encoding",
        "audio_gain_db": -2.0,
        "source_script": "scripts/duohertz-compose-kitewire-sprint.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": "Use case: stylized-concept. Create one original square album-cover illustration for “Kitewire Sprint”, an all-ages Drum & Bass music candidate in the duohertz electronic rhythm game. Visual concept: two bright ribbon-like frequency lines race upward like playful kite strings through a breezy daytime sky, weaving around small translucent sound buoys and turquoise light particles. Dynamic diagonal motion suggests a fast syncopated breakbeat, but the mood stays friendly, optimistic and readable for children. Palette: cobalt blue, bright aqua, soft lime and cloud white, with deep blue negative space in the lower third for a later local title overlay. Polished contemporary editorial album art with a clear small-thumbnail silhouette. Distinct from earlier aurora stepping stones, circular rings and apricot glass horizon. Absolutely no text, letters, logos, characters, vehicles, weapons, copied game imagery, red neon city or flashing stripes. Square image.",
            "og_base_prompt": "Use case: ads-marketing. Edit the supplied Kitewire Sprint square artwork into a companion wide, text-free social card for a family-friendly Drum & Bass track in duohertz. Preserve the cobalt sky, aqua and lime ribbon-like frequency lines, translucent sound buoys, and buoyant fast motion. Recompose for a horizontal 1200x630-style landscape image: motion and luminous ribbon crossing the right two-thirds, deep cobalt-blue calm negative space on the left third for later title typography. Polished contemporary editorial album-art style, legible at thumbnail size. No text, letters, logos, characters, vehicles, weapons, copied game art, flashing stripes or red neon city.",
            "og_prompt": "Use case: ads-marketing. Edit the supplied wide, text-free Kitewire Sprint social card. Preserve the cobalt sky and the right-side aqua/lime racing sound ribbons. In the calm deep-blue left third, place exactly two crisp, highly legible lines of modern sans-serif type with generous margins: line 1 \"duohertz\" all lowercase in pale aqua, smaller; line 2 \"Kitewire Sprint\" in white, larger. Spell both lines exactly. No other text, letters, icons, logos or marks. Keep the wide landscape composition suitable for a 1200x630 social card.",
            "og_resize": "Built-in imagegen supplied a wide card; sips resized it to exactly 1200x630 without changing the composition",
            "cover_svg": "Local SVG title overlay around the generated cover-art.png; bitmap source is unchanged",
        },
        "files_sha256": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {TRACK_ID}: {len(files)} files to {OUT}")


if __name__ == "__main__":
    main()
