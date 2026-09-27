#!/usr/bin/env python3
"""Stage independently reviewed duohertz characters without approving the website."""

from __future__ import annotations

import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
ROLES = {"Attacker", "Support", "Buffer"}
REVIEW_GATES = ("name", "rights", "art", "copy")
HASH = re.compile(r"[a-f0-9]{64}\Z")
ID = re.compile(r"dh-char-[a-z0-9]+(?:-[a-z0-9]+)*\Z")
COPY_FIELDS = ("name", "title", "region", "height", "identity", "traits", "quote", "story", "alt", "side_alt")
PUBLIC_FIELDS = ("id", "name", "title", "role", "region", "height", "identity", "traits", "quote",
                 "story", "art", "side_art", "alt", "side_alt", "art_sha256", "side_art_sha256")
FORBIDDEN_SOURCE_ROOTS = (
    ROOT / "apps/beatscape/candidates",
    ROOT / "apps/beatscape/public",
)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def text(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def timestamp(value: object, label: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError(f"{label}: timestamp with timezone is required")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"{label}: invalid timestamp") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(f"{label}: timestamp with timezone is required")
    return parsed


def evidence(signoff_path: Path, row: dict, label: str, approved_at: datetime) -> None:
    if row.get("status") != "pass" or not text(row.get("reviewedBy")) \
            or timestamp(row.get("reviewedAt"), label) > approved_at:
        raise ValueError(f"{label}: passing human review is missing or late")
    relative = row.get("evidence")
    fingerprint = row.get("sha256")
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute() \
            or ".." in Path(relative).parts or not isinstance(fingerprint, str) or not HASH.fullmatch(fingerprint):
        raise ValueError(f"{label}: invalid evidence reference")
    base = signoff_path.parent.resolve()
    reference = base / relative
    file = reference.resolve()
    if reference.is_symlink() or not file.is_relative_to(base) or not file.is_file() or sha(file) != fingerprint:
        raise ValueError(f"{label}: missing or changed evidence")


def png(path: Path, fingerprint: object, label: str) -> None:
    if path.is_symlink() or not path.is_file() or not isinstance(fingerprint, str) \
            or not HASH.fullmatch(fingerprint) or sha(path) != fingerprint:
        raise ValueError(f"{label}: missing or changed art")
    header = path.read_bytes()[:26]
    if len(header) < 26 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise ValueError(f"{label}: invalid PNG")
    width, height = struct.unpack(">II", header[16:24])
    if width < 512 or height < 768 or header[24:26] != b"\x08\x06":
        raise ValueError(f"{label}: expected a transparent RGBA PNG of at least 512×768")
    try:
        def alpha_at(x: int, y: int) -> int:
            pixel = subprocess.run(
                ["ffmpeg", "-v", "error", "-i", str(path), "-vf", f"crop=1:1:{x}:{y},format=rgba",
                 "-frames:v", "1", "-f", "rawvideo", "-"],
                check=True, capture_output=True,
            ).stdout
            if len(pixel) != 4:
                raise ValueError(f"{label}: cannot inspect alpha")
            return pixel[3]

        if alpha_at(0, 0) != 0 or alpha_at(width // 2, height // 2) < 200:
            raise ValueError(f"{label}: corner must be transparent and the character body visible")
    except (FileNotFoundError, subprocess.CalledProcessError) as exc:
        raise ValueError(f"{label}: PNG cannot be decoded") from exc


def roster(path: Path) -> list[dict]:
    resolved = path.resolve()
    if path.is_symlink() or any(resolved.is_relative_to(root.resolve()) for root in FORBIDDEN_SOURCE_ROOTS):
        raise ValueError("Reviewed roster must be separate from candidates and public assets")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or data.get("schema") != 1 or data.get("brand") != "duohertz" \
            or not isinstance(data.get("characters"), list) or len(data["characters"]) != 3:
        raise ValueError("Expected a separate three-character duohertz reviewed roster")
    names: set[str] = set()
    ids: set[str] = set()
    roles: set[str] = set()
    for entry in data["characters"]:
        if not isinstance(entry, dict) or not isinstance(entry.get("id"), str) or not ID.fullmatch(entry["id"]) \
                or entry["id"] in ids or not isinstance(entry.get("role"), str) \
                or entry["role"] not in ROLES or entry["role"] in roles \
                or any(not text(entry.get(field)) for field in COPY_FIELDS) \
                or entry["name"].strip().casefold() in names:
            raise ValueError("Invalid duohertz reviewed character identity or copy")
        if not 120 <= len(entry["story"].split()) <= 180:
            raise ValueError(f"{entry['id']}: background story must be 120–180 words")
        character_id = entry["id"]
        for key, filename in (("art", "front.png"), ("side_art", "side.png")):
            expected = f"/characters/{character_id}/{filename}"
            if entry.get(key) != expected:
                raise ValueError(f"{character_id}: invalid {key} path")
            art_path = path.parent / expected.lstrip("/")
            if not art_path.resolve().is_relative_to(path.parent.resolve()):
                raise ValueError(f"{character_id}: art escapes the reviewed roster")
            png(art_path, entry.get(f"{key}_sha256"), f"{character_id}/{filename}")
        names.add(entry["name"].strip().casefold())
        ids.add(character_id)
        roles.add(entry["role"])
    return data["characters"]


def signoff(path: Path, roster_path: Path, entries: list[dict]) -> None:
    if path.is_symlink():
        raise ValueError("Character signoff file cannot be a symlink")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or data.get("schema") != 1 \
            or data.get("scope") != "duohertz_character_signoff" \
            or data.get("charactersApproval") is not True \
            or not text(data.get("approvedBy")) or data.get("roster_sha256") != sha(roster_path):
        raise ValueError("Missing or stale duohertz character signoff")
    approved_at = timestamp(data.get("approvedAt"), "character approval")
    rows = data.get("characters")
    if not isinstance(rows, list) or len(rows) != len(entries):
        raise ValueError("Character signoff must cover all three reviewed characters")
    expected = {entry["id"] for entry in entries}
    seen: set[str] = set()
    for row in rows:
        if not isinstance(row, dict) or row.get("id") not in expected or row["id"] in seen:
            raise ValueError("Character signoff contains a duplicate or unknown character")
        seen.add(row["id"])
        for kind in REVIEW_GATES:
            record = row.get(kind)
            if not isinstance(record, dict):
                raise ValueError(f"{row['id']}/{kind}: passing human review is missing")
            evidence(path, record, f"{row['id']}/{kind}", approved_at)


def catalog(entries: list[dict], signoff_path: Path) -> dict:
    return {
        "version": 1,
        "brand": "duohertz",
        "source_character_signoff_sha256": sha(signoff_path),
        "site_and_deployment_approval": False,
        "characters": [{field: entry[field] for field in PUBLIC_FIELDS} for entry in entries],
    }


def stage(output: Path, source: Path, data: dict) -> None:
    output = output.resolve()
    if output.exists() or output.is_relative_to(source.resolve()) \
            or any(output.is_relative_to(root.resolve()) for root in FORBIDDEN_SOURCE_ROOTS):
        raise ValueError("Output must be a new isolated directory outside source, candidates and public/")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="duohertz-characters-", dir=output.parent) as temp:
        staged = Path(temp)
        for entry in data["characters"]:
            target = staged / "characters" / entry["id"]
            target.mkdir(parents=True)
            for field, filename in (("art", "front.png"), ("side_art", "side.png")):
                asset = target / filename
                shutil.copyfile(source / "characters" / entry["id"] / filename, asset)
                if sha(asset) != entry[f"{field}_sha256"]:
                    raise ValueError(f"{entry['id']}/{filename}: art changed while staging")
        (staged / "characters.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        staged.rename(output)


def build(roster_path: Path | None, signoff_path: Path | None, output: Path | None = None) -> dict:
    blockers = []
    if roster_path is None:
        blockers.append("Missing separately reviewed character roster")
    if signoff_path is None:
        blockers.append("Missing independent character signoff")
    if blockers:
        return {"character_stage_ready": False, "blockers": blockers, "site_and_deployment_approval": False}
    assert roster_path is not None and signoff_path is not None
    entries = roster(roster_path)
    signoff(signoff_path, roster_path, entries)
    data = catalog(entries, signoff_path)
    if output is not None:
        stage(output, roster_path.parent, data)
    return {"character_stage_ready": True, "staged_characters": len(entries),
            "output": str(output.resolve()) if output else None, "site_and_deployment_approval": False}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--roster", type=Path, help="Reviewed roster JSON outside candidate/public directories")
    parser.add_argument("--signoff", type=Path, help="Independent human signoff with hashed evidence")
    parser.add_argument("--out", type=Path, help="New isolated output directory; never public/")
    args = parser.parse_args()
    try:
        result = build(args.roster, args.signoff, args.out)
    except (ValueError, OSError, KeyError, TypeError, json.JSONDecodeError) as exc:
        print(f"FAIL {exc}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["character_stage_ready"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
