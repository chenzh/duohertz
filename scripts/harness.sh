#!/usr/bin/env bash
# MusicSaas test harness — unified entry for unit / integration / e2e / mlx tiers.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TIER="${1:-all}"
GATEWAY_PID=""
DEMO_PID=""

export DATABASE_URL="${DATABASE_URL:-file:${ROOT}/data/test.db}"
export MOCK_WORKERS="${MOCK_WORKERS:-true}"
export API_KEY="${API_KEY:-test-key}"
export API_KEY_ALT="${API_KEY_ALT:-dev-api-key-alt}"
export AUDIO_STORAGE_PATH="${AUDIO_STORAGE_PATH:-${ROOT}/data/audio-test}"
export RATE_LIMIT_QPS="${RATE_LIMIT_QPS:-100}"
export RATE_LIMIT_DAILY_JOBS="${RATE_LIMIT_DAILY_JOBS:-10000}"

log() { printf '==> %s\n' "$*"; }

python_bin() {
  if command -v python3.12 >/dev/null 2>&1; then
    echo python3.12
  elif command -v python3.11 >/dev/null 2>&1; then
    echo python3.11
  else
    echo python3
  fi
}

PY="$(python_bin)"

ensure_py_env() {
  if [[ ! -x tests/.venv/bin/python ]]; then
    log "creating tests/.venv with $PY"
    "$PY" -m venv tests/.venv
    tests/.venv/bin/pip install -q -U pip
    tests/.venv/bin/pip install -q -r tests/requirements.txt -r workers/ace-step/requirements.txt
  fi
  PY=tests/.venv/bin/python
}

wait_http() {
  local url="$1"
  local label="$2"
  local tries="${3:-40}"
  for _ in $(seq 1 "$tries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "$label ready: $url"
      return 0
    fi
    sleep 1
  done
  echo "timeout waiting for $label ($url)" >&2
  return 1
}

start_gateway() {
  if curl -fsS "${API_BASE:-http://127.0.0.1:8080}/v1/health" >/dev/null 2>&1; then
    log "gateway already running"
    return 0
  fi
  log "starting gateway (MOCK_WORKERS=$MOCK_WORKERS)"
  pnpm --filter gateway db:push >/dev/null
  pnpm --filter gateway exec tsx src/index.ts &
  GATEWAY_PID=$!
  wait_http "${API_BASE:-http://127.0.0.1:8080}/v1/health" "gateway"
}

start_demo() {
  if curl -fsS "${DEMO_BASE:-http://127.0.0.1:8080/demo}/" >/dev/null 2>&1; then
    log "demo already served"
    return 0
  fi
  log "building demo for e2e"
  pnpm --filter demo build >/dev/null
  log "demo static assets expected at apps/demo/dist (served by gateway /demo)"
}

cleanup() {
  if [[ -n "$GATEWAY_PID" ]]; then
    kill "$GATEWAY_PID" 2>/dev/null || true
  fi
  if [[ -n "$DEMO_PID" ]]; then
    kill "$DEMO_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

run_unit() {
  ensure_py_env
  log "tier: unit (vitest + pytest) via $PY"
  mkdir -p "${ROOT}/data" "${ROOT}/data/audio-test"
  pnpm --filter gateway db:push >/dev/null
  pnpm --filter gateway test
  "$PY" -m pytest tests/unit -q
}

run_integration() {
  ensure_py_env
  log "tier: integration (gateway + acceptance-p0, INTEGRATION=false)"
  export API_BASE="${API_BASE:-http://127.0.0.1:8080}"
  export INTEGRATION=false
  export RATE_LIMIT_QPS=2
  start_gateway
  "$PY" scripts/acceptance-p0.py
}

run_e2e() {
  ensure_py_env
  log "tier: e2e (gateway + demo acceptance)"
  export API_BASE="${API_BASE:-http://127.0.0.1:8080}"
  export DEMO_BASE="${DEMO_BASE:-http://127.0.0.1:8080/demo}"
  export GATEWAY_BASE="${GATEWAY_BASE:-http://127.0.0.1:8080}"
  start_gateway
  start_demo
  "$PY" scripts/acceptance-demo-web.py
}

run_mlx() {
  ensure_py_env
  log "tier: mlx (optional Mac MLX vocal e2e)"
  if [[ "${MLX_HARNESS_SKIP:-}" == "true" ]]; then
    log "MLX_HARNESS_SKIP=true — skipping mlx tier"
    return 0
  fi
  export API_BASE="${API_BASE:-http://127.0.0.1:8080}"
  if ! curl -fsS "$API_BASE/v1/health/inference" >/dev/null 2>&1; then
    log "inference stack not reachable — skipping mlx tier"
    return 0
  fi
  "$PY" scripts/acceptance-mlx-vocal.py
}

run_build() {
  log "tier: build"
  pnpm -r build
}

case "$TIER" in
  unit) run_unit ;;
  integration) run_integration ;;
  e2e) run_e2e ;;
  mlx) run_mlx ;;
  build) run_build ;;
  all)
    run_unit
    run_build
    run_integration
    ;;
  *)
    cat <<EOF
Usage: $0 <tier>

Tiers:
  unit         Vitest (gateway) + pytest (workers/harness)
  integration  Live gateway (mock workers) + acceptance-p0 (fast)
  e2e          Gateway + demo web acceptance
  mlx          Mac MLX vocal e2e (skipped if stack unavailable)
  build        pnpm -r build
  all          unit + build + integration (CI default)

Env:
  API_BASE, API_KEY, MOCK_WORKERS, INTEGRATION, DEMO_BASE, MLX_HARNESS_SKIP
EOF
    exit 1
    ;;
esac

log "harness tier '$TIER' complete"
