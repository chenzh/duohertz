#!/usr/bin/env bash
# Codex is the only company CLI worker; legacy entry points delegate here.
set -euo pipefail
export MULTICA_ROOT="${MULTICA_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
export REPO_ROOT="${REPO_ROOT:-$MULTICA_ROOT}"
if [ -f "$MULTICA_ROOT/scripts/ai-company/lib/source-local-env.sh" ]; then
  source "$MULTICA_ROOT/scripts/ai-company/lib/source-local-env.sh"
fi
exec python3 "$MULTICA_ROOT/scripts/agent-delivery/dispatch_codex.py" "$@"
