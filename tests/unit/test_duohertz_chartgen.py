"""New one/two-key chart generation follows audible events in its own audio."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("duohertz_chartgen", ROOT / "scripts/duohertz-chartgen.py")
assert SPEC and SPEC.loader
chartgen = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = chartgen
SPEC.loader.exec_module(chartgen)


def test_one_and_two_key_tiers_use_real_onsets_and_chords_only_on_hard() -> None:
    bpm = 120
    beat = 60 / bpm
    onsets = sorted({round(slot * beat / 4 + 0.009, 3) for slot in range(16, 160)})
    onsets += [3.057, 8.061]  # high-energy off-grid transients must not define chart times
    onsets.sort()
    energies = [100_000 if value in {3.057, 8.061} else 2_000 for value in onsets]
    charts = {tier: chartgen.make_chart(track_id="dh-test", tier=tier, bpm=bpm,
                                        duration=20, onsets=onsets, energies=energies)
              for tier in ("easy", "standard", "hard")}

    assert 0 < len(charts["easy"]["notes"]) < len(charts["standard"]["notes"]) < len(charts["hard"]["notes"])
    for tier, chart in charts.items():
        assert chart["input_count"] == (1 if tier == "easy" else 2)
        assert all(note["t"] in onsets for note in chart["notes"])
        assert all(note["t"] not in {3.057, 8.061} for note in chart["notes"])
        assert chart["total_notes"] == sum(2 if note["type"] == "chord" else 1 for note in chart["notes"])
    assert {note["key"] for note in charts["standard"]["notes"]} == {0, 1}
    assert all(note["type"] == "tap" and note["key"] == 0 for note in charts["easy"]["notes"])
    assert any(note["type"] == "chord" for note in charts["hard"]["notes"])
    assert all(note["keys"] == [0, 1] for note in charts["hard"]["notes"] if note["type"] == "chord")


def test_fast_chart_rejects_louder_transients_outside_beat_relative_grid_margin() -> None:
    bpm = 172
    eighth = 60 / bpm / 2
    onsets = []
    energies = []
    for slot in range(12, 100):
        onsets.extend((round(slot * eighth + 0.009, 3), round(slot * eighth + 0.031, 3)))
        energies.extend((2_000, 100_000))
    chart = chartgen.make_chart(track_id="dh-fast", tier="hard", bpm=bpm,
                                duration=20, onsets=onsets, energies=energies)
    assert len(chart["notes"]) > 20
    assert all(min(abs(note["t"] - (slot * eighth + 0.009)) for slot in range(12, 100)) < 0.002
               for note in chart["notes"])


def test_measured_pulse_prevents_sparse_charts_from_small_bpm_drift() -> None:
    target_bpm = 142
    measured_bpm = 142.857142857
    sixteenth = 60 / measured_bpm / 4
    onsets = [round(slot * sixteenth, 3) for slot in range(16, 600)]
    energies = [2000.0] * len(onsets)
    target_chart = chartgen.make_chart(track_id="dh-drift", tier="easy", bpm=target_bpm,
                                       duration=64, onsets=onsets, energies=energies)
    resolved_bpm = chartgen.choose_chart_bpm(target_bpm, measured_bpm)
    measured_chart = chartgen.make_chart(track_id="dh-drift", tier="easy", bpm=resolved_bpm,
                                         duration=64, onsets=onsets, energies=energies)
    assert resolved_bpm == 142.857
    assert len(measured_chart["notes"]) > len(target_chart["notes"]) + 25
    assert measured_chart["notes"][-1]["t"] > 60


def test_large_bpm_drift_refuses_chart_generation() -> None:
    with pytest.raises(ValueError, match="remake or inspect"):
        chartgen.choose_chart_bpm(136, 130.4)
