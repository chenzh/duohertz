#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_BASE="${API_BASE:-http://localhost:8080}"
API_KEY="${API_KEY:-dev-api-key-change-me}"

curl -sS "${API_BASE}/v1/health" | grep -q '"status":"ok"'
echo "health ok"
