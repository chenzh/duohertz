#!/usr/bin/env bash
# Start full Mac MLX stack: ACE API (:8200) + Workers (:8101/:8102).
# Keep these terminals running (or use scripts/launchd/*.plist).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAMBA="${MAMBA:-$HOME/bin/micromamba}"
NODE_BIN="${NODE_BIN:-/Users/zhenhuachen/Library/Application Support/TRAE SOLO CN/ModularData/ai-agent/vm/tools/opt/node/26.3.1/bin}"

echo "1/4 SA3 MLX (optional bootstrap if missing)"
if [[ ! -x "${SA3_REPO:-$HOME/workers/stable-audio-3}/optimized/mlx/.venv/bin/python" ]]; then
  bash "$ROOT/scripts/mac-sa3-mlx-bootstrap.sh" || echo "warn: SA3 bootstrap skipped"
fi

echo "2/4 ACE API (models preload, ~3min first time)"
bash "$ROOT/scripts/mac-ace-api-restart.sh"

echo "3/4 MLX Workers"
export PATH="$MAMBA:$PATH"
ACE_FALLBACK_SYNTH="${ACE_FALLBACK_SYNTH:-true}" bash "$ROOT/scripts/mac-worker-mlx.sh"

echo "4/4 Gateway (optional, for Demo/API)"
if [[ -x "$NODE_BIN/node" ]] && [[ -x "$ROOT/apps/gateway/node_modules/.bin/tsx" ]]; then
  lsof -ti :8080 | xargs kill -9 2>/dev/null || true
  export PATH="$NODE_BIN:$PATH"
  cd "$ROOT/apps/gateway"
  nohup ./node_modules/.bin/tsx watch src/index.ts >>/tmp/gateway.log 2>&1 &
  sleep 3
  curl -fsS http://127.0.0.1:8080/v1/health && echo
else
  echo "skip gateway (install deps: micromamba run -n workers pnpm install)"
fi

echo "MLX stack ready."
echo "  Vocal: bash scripts/mac-mlx-test.sh"
echo "  BGM:   bash scripts/mac-sa3-test.sh"
echo "  Demo:  bash scripts/demo-present.sh"
