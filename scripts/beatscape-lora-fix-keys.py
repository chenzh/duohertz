#!/usr/bin/env python3
"""Fix peft-wrapper key prefix in a diffusers SDXL LoRA safetensors.

When LoRA is saved via diffusers' `StableDiffusionXLPipeline.save_lora_weights`
together with `convert_state_dict_to_diffusers`, keys can end up as
`unet.base_model.model.up_blocks...to_k.lora.down.weight` (the peft wrapper
segment `base_model.model.` is not stripped). diffusers' loader then reads that
segment as part of the real module path and fails with
"Target modules ... not found".

This script rewrites keys to the canonical `unet.<module>.lora.down.weight`
(diffusers/peft compatible) form, backing up the original file first.

Usage:
    python scripts/beatscape-lora-fix-keys.py <path-to-lora.safetensors>
"""
import sys
import shutil
from pathlib import Path

import safetensors.torch as st


def fix_keys(path: Path) -> Path:
    sd = st.load_file(str(path))
    bad = [k for k in sd if "base_model.model." in k]
    if not bad:
        print(f"[skip] no 'base_model.model.' keys in {path.name} "
              f"({len(sd)} keys) — already canonical")
        return path
    new = {k.replace("base_model.model.", ""): v for k, v in sd.items()}
    backup = path.with_suffix(".safetensors.bak")
    if not backup.exists():
        shutil.copy(path, backup)
        print(f"[backup] {backup.name}")
    st.save_file(new, str(path))
    print(f"[fixed] {path.name}: {len(bad)} keys rewritten "
          f"-> unet.<module>.lora.*.weight")
    return path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: beatscape-lora-fix-keys.py <lora.safetensors>")
    for p in sys.argv[1:]:
        fix_keys(Path(p))
