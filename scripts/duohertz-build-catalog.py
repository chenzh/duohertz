#!/usr/bin/env python3
"""Stage a duohertz catalog only after complete content and signed evidence.

This creates an isolated artifact, never the legacy public catalog. Passing this
gate does not approve the website, character art, brand copy or deployment.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import contextlib
import hashlib
import importlib.util
import io
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CANDIDATES = ROOT / "apps/beatscape/candidates/duohertz"
REVIEW_GATES = ("earcheck", "content", "rights", "art")


def module(name: str, filename: str):
    path = ROOT / "scripts" / filename
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {filename}")
    loaded = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = loaded
    spec.loader.exec_module(loaded)
    return loaded


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def manifest(root: Path, track_id: str) -> dict:
    return json.loads((root / track_id / "manifest.json").read_text(encoding="utf-8"))


def stream_master_blockers(root: Path, tracks: list[dict]) -> tuple[list[str], dict[str, float]]:
    gate = module("duohertz_candidate_gate_for_catalog_build", "duohertz-candidate-gate.py")
    blockers: list[str] = []
    lengths: dict[str, float] = {}
    for track in tracks:
        track_id = track["track_id"]
        data = manifest(root, track_id)
        files = data["files_sha256"]
        if files["stream.m4a"] == files["audio.m4a"]:
            blockers.append(f"{track_id}: stream master is identical to game audio")
            continue
        actual = gate.duration(root / track_id / "stream.m4a")
        if actual < data["duration_sec"] * 1.8:
            blockers.append(f"{track_id}: stream master {actual:.1f}s is shorter than game audio × 1.8")
        lengths[track_id] = actual
    return blockers, lengths


def assert_audio_peak(root: Path, tracks: list[dict]) -> None:
    """Require every signed game, preview and stream AAC to pass the peak screen."""
    audio_gate = module("duohertz_audio_gate_for_catalog_build", "duohertz-audio-gate.py")
    paths = [root / track["track_id"] / name for track in tracks for name in audio_gate.AUDIO_FILES]
    with ThreadPoolExecutor(max_workers=6) as pool:
        measurements = list(pool.map(audio_gate.measure, paths))
    for path, _, peak in measurements:
        if peak > -1.0:
            raise ValueError(f"{path.parent.name}/{path.name}: {peak:.2f} dBTP exceeds audio peak gate")


def evidence_file(signoff_path: Path, entry: dict, track_id: str, kind: str) -> None:
    relative = entry.get("evidence")
    fingerprint = entry.get("sha256")
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute() \
            or ".." in Path(relative).parts or not isinstance(fingerprint, str) \
            or not re.fullmatch(r"[a-f0-9]{64}", fingerprint):
        raise ValueError(f"{track_id}/{kind}: invalid evidence reference")
    base = signoff_path.parent.resolve()
    reference = base / relative
    path = reference.resolve()
    if reference.is_symlink() or not path.is_relative_to(base) or not path.is_file() or sha(path) != fingerprint:
        raise ValueError(f"{track_id}/{kind}: missing or changed evidence")


def verify_signoff(root: Path, tracks: list[dict], observations_path: Path, signoff_path: Path) -> dict:
    if signoff_path.is_symlink():
        raise ValueError("Signoff file cannot be a symlink")
    data = json.loads(signoff_path.read_text(encoding="utf-8"))
    review = module("duohertz_review_audit_for_catalog_build", "duohertz-review-audit.py")
    if not isinstance(data, dict) or data.get("schema") != 1 \
            or data.get("scope") != "duohertz_catalog_signoff" \
            or data.get("catalogApproval") is not True:
        raise ValueError("Missing explicit duohertz catalog signoff")
    if not isinstance(data.get("approvedBy"), str) or not data["approvedBy"].strip():
        raise ValueError("Catalog approver is missing")
    approved_at = review.timestamp(data.get("approvedAt"), "catalog approval")
    if data.get("observations_sha256") != sha(observations_path):
        raise ValueError("Catalog signoff does not bind the current observation export")
    observations = json.loads(observations_path.read_text(encoding="utf-8"))
    if not isinstance(observations, dict) or review.timestamp(observations.get("exportedAt"), "observation export") > approved_at:
        raise ValueError("Catalog approval predates the observation export")
    rows = data.get("tracks")
    if not isinstance(rows, list) or len(rows) != len(tracks):
        raise ValueError("Catalog signoff must cover every staged track")
    by_id = {track["track_id"]: track for track in tracks}
    seen: set[str] = set()
    for row in rows:
        if not isinstance(row, dict) or row.get("track_id") not in by_id:
            raise ValueError("Catalog signoff has an unknown track")
        track_id = row["track_id"]
        if track_id in seen or row.get("manifest_sha256") != sha(root / track_id / "manifest.json"):
            raise ValueError(f"Duplicate or stale catalog signoff: {track_id}")
        seen.add(track_id)
        for kind in REVIEW_GATES:
            item = row.get(kind)
            if not isinstance(item, dict) or item.get("status") != "pass" \
                    or not isinstance(item.get("reviewedBy"), str) or not item["reviewedBy"].strip() \
                    or review.timestamp(item.get("reviewedAt"), f"{track_id}/{kind}") > approved_at:
                raise ValueError(f"{track_id}/{kind}: passing human record is missing")
            evidence_file(signoff_path, item, track_id, kind)
    return data


def catalog(tracks: list[dict], root: Path, stream_lengths: dict[str, float],
            observations_path: Path, signoff_path: Path) -> dict:
    entries = []
    for track in tracks:
        track_id = track["track_id"]
        data = manifest(root, track_id)
        base = f"/catalog/{track_id}"
        entries.append({
            "track_id": track_id,
            "title": data["title"],
            "artist": data["artist"],
            "genre": data["subgenre"],
            "bpm": data["bpm"],
            "duration_sec": data["duration_sec"],
            "stream_duration_sec": round(stream_lengths[track_id], 3),
            "theme": "duohertz",
            "chart_format": 2,
            "rights": "signed_catalog_candidate",
            "audio": f"{base}/audio.m4a",
            "stream_audio": f"{base}/stream.m4a",
            "preview": f"{base}/preview_48s.m4a",
            # An SVG loaded as <img> cannot reliably load its external
            # cover-art.png reference. Use the self-contained bitmap.
            "cover": f"{base}/cover-art.png",
            "cover_thumb": f"{base}/cover-thumb.webp",
            "og": f"{base}/og.png",
            "charts": {tier: f"{base}/{tier}.json" for tier in ("easy", "standard", "hard")},
            "manifest_sha256": sha(root / track_id / "manifest.json"),
        })
    return {
        "version": 2,
        "brand": "duohertz",
        "tracks": entries,
        "source_observations_sha256": sha(observations_path),
        "source_catalog_signoff_sha256": sha(signoff_path),
        "site_and_deployment_approval": False,
    }


def stage(output: Path, root: Path, catalog_data: dict) -> None:
    output = output.resolve()
    if output.exists() or output.is_relative_to((ROOT / "apps/beatscape/public").resolve()) \
            or output.is_relative_to(root.resolve()):
        raise ValueError("Output must be a new isolated directory outside public/ and candidates/")
    output.parent.mkdir(parents=True, exist_ok=True)
    files = module("duohertz_candidate_gate_for_copy", "duohertz-candidate-gate.py").FILES
    thumbs = module("duohertz_thumbs_for_catalog_build", "duohertz-cover-thumbs.py")
    staged_catalog = json.loads(json.dumps(catalog_data))
    with tempfile.TemporaryDirectory(prefix="duohertz-catalog-", dir=output.parent) as temp:
        staged = Path(temp)
        target_root = staged / "catalog"
        target_root.mkdir()
        for track in staged_catalog["tracks"]:
            source = root / track["track_id"]
            destination = target_root / track["track_id"]
            destination.mkdir()
            source_manifest = manifest(root, track["track_id"])
            for name in (*files, "manifest.json"):
                shutil.copyfile(source / name, destination / name)
                expected = track["manifest_sha256"] if name == "manifest.json" else source_manifest["files_sha256"][name]
                if sha(destination / name) != expected:
                    raise ValueError(f"{track['track_id']}/{name}: asset changed while staging")
            track["cover_thumb_sha256"] = thumbs.encode(destination / "cover-art.png", destination / "cover-thumb.webp")
        (staged / "catalog.json").write_text(json.dumps(staged_catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        staged.rename(output)


def build(root: Path, observations_path: Path | None, signoff_path: Path | None,
          output: Path | None = None) -> dict:
    structure = module("duohertz_structure_for_catalog_build", "duohertz-catalog-structure.py")
    tracks = structure.inspect(root)
    report = structure.assess(tracks)
    blockers: list[str] = []
    if not report["technical_structure_pass"]:
        blockers.append(f"Catalog incomplete: {report['staged_tracks']}/105 tracks, {report['staged_charts']}/315 charts")
    master_blockers, stream_lengths = stream_master_blockers(root, tracks)
    blockers.extend(master_blockers)
    if observations_path is None:
        blockers.append("Missing human observation export")
    if signoff_path is None:
        blockers.append("Missing separate catalog signoff")
    if blockers:
        return {"catalog_stage_ready": False, "blockers": blockers, "site_and_deployment_approval": False}

    assert observations_path is not None and signoff_path is not None
    review = module("duohertz_review_audit_for_catalog_check", "duohertz-review-audit.py")
    observation_data = json.loads(observations_path.read_text(encoding="utf-8"))
    observation_report = review.audit(root, observation_data)
    if not observation_report["all_observations_pass"]:
        raise ValueError("Human observations are incomplete or require revision")
    verify_signoff(root, tracks, observations_path, signoff_path)
    gate = module("duohertz_candidate_gate_for_catalog_check", "duohertz-candidate-gate.py")
    with contextlib.redirect_stdout(io.StringIO()):
        for track in tracks:
            gate.validate(root / track["track_id"])
    assert_audio_peak(root, tracks)
    result = catalog(tracks, root, stream_lengths, observations_path, signoff_path)
    if output is not None:
        stage(output, root, result)
    return {"catalog_stage_ready": True, "staged_tracks": len(tracks), "staged_charts": len(tracks) * 3,
            "output": str(output.resolve()) if output else None, "site_and_deployment_approval": False}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=DEFAULT_CANDIDATES)
    parser.add_argument("--observations", type=Path)
    parser.add_argument("--signoff", type=Path)
    parser.add_argument("--out", type=Path, help="New isolated output directory; never apps/beatscape/public")
    args = parser.parse_args()
    try:
        result = build(args.root.resolve(), args.observations, args.signoff, args.out)
    except (ValueError, RuntimeError, OSError, KeyError, TypeError, json.JSONDecodeError,
            subprocess.CalledProcessError) as exc:
        print(f"FAIL {exc}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["catalog_stage_ready"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
