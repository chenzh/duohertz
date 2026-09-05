#!/usr/bin/env bash
# Compatibility entry point; company dispatch now uses the authenticated Codex CLI.
set -euo pipefail
exec bash "$(dirname "$0")/dispatch-codex-cli.sh" "$@"
