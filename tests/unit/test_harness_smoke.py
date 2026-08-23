"""Smoke tests for the harness library itself."""

from __future__ import annotations

from harness import Harness, HttpClient, wav_ok
from harness.env import HarnessEnv


def test_harness_summary_pass() -> None:
    h = Harness("smoke")
    h.record("T-01", True)
    h.record("T-02", True)
    assert h.summary() == 0
    assert h.passed == 2


def test_harness_summary_fail() -> None:
    h = Harness("smoke")
    h.record("T-01", True)
    h.record("T-02", False, "boom")
    assert h.summary() == 1
    assert h.failed_ids == ["T-02"]


def test_wav_ok_rejects_short_payload() -> None:
    assert wav_ok(b"RIFF") is False


def test_http_client_env_defaults() -> None:
    env = HarnessEnv()
    client = HttpClient(env)
    assert client.env.api_base.startswith("http")
