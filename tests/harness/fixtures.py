"""Load shared test payloads from tests/fixtures/."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures"


@lru_cache(maxsize=8)
def _load_json(relative_path: str) -> dict[str, Any]:
    path = FIXTURES_DIR / relative_path
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def load_payload(name: str, *, file: str = "payloads/jobs.json") -> dict[str, Any]:
    """Return a named job payload from fixtures (e.g. ``game_bgm_valid``)."""
    data = _load_json(file)
    if name not in data:
        raise KeyError(f"fixture {name!r} not found in {file}")
    payload = data[name]
    if not isinstance(payload, dict):
        raise TypeError(f"fixture {name!r} must be a JSON object")
    return dict(payload)
