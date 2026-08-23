#!/usr/bin/env bash
# Presentation helper: verify stack and open Demo in browser.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEMO_URL="${DEMO_URL:-http://127.0.0.1:8080/demo/}"
OPEN_BROWSER="${OPEN_BROWSER:-1}"

echo "[demo-present] health checks"
curl -fsS http://127.0.0.1:8080/v1/health >/dev/null
curl -fsS http://127.0.0.1:8080/v1/health/inference | python3 -m json.tool | head -20
curl -fsS http://127.0.0.1:8080/demo/meta | python3 -m json.tool

if [[ "${SMOKE_MLX:-}" == "1" ]]; then
  echo "[demo-present] mlx smoke (optional)"
  bash "$ROOT/scripts/mac-mlx-test.sh" || true
  bash "$ROOT/scripts/mac-sa3-test.sh" || true
fi

if [[ "$OPEN_BROWSER" == "1" ]]; then
  open "${DEMO_URL}?demo=1" 2>/dev/null || xdg-open "${DEMO_URL}?demo=1" 2>/dev/null || echo "Open: ${DEMO_URL}?demo=1"
fi

echo "[demo-present] ready: ${DEMO_URL}"
