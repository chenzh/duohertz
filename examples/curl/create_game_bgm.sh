#!/usr/bin/env bash
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:8080}"
API_KEY="${API_KEY:-dev-api-key-change-me}"

curl -sS -X POST "${API_BASE}/v1/jobs" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "game_bgm",
    "prompt": "dark dungeon ambient, tense, instrumental",
    "duration_sec": 30
  }'
