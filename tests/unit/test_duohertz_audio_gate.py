"""The AAC screen uses decoded true peak and rejects unusable measurements."""

from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("duohertz_audio_gate", ROOT / "scripts/duohertz-audio-gate.py")
assert SPEC and SPEC.loader
GATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)


def test_parse_ffmpeg_loudnorm_input_values() -> None:
    output = '''{"input_i":"-17.20","input_tp":"3.60","output_tp":"-1.00"}'''
    assert GATE.parse_measurement(output) == (-17.2, 3.6)


@pytest.mark.parametrize("output", ["", '{"input_i":"-inf","input_tp":"-2.0"}',
                                      '{"input_i":"-17.2","input_tp":"nan"}'])
def test_rejects_missing_or_invalid_measurement(output: str) -> None:
    with pytest.raises(ValueError):
        GATE.parse_measurement(output)
