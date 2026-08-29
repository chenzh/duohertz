#!/usr/bin/env bash
# Print MusicSaas SA3 job commands for Stage 4 wave-1 (human runs on MLX node).
# Does NOT call the API — review prompts first.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/scripts/beatscape-stage4-manifest.json"
python3 - <<'PY'
import json
from pathlib import Path

manifest = json.loads(Path("scripts/beatscape-stage4-manifest.json").read_text())
for tr in manifest["tracks"]:
    tid = tr["track_id"]
    print(f"\n# {tid} — {tr['title']} ({tr['bpm']} BPM · {tr['preset_id']})")
    print(f"# Prompt:\n# {tr['prompt']}\n")
    print(
        "python3 scripts/beatscape-generate-tracks.py "
        f"--manifest scripts/beatscape-stage4-manifest.json --track {tid} --dry-run"
    )
    print(
        "python3 scripts/beatscape-generate-tracks.py "
        f"--manifest scripts/beatscape-stage4-manifest.json --track {tid}"
    )
PY
