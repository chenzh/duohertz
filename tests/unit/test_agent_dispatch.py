"""Exercise the Codex dispatch entry points without contacting external services."""
import json
import os
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
DISPATCHERS = (
    ROOT / "scripts/agent-delivery/dispatch-cursor-agent.sh",
    ROOT / "scripts/agent-delivery/dispatch-cursor-agent-cli.sh",
)


@pytest.mark.parametrize("script", DISPATCHERS)
def test_compatibility_entry_points_use_codex_dry_run(script):
    result = subprocess.run(
        ["bash", str(script), "42", "--dry-run"],
        cwd=ROOT,
        env={**os.environ, "REPO_ROOT": str(ROOT), "MULTICA_ROOT": str(ROOT)},
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
    payload = json.loads(result.stdout)
    assert payload == {
        "dry_run": True,
        "issue": 42,
        "repo_root": str(ROOT),
        "role": "engineering",
        "model": "gpt-5.6-terra",
        "reasoning_effort": "medium",
        "executor": "codex exec",
        "sandbox": "workspace-write",
        "independent_review": {
            "role": "review",
            "model": "gpt-6-astra",
            "reasoning_effort": "high",
        },
        "completion": "independently reviewed commit, merged PR with passing CI",
    }


@pytest.mark.parametrize("script", DISPATCHERS)
@pytest.mark.parametrize("issue", ["0", "-1", "42\n99"])
def test_invalid_issue_never_starts_dispatch(script, issue):
    result = subprocess.run(
        ["bash", str(script), issue, "--dry-run"],
        cwd=ROOT,
        env={**os.environ, "REPO_ROOT": str(ROOT), "MULTICA_ROOT": str(ROOT)},
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "usage:" in result.stderr


def test_dispatch_workflow_requires_designated_codex_host():
    workflow = (ROOT / ".github/workflows/agent-delivery-dispatch.yml").read_text()
    assert "local-codex-required" in workflow
    assert "codex login status" in workflow
    assert "No issue was claimed and no implementation was started" in workflow
    assert "Resolve issue queue" not in workflow
    assert "Dispatch Cloud Agents" not in workflow
