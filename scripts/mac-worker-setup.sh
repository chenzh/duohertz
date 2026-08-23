#!/usr/bin/env bash
# Bootstrap Mac workers (micromamba preferred; falls back to python3 venv).
set -euo pipefail
MAC_DIR="${MAC_DIR:-$HOME/Desktop/MusicSaas}"
MAMBA="${MAMBA:-$HOME/bin/micromamba}"
ENV_NAME="${MAMBA_ENV:-workers}"

for port in 8101 8102; do
  lsof -ti :$port | xargs kill -9 2>/dev/null || true
done

run_uvicorn() {
  local dir="$1" port="$2" log="$3"
  cd "$dir"
  if [[ -x "$MAMBA" ]]; then
    "$MAMBA" run -n "$ENV_NAME" pip install -q -r requirements.txt
    nohup "$MAMBA" run -n "$ENV_NAME" uvicorn server:app --host 0.0.0.0 --port "$port" >"$log" 2>&1 &
  else
    python3 -m venv .venv
    . .venv/bin/activate
    pip install -q -r requirements.txt
    nohup .venv/bin/uvicorn server:app --host 0.0.0.0 --port "$port" >"$log" 2>&1 &
  fi
}

if [[ -x "$MAMBA" ]] && ! "$MAMBA" env list | grep -qE "(^| )${ENV_NAME}( |$)"; then
  "$MAMBA" create -y -n "$ENV_NAME" -c conda-forge python=3.11
fi

run_uvicorn "$MAC_DIR/workers/ace-step" 8101 /tmp/ace-worker.log
run_uvicorn "$MAC_DIR/workers/sa3" 8102 /tmp/sa3-worker.log

sleep 4
curl -fsS http://127.0.0.1:8101/health
curl -fsS http://127.0.0.1:8102/health
echo "Mac workers started"
