"""Harness environment and tier detection."""

from __future__ import annotations

import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Literal

Tier = Literal["unit", "integration", "e2e", "mlx"]


@dataclass(frozen=True)
class HarnessEnv:
    api_base: str = os.getenv("API_BASE", "http://127.0.0.1:8080")
    api_key: str = os.getenv("API_KEY", "dev-api-key-change-me")
    bad_api_key: str = os.getenv("BAD_API_KEY", "wrong-key")
    alt_api_key: str = os.getenv("ALT_API_KEY", "dev-api-key-alt")
    demo_base: str = os.getenv("DEMO_BASE", "http://127.0.0.1:8080/demo")
    gateway_base: str = os.getenv("GATEWAY_BASE", "http://127.0.0.1:8080")
    integration: bool = os.getenv("INTEGRATION", "true").lower() == "true"
    job_poll_timeout: int = int(os.getenv("JOB_POLL_TIMEOUT", "180"))


def _probe(url: str, timeout: float = 2.0) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as res:
            return 200 <= res.status < 500
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def detect_tier() -> Tier | None:
    """Return the highest tier the current environment can run, or None if only unit."""
    env = HarnessEnv()
    gateway_ok = _probe(f"{env.gateway_base.rstrip('/')}/v1/health")
    if not gateway_ok:
        return None
    if os.getenv("MLX_HARNESS", "").lower() == "true":
        return "mlx"
    demo_ok = _probe(env.demo_base.rstrip("/") + "/")
    if demo_ok:
        return "e2e"
    return "integration"
