#!/usr/bin/env bash
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:8080}"
API_KEY="${API_KEY:-dev-api-key-change-me}"
JOB_ID="${1:?job id required}"
OUT="${2:-/tmp/${JOB_ID}.wav}"

curl -sS "${API_BASE}/v1/jobs/${JOB_ID}/audio" \
  -H "X-API-Key: ${API_KEY}" \
  -o "${OUT}"
test "$(wc -c < "${OUT}")" -gt 1024
echo "saved ${OUT}"
