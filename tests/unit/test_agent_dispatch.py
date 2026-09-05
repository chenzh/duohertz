"""Keep local and Cloud dispatch pointed at the selected repository; no network."""
import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture
def dispatcher(tmp_path):
    repo_root = tmp_path / "product"
    scripts = repo_root / "scripts/agent-delivery"
    scripts.mkdir(parents=True)
    for name in ("dispatch-cursor-agent.sh", "dispatch-cursor-agent-cli.sh", "build-prompt.sh"):
        shutil.copy(ROOT / "scripts/agent-delivery" / name, scripts / name)
    prompt = repo_root / ".delivery/prompts/orchestrator-kickoff.md"
    prompt.parent.mkdir(parents=True)
    shutil.copy(ROOT / ".delivery/prompts/orchestrator-kickoff.md", prompt)
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    log = tmp_path / "calls.jsonl"
    payload_path = tmp_path / "payload.json"
    fake = '''#!/usr/bin/env python3
import json, os, pathlib, sys
name, args = pathlib.Path(sys.argv[0]).name, sys.argv[1:]
with open(os.environ["FAKE_CALLS"], "a") as log:
    log.write(json.dumps({"name": name, "args": args, "cwd": os.getcwd()}) + "\\n")
if name == "gh":
    if args[:2] == ["repo", "view"]:
        assert args == ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"]
        if os.getenv("FAKE_RESOLVE_FAILURE"):
            sys.exit(1)
        print("chenzh/MusicSaas")
    elif args[:2] == ["issue", "view"]:
        repo = args[args.index("--repo") + 1]
        print(json.dumps({"title": "Fix documentation", "body": "Acceptance: inspect links.", "number": 42, "url": "https://github.com/" + repo + "/issues/42"}))
    elif args[:2] not in (["issue", "edit"], ["issue", "comment"]):
        sys.exit("Unexpected gh call")
elif name == "curl":
    pathlib.Path(args[args.index("-o") + 1]).write_text('{"agent":{"id":"fixture-agent"},"run":{"id":"fixture-run"}}')
    payload = pathlib.Path(args[args.index("-d") + 1][1:]).read_text()
    pathlib.Path(os.environ["FAKE_PAYLOAD"]).write_text(payload)
    print("201", end="")
elif name == "cursor-agent":
    assert args == ["status"] or (os.getenv("FAKE_AGENT_RUN") and args[0] == "-p"), "Unexpected agent launch"
else:
    sys.exit("Unexpected executable")
'''
    for name in ("gh", "curl", "cursor-agent"):
        path = bin_dir / name
        path.write_text(fake)
        path.chmod(0o755)

    def run(mode, *, override=None, fail_resolution=False, number="42"):
        env = {key: value for key, value in os.environ.items() if key not in (
            "GITHUB_REPOSITORY", "GH_REPO", "REPO_ROOT", "LOG_DIR", "CURSOR_AGENT_BIN",
        )}
        env.update({
            "PATH": f"{bin_dir}{os.pathsep}{os.environ['PATH']}", "CURSOR_API_KEY": "fixture-key",
            "FAKE_CALLS": str(log), "FAKE_PAYLOAD": str(payload_path),
        })
        if override:
            env["GITHUB_REPOSITORY"] = override
        if fail_resolution:
            env["FAKE_RESOLVE_FAILURE"] = "1"
        if mode == "cli-run":
            env["FAKE_AGENT_RUN"] = "1"
        suffix = "-cli" if mode.startswith("cli") else ""
        args = ["bash", str(scripts / f"dispatch-cursor-agent{suffix}.sh"), number]
        if mode == "cli":
            args.append("--dry-run")
        result = subprocess.run(args, cwd=tmp_path, env=env, capture_output=True, text=True)
        calls = [json.loads(line) for line in log.read_text().splitlines()] if log.exists() else []
        payload = json.loads(payload_path.read_text()) if payload_path.exists() else None
        return result, calls, payload, repo_root

    return run


@pytest.mark.parametrize("mode", ["cloud", "cli"])
@pytest.mark.parametrize("override", [None, "example/SelectedRepo"])
def test_dispatch_uses_one_explicit_repository(dispatcher, mode, override):
    result, calls, payload, repo_root = dispatcher(mode, override=override)
    assert result.returncode == 0, result.stderr
    expected = override or "chenzh/MusicSaas"
    resolves = [call for call in calls if call["args"][:2] == ["repo", "view"]]
    assert len(resolves) == (0 if override else 1)
    assert all(call["cwd"] == str(repo_root) for call in resolves)
    issue_calls = [call for call in calls if call["name"] == "gh" and call["args"][0] == "issue"]
    assert issue_calls
    assert all(call["args"][call["args"].index("--repo") + 1] == expected for call in issue_calls)
    if mode == "cloud":
        assert payload["repos"][0]["url"] == f"https://github.com/{expected}"
        assert payload["name"] == f"{expected.split('/')[-1]}-issue-42"
        assert "<GITHUB_ISSUE_URL>" not in payload["prompt"]["text"]
        assert ".delivery/<slug>/" not in payload["prompt"]["text"]
        assert f"https://github.com/{expected}/issues/42" in payload["prompt"]["text"]
    else:
        assert payload is None
        assert [call["args"][1] for call in issue_calls] == ["view"]


@pytest.mark.parametrize("mode", ["cloud", "cli"])
def test_failed_repo_resolution_never_dispatches(dispatcher, mode):
    result, calls, payload, _ = dispatcher(mode, fail_resolution=True)
    assert result.returncode != 0
    assert payload is None
    assert all(call["name"] == "gh" and call["args"][:2] == ["repo", "view"] for call in calls)


@pytest.mark.parametrize("mode", ["cloud", "cli"])
def test_invalid_issue_number_never_calls_a_service(dispatcher, mode):
    result, calls, payload, _ = dispatcher(mode, number="42\n99")
    assert result.returncode != 0
    assert calls == []
    assert payload is None


def test_successful_cli_exit_does_not_mark_issue_done(dispatcher):
    result, calls, payload, _ = dispatcher("cli-run")
    assert result.returncode == 0, result.stderr
    assert payload is None
    edits = [call["args"] for call in calls if call["name"] == "gh" and call["args"][:2] == ["issue", "edit"]]
    assert len(edits) == 1
    assert edits[0][edits[0].index("--add-label") + 1] == "agent-running"
    assert all("agent-done" not in call["args"] for call in calls)
    comments = [call["args"][-1] for call in calls if call["args"][:2] == ["issue", "comment"]]
    assert "Awaiting PR, CI, and acceptance-evidence verification" in comments[-1]


def resolve_queue_shell():
    """Extract the actual queue step without adding a YAML runtime dependency."""
    workflow = (ROOT / ".github/workflows/agent-delivery-dispatch.yml").read_text()
    step = workflow.split("      - name: Resolve issue queue\n", 1)[1]
    script = step.split("        run: |\n", 1)[1].split("\n      - name:", 1)[0]
    return "\n".join(line[10:] if line.startswith("          ") else line for line in script.splitlines())


@pytest.mark.parametrize("label", ["agent-running", "agent-blocked", "agent-done", "human-only", "agent-assisted"])
def test_manual_queue_rejects_ineligible_issue_labels(tmp_path, label):
    cli = tmp_path / "gh"
    cli.write_text('#!/bin/sh\nprintf \'%s\\n\' "$FIXTURE_ISSUE"\n')
    cli.chmod(0o755)
    output = tmp_path / "output"
    result = subprocess.run(["bash", "-c", resolve_queue_shell()], env={
        **os.environ, "PATH": f"{tmp_path}{os.pathsep}{os.environ['PATH']}",
        "SINGLE": "42", "MAX": "1", "GITHUB_OUTPUT": str(output),
        "FIXTURE_ISSUE": json.dumps({"state": "OPEN", "labels": [{"name": "agent-safe"}, {"name": label}]}),
    }, capture_output=True, text=True)
    assert result.returncode != 0
    assert not output.exists()


def test_queue_scan_excludes_terminal_and_human_labels(tmp_path):
    cli = tmp_path / "gh"
    cli.write_text('''#!/usr/bin/env python3
import sys
args = sys.argv[1:]
assert args[:2] == ["issue", "list"]
search = args[args.index("--search") + 1].split()
assert set(search) == {"-label:agent-running", "-label:agent-blocked", "-label:agent-done", "-label:human-only", "-label:agent-assisted"}
print("[]")
''')
    cli.chmod(0o755)
    output = tmp_path / "output"
    result = subprocess.run(["bash", "-c", resolve_queue_shell()], env={
        **os.environ, "PATH": f"{tmp_path}{os.pathsep}{os.environ['PATH']}",
        "SINGLE": "", "MAX": "2", "GITHUB_OUTPUT": str(output),
    }, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    assert output.read_text() == "numbers=\n"
