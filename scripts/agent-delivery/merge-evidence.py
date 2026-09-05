#!/usr/bin/env python3
"""Require positive checks on the observed PR head before considering a merge."""
import importlib.util
import json
from pathlib import Path
import re
import sys

spec = importlib.util.spec_from_file_location('dispatch_codex', Path(__file__).with_name('dispatch_codex.py'))
delivery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(delivery)


def eligible(pr, policy):
    if policy.get('autoMergeEnabled') is not True:
        return False, 'auto_merge_disabled'
    if pr.get('state') != 'OPEN' or pr.get('isDraft') is not False or pr.get('mergeable') != 'MERGEABLE':
        return False, 'not_mergeable'
    if not re.fullmatch(r'[0-9a-f]{40}', pr.get('headRefOid', '')):
        return False, 'missing_head_sha'
    prefixes = policy.get('branchNamePrefixes') or [policy.get('branchNamePrefix', 'codex/issue-')]
    if not any(pr.get('headRefName', '').startswith(p) for p in prefixes if p):
        return False, 'branch_prefix'
    if pr.get('reviewDecision') in {'CHANGES_REQUESTED', 'REVIEW_REQUIRED'}:
        return False, 'review_required'
    checks = pr.get('statusCheckRollup') or []
    if not delivery.checks_pass(checks):
        return False, 'checks_not_positive'
    pattern = policy.get('requiredChecksRegexp')
    if pattern and not any(re.search(pattern, c.get('name') or c.get('context') or '')
                           and (c.get('conclusion') == 'SUCCESS' or c.get('state') == 'SUCCESS') for c in checks):
        return False, 'required_checks_missing'
    return True, 'verified'


if __name__ == '__main__':
    pr = json.load(sys.stdin)
    policy = json.loads(Path(sys.argv[1]).read_text())
    ok, reason = eligible(pr, policy)
    print(f'merge_evidence={str(ok).lower()} reason={reason}')
    sys.exit(0 if ok else 1)
