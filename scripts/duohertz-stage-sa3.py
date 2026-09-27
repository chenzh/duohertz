#!/usr/bin/env python3
"""Stage one SA3 master as an isolated duohertz candidate after technical checks.

Requires a stereo PCM16 WAV master, its recipe and two original art sources.
It never writes to the old BeatScape catalog or grants content/release approval.
"""

from __future__ import annotations

import argparse
from array import array
import hashlib
import html
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / "apps/beatscape/candidates/duohertz"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def probe(path: Path) -> tuple[float, int]:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=channels",
         "-of", "json", str(path)], capture_output=True, text=True, check=True,
    )
    info = json.loads(result.stdout)
    return float(info["format"]["duration"]), int(info["streams"][0]["channels"])


def preflight_master(path: Path) -> dict[str, float | int]:
    """Reject grossly unusable PCM; these measurements are not an earcheck."""
    with wave.open(str(path), "rb") as wav:
        channels = wav.getnchannels()
        sample_rate = wav.getframerate()
        frames = wav.getnframes()
        if channels != 2 or wav.getsampwidth() != 2 or sample_rate != 44_100:
            raise ValueError("Source must be stereo 44.1 kHz PCM16 WAV")
        pcm = wav.readframes(frames)
    if sys.byteorder != "little":
        raise RuntimeError("PCM16 preflight expects a little-endian host")
    samples = array("h")
    samples.frombytes(pcm)
    if frames < sample_rate * 10:
        raise ValueError("Source is too short for music preflight")
    # Exact copy of an entire half is a production mistake, unlike a recurring hook.
    half_bytes = (frames // 2) * channels * 2
    if frames % 2 == 0 and pcm[:half_bytes] == pcm[half_bytes:]:
        raise ValueError("Source contains an exact duplicated half")
    clipped = samples.count(32767) + samples.count(-32768)
    clipping_ratio = clipped / len(samples)
    if clipping_ratio > 0.005:
        raise ValueError(f"Source has excessive PCM clipping ({clipping_ratio:.2%})")
    # Sample every 32nd frame across each 8-second window. This catches full
    # silence and a duplicated mono channel without loading a DSP dependency.
    stride = 32
    window_frames = sample_rate * 8
    total_power = 0
    total_samples = 0
    quiet_windows = 0
    equal_channels = 0
    for start in range(0, frames, window_frames):
        end = min(start + window_frames, frames)
        power = 0
        count = 0
        for frame in range(start, end, stride):
            left, right = samples[frame * 2], samples[frame * 2 + 1]
            power += left * left + right * right
            equal_channels += left == right
            count += 1
        if count and math.sqrt(power / (2 * count)) / 32768 < 0.001:
            quiet_windows += 1
        total_power += power
        total_samples += count
    rms = math.sqrt(total_power / (2 * total_samples)) / 32768
    if rms < 0.015 or quiet_windows:
        raise ValueError(f"Source is silent or has an 8-second silent window (RMS {rms:.4f})")
    if equal_channels / total_samples > 0.999:
        raise ValueError("Source contains identical left and right channels")
    return {
        "sample_rate_hz": sample_rate,
        "channels": channels,
        "duration_sec": round(frames / sample_rate, 3),
        "sampled_rms": round(rms, 5),
        "clipping_ratio": round(clipping_ratio, 6),
        "silent_8s_windows": quiet_windows,
    }


def encode(source: Path, target: Path, seconds: float | None = None, *, gain_db: float = -3.0,
           limiter: float | None = None, start_sec: float = 0.0) -> None:
    command = ["ffmpeg", "-v", "error", "-y", "-i", str(source)]
    if start_sec:
        command.extend(["-ss", str(start_sec)])
    if seconds is not None:
        command.extend(["-t", str(seconds)])
    filters = f"volume={gain_db:g}dB"
    if limiter is not None:
        filters += f",alimiter=limit={limiter:g}:level=0"
    command.extend(["-af", filters, "-c:a", "aac", "-b:a", "160k", str(target)])
    subprocess.run(command, check=True)


def resize(source: Path, target: Path, width: int, height: int) -> None:
    subprocess.run(["sips", "-s", "format", "png", "-z", str(height), str(width),
                    str(source), "--out", str(target)], check=True, capture_output=True)


def cover_svg(title: str) -> str:
    title = html.escape(title)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <image href="cover-art.png" width="1024" height="1024" preserveAspectRatio="xMidYMid slice" />
  <rect y="770" width="1024" height="254" fill="#111421" opacity="0.88" />
  <text x="68" y="850" fill="#67eee0" font-family="sans-serif" font-size="36" font-weight="700" letter-spacing="3">duohertz</text>
  <text x="68" y="932" fill="#fff9ef" font-family="sans-serif" font-size="56" font-weight="700">{title}</text>
</svg>
'''


def local_svg_source(recipe: dict, key: str, png: Path, width: int, height: int) -> tuple[str, str]:
    source_name = recipe.get(key)
    if not isinstance(source_name, str) or not source_name.startswith("scripts/duohertz-art-sources/"):
        raise ValueError(f"Invalid local SVG source: {key}")
    original = ROOT / source_name
    source = original.resolve()
    if not source.is_relative_to(ROOT) or not source.is_file() or original.is_symlink() or source.suffix != ".svg":
        raise ValueError(f"Missing or unsafe local SVG source: {key}")
    svg = ET.parse(source).getroot()
    forbidden = {"script", "image", "foreignObject", "style", "use"}
    if svg.tag != "{http://www.w3.org/2000/svg}svg":
        raise ValueError(f"Local SVG source must be self-contained and script-free: {key}")
    for node in svg.iter():
        if node.tag.rsplit("}", 1)[-1] in forbidden:
            raise ValueError(f"Local SVG source must be self-contained and script-free: {key}")
        for name, value in node.attrib.items():
            if name.rsplit("}", 1)[-1] == "href" or re.search(r"https?://|file:|@import", value, re.I) \
                    or any(not ref.strip("'\" ").startswith("#")
                           for ref in re.findall(r"url\(([^)]+)\)", value, re.I)):
                raise ValueError(f"Local SVG source must be self-contained and script-free: {key}")
    with tempfile.TemporaryDirectory(prefix="duohertz-art-check-") as temp:
        rendered = Path(temp) / "rendered.png"
        subprocess.run(["sips", "-s", "format", "png", "-z", str(height), str(width),
                        str(source), "--out", str(rendered)], check=True, capture_output=True)
        if sha(rendered) != sha(png):
            raise ValueError(f"Local PNG does not match its SVG source: {key}")
    return source_name, sha(source)


def art_provenance(recipe: dict, cover: Path, og: Path) -> dict:
    tool = recipe.get("art_tool", "built-in imagegen")
    if tool == "local-authored SVG":
        cover_name, cover_hash = local_svg_source(recipe, "cover_source_svg", cover, 1024, 1024)
        og_name, og_hash = local_svg_source(recipe, "og_source_svg", og, 1200, 630)
        return {
            "tool": tool,
            "cover_prompt": recipe["cover_prompt"],
            "og_prompt": recipe["og_prompt"],
            "cover_source_sha256": sha(cover),
            "og_source_sha256": sha(og),
            "cover_svg_source": cover_name,
            "cover_svg_source_sha256": cover_hash,
            "og_svg_source": og_name,
            "og_svg_source_sha256": og_hash,
            "render_method": "local macOS sips SVG-to-PNG; source raster equality checked before staging",
            "cover_svg": "Local SVG title overlay around the authored cover-art.png",
        }
    if tool != "built-in imagegen":
        raise ValueError(f"Unknown art source tool: {tool}")
    return {
        "tool": tool,
        "cover_prompt": recipe["cover_prompt"],
        "og_prompt": recipe["og_prompt"],
        "cover_source_sha256": sha(cover),
        "og_source_sha256": sha(og),
        "og_reference": "cover-art source supplied to built-in imagegen for the wide card",
        "cover_svg": "Local SVG title overlay around the generated cover-art.png",
    }


def stage(recipe_path: Path, source: Path, cover: Path, og: Path, receipt_path: Path,
          *, gain_db: float = -3.0, stream_limiter: float | None = None) -> Path:
    if not math.isfinite(gain_db) or not -30.0 <= gain_db <= 0.0:
        raise ValueError("AAC gain must be finite and between -30 and 0 dB")
    if stream_limiter is not None and (not math.isfinite(stream_limiter)
                                       or not 0.1 <= stream_limiter <= 1.0):
        raise ValueError("Stream limiter must be finite and between 0.1 and 1.0")
    recipe = json.loads(recipe_path.read_text(encoding="utf-8"))
    track_id = recipe["track_id"]
    stream_duration = float(recipe["stream_duration_sec"])
    generation_duration = float(recipe.get("generation_duration_sec", stream_duration))
    stream_start = float(recipe.get("stream_start_sec", 0.0))
    if (not all(math.isfinite(value) for value in (stream_duration, generation_duration, stream_start))
            or stream_start < 0 or generation_duration < stream_start + stream_duration):
        raise ValueError("Invalid generated master duration or stream excerpt start")
    receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    if (receipt.get("track_id") != track_id
            or receipt.get("source_recipe_sha256") != sha(recipe_path)
            or receipt.get("source_master_sha256") != sha(source)
            or not receipt.get("gateway_job_id")
            or receipt.get("request") != {
                "mode": "game_bgm", "prompt": recipe["generation_prompt"],
                "duration_sec": recipe.get("generation_duration_sec", recipe["stream_duration_sec"]),
                "model_variant": recipe["model_variant"],
            }):
        raise ValueError("Generation receipt does not match recipe and source master")
    for key in ("worker_health_before", "worker_health_after"):
        health = receipt.get(key, {})
        if health.get("status") != "ok" or health.get("mode") != "mlx" or health.get("sa3_mlx") != "ok":
            raise ValueError("Generation receipt does not show healthy SA3 MLX worker")
    final = CANDIDATES / track_id
    if final.exists():
        raise FileExistsError(f"Refusing to overwrite candidate: {final}")
    master_duration, channels = probe(source)
    game_duration = float(recipe["game_duration_sec"])
    if (channels != 2 or abs(master_duration - generation_duration) > 0.1
            or stream_duration < game_duration * 1.8):
        raise ValueError("Source must be a stereo master of the declared generation length (stream >=1.8x game)")
    master_preflight = preflight_master(source)
    artwork = art_provenance(recipe, cover, og)
    CANDIDATES.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="duohertz-stage-") as temp:
        candidate = Path(temp) / track_id
        candidate.mkdir()
        encode(source, candidate / "audio.m4a", game_duration, gain_db=gain_db, start_sec=stream_start)
        encode(source, candidate / "stream.m4a", stream_duration, gain_db=gain_db,
               limiter=stream_limiter, start_sec=stream_start)
        encode(source, candidate / "preview_48s.m4a", min(48.0, game_duration),
               gain_db=gain_db, start_sec=stream_start)
        subprocess.run([
            "python3", str(ROOT / "scripts/duohertz-chartgen.py"),
            "--audio", str(candidate / "audio.m4a"), "--track-id", track_id,
            "--bpm", str(recipe["bpm"]), "--use-estimated-bpm", "--out", str(candidate),
        ], check=True)
        chart_bpm = json.loads((candidate / "easy.json").read_text(encoding="utf-8"))["bpm"]
        resize(cover, candidate / "cover-art.png", 1024, 1024)
        resize(og, candidate / "og.png", 1200, 630)
        (candidate / "cover.svg").write_text(cover_svg(recipe["title"]), encoding="utf-8")
        files = {path.name: sha(path) for path in sorted(candidate.iterdir()) if path.is_file()}
        manifest = {
            "track_id": track_id,
            "title": recipe["title"],
            "artist": recipe["artist"],
            "theme": "duohertz",
            "subgenre": recipe["subgenre"],
            "bpm": chart_bpm,
            "target_bpm": recipe["bpm"],
            "duration_sec": game_duration,
            "stream_duration_sec": stream_duration,
            "generation_duration_sec": generation_duration,
            "stream_start_sec": stream_start,
            "creation_method": f"MusicSaas Gateway game_bgm / SA3 {recipe['model_variant']} single-pass {generation_duration:g}-second stereo master; a continuous {stream_duration:g}-second excerpt from {stream_start:g}s forms the station mix and its first {game_duration:g} seconds form the game mix; {gain_db:g} dB gain before AAC encoding{f'; stream-only limiter at {stream_limiter:g} linear amplitude with no makeup gain' if stream_limiter is not None else ''}. PCM preflight cannot independently prove inference mode or musical quality; human review remains required.",
            "audio_gain_db": gain_db,
            "stream_limiter": stream_limiter,
            "source_script": "scripts/duohertz-stage-sa3.py",
            "source_recipe": str(recipe_path.relative_to(ROOT)),
            "source_recipe_sha256": sha(recipe_path),
            "source_master_sha256": sha(source),
            "source_master_preflight": master_preflight,
            "source_generation_job_id": receipt["gateway_job_id"],
            "source_generation_receipt_sha256": sha(receipt_path),
            "generation_prompt": recipe["generation_prompt"],
            "rights_status": "internal_candidate_unreviewed",
            "review_status": "requires_earcheck_content_rights_art_review_and_signoff",
            "art_provenance": artwork,
            "files_sha256": files,
        }
        (candidate / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        subprocess.run(["python3", str(ROOT / "scripts/duohertz-candidate-gate.py"),
                        "--candidate", str(candidate)], check=True)
        subprocess.run(["python3", str(ROOT / "scripts/duohertz-audio-gate.py"),
                        "--candidate", str(candidate)], check=True)
        shutil.move(str(candidate), str(final))
    print(f"Staged unreviewed technical candidate at {final}")
    return final


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--recipe", type=Path, required=True)
    parser.add_argument("--master", type=Path, required=True)
    parser.add_argument("--cover-source", type=Path, required=True)
    parser.add_argument("--og-source", type=Path, required=True)
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--gain-db", type=float, default=-3.0,
                        help="Linear gain applied to the original master before AAC encoding")
    parser.add_argument("--stream-limiter", type=float,
                        help="Optional stream-only peak limiter amplitude, without makeup gain")
    args = parser.parse_args()
    stage(*(path.resolve() for path in (args.recipe, args.master, args.cover_source, args.og_source, args.receipt)),
          gain_db=args.gain_db, stream_limiter=args.stream_limiter)


if __name__ == "__main__":
    main()
