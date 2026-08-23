#!/usr/bin/env bash
# Restart ACE-Step MLX API (port 8200) in background.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${ACE_API_PORT:-8200}"

lsof -ti :"$PORT" | xargs kill -9 2>/dev/null || true
sleep 2

nohup bash "$ROOT/scripts/mac-ace-api-start.sh" >/tmp/ace-api.log 2>&1 &
echo "Waiting for acestep-api on :${PORT} (models may take several minutes)..."
for _ in $(seq 1 180); do
  if health=$(curl -fsS "http://127.0.0.1:${PORT}/health" 2>/dev/null); then
    models_ok=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print('yes' if d.get('data',{}).get('models_initialized') else 'no')" "$health" 2>/dev/null || echo no)
    if [[ "$models_ok" == "yes" ]]; then
      echo "$health"
      echo "ACE API ready (models loaded)"
      exit 0
    fi
  fi
  sleep 2
done

echo "ACE API failed to start; see /tmp/ace-api.log" >&2
tail -30 /tmp/ace-api.log >&2 || true
exit 1
