#!/usr/bin/env python3
"""Batch-train BeatScape character LoRAs for the 6 characters that still need one.

For each character it reuses the three verified single-character scripts:
  1. beatscape-anime-trainset.py  -> img2img consistent training set (8 imgs)
  2. beatscape-anime-lora-train.py -> SDXL unet LoRA (rank 8, 8 epochs, MPS)
  3. beatscape-anime-gen.py        -> 6 validation images with the LoRA loaded

RIVET is skipped (already done). Every step is subprocess-isolated so a failure
in one character does not abort the rest; a per-character report is printed.

    python3 scripts/beatscape-anime-lora-batch.py
"""
from __future__ import annotations

import glob
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PY = Path("/Users/zhenhuachen/.workbuddy/binaries/python/envs/default/bin/python")

# RIVET is already trained; only these 6 remain.
CHARS = ["volta", "static", "prism", "ember", "glide", "halo"]
SEEDS = {"volta": 1337, "static": 1338, "prism": 1339,
         "ember": 1340, "glide": 1342, "halo": 1343}

ENV = os.environ.copy()
ENV["HF_HUB_OFFLINE"] = "1"
ENV["HF_ENDPOINT"] = "https://hf-mirror.com"


def run(label: str, cmd: list[str]) -> bool:
    print(f"\n=== {label} ===", flush=True)
    print(">>> " + " ".join(str(c) for c in cmd), flush=True)
    r = subprocess.run(cmd, cwd=str(ROOT), env=ENV)
    ok = r.returncode == 0
    print(f"[{'OK ' if ok else 'FAIL'}] {label} (rc={r.returncode})", flush=True)
    return ok


def main() -> int:
    results = {}
    for c in CHARS:
        base = ROOT / "data" / "beatscape-characters" / "anime" / c
        anchors = sorted(glob.glob(str(base / f"{c}-front-*-00-*.png")))
        if not anchors:
            print(f"[skip] {c}: no anchor image found", flush=True)
            results[c] = "no-anchor"
            continue
        anchor = anchors[0]
        trigger = f"{c}bs"

        ok_ts = run(f"{c} trainset", [
            PY, "scripts/beatscape-anime-trainset.py",
            "--character", c, "--anchor", anchor, "--count", "8",
        ])
        ok_tr = run(f"{c} train", [
            PY, "scripts/beatscape-anime-lora-train.py",
            "--train-dir", str(base / "train"),
            "--output-dir", str(base / "lora"),
            "--character", c, "--epochs", "8", "--resolution", "768",
            "--rank", "8", "--lr", "5e-5",
        ])
        ok_va = run(f"{c} validate", [
            PY, "scripts/beatscape-anime-gen.py",
            "--character", c, "--view", "front", "--count", "6",
            "--seed", str(SEEDS[c]), "--lora", str(base / "lora"),
            "--trigger", trigger, "--lora-scale", "0.9",
            "--out-dir", str(base / "lora-test"),
        ])
        results[c] = "ok" if (ok_ts and ok_tr and ok_va) else "partial"
        print(f"[summary] {c}: trainset={ok_ts} train={ok_tr} validate={ok_va}",
              flush=True)

    print("\n===== BATCH COMPLETE =====", flush=True)
    for c, v in results.items():
        print(f"  {c}: {v}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
