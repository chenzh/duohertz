#!/usr/bin/env bash
# Read-only auto-merge eligibility check. CI and explicit workflow opt-in are separate gates.
set -euo pipefail

PR_NUMBER="${1:?usage: check-merge-eligible.sh <pr_number>}"
[[ "$PR_NUMBER" =~ ^[1-9][0-9]*$ ]] || { echo 'error: PR number must be a positive integer' >&2; exit 1; }
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REPO="${GITHUB_REPOSITORY:-$(cd "$ROOT" && gh repo view --json nameWithOwner -q .nameWithOwner)}"
POLICY="$ROOT/.delivery/config/merge-policy.json"

if [ ! -f "$POLICY" ]; then
  echo 'merge_eligible=false reason=policy_missing'
  exit 1
fi
if [ "$(jq -r '.autoMergeEnabled' "$POLICY")" != true ]; then
  echo 'merge_eligible=false reason=auto_merge_disabled'
  exit 0
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
# Assignments/commands propagate API failures; process substitutions would hide them.
gh pr view "$PR_NUMBER" --repo "$REPO" \
  --json baseRefName,baseRefOid,headRefName,headRefOid,state,isDraft,isCrossRepository,labels,reviewDecision,changedFiles > "$TMP/pr.json"
gh api --paginate --slurp "repos/$REPO/pulls/$PR_NUMBER/files?per_page=100" > "$TMP/files.json"
gh pr view "$PR_NUMBER" --repo "$REPO" --json headRefOid,baseRefOid > "$TMP/after.json"
if ! jq -e --slurp '.[0].headRefOid == .[1].headRefOid and .[0].baseRefOid == .[1].baseRefOid' "$TMP/pr.json" "$TMP/after.json" >/dev/null; then
  echo 'merge_eligible=false reason=pr_changed_during_check'
  exit 0
fi

python3 - "$POLICY" "$TMP/pr.json" "$TMP/files.json" <<'PY'
import json
import re
import sys
from pathlib import Path

policy, pr, pages = [json.loads(Path(path).read_text()) for path in sys.argv[1:]]


def reject(reason):
    print(f"merge_eligible=false reason={reason}")
    raise SystemExit(0)


def glob_regex(pattern):
    """Match complete repo paths: * stays in a segment, ** crosses segments."""
    pieces = []
    i = 0
    while i < len(pattern):
        if pattern[i:i + 3] == "**/":
            pieces.append("(?:.*/)?")
            i += 3
        elif pattern[i:i + 2] == "**":
            pieces.append(".*")
            i += 2
        elif pattern[i] == "*":
            pieces.append("[^/]*")
            i += 1
        elif pattern[i] == "?":
            pieces.append("[^/]")
            i += 1
        else:
            pieces.append(re.escape(pattern[i]))
            i += 1
    return re.compile("".join(pieces))


prefix = policy.get("branchNamePrefix", "cursor/")
if not isinstance(prefix, str) or not prefix or not pr["headRefName"].startswith(prefix):
    reject("branch_prefix")
if pr["state"] != "OPEN" or pr["isDraft"] or pr["isCrossRepository"]:
    reject("pr_state")
labels = {label["name"] for label in pr["labels"]}
if not set(policy["requireLabels"]).issubset(labels):
    reject("required_labels")
if pr["reviewDecision"] != "APPROVED":
    reject("review_required")
files = [file for page in pages for file in page]
if not files or len(files) != pr["changedFiles"]:
    reject("incomplete_file_list")
allow = [glob_regex(pattern) for pattern in policy["allow"]]
deny = [glob_regex(pattern) for pattern in policy["deny"]]
# Check both sides of renames so moving a protected file cannot bypass the policy.
paths = {file[key] for file in files for key in ("filename", "previous_filename") if key in file}
if any(pattern.fullmatch(path) for path in paths for pattern in deny):
    reject("deny_path")
if any(not any(pattern.fullmatch(path) for pattern in allow) for path in paths):
    reject("not_in_allowlist")
print(f'merge_eligible=true sha={pr["headRefOid"]} files={len(files)}')
PY
