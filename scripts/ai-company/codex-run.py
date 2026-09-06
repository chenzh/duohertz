#!/usr/bin/env python3
"""Company model routing. Never inherits the interactive user's model or effort."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile


def worker_env(workspace):
    env = dict(os.environ)
    # Go's default macOS cache is outside the worker sandbox; use a private temp cache.
    key = hashlib.sha256(str(Path(workspace).resolve()).encode()).hexdigest()[:16]
    cache = Path(tempfile.gettempdir()) / 'codex-company-cache' / key / 'go-build'
    cache.mkdir(parents=True, exist_ok=True, mode=0o700)
    env['GOCACHE'] = str(cache)
    return env


def route(role=None, allow_job_overrides=True):
    root = Path(os.environ.get("MULTICA_ROOT", Path(__file__).resolve().parents[2]))
    config = Path(os.environ.get("CODEX_MODELS_CONFIG", root / ".ai-company/config/codex-models.json"))
    data = json.loads(config.read_text())
    role = role or os.environ.get("CODEX_ROLE", data["default_role"])
    if role not in data["roles"]:
        raise ValueError(f"Unknown Codex role: {role}")
    selected = dict(data["roles"][role])
    if allow_job_overrides:
        selected["model"] = os.environ.get("CODEX_MODEL", selected["model"])
        selected["reasoning_effort"] = os.environ.get("CODEX_REASONING_EFFORT", selected["reasoning_effort"])
    if selected["reasoning_effort"] not in {"low", "medium", "high", "xhigh", "max", "ultra"}:
        raise ValueError("Invalid CODEX_REASONING_EFFORT")
    return {"role": role, **selected}


def command(workspace, selected, output=None, sandbox="workspace-write", json_output=True):
    args = [os.environ.get("CODEX_BIN", "codex"), "exec", "--ephemeral", "--ignore-user-config",
            "-C", str(workspace), "-m", selected["model"],
            "-c", 'model_reasoning_effort="' + selected["reasoning_effort"] + '"']
    if sandbox == "workspace-write":
        args.append("--approve-for-me")
    else:
        args.extend(["-s", sandbox])
    if json_output:
        args.append("--json")
    if output:
        args.extend(["--output-last-message", str(output)])
    args.append("-")
    return args


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--role")
    parser.add_argument("--workspace", default=os.getcwd())
    parser.add_argument("--prompt-file")
    parser.add_argument("--output")
    parser.add_argument("--read-only", action="store_true")
    parser.add_argument("--show-config", action="store_true")
    args = parser.parse_args()
    selected = route(args.role)
    if args.show_config:
        print(json.dumps(selected))
        return 0
    prompt = Path(args.prompt_file).read_text() if args.prompt_file else sys.stdin.read()
    # stdin keeps task content out of the process list. No shell interpolation.
    return subprocess.run(command(args.workspace, selected, args.output,
                                  "read-only" if args.read_only else "workspace-write"),
                          input=prompt, text=True, env=worker_env(args.workspace)).returncode


if __name__ == "__main__":
    sys.exit(main())
