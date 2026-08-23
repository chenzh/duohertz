#!/usr/bin/env bash
# Start ACE-Step MLX API on Mac (port 8200).
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"
cd "$HOME/workers/ACE-Step-1.5"
source .venv/bin/activate

export ACESTEP_LM_BACKEND=mlx
export TOKENIZERS_PARALLELISM=false
export CHECK_UPDATE=false

PORT="${ACE_API_PORT:-8200}"
HOST="${ACE_API_HOST:-0.0.0.0}"

echo "Starting ACE-Step API on ${HOST}:${PORT}"
exec acestep-api --host "$HOST" --port "$PORT"
