#!/usr/bin/env python3
"""Generate wordless-hum BeatScape tracks by calling the SA3 worker directly.

The gateway path (beatscape-generate-tracks.py -> /v1/jobs) does not yet carry
a per-request negative_prompt, which the hum wave needs (SA3 worker accepts
one on /internal/generate). This script bypasses the gateway and calls the
worker's sync endpoint, so the manifest's `negative_prompt` reaches the model.

Usage:
  python3 scripts/beatscape-generate-hum.py --manifest scripts/beatscape-p4-manifest.json
  python3 scripts/beatscape-generate-hum.py --manifest scripts/beatscape-p4-manifest.json --track bs-p4-01
  python3 scripts/beatscape-generate-hum.py --dry-run
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.request
import wave
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MASTERS = ROOT / "data" / "beatscape-preview" / "masters"

WORKER_URL = os.getenv("SA3_WORKER_URL", "http://127.0.0.1:8102")


def wav_duration(audio: bytes) -> float:
    try:
        with wave.open(BytesIO(audio)) as wf:
            return wf.getnframes() / wf.getframerate()
    except wave.Error:
        return 0.0


def generate_one(entry: dict, dry_run: bool = False, force: bool = False) -> bool:
    track_id = entry["track_id"]
    stem = entry.get("preview_stem", track_id)
    duration = int(entry.get("job_duration_sec", entry.get("duration_sec", 180)))
    prompt = entry.get("prompt", "")
    negative = entry.get("negative_prompt") or os.getenv(
        "SA3_NEGATIVE_PROMPT", "vocals, singing, speech, lyrics"
    )

    out_wav = MASTERS / f"{stem}.wav"
    if not force and out_wav.is_file() and out_wav.stat().st_size > 500_000:
        print(f"SKIP {track_id}: master exists {out_wav}")
        return True

    if dry_run:
        print(f"WOULD generate {track_id} {duration}s (negative_prompt={bool(negative)})")
        return True

    body = {
        "job_id": track_id,
        "mode": "game_bgm",
        "prompt": prompt,
        "duration_sec": duration,
        "model_variant": entry.get("model_variant", "small"),
        "output_path": f"/tmp/{track_id}.wav",
        "negative_prompt": negative,
    }
    req = urllib.request.Request(
        f"{WORKER_URL}/internal/generate",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    print(f"CREATE {track_id} ({duration}s, negative=hum)...")
    try:
        with urllib.request.urlopen(req, timeout=1800) as res:
            resp = json.loads(res.read().decode())
    except Exception as exc:  # noqa: BLE001
        print(f"FAIL {track_id}: {exc}")
        return False

    if not resp.get("ok"):
        print(f"FAIL {track_id}: {resp.get('error')}")
        return False

    audio = base64.b64decode(resp["audio_base64"])
    MASTERS.mkdir(parents=True, exist_ok=True)
    out_wav.write_bytes(audio)
    also = MASTERS / f"{track_id}.wav"
    if also != out_wav:
        also.write_bytes(audio)
    dur = wav_duration(audio)
    print(f"OK {track_id}: {dur:.1f}s -> {out_wav} (latency {resp.get('latency_ms')}ms)")
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--track", help="Only generate one track_id")
    parser.add_argument("--force", action="store_true", help="Overwrite existing masters")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    tracks = manifest.get("tracks", manifest)
    if args.track:
        tracks = [t for t in tracks if t["track_id"] == args.track]

    ok = 0
    for entry in tracks:
        if generate_one(entry, dry_run=args.dry_run, force=args.force):
            ok += 1
    print(f"done: {ok}/{len(tracks)}")
    return 0 if ok == len(tracks) else 1


if __name__ == "__main__":
    sys.exit(main())
