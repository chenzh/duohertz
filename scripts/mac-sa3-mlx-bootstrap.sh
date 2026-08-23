#!/usr/bin/env bash
# Clone Stable Audio 3 MLX and create local venv (weights download on first generate).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SA3_REPO="${SA3_REPO:-$HOME/workers/stable-audio-3}"
MLX_DIR="$SA3_REPO/optimized/mlx"

log() { printf '==> %s\n' "$*"; }

if [[ ! -d "$SA3_REPO/.git" ]]; then
  log "cloning stable-audio-3 into $SA3_REPO"
  mkdir -p "$(dirname "$SA3_REPO")"
  git clone --depth 1 https://github.com/Stability-AI/stable-audio-3.git "$SA3_REPO"
fi

cd "$MLX_DIR"

if [[ ! -x .venv/bin/python ]]; then
  log "installing SA3 MLX venv at $MLX_DIR"
  if command -v uv >/dev/null 2>&1; then
  ./install.sh -y || true
  elif [[ -x "$HOME/.local/bin/uv" ]]; then
    export PATH="$HOME/.local/bin:$PATH"
    ./install.sh -y || true
  else
    log "uv not found — installing uv"
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
    ./install.sh -y || true
  fi
fi

if [[ ! -x .venv/bin/python ]]; then
  log "fallback: uv venv + pip only (weights auto-download on first run)"
  export PATH="${HOME}/.local/bin:${PATH}"
  uv venv --seed --python 3.11 .venv
  VIRTUAL_ENV="$MLX_DIR/.venv" uv pip install -r requirements.txt
fi

log "SA3 MLX ready at $MLX_DIR"
log "export SA3_REPO=$SA3_REPO"
log "export SA3_WORKER_MODE=mlx"
