#!/usr/bin/env bash
# Bootstrap Mac workers after Xcode CLT is installed.
set -euo pipefail
MAC_DIR="${MAC_DIR:-$HOME/local-ai-music-platform}"

for port in 8101 8102; do
  lsof -ti :$port | xargs kill -9 2>/dev/null || true
done

cd "$MAC_DIR/ace-step"
python3 -m venv .venv
. .venv/bin/activate
pip install -q -r requirements.txt
nohup .venv/bin/uvicorn server:app --host 0.0.0.0 --port 8101 >/tmp/ace-worker.log 2>&1 &

cd "$MAC_DIR/sa3"
python3 -m venv .venv
. .venv/bin/activate
pip install -q -r requirements.txt
nohup .venv/bin/uvicorn server:app --host 0.0.0.0 --port 8102 >/tmp/sa3-worker.log 2>&1 &

sleep 3
curl -fsS http://127.0.0.1:8101/health
curl -fsS http://127.0.0.1:8102/health
echo "Mac workers started"
