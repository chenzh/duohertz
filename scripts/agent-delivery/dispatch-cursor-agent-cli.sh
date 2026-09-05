#!/usr/bin/env bash
# Compatibility entry point for existing schedules. The worker is Codex CLI.
set -euo pipefail
exec bash "$(dirname "$0")/dispatch-codex-cli.sh" "$@"
