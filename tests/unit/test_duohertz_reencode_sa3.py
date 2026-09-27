"""Audio rework must keep the source-master provenance intact."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("duohertz_reencode_sa3", ROOT / "scripts/duohertz-reencode-sa3.py")
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def test_rejects_unmatched_source_master_before_copying_candidate(tmp_path: Path) -> None:
    candidate = tmp_path / "dh-test"
    candidate.mkdir()
    (candidate / "manifest.json").write_text(json.dumps({
        "track_id": "dh-test", "source_master_sha256": "0" * 64,
    }), encoding="utf-8")
    master = tmp_path / "source.wav"
    master.write_bytes(b"different master")
    output = tmp_path / "rebuild"
    with pytest.raises(ValueError, match="Source master hash"):
        MODULE.reencode(candidate, master, output, gain_db=-3)
    assert not output.exists()
