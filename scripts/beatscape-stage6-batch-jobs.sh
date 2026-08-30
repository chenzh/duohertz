#!/usr/bin/env bash
# Print / run the 50 Stage6 MusicSaas generation jobs (catalog 35 -> 85).
#
# Prereqs: Gateway on :8080 and SA3 worker in MLX mode on :8102.
#   bash scripts/beatscape-stage6-batch-jobs.sh            # print commands
#   bash scripts/beatscape-stage6-batch-jobs.sh --run      # execute sequentially
#
# Note: macOS ships bash 3.2 — no `mapfile`, hence the while-read loop below.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/scripts/beatscape-stage6-manifest.json"
MODE="${1:-}"

if [[ ! -f "$MANIFEST" ]]; then
  echo "manifest missing: $MANIFEST (run python3 scripts/beatscape-stage6-sync-manifest.py)" >&2
  exit 1
fi

TRACK_LIST="$(python3 -c "
import json
d = json.load(open('$MANIFEST'))
print('\n'.join(t['track_id'] for t in d['tracks']))
")"

count=0
while IFS= read -r tid; do
  [[ -z "$tid" ]] && continue
  count=$((count + 1))
done <<< "$TRACK_LIST"

echo "# Stage6 batch: $count tracks"
echo "# manifest: $MANIFEST"
echo

failed=()
done_count=0
while IFS= read -r tid; do
  [[ -z "$tid" ]] && continue
  cmd=(python3 "$ROOT/scripts/beatscape-generate-tracks.py" --manifest "$MANIFEST" --track "$tid")
  if [[ "$MODE" == "--run" ]]; then
    echo "+ [$(date +%H:%M:%S)] ${cmd[*]}"
    if "${cmd[@]}"; then
      done_count=$((done_count + 1))
      echo "  progress: $done_count/$count"
    else
      echo "WARN generation failed: $tid"
      failed+=("$tid")
    fi
  else
    echo "${cmd[*]}"
  fi
done <<< "$TRACK_LIST"

if [[ "$MODE" == "--run" ]]; then
  echo
  echo "Stage6 generation batch finished: $done_count/$count ok"
  if ((${#failed[@]})); then
    echo "FAILED: ${failed[*]}"
  fi
  echo "Next: python3 scripts/beatscape-ingest-stage6.py --dry-run"
  ((${#failed[@]})) && exit 1
fi
exit 0
