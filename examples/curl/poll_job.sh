#!/usr/bin/env bash
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:8080}"
API_KEY="${API_KEY:-dev-api-key-change-me}"
JOB_ID="${1:?job id required}"

for i in $(seq 1 120); do
  BODY=$(curl -sS "${API_BASE}/v1/jobs/${JOB_ID}" -H "X-API-Key: ${API_KEY}")
  echo "$BODY"
  echo "$BODY" | grep -q '"status":"completed"' && exit 0
  echo "$BODY" | grep -q '"status":"failed"' && exit 1
  sleep 2
done
exit 1
