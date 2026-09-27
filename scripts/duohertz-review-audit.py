#!/usr/bin/env python3
"""Check human observation exports against exact staged duohertz assets.

This checks identity, completeness and freshness only. A worksheet export is
not rights clearance, formal art approval or release signoff, even if every
observation says pass. This command never promotes content into a catalog.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CANDIDATES = ROOT / "apps/beatscape/candidates/duohertz"
QUESTIONS = ("audioQuality", "distinctness", "allAges", "subgenreFit", "chartFeel", "visual")
VERDICTS = {"pass", "revise", "reject"}


def worksheet_module():
    path = ROOT / "scripts/duohertz-review-worksheet.py"
    spec = importlib.util.spec_from_file_location("duohertz_review_worksheet_for_audit", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load duohertz review worksheet")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def timestamp(value: object, label: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError(f"Missing {label} timestamp")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"Invalid {label} timestamp") from exc
    if parsed.tzinfo is None:
        raise ValueError(f"{label} timestamp needs a timezone")
    return parsed


def audit(root: Path, report: dict | None) -> dict:
    current = worksheet_module().candidates(root)
    by_id = {track["track_id"]: track for track in current}
    observations: dict[str, dict] = {}
    if report is not None:
        if not isinstance(report, dict) or report.get("schema") != 1 \
                or report.get("scope") != "duohertz_candidate_observations" \
                or report.get("releaseApproval") is not False:
            raise ValueError("Expected a worksheet observation export with releaseApproval=false")
        if not isinstance(report.get("reviewer"), str) or not report["reviewer"].strip():
            raise ValueError("Reviewer name is missing")
        exported_at = timestamp(report.get("exportedAt"), "export")
        rows = report.get("tracks")
        if not isinstance(rows, list):
            raise ValueError("Observation tracks must be a list")
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get("track_id"), str):
                raise ValueError("Invalid observation track row")
            track_id = row["track_id"]
            if track_id in observations or track_id not in by_id:
                raise ValueError(f"Duplicate or unknown observation: {track_id}")
            expected = by_id[track_id]
            for field in ("title", "subgenre", "fingerprint", "manifest_sha256", "assets_sha256", "rights_status"):
                if row.get(field) != expected[field]:
                    raise ValueError(f"Stale or mismatched observation: {track_id}/{field}")
            verdicts = row.get("verdicts")
            if not isinstance(verdicts, dict) or set(verdicts) - set(QUESTIONS) \
                    or any(not isinstance(value, str) or value not in VERDICTS for value in verdicts.values()):
                raise ValueError(f"Invalid verdicts: {track_id}")
            if not isinstance(row.get("notes"), str):
                raise ValueError(f"Invalid reviewer notes: {track_id}")
            if row.get("reviewedAt") is not None:
                if timestamp(row["reviewedAt"], "review") > exported_at:
                    raise ValueError(f"Review timestamp after export: {track_id}")
            observations[track_id] = row

    complete: list[str] = []
    passed: list[str] = []
    needs_revision: list[str] = []
    pending: list[str] = []
    for track_id in by_id:
        row = observations.get(track_id)
        if row is None or row.get("reviewedAt") is None or set(row["verdicts"]) != set(QUESTIONS):
            pending.append(track_id)
            continue
        if any(value != "pass" for value in row["verdicts"].values()) and not row["notes"].strip():
            pending.append(track_id)
            continue
        complete.append(track_id)
        if all(value == "pass" for value in row["verdicts"].values()):
            passed.append(track_id)
        else:
            needs_revision.append(track_id)
    return {
        "schema": 1,
        "scope": "duohertz_review_observation_audit",
        "staged_tracks": len(current),
        "matched_records": len(observations),
        "complete_observations": len(complete),
        "pass_observations": len(passed),
        "pending_track_ids": pending,
        "needs_revision_track_ids": needs_revision,
        "all_observations_pass": len(passed) == len(current),
        "rights_art_and_release_signoff": "not_assessed_here",
        "release_approved": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=DEFAULT_CANDIDATES)
    parser.add_argument("--report", type=Path, help="JSON exported by the local review worksheet")
    args = parser.parse_args()
    try:
        report = json.loads(args.report.read_text(encoding="utf-8")) if args.report else None
        result = audit(args.root.resolve(), report)
    except (ValueError, OSError, KeyError, json.JSONDecodeError) as exc:
        print(f"FAIL {exc}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["all_observations_pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
