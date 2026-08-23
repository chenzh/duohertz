"""Pytest configuration — ensure workers and harness are importable."""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tests"))
sys.path.insert(0, str(ROOT / "workers"))
sys.path.insert(0, str(ROOT / "workers" / "ace-step"))
sys.path.insert(0, str(ROOT / "workers" / "sa3"))

os.environ.setdefault("WORKER_MODE", "synth")
os.environ.setdefault("WORKER_SECRET", "harness-test-secret")
os.environ.setdefault("ACE_FALLBACK_SYNTH", "true")
