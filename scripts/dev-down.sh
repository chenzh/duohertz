#!/usr/bin/env bash
set -euo pipefail
pkill -f "apps/gateway" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
echo "stopped local dev processes"
