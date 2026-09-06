# Codex delivery runtime

The company dispatcher uses the official `codex` CLI authenticated on the execution host (`codex login status`), Python 3, Git, and an authenticated `gh` CLI. Role routing comes from `.ai-company/config/codex-models.json`.

## Dispatch

```bash
# Inspect routing without starting models or contacting GitHub.
python3 scripts/agent-delivery/dispatch_codex.py 123 --dry-run

# Implement and review an authorized issue; keep the result local.
bash scripts/agent-delivery/dispatch-codex-cli.sh 123 --local-only

# Publish only when the repository and operation are authorized.
bash scripts/agent-delivery/dispatch-codex-cli.sh 123
```

Issues must be open and eligible under the existing `agent-safe` and state-label rules. The dispatcher uses an isolated worktree and an OS lock. Local-only mode still calls the implementation and review models and updates issue state; it is not an offline or read-only command.

## Independent review

The implementation worker commits locally. A separate read-only session then reviews the exact base and head commits using the `review` role (currently `gpt-6-astra`, high reasoning). Worker-level `CODEX_MODEL` and `CODEX_REASONING_EFFORT` overrides do not change the reviewer. Review emits a structured verdict, commit IDs, findings, and model usage into `.delivery/.agent-runs/review-<run-id>/review.json`.

The supervisor stops before publishing if review requests changes, cannot complete, times out, returns invalid output, or the worktree changes. `CODEX_REVIEW_TIMEOUT_SECONDS` defaults to 600. A passing review permits the next already-authorized step; it does not verify acceptance tests or CI. The supervisor pushes the exact reviewed commit, checks the publication pause again before creating a PR, and records the resulting PR head and checks.

`company-publication-paused` under `MULTICA_STATE_DIR` (default `~/.multica`) prevents automatic publication. Keep it in place while publication authorization is pending. Dry-run is safe while paused; local-only still needs authorization to send the specific project data to Codex.

This review applies to dispatches through `dispatch_codex.py`. Existing PRs, older cloud workflows, and other merge entry points do not acquire a review retroactively. Existing acceptance cases, CI, file-scope policy, branch protection, review requirements, and deployment permissions remain separate gates.

Legacy `dispatch-cursor-agent*.sh` filenames are compatibility entry points to this Codex runtime where migrated. Do not use old Cloud Agent polling scripts for Codex JSONL runs. The full project delivery context is in [.delivery/README.md](../../.delivery/README.md); check the actual workflow before relying on older Cloud Agent examples there.

## Verification

At the company source repository, run:

```bash
python3 -m unittest discover -s scripts/agent-delivery -p 'test_dispatch_codex.py' -v
```

These tests use temporary Git repositories and fake Codex/GitHub executables. They do not call an installed agent or publish project code.

MusicSaas dispatch resolves the repository from the project root; `GITHUB_REPOSITORY=chenzh/MusicSaas` overrides it. Its workflow also requires `AGENT_DELIVERY_AUTO_MERGE=true` before enabling auto-merge. This runtime update does not set that variable or change branch protection.
