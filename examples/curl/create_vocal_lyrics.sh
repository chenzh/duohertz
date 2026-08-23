#!/usr/bin/env bash
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:8080}"
API_KEY="${API_KEY:-dev-api-key-change-me}"

curl -sS -X POST "${API_BASE}/v1/jobs" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "vocal_lyrics",
    "style_tags": "j-pop, female vocal, emotional",
    "lyrics": "[Verse]\nLine one\n[Chorus]\nChorus line",
    "duration_sec": 30
  }'
