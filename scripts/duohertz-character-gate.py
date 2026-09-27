#!/usr/bin/env python3
"""Validate staged duohertz character concept files without approving their release."""

from __future__ import annotations

import hashlib
import json
import struct
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / "apps/beatscape/candidates/duohertz/characters"
EXPECTED = {
    "RHYVORI": ("The First Pulse", "Attacker", "rhyvori-concept.png"),
    "NIVAREO": ("The Reply Wave", "Support", "nivareo-concept.png"),
    "ZORYMELA": ("Weaver of Waves", "Buffer", "zorymela-concept.png"),
}


def alpha_at(path: Path, x: int, y: int) -> int:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-vf", f"crop=1:1:{x}:{y},format=rgba",
         "-frames:v", "1", "-f", "rawvideo", "-"],
        check=True, capture_output=True,
    ).stdout
    if len(raw) != 4:
        raise ValueError(f"Cannot inspect alpha: {path.name}")
    return raw[3]


def validate_png(path: Path, sha256: str, width: int, height: int, label: str) -> None:
    if not path.is_file() or path.is_symlink() or hashlib.sha256(path.read_bytes()).hexdigest() != sha256:
        raise ValueError(f"{label}: missing or modified art")
    header = path.read_bytes()[:26]
    if len(header) < 26 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise ValueError(f"{label}: invalid PNG")
    actual_width, actual_height = struct.unpack(">II", header[16:24])
    if (actual_width, actual_height) != (width, height) or width < 512 or height < 768:
        raise ValueError(f"{label}: incorrect concept dimensions")
    if alpha_at(path, 0, 0) != 0 or alpha_at(path, width // 2, height // 2) < 200:
        raise ValueError(f"{label}: background is not transparent or body is missing")


def validate(directory: Path = DIRECTORY) -> None:
    manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("theme") != "duohertz" or manifest.get("status") != "visual_concepts_unreviewed" \
            or manifest.get("generation_tool") != "built-in imagegen":
        raise ValueError("Character concept provenance/status mismatch")
    characters = manifest.get("characters")
    if not isinstance(characters, list) or {item.get("name") for item in characters if isinstance(item, dict)} != set(EXPECTED) \
            or len(characters) != len(EXPECTED):
        raise ValueError("Expected exactly three original character concepts")
    for item in characters:
        name = item["name"]
        title, role, filename = EXPECTED[name]
        if (item.get("title"), item.get("role"), item.get("file")) != (title, role, filename):
            raise ValueError(f"{name}: metadata mismatch")
        if not isinstance(item.get("prompt"), str) or not item["prompt"].startswith("Use case: stylized-concept."):
            raise ValueError(f"{name}: missing image-generation prompt")
        prompt_name = item.get("prompt_name_at_generation", name)
        if f"Character: {prompt_name}," not in item["prompt"] or (prompt_name != name and not item.get("naming_note")):
            raise ValueError(f"{name}: name/prompt provenance mismatch")
        prompt_title = item.get("prompt_title_at_generation", title)
        if f"'{prompt_title}'" not in item["prompt"] or (prompt_title != title and not item.get("naming_note")):
            raise ValueError(f"{name}: title/prompt provenance mismatch")
        width, height = item.get("width"), item.get("height")
        validate_png(directory / filename, item.get("sha256"), width, height, name)
        side = item.get("side_view")
        side_prompt_name = side.get("prompt_name_at_generation", name) if isinstance(side, dict) else name
        if not isinstance(side, dict) or side.get("file") != f"{name.lower()}-side-concept.png" \
                or side.get("source_front_file") != filename or side.get("source_front_sha256") != item.get("sha256") \
                or side.get("status") != "concept_unreviewed" or not isinstance(side.get("prompt"), str) \
                or not side["prompt"].startswith("Use case: stylized-concept.") \
                or f"of {side_prompt_name}," not in side["prompt"] \
                or (side_prompt_name != name and not item.get("naming_note")) \
                or "side profile" not in side["prompt"]:
            raise ValueError(f"{name}: side-view provenance mismatch")
        validate_png(directory / side["file"], side.get("sha256"), side.get("width"), side.get("height"), f"{name} side")
        print(f"pass {name}: front + side {width}x{height}, transparent cutouts, hashes/provenance match")
    print("Character concepts PASS technical integrity; name/visual similarity, production sprites and final art review remain pending.")


if __name__ == "__main__":
    validate()
