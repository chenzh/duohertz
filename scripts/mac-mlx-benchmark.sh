#!/usr/bin/env bash
# Run mac-mlx-test.sh N times and print latency summary.
set -euo pipefail
RUNS="${1:-3}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESULTS=()

echo "MLX benchmark: ${RUNS} runs"
for i in $(seq 1 "$RUNS"); do
  echo "=== run ${i}/${RUNS} ==="
  rm -f /tmp/mlx-test-1.wav /tmp/mlx-test-resp.json
  start=$(date +%s)
  bash "$ROOT/scripts/mac-mlx-test.sh" | tee "/tmp/mlx-bench-${i}.out"
  end=$(date +%s)
  wall=$((end - start))
  latency=$(python3 - <<'PY'
import json
print(json.load(open("/tmp/mlx-test-resp.json")).get("latency_ms", 0))
PY
)
  RESULTS+=("$wall:$latency")
  echo "wall=${wall}s worker_latency_ms=${latency}"
done

python3 - <<'PY'
import statistics, sys
rows = []
for line in sys.stdin:
    line = line.strip()
    if not line or ":" not in line:
        continue
    wall_s, latency_ms = line.split(":", 1)
    rows.append((int(wall_s), int(latency_ms)))
if not rows:
    raise SystemExit("no results")
walls = [r[0] for r in rows]
lats = [r[1] for r in rows]
print(f"P50 wall={statistics.median(walls):.0f}s worker_latency_ms={statistics.median(lats):.0f}")
print(f"P90 wall={sorted(walls)[int(0.9*(len(walls)-1))]}s worker_latency_ms={sorted(lats)[int(0.9*(len(lats)-1))]}")
PY
<<<"$(printf '%s\n' "${RESULTS[@]}")"
