#!/usr/bin/env bash
# Verify full Mac MLX stack health (ACE API + Workers + Gateway + Demo).
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
DEMO_BASE="${DEMO_BASE:-$API_BASE/demo}"
FAIL=0

ok() { printf '  ✓ %s\n' "$1"; }
bad() { printf '  ✗ %s\n' "$1"; FAIL=1; }

echo "==> MusicSaas stack verify"
echo "API_BASE=$API_BASE"

if curl -fsS http://127.0.0.1:8200/health >/dev/null 2>&1; then ok "ACE API :8200"; else bad "ACE API :8200"; fi
if curl -fsS http://127.0.0.1:8101/health >/dev/null 2>&1; then ok "ACE Worker :8101"; else bad "ACE Worker :8101"; fi
if curl -fsS http://127.0.0.1:8102/health >/dev/null 2>&1; then ok "SA3 Worker :8102"; else bad "SA3 Worker :8102"; fi
if curl -fsS "$API_BASE/v1/health" >/dev/null 2>&1; then ok "Gateway /v1/health"; else bad "Gateway /v1/health"; fi

if curl -fsS "$API_BASE/v1/health/inference" 2>/dev/null | python3 -c "
import json, sys
d = json.load(sys.stdin)['data']['workers']
raise SystemExit(0 if d['ace']['status'] == 'ok' and d['sa3']['status'] == 'ok' else 1)
" 2>/dev/null; then
  ok "Inference ace+sa3 ok"
else
  bad "Inference ace+sa3 ok"
fi

if curl -fsS "$DEMO_BASE/" 2>/dev/null | grep -q 'id="root"'; then ok "Demo index"; else bad "Demo index"; fi
if curl -fsS "$API_BASE/demo/meta" 2>/dev/null | python3 -c "import json,sys; json.load(sys.stdin)" 2>/dev/null; then
  ok "Demo meta"
else
  bad "Demo meta"
fi

if [[ "$FAIL" -eq 0 ]]; then
  echo ""
  echo "Stack OK — Demo: ${DEMO_BASE}/?demo=1"
  echo "Smoke: bash scripts/mac-mlx-test.sh && bash scripts/mac-sa3-test.sh"
  exit 0
fi

echo ""
echo "Stack incomplete. Try: bash scripts/mac-services-up.sh"
exit 1
