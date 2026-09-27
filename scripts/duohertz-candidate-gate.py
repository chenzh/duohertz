#!/usr/bin/env python3
"""Technical gate for one isolated duohertz format-2 music candidate.

Runs the existing BS-D002 audio alignment checks on new-format charts without
adding the candidate to the old BeatScape catalog. PASS is not an earcheck,
rights clearance, character/art approval, or release signoff.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import re
import struct
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CANDIDATES = ROOT / "apps/beatscape/candidates/duohertz"
TIERS = ("easy", "standard", "hard")
# Grossly sparse drafts usually indicate unstable tempo/onset extraction. These
# are conservative technical floors, not the final player-tested difficulty spec.
MIN_JUDGMENTS_PER_SECOND = {"easy": 0.5, "standard": 0.9, "hard": 1.8}
FILES = {
    "audio.m4a", "stream.m4a", "preview_48s.m4a",
    "easy.json", "standard.json", "hard.json",
    "cover-art.png", "cover.svg", "og.png",
}


def load_old_audio_gate():
    path = ROOT / "scripts/beatscape-chart-gate.py"
    spec = importlib.util.spec_from_file_location("beatscape_chart_gate_for_duohertz", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load BS-D002 audio gate")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(result.stdout.strip())


def png_size(path: Path) -> tuple[int, int]:
    header = path.read_bytes()[:24]
    if len(header) < 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        fail(f"Invalid PNG: {path.name}")
    return struct.unpack(">II", header[16:24])


def fail(message: str) -> None:
    raise ValueError(message)


def validate_chart(raw: object, *, tier: str, track_id: str, bpm: float, track_duration: float) -> dict:
    if not isinstance(raw, dict):
        fail(f"{tier}: chart must be an object")
    chart = raw
    count = 1 if tier == "easy" else 2
    if chart.get("format") != 2 or chart.get("theme") != "duohertz" or chart.get("track_id") != track_id:
        fail(f"{tier}: expected this track's duohertz format 2 chart")
    if chart.get("tier") != tier or type(chart.get("input_count")) is not int or chart.get("input_count") != count:
        fail(f"{tier}: wrong tier or input count")
    if chart.get("bpm") != bpm or type(chart.get("audio_offset_ms")) not in (int, float) or not math.isfinite(chart["audio_offset_ms"]):
        fail(f"{tier}: invalid timing metadata")
    notes = chart.get("notes")
    if not isinstance(notes, list) or not notes:
        fail(f"{tier}: empty notes")
    seen: set[str] = set()
    previous = -1.0
    held_until = [-1.0, -1.0]
    used_keys: set[int] = set()
    judgments = 0
    for note in notes:
        if not isinstance(note, dict) or not isinstance(note.get("id"), str) or not note["id"].strip() or note["id"] in seen:
            fail(f"{tier}: missing or duplicate note ID")
        seen.add(note["id"])
        time = note.get("t")
        if type(time) not in (int, float) or not math.isfinite(time) or time <= previous or time < 0 or time >= track_duration:
            fail(f"{tier}: invalid or unsorted note time at {note['id']}")
        previous = time
        kind = note.get("type")
        if kind == "chord":
            if tier != "hard" or note.get("keys") != [0, 1]:
                fail(f"{tier}: chords require both Hard keys at {note['id']}")
            keys = [0, 1]
            judgments += 2
        elif kind in ("tap", "hold"):
            key = note.get("key")
            if not isinstance(key, int) or isinstance(key, bool) or key not in range(count):
                fail(f"{tier}: invalid key at {note['id']}")
            keys = [key]
            judgments += 1
            if kind == "hold":
                end = note.get("end")
                if type(end) not in (int, float) or not math.isfinite(end) or end <= time or end >= track_duration:
                    fail(f"{tier}: invalid Hold tail at {note['id']}")
        else:
            fail(f"{tier}: unsupported note at {note['id']}")
        for key in keys:
            used_keys.add(key)
            if time <= held_until[key]:
                fail(f"{tier}: same-key conflict at {note['id']}")
            if kind == "hold":
                held_until[key] = note["end"]
    if chart.get("audio_offset_ms") != 0:
        fail(f"{tier}: nonzero audio offset is not supported by this candidate gate")
    if used_keys != set(range(count)):
        fail(f"{tier}: chart does not use every declared key")
    if chart.get("total_notes") != judgments:
        fail(f"{tier}: total_notes mismatch, expected {judgments}")
    return chart


def validate_durations(candidate: Path, track_duration: float, stream_target: float | None = None) -> None:
    for name, target in (("audio.m4a", track_duration), ("preview_48s.m4a", min(48, track_duration))):
        actual = duration(candidate / name)
        if not math.isfinite(actual) or abs(actual - target) > 0.1:
            fail(f"{name}: duration {actual:.3f}s does not match {target:.3f}s")
    stream_duration = duration(candidate / "stream.m4a")
    if not math.isfinite(stream_duration) or stream_duration < track_duration - 0.1:
        fail(f"stream.m4a: duration {stream_duration:.3f}s is shorter than game audio {track_duration:.3f}s")
    if stream_target is not None and abs(stream_duration - stream_target) > 0.1:
        fail(f"stream.m4a: duration {stream_duration:.3f}s does not match manifest {stream_target:.3f}s")


def validate_density(chart: dict, *, tier: str, track_duration: float) -> None:
    minimum = math.ceil(track_duration * MIN_JUDGMENTS_PER_SECOND[tier])
    if chart["total_notes"] < minimum:
        fail(f"{tier}: {chart['total_notes']} judgments below technical density floor {minimum} "
             f"for {track_duration:g}s; inspect tempo and actual onsets")


def validate_art_provenance(art_provenance: object, candidate: Path | None = None) -> None:
    if not isinstance(art_provenance, dict) or not art_provenance.get("cover_prompt") \
            or not art_provenance.get("og_prompt"):
        fail("Missing art provenance and creative briefs")
    tool = art_provenance.get("tool")
    if tool == "built-in imagegen":
        return
    if tool != "local-authored SVG":
        fail("Unknown art source tool")
    if not isinstance(art_provenance.get("render_method"), str) or not art_provenance["render_method"]:
        fail("Missing local SVG render method")
    for key in ("cover", "og"):
        name = art_provenance.get(f"{key}_svg_source")
        expected = art_provenance.get(f"{key}_svg_source_sha256")
        if not isinstance(name, str) or not name.startswith("scripts/duohertz-art-sources/") \
                or not isinstance(expected, str):
            fail(f"Missing local SVG source provenance: {key}")
        original = ROOT / name
        path = original.resolve()
        if not path.is_relative_to(ROOT) or not path.is_file() or original.is_symlink() \
                or path.suffix != ".svg" or sha(path) != expected:
            fail(f"Missing or changed local SVG source: {key}")
        svg = ET.parse(path).getroot()
        forbidden = {"script", "image", "foreignObject", "style", "use"}
        if svg.tag != "{http://www.w3.org/2000/svg}svg":
            fail(f"Unsafe local SVG source: {key}")
        for node in svg.iter():
            if node.tag.rsplit("}", 1)[-1] in forbidden:
                fail(f"Unsafe local SVG source: {key}")
            for attribute, value in node.attrib.items():
                if attribute.rsplit("}", 1)[-1] == "href" or re.search(r"https?://|file:|@import", value, re.I) \
                        or any(not ref.strip("'\" ").startswith("#")
                               for ref in re.findall(r"url\(([^)]+)\)", value, re.I)):
                    fail(f"Unsafe local SVG source: {key}")
        if candidate is not None:
            width, height, target = (1024, 1024, "cover-art.png") if key == "cover" \
                else (1200, 630, "og.png")
            with tempfile.TemporaryDirectory(prefix="duohertz-art-gate-") as temp:
                rendered = Path(temp) / "rendered.png"
                staged = Path(temp) / "staged.png"
                subprocess.run(["sips", "-s", "format", "png", "-z", str(height), str(width),
                                str(path), "--out", str(rendered)], check=True, capture_output=True)
                if sha(rendered) != art_provenance.get(f"{key}_source_sha256"):
                    fail(f"Local SVG render does not match source PNG provenance: {key}")
                subprocess.run(["sips", "-s", "format", "png", "-z", str(height), str(width),
                                str(rendered), "--out", str(staged)], check=True, capture_output=True)
                if not (candidate / target).is_file() or sha(staged) != sha(candidate / target):
                    fail(f"Candidate art does not match local SVG source: {key}")


def validate(candidate: Path) -> None:
    if candidate.is_symlink() or not candidate.is_dir():
        fail(f"Candidate directory missing: {candidate}")
    manifest_path = candidate / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if not isinstance(manifest, dict):
        fail("Candidate manifest must be an object")
    track_id = manifest.get("track_id")
    if not isinstance(track_id, str) or not re.fullmatch(r"dh-[a-z0-9-]+", track_id):
        fail("Invalid duohertz track ID")
    if manifest.get("theme") != "duohertz" or candidate.name != track_id:
        fail("Candidate identity mismatch")
    if not isinstance(manifest.get("title"), str) or not manifest["title"].strip():
        fail("Missing track title")
    if manifest.get("subgenre") not in {"Melodic House", "Synthwave", "Future Bass", "Drum & Bass", "Trance"}:
        fail("Unrecognized electronic subgenre")
    if not isinstance(manifest.get("creation_method"), str) or not manifest["creation_method"].strip():
        fail("Missing creation provenance")
    if manifest.get("rights_status") != "internal_candidate_unreviewed":
        fail("Candidate rights status must remain unreviewed until signed evidence exists")
    validate_art_provenance(manifest.get("art_provenance"), candidate)
    checksums = manifest.get("files_sha256")
    if not isinstance(checksums, dict) or set(checksums) != FILES:
        fail("Candidate file list is incomplete or contains unexpected files")
    for name in FILES:
        path = candidate / name
        if not path.is_file() or path.is_symlink() or path.stat().st_size == 0 or sha(path) != checksums[name]:
            fail(f"Missing, empty or modified candidate file: {name}")
    cover_size = png_size(candidate / "cover-art.png")
    if cover_size[0] != cover_size[1] or cover_size[0] < 512:
        fail("Cover art must be a square PNG at least 512 px wide")
    if png_size(candidate / "og.png") != (1200, 630):
        fail("OG card must be a 1200x630 PNG")
    svg = ET.parse(candidate / "cover.svg").getroot()
    if svg.tag != "{http://www.w3.org/2000/svg}svg":
        fail("Cover wrapper must be SVG")
    image_nodes = svg.findall(".//{http://www.w3.org/2000/svg}image")
    if len(image_nodes) != 1 or image_nodes[0].get("href") != "cover-art.png" \
            or image_nodes[0].get("{http://www.w3.org/1999/xlink}href", "cover-art.png") != "cover-art.png":
        fail("Cover wrapper must use only the local generated art")
    if svg.find(".//{http://www.w3.org/2000/svg}script") is not None:
        fail("Cover wrapper cannot contain scripts")
    cover_text = " ".join((node.text or "") for node in svg.findall(".//{http://www.w3.org/2000/svg}text"))
    if "duohertz" not in cover_text or manifest.get("title") not in cover_text:
        fail("Cover wrapper is missing the exact brand or track title")
    bpm = manifest.get("bpm")
    if type(bpm) not in (int, float) or not math.isfinite(bpm) or bpm <= 0:
        fail("Invalid BPM")
    raw_duration = manifest.get("duration_sec")
    if type(raw_duration) not in (int, float) or not math.isfinite(raw_duration) or raw_duration <= 0:
        fail("Invalid duration")
    track_duration = float(raw_duration)
    raw_stream_duration = manifest.get("stream_duration_sec")
    if raw_stream_duration is not None and (type(raw_stream_duration) not in (int, float)
                                            or not math.isfinite(raw_stream_duration)
                                            or raw_stream_duration <= 0):
        fail("Invalid stream duration")
    validate_durations(candidate, track_duration,
                       float(raw_stream_duration) if raw_stream_duration is not None else None)

    audio_gate = load_old_audio_gate()
    analysis = audio_gate.analyze_audio(candidate / "audio.m4a", bpm)
    for tier in TIERS:
        chart = validate_chart(json.loads((candidate / f"{tier}.json").read_text(encoding="utf-8")),
                               tier=tier, track_id=track_id, bpm=bpm, track_duration=track_duration)
        validate_density(chart, tier=tier, track_duration=track_duration)
        issues = audio_gate.check_chart(tier, chart, analysis)
        if issues:
            fail(f"{tier}: BS-D002 audio match failed: {'; '.join(issues)}")
        print(f"pass {track_id} [{tier}]: {chart['total_notes']} judgments, format 2, BS-D002 audio match")
    print("Technical candidate PASS. Cover/OG assets exist; earcheck, rights/content/art review and release signoff remain pending.")


GATE_ERRORS = (ValueError, OSError, subprocess.CalledProcessError, json.JSONDecodeError, ET.ParseError)


def validate_staged(root: Path) -> int:
    """Check every staged song; a passing subset never makes the batch green."""
    if not root.is_dir() or root.is_symlink():
        print(f"FAIL Candidate root missing: {root}")
        return 1
    candidates = sorted(root.glob("dh-*"))
    if not candidates:
        print(f"FAIL No staged duohertz candidates in {root}")
        return 1
    passed = 0
    for candidate in candidates:
        try:
            validate(candidate)
            passed += 1
        except GATE_ERRORS as exc:
            print(f"FAIL {candidate.name}: {exc}")
    print(f"Staged technical candidates: {passed}/{len(candidates)} PASS. "
          "This does not assess the 105-track catalog target or grant human/release approval.")
    return 0 if passed == len(candidates) else 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    choice = parser.add_mutually_exclusive_group(required=True)
    choice.add_argument("--candidate", type=Path)
    choice.add_argument("--all-staged", action="store_true")
    parser.add_argument("--root", type=Path, default=DEFAULT_CANDIDATES,
                        help="Candidate directory for --all-staged")
    args = parser.parse_args()
    if args.all_staged:
        return validate_staged(args.root.absolute())
    try:
        validate(args.candidate.absolute())
    except GATE_ERRORS as exc:
        print(f"FAIL {exc}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
