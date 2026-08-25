#!/usr/bin/env python3
"""Generate BeatScape tracks via MusicSaas Gateway (SA3 / ACE).

Reads scripts/beatscape-stage2-manifest.json (or --manifest).

Usage:
  python3 scripts/beatscape-generate-tracks.py --manifest scripts/beatscape-stage2-manifest.json
  python3 scripts/beatscape-generate-tracks.py --track bs-s2-01
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
import wave
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "data" / "beatscape-preview"
MASTERS = PREVIEW / "masters"
DEFAULT_MANIFEST = ROOT / "scripts" / "beatscape-stage2-manifest.json"

API_BASE = os.getenv("API_BASE", "http://127.0.0.1:8080")
API_KEY = os.getenv("API_KEY", "dev-api-key-change-me")
POLL_TIMEOUT = int(os.getenv("JOB_POLL_TIMEOUT", "3600"))


def api(method: str, path: str, body: dict | None = None, timeout: int = 120):
    headers = {"X-API-Key": API_KEY}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        raw = res.read()
        if "audio" in res.headers.get("Content-Type", ""):
            return res.status, raw
        return res.status, json.loads(raw.decode())


def wav_duration(audio: bytes) -> float:
    try:
        with wave.open(BytesIO(audio)) as wf:
            return wf.getnframes() / wf.getframerate()
    except wave.Error:
        import struct

        pos = 12
        fmt: bytes | None = None
        data_size = 0
        while pos + 8 <= len(audio):
            chunk_id = audio[pos : pos + 4]
            size = struct.unpack("<I", audio[pos + 4 : pos + 8])[0]
            pos += 8
            if chunk_id == b"fmt ":
                fmt = audio[pos : pos + size]
            elif chunk_id == b"data":
                data_size = size
                break
            pos += size + (size % 2)
        if not fmt or len(fmt) < 16 or data_size <= 0:
            raise ValueError("unsupported wav")
        _tag, channels, sample_rate, _byte_rate, block_align, bits = struct.unpack("<HHIIHH", fmt[:16])
        frame_bytes = max(block_align, channels * (bits // 8))
        return (data_size // frame_bytes) / sample_rate


def generate_one(entry: dict, dry_run: bool = False) -> bool:
    track_id = entry["track_id"]
    stem = entry.get("preview_stem", track_id)
    mode = entry.get("mode", "game_bgm")
    duration = int(entry.get("duration_sec", 180))
    prompt = entry.get("prompt", "")
    body: dict = {"duration_sec": duration}
    if mode == "vocal_lyrics":
        body["mode"] = "vocal_lyrics"
        body["style_tags"] = entry.get("style_tags", "english pop, neon, clear beat, beatscape original")
        body["lyrics"] = entry.get("lyrics", "")
        if not body["lyrics"]:
            raise ValueError(f"{track_id}: vocal_lyrics requires lyrics in manifest")
    else:
        body["mode"] = "game_bgm"
        body["prompt"] = prompt
        body["model_variant"] = "small"

    out_wav = MASTERS / f"{stem}.wav"
    if out_wav.is_file() and out_wav.stat().st_size > 500_000:
        print(f"SKIP {track_id}: master exists {out_wav}")
        return True

    if dry_run:
        print(f"WOULD generate {track_id} {duration}s mode={mode}")
        return True

    print(f"CREATE {track_id} ({duration}s)...")
    try:
        code, created = api("POST", "/v1/jobs", body)
    except urllib.error.URLError as exc:
        print(f"FAIL {track_id}: {exc}")
        return False
    if code != 201:
        print(f"FAIL {track_id}: create {created}")
        return False

    job_id = created["data"]["job_id"]
    start = time.time()
    while time.time() - start < POLL_TIMEOUT:
        _, polled = api("GET", f"/v1/jobs/{job_id}")
        st = polled["data"]["status"]
        print(f"  {track_id} status={st} elapsed={int(time.time()-start)}s")
        if st == "completed":
            break
        if st == "failed":
            print(f"FAIL {track_id}:", polled)
            return False
        time.sleep(5)
    else:
        print(f"TIMEOUT {track_id}")
        return False

    ac, audio = api("GET", f"/v1/jobs/{job_id}/audio", timeout=300)
    if ac != 200 or not isinstance(audio, bytes) or len(audio) < 100_000:
        print(f"FAIL {track_id}: bad audio ({ac}, {len(audio) if isinstance(audio, bytes) else 0} bytes)")
        return False

    MASTERS.mkdir(parents=True, exist_ok=True)
    out_wav.write_bytes(audio)
    also = MASTERS / f"{track_id}.wav"
    if also != out_wav:
        also.write_bytes(audio)
    dur = wav_duration(audio)
    print(f"OK {track_id}: {dur:.1f}s -> {out_wav}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate BeatScape masters via Gateway")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--track", help="Single track_id from manifest")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    tracks = manifest.get("tracks", [])
    if args.track:
        tracks = [t for t in tracks if t.get("track_id") == args.track]
    if not tracks:
        raise SystemExit("no tracks to generate")

    ok = sum(1 for t in tracks if generate_one(t, dry_run=args.dry_run))
    return 0 if ok == len(tracks) else 1


if __name__ == "__main__":
    sys.exit(main())
