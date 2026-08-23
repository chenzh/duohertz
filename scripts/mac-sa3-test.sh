#!/usr/bin/env bash
# Quick SA3 MLX BGM smoke test (15s game_bgm).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export API_BASE="${API_BASE:-http://127.0.0.1:8080}"
export API_KEY="${API_KEY:-dev-api-key-change-me}"
export SA3_TEST_DURATION="${SA3_TEST_DURATION:-15}"
python3 "$ROOT/scripts/acceptance-sa3-bgm.py"
