#!/usr/bin/env bash
# Start ACE-Step MLX API on Mac (port 8200).
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"
cd "$HOME/workers/ACE-Step-1.5"
source .venv/bin/activate

export ACESTEP_LM_BACKEND=mlx
export ACESTEP_LM_MODEL_PATH="${ACESTEP_LM_MODEL_PATH:-acestep-5Hz-lm-0.6B}"
export ACESTEP_NO_INIT="${ACESTEP_NO_INIT:-false}"
export TOKENIZERS_PARALLELISM=false
export CHECK_UPDATE=false

PORT="${ACE_API_PORT:-8200}"
HOST="${ACE_API_HOST:-0.0.0.0}"

echo "Starting ACE-Step API on ${HOST}:${PORT} (LM=${ACESTEP_LM_MODEL_PATH})"
exec acestep-api --host "$HOST" --port "$PORT" --lm-model-path "$ACESTEP_LM_MODEL_PATH"
