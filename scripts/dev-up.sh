#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export API_KEY="${API_KEY:-dev-api-key-change-me}"
export MOCK_WORKERS="${MOCK_WORKERS:-false}"

mkdir -p data/audio

if ! command -v pnpm >/dev/null; then
  echo "pnpm required" >&2
  exit 1
fi

pnpm install
pnpm --filter gateway db:push

# Mac workers (optional remote host)
MAC_HOST="${MAC_HOST:-192.168.0.199}"
if ping -c 1 -W 1 "$MAC_HOST" >/dev/null 2>&1; then
  echo "Syncing workers to Mac ${MAC_HOST}..."
  ssh -o BatchMode=yes "zhenhuachen@${MAC_HOST}" "mkdir -p ~/local-ai-music-platform/workers"
  scp -r workers/* "zhenhuachen@${MAC_HOST}:~/local-ai-music-platform/workers/"
  ssh -o BatchMode=yes "zhenhuachen@${MAC_HOST}" 'cd ~/local-ai-music-platform/workers/ace-step && python3 -m venv .venv && . .venv/bin/activate && pip install -q -r requirements.txt && nohup .venv/bin/uvicorn server:app --host 0.0.0.0 --port 8101 >/tmp/ace-worker.log 2>&1 &'
  ssh -o BatchMode=yes "zhenhuachen@${MAC_HOST}" 'cd ~/local-ai-music-platform/workers/sa3 && python3 -m venv .venv && . .venv/bin/activate && pip install -q -r requirements.txt && nohup .venv/bin/uvicorn server:app --host 0.0.0.0 --port 8102 >/tmp/sa3-worker.log 2>&1 &'
  sleep 3
  curl -fsS "http://${MAC_HOST}:8101/health" && echo " ACE ok"
  curl -fsS "http://${MAC_HOST}:8102/health" && echo " SA3 ok"
fi

cp -n apps/gateway/.env.example apps/gateway/.env 2>/dev/null || true

pnpm --filter gateway dev &
GW_PID=$!
sleep 3
curl -fsS http://localhost:8080/v1/health

pnpm --filter demo dev &
DEMO_PID=$!

echo "Gateway :8080  Demo :3000"
echo "Press Ctrl+C to stop"
trap 'kill $GW_PID $DEMO_PID 2>/dev/null || true' EXIT
wait
