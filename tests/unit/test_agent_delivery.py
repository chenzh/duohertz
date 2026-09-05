"""Exercise the real merge checker with a local, read-only GitHub CLI fixture."""
import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SHA = "a" * 40


@pytest.fixture
def gate(tmp_path):
    script = tmp_path / "scripts/agent-delivery/check-merge-eligible.sh"
    script.parent.mkdir(parents=True)
    shutil.copy(ROOT / "scripts/agent-delivery/check-merge-eligible.sh", script)
    policy_path = tmp_path / ".delivery/config/merge-policy.json"
    policy_path.parent.mkdir(parents=True)
    policy = json.loads((ROOT / ".delivery/config/merge-policy.json").read_text())
    policy_path.write_text(json.dumps(policy))
    cli = tmp_path / "bin/gh"
    cli.parent.mkdir()
    cli.write_text('''#!/usr/bin/env python3
import json, os, sys
args = sys.argv[1:]
if os.getenv("FAKE_GH_ERROR") == " ".join(args[:2]):
    sys.exit(1)
if args[:2] == ["pr", "view"]:
    key = "FAKE_GH_AFTER" if args[-1] == "headRefOid,baseRefOid" else "FAKE_GH_PR"
    print(os.environ.get(key) or os.environ["FAKE_GH_PR"])
elif args[:1] == ["api"]:
    if os.getenv("FAKE_GH_ERROR") == "api":
        sys.exit(1)
    assert "--paginate" in args and "--slurp" in args
    assert args[-1] == "repos/chenzh/MusicSaas/pulls/42/files?per_page=100"
    print(os.environ["FAKE_GH_FILES"])
else:
    sys.exit("Unexpected GitHub operation: " + repr(args))
''')
    cli.chmod(0o755)

    def run(paths=("docs/guide.md",), *, metadata=None, pages=None, error=None, after=None, enabled=True, number="42"):
        pr = {
            "baseRefName": "main", "baseRefOid": "b" * 40,
            "headRefName": "cursor/docs", "headRefOid": SHA,
            "state": "OPEN", "isDraft": False, "isCrossRepository": False,
            "labels": [{"name": "agent-safe"}], "reviewDecision": "APPROVED",
            "changedFiles": len(paths),
        }
        pr.update(metadata or {})
        policy["autoMergeEnabled"] = enabled
        policy_path.write_text(json.dumps(policy))
        env = {
            **os.environ, "PATH": f"{cli.parent}{os.pathsep}{os.environ['PATH']}",
            "GITHUB_REPOSITORY": "chenzh/MusicSaas", "FAKE_GH_PR": json.dumps(pr),
            "FAKE_GH_FILES": json.dumps(pages if pages is not None else [[{"filename": path} for path in paths]]),
            "FAKE_GH_ERROR": error or "", "FAKE_GH_AFTER": json.dumps(after) if after else "",
        }
        return subprocess.run(["bash", str(script), number], env=env, capture_output=True, text=True)

    return run


@pytest.mark.parametrize("path", ["README.md", "docs/nested/guide.md", "apps/gateway/src/job.test.ts", "public/logo.svg"])
def test_allowlist_supports_root_and_nested_globs(gate, path):
    result = gate((path,))
    assert result.returncode == 0, result.stderr
    assert result.stdout.startswith(f"merge_eligible=true sha={SHA} ")


@pytest.mark.parametrize("path", [
    ".env", ".env.local", "apps/gateway/.env.production", "auth/README.md",
    "apps/gateway/auth/guard.test.ts", "migrations/001.md", "apps/gateway/migrations/001.md",
    "docs/secrets/setup.md", "payment/test.md", ".github/workflows/ci.yml",
    "docker-compose.prod.yml", "api/openapi.yaml",
])
def test_deny_wins_including_root_and_nested_paths(gate, path):
    result = gate((path,))
    assert result.returncode == 0, result.stderr
    assert "reason=deny_path" in result.stdout


@pytest.mark.parametrize("path", ["apps/gateway/src/index.ts", "docs-other/config.ts", "image.png", "some.test.ts.bak"])
def test_non_allowlisted_code_is_rejected(gate, path):
    result = gate((path,))
    assert result.returncode == 0
    assert "reason=not_in_allowlist" in result.stdout


@pytest.mark.parametrize(("metadata", "reason"), [
    ({"labels": []}, "required_labels"),
    ({"reviewDecision": None}, "review_required"),
    ({"reviewDecision": "CHANGES_REQUESTED"}, "review_required"),
    ({"isCrossRepository": True}, "pr_state"),
    ({"state": "CLOSED"}, "pr_state"),
    ({"isDraft": True}, "pr_state"),
    ({"headRefName": "feature/docs"}, "branch_prefix"),
    ({"changedFiles": 2}, "incomplete_file_list"),
])
def test_policy_and_pr_requirements(gate, metadata, reason):
    result = gate(metadata=metadata)
    assert result.returncode == 0
    assert f"reason={reason}" in result.stdout


def test_all_pages_are_checked(gate):
    result = gate(("docs/a.md", "src/code.ts"), pages=[[{"filename": "docs/a.md"}], [{"filename": "src/code.ts"}]])
    assert "reason=not_in_allowlist" in result.stdout


def test_protected_rename_cannot_escape_deny(gate):
    result = gate(pages=[[{"filename": "docs/guide.md", "previous_filename": "auth/guide.md"}]])
    assert "reason=deny_path" in result.stdout


def test_empty_diff_is_not_eligible(gate):
    assert "reason=incomplete_file_list" in gate(()).stdout


def test_pr_change_during_pagination_is_not_eligible(gate):
    result = gate(after={"headRefOid": "c" * 40, "baseRefOid": "b" * 40})
    assert "reason=pr_changed_during_check" in result.stdout


@pytest.mark.parametrize("error", ["pr view", "api"])
def test_github_failure_is_not_success(gate, error):
    result = gate(error=error)
    assert result.returncode != 0
    assert "merge_eligible=true" not in result.stdout


def test_disabled_policy_skips_github(gate):
    result = gate(enabled=False, error="pr view")
    assert result.returncode == 0
    assert "reason=auto_merge_disabled" in result.stdout


def test_invalid_pr_number_is_rejected(gate):
    result = gate(number="42\neligible=true")
    assert result.returncode != 0
    assert "merge_eligible=true" not in result.stdout
