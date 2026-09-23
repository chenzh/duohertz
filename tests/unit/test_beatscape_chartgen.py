"""Regression tests for input-safe BeatScape chart generation."""
import importlib.util
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "beatscape_chartgen", ROOT / "scripts/beatscape-chartgen.py"
)
assert SPEC and SPEC.loader
CHARTGEN = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = CHARTGEN
SPEC.loader.exec_module(CHARTGEN)


def test_slide_tail_is_retimed_out_of_a_same_lane_judgment_window():
    notes = [
        {"id": "slide", "t": 1.0, "type": "slide", "lane": 0, "to": 1, "end": 1.35},
        {"id": "chord", "t": 1.362, "type": "chord", "lanes": [1, 3]},
    ]

    CHARTGEN.resolve_slide_tail_conflicts(notes)

    tail = notes[0]["end"]
    assert abs(tail - notes[1]["t"]) >= CHARTGEN.MIN_SAME_LANE_PRESS_GAP_SEC
    assert CHARTGEN.MIN_SLIDE_DURATION_SEC <= tail - notes[0]["t"] <= CHARTGEN.MAX_SLIDE_DURATION_SEC


def test_clear_slide_tail_is_not_moved():
    notes = [
        {"id": "slide", "t": 1.0, "type": "slide", "lane": 0, "to": 1, "end": 1.35},
        {"id": "tap", "t": 1.8, "type": "tap", "lane": 1},
    ]

    CHARTGEN.resolve_slide_tail_conflicts(notes)

    assert notes[0]["end"] == 1.35
