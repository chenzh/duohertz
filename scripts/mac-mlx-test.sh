#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json
open("/tmp/mlx-test-body.json", "w").write(json.dumps({
    "job_id": "mlx-test-1",
    "mode": "vocal_lyrics",
    "style_tags": "pop female vocal",
    "lyrics": "hello world",
    "duration_sec": 10,
    "output_path": "/tmp/mlx-test-1.wav",
}))
PY
echo "body:"; cat /tmp/mlx-test-body.json
echo "calling worker..."
curl -sS -m 3600 -X POST http://127.0.0.1:8101/internal/generate \
  -H 'Content-Type: application/json' \
  --data-binary @/tmp/mlx-test-body.json \
  -o /tmp/mlx-test-resp.json \
  -w 'HTTP %{http_code}\n'
ls -la /tmp/mlx-test-1.wav 2>/dev/null || echo "no wav yet"
python3 - <<'PY'
import json
d=json.load(open("/tmp/mlx-test-resp.json"))
print("ok", d.get("ok"), "latency_ms", d.get("latency_ms"))
print("audio_b64_len", len(d.get("audio_base64") or ""))
PY
