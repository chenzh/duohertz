"""The local similarity queue must rank a known repeat without granting approval."""

from __future__ import annotations

import importlib.util
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "duohertz_similarity_prescreen", ROOT / "scripts/duohertz-similarity-prescreen.py"
)
assert SPEC and SPEC.loader
SCREEN = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SCREEN)


def test_known_shifted_repeat_ranks_ahead_of_different_pattern() -> None:
    rng = np.random.default_rng(12)
    original = rng.random((48, 12))
    original /= np.linalg.norm(original, axis=1, keepdims=True)
    shifted_repeat = np.roll(original, 4, axis=1)
    unrelated = rng.random((48, 12))
    unrelated /= np.linalg.norm(unrelated, axis=1, keepdims=True)
    rows = [{"track_id": f"dh-test-{index}"} for index in range(3)]

    pairs, considered = SCREEN.rank_pairs(rows, [original, shifted_repeat, unrelated], 3, 3)

    assert considered == 3
    assert {pairs[0]["a"], pairs[0]["b"]} == {"dh-test-0", "dh-test-1"}
    assert pairs[0]["temporal_score"] > 0.99
    assert pairs[0]["score"] > pairs[1]["score"]


def test_silent_audio_cannot_create_a_high_similarity_match() -> None:
    silent = SCREEN.chroma_seconds(np.zeros(SCREEN.SAMPLE_RATE * 21, dtype=np.float32))
    assert np.count_nonzero(silent) == 0
    assert SCREEN.aligned_similarity(silent, silent)["score"] == 0
