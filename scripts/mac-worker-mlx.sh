#!/usr/bin/env bash
# Restart Mac workers with MLX ACE backend.
set -euo pipefail
MAC_DIR="${MAC_DIR:-$HOME/Desktop/MusicSaas}"
MAMBA="${MAMBA:-$HOME/bin/micromamba}"
ENV_NAME="${MAMBA_ENV:-workers}"
export WORKER_MODE=mlx
export ACE_API_URL="${ACE_API_URL:-http://127.0.0.1:8200}"
export ACE_FALLBACK_SYNTH="${ACE_FALLBACK_SYNTH:-true}"
export ACE_THINKING="${ACE_THINKING:-false}"
export ACE_BATCH_SIZE="${ACE_BATCH_SIZE:-1}"

for port in 8101 8102; do
  lsof -ti :$port | xargs kill -9 2>/dev/null || true
done

run_uvicorn() {
  local dir="$1" port="$2" log="$3" extra_env="$4"
  cd "$dir"
  "$MAMBA" run -n "$ENV_NAME" pip install -q -r requirements.txt
  nohup env $extra_env WORKER_SECRET="${WORKER_SECRET:-}" \
    "$MAMBA" run -n "$ENV_NAME" uvicorn server:app --host 0.0.0.0 --port "$port" >"$log" 2>&1 &
}

run_uvicorn "$MAC_DIR/workers/ace-step" 8101 /tmp/ace-worker.log \
  "WORKER_MODE=$WORKER_MODE ACE_API_URL=$ACE_API_URL ACE_FALLBACK_SYNTH=$ACE_FALLBACK_SYNTH ACE_THINKING=$ACE_THINKING ACE_BATCH_SIZE=$ACE_BATCH_SIZE"

export SA3_WORKER_MODE="${SA3_WORKER_MODE:-mlx}"
export SA3_REPO="${SA3_REPO:-$HOME/workers/stable-audio-3}"
export SA3_FALLBACK_SYNTH="${SA3_FALLBACK_SYNTH:-true}"

run_uvicorn "$MAC_DIR/workers/sa3" 8102 /tmp/sa3-worker.log \
  "SA3_WORKER_MODE=$SA3_WORKER_MODE WORKER_MODE=synth SA3_REPO=$SA3_REPO SA3_FALLBACK_SYNTH=$SA3_FALLBACK_SYNTH SA3_MODEL_VARIANT=${SA3_MODEL_VARIANT:-small}"

sleep 4
curl -fsS http://127.0.0.1:8101/health
curl -fsS http://127.0.0.1:8200/health 2>/dev/null || echo "ace-api starting..."
echo "Mac workers (mlx ace) started"
