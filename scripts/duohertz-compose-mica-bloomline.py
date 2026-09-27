#!/usr/bin/env python3
"""Render the independent Melodic House candidate Mica Bloomline outside the catalog.

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
OUT = ROOT / "apps/beatscape/candidates/duohertz/dh-011-mica-bloomline"
TRACK_ID = "dh-011-mica-bloomline"
RATE = 32_000
BPM = 126
BEAT = 60 / BPM
SECONDS = 64
STREAM_SECONDS = 128
SAMPLES = RATE * SECONDS
RNG = np.random.default_rng(2026092411)


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


def kick(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.29)
    phase = math.tau * (51 * t + 102 * (1 - np.exp(-29 * t)) / 29)
    add(stereo, at, np.sin(phase) * np.exp(-17 * t) * level)


def clap(stereo: np.ndarray, at: float, level: float) -> None:
    t = times(0.18)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.77
    body = np.sin(math.tau * 188 * t) * np.exp(-30 * t)
    add(stereo, at, (high * 0.73 + body * 0.27) * np.exp(-23 * t) * level)


def hat(stereo: np.ndarray, at: float, level: float, pan: float) -> None:
    t = times(0.092)
    noise = RNG.uniform(-1, 1, len(t))
    high = noise - np.concatenate(([0.0], noise[:-1])) * 0.85
    add(stereo, at, high * np.exp(-45 * t) * level, pan)


def rubber_bass(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = times(0.37)
    envelope = np.clip(t / 0.006, 0, 1) * np.exp(-7.3 * t)
    phase = math.tau * frequency * t
    signal = np.sin(phase + 0.22 * np.sin(phase * 2)) + 0.25 * np.sin(phase * 2)
    add(stereo, at, signal * envelope * level)


def layered_pad(stereo: np.ndarray, at: float, frequencies: tuple[float, ...], level: float) -> None:
    t = times(2.0)
    envelope = np.clip(t / 0.20, 0, 1) * np.clip((2.0 - t) / 0.32, 0, 1)
    for index, frequency in enumerate(frequencies):
        signal = np.sin(math.tau * frequency * t) + 0.22 * np.sin(math.tau * frequency * 1.006 * t)
        add(stereo, at, signal * envelope * level / len(frequencies), (index - 1) * 0.32)


def mica_mallet(stereo: np.ndarray, at: float, frequency: float, level: float, pan: float) -> None:
    t = times(0.48)
    envelope = np.clip(t / 0.003, 0, 1) * np.exp(-10.8 * t)
    carrier = math.tau * frequency * t
    modulation = 1.4 * np.exp(-13 * t) * np.sin(math.tau * frequency * 2.7 * t)
    signal = np.sin(carrier + modulation) + 0.14 * np.sin(carrier * 2)
    add(stereo, at, signal * envelope * level, pan)


def bloom_lead(stereo: np.ndarray, at: float, frequency: float, level: float) -> None:
    t = times(0.62)
    envelope = np.clip(t / 0.016, 0, 1) * np.clip((0.62 - t) / 0.17, 0, 1)
    signal = np.sin(math.tau * frequency * t) + 0.34 * np.sin(math.tau * frequency * 2.003 * t)
    add(stereo, at, signal * envelope * level)


def render_wav(path: Path) -> None:
    stereo = np.zeros((2, SAMPLES), dtype=np.float32)
    # Fmaj7–Cadd9–Dm7–Bbmaj7; FM mallets and offbeat rubber bass.
    roots = (87.31, 130.81, 146.83, 116.54)
    chords = ((174.61, 220.00, 261.63, 329.63),
              (196.00, 261.63, 293.66, 392.00),
              (146.83, 174.61, 220.00, 261.63),
              (174.61, 233.08, 293.66, 349.23))
    melody = ((440.00, 523.25, 659.25, 523.25),
              (392.00, 587.33, 783.99, 587.33),
              (349.23, 440.00, 698.46, 523.25),
              (349.23, 466.16, 587.33, 466.16))
    for bar in range(33):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        intro = bar < 4
        breakdown = 16 <= bar < 20
        lift = 20 <= bar < 30
        outro = bar >= 30
        layered_pad(stereo, start, chords[harmony], 0.040 if breakdown else 0.056)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            kick(stereo, at, 0.25 if breakdown else (0.36 if lift else 0.31))
            if beat_index in (1, 3) and not breakdown:
                clap(stereo, at, 0.13 if intro or outro else (0.22 if lift else 0.18))
            if beat_index in (0, 2) and not intro:
                rubber_bass(stereo, at + BEAT / 2, roots[harmony], 0.14 if lift else 0.11)
            if not intro and not breakdown and not outro and beat_index in (0, 2):
                bloom_lead(stereo, at, melody[harmony][beat_index], 0.060 if lift else 0.043)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(stereo, at, 0.08 if breakdown else (0.14 if lift else 0.11),
                -0.25 if eighth % 2 else 0.25)
            if not breakdown and not outro and eighth in (0, 3, 5, 7):
                pitch = melody[harmony][eighth // 2] if eighth in (3, 7) else chords[harmony][eighth % 4] * 2
                mica_mallet(stereo, at, pitch, 0.050 if lift else (0.033 if intro else 0.041),
                            0.28 if eighth % 2 else -0.28)

    fade = round(1.0 * RATE)
    stereo[:, -fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    peak = float(np.max(np.abs(stereo)))
    if peak <= 0 or not math.isfinite(peak):
        raise ValueError("Rendered audio is silent or invalid")
    pcm = (np.clip(stereo.T * (0.78 / peak), -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm.tobytes())


def render_stream_wav(game_source: Path, path: Path) -> None:
    """Keep the game movement, then add a separately arranged 64-second answer."""
    with wave.open(str(game_source), "rb") as source:
        if source.getnchannels() != 2 or source.getsampwidth() != 2 or source.getframerate() != RATE:
            raise ValueError("Unexpected game source format")
        first = source.readframes(SAMPLES)
    if len(first) != SAMPLES * 2 * 2:
        raise ValueError("Incomplete game source")

    second = np.zeros((2, SAMPLES), dtype=np.float32)
    # Gm7–Bbmaj7–Fadd9–C response: descending melody and beat-centred bass.
    roots = (98.00, 116.54, 87.31, 130.81)
    chords = ((196.00, 233.08, 293.66, 349.23),
              (174.61, 233.08, 293.66, 349.23),
              (174.61, 220.00, 261.63, 392.00),
              (196.00, 261.63, 293.66, 392.00))
    melody = ((698.46, 587.33, 466.16, 392.00),
              (698.46, 587.33, 466.16, 349.23),
              (783.99, 659.25, 523.25, 440.00),
              (783.99, 587.33, 523.25, 392.00))
    for bar in range(33):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        restart = bar < 4
        breakdown = 12 <= bar < 16
        lift = 16 <= bar < 29
        outro = bar >= 30
        layered_pad(second, start, chords[harmony], 0.042 if breakdown else 0.055)
        for beat_index in range(4):
            at = start + beat_index * BEAT
            kick(second, at, 0.23 if breakdown else (0.35 if lift else 0.30))
            if beat_index in (1, 3) and not breakdown:
                clap(second, at, 0.14 if restart else (0.21 if lift else 0.18))
            if beat_index in (0, 2) and not breakdown:
                rubber_bass(second, at, roots[harmony], 0.12 if restart else (0.17 if lift else 0.14))
            if not restart and not breakdown and not outro and beat_index in (1, 3):
                bloom_lead(second, at, melody[harmony][beat_index], 0.057 if lift else 0.041)
        for eighth in range(8):
            at = start + eighth * BEAT / 2
            hat(second, at, 0.073 if breakdown else (0.14 if lift else 0.10),
                0.26 if eighth % 2 else -0.26)
            if not breakdown and not outro and eighth in (1, 2, 4, 6):
                pitch = melody[harmony][eighth // 2] if eighth in (2, 6) else chords[harmony][eighth % 4] * 2
                mica_mallet(second, at, pitch, 0.050 if lift else 0.035,
                            -0.25 if eighth % 2 else 0.25)

    fade = round(1.0 * RATE)
    second[:, -fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    peak = float(np.max(np.abs(second)))
    if peak <= 0 or not math.isfinite(peak):
        raise ValueError("Second movement is silent or invalid")
    pcm = (np.clip(second.T * (0.78 / peak), -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(first)
        output.writeframes(pcm.tobytes())


def observed_onsets(audio: Path) -> list[float]:
    """Chart against audible transients reported by the BS-D002 analyzer."""
    path = ROOT / "scripts/beatscape-audio.py"
    spec = importlib.util.spec_from_file_location("beatscape_audio_for_mica_bloomline", path)
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
        for beat_index in range(8, 132, 2):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            if beat_index % 16 == 14:
                notes.append({"id": f"e-{beat_index}", "type": "hold", "t": at,
                              "end": round(at + BEAT / 2, 6), "key": 0})
            else:
                notes.append({"id": f"e-{beat_index}", "type": "tap", "t": at, "key": 0})
    elif tier == "standard":
        for beat_index in range(8, 132):
            at = round(beat_index * BEAT, 6)
            if not has_onset(at, onsets):
                continue
            notes.append({"id": f"s-{beat_index}", "type": "tap", "t": at,
                          "key": beat_index % 2})
    else:
        for eighth in range(16, 264):
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
  <text x="80" y="934" fill="white" font-family="sans-serif" font-size="65" font-weight="700">Mica Bloomline</text>
</svg>
""", encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="duohertz-mica-bloomline-") as temp:
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
        "title": "Mica Bloomline",
        "artist": "duohertz studio",
        "theme": "duohertz",
        "subgenre": "Melodic House",
        "bpm": BPM,
        "duration_sec": SECONDS,
        "stream_duration_sec": STREAM_SECONDS,
        "creation_method": "Independent deterministic Fmaj7–Cadd9–Dm7–Bbmaj7 Melodic House game movement with FM mica mallets, rubber bass and seeded percussion; a new Gm7–Bbmaj7–Fadd9–C descending answer movement extends the stream master to 128 seconds without looping the first movement; no sampled source audio",
        "source_script": "scripts/duohertz-compose-mica-bloomline.py",
        "rights_status": "internal_candidate_unreviewed",
        "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
        "art_provenance": {
            "tool": "built-in imagegen",
            "cover_prompt": "Use case: stylized-concept\\nAsset type: original square, text-free album-cover background for an internal duohertz electronic rhythm-game candidate.\\nPrimary request: Create distinctive art for “Mica Bloomline”, a joyful all-ages Melodic House track. Imagine many thin iridescent mica-like petal wafers opening in a gentle wave along one fine glowing sound line, with tiny round frequency sparks drifting upward. It should evoke layered mineral color and springtime motion, without resembling a literal flower bouquet.\\nStyle/medium: polished contemporary editorial electronic album illustration, tactile translucent layers, clean shapes, restrained luminous detail, readable as a tiny music thumbnail.\\nComposition/framing: exact square composition; petal layers occupy upper and middle portions, with a calm deep dusk-blue lower third reserved for a separate title overlay.\\nColor palette: turquoise, warm coral, pale gold, soft lilac highlights and deep dusk blue.\\nConstraints: no text, letters, numbers, logos, people, characters, weapons, vehicles, food, red neon city, flashing/strobing patterns, copied game imagery, interlocking rings, glass horizon, aurora stones, racing sky ribbons, helix, vertical light columns, lantern network, paper fins, citrus tiles or faceted prism chains.",
            "og_prompt": "Use case: ads-marketing\\nAsset type: wide companion sharing card for the supplied Mica Bloomline square cover, final target 1200x630.\\nPrimary request: Recompose the supplied iridescent mica-like petal wafers, gentle single sound line, tiny round frequency sparks and deep dusk-blue atmosphere into a wide 1.9:1 horizontal illustration. Place the main layered petals mainly in the right two-thirds; keep the left third calm deep dusk blue for typography. Make a new companion composition, not a stretched or simply cropped square.\\nText (verbatim): exactly two crisp, highly legible lines in the left third with generous margins, clean modern sans-serif: line 1 “duohertz” all lowercase, smaller, pale turquoise; line 2 “Mica Bloomline” title case, larger, white. Spell both exactly. No other text or logos.\\nStyle/mood: buoyant all-ages Melodic House music, polished contemporary editorial electronic album art, legible in a small social preview.\\nConstraints: preserve the reference’s turquoise, coral, pale gold, lilac and dusk-blue palette; no people, vehicles, weapons, red neon city, flashing stripes, copied game art or new unrelated objects.",
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
