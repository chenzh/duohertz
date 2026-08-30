#!/usr/bin/env python3
"""Build a CONSISTENT LoRA training set for one BeatScape character.

Step 2 of the character IP pipeline. We take ONE strong txt2img anchor image as
the identity source, then run SDXL img2img at low strength (0.45) with varied
pose / angle / expression prompts. Because the anchor already encodes the face,
low denoise keeps identity while the prompt reshapes the pose — giving a set of
images that share ONE character (what a LoRA needs) instead of N different boys.

Each image gets a sidecar .txt caption that starts with the unique trigger token
`rivetbs` (or `<char>bs`) so the trained LoRA activates on that token alone.

    python3 scripts/beatscape-anime-trainset.py --character rivet --anchor rivet-front-1341-00-1945552655.png --count 8

Runtime: managed venv with torch + diffusers + transformers (MPS on Apple Silicon).
License: Animagine XL 4.0 is CreativeML Open RAIL++-M — commercial use permitted
with licence shipped + changes stated. See docs/licenses/README.md.
"""

from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "beatscape-characters" / "anime"

TRIGGER_SUFFIX = "bs"  # -> rivetbs, prismbs, ...

# Pose / angle / expression variants. These go BETWEEN the identity tags and the
# quality tail so img2img reshapes composition while keeping the face.
VARIATIONS = [
    "front view, standing, neutral expression, symmetric pose",
    "three-quarter view, slight smile, looking at viewer",
    "looking to the side, dynamic angle, wind in hair",
    "arms crossed, confident pose, upper body",
    "close-up, upper body, soft lighting",
    "full body, wide shot, city street background",
    "laughing, energetic, open mouth",
    "from below, heroic low angle, chest emblem visible",
]


def _load_prompts():
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "beatscape_anime_prompts", ROOT / "scripts" / "beatscape-anime-prompts.py"
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def fit_clip(prompt: str, tokenizer, limit: int = 75) -> str:
    tags = [t.strip() for t in prompt.split(",") if t.strip()]
    enc = lambda s: len(tokenizer(s, add_special_tokens=False).input_ids)
    if enc(prompt) <= limit:
        return prompt
    head, tail = tags[:14], tags[-4:]
    mid = [t for t in tags[14:-4] if t not in set(head) | set(tail)]
    while mid:
        if enc(", ".join(head + mid + tail)) <= limit:
            break
        mid.pop()
    return ", ".join(head + mid + tail)


def build_set(character: str, anchor: Path, count: int, seed: int,
              strength: float, out_dir: Path, dry_run: bool = False) -> list[Path]:
    P = _load_prompts()
    import torch
    from diffusers import StableDiffusionXLImg2ImgPipeline, EulerAncestralDiscreteScheduler
    from PIL import Image

    trigger = f"{character}{TRIGGER_SUFFIX}"
    base = P.build_prompt(character, "front")  # identity tags + MOTIF + quality
    negative = P.NEGATIVE

    out_dir.mkdir(parents=True, exist_ok=True)

    if dry_run:
        print(f"[dry-run] {character} trainset × {count}  anchor={anchor.name} "
              f"strength={strength} trigger={trigger}")
        for i in range(count):
            v = VARIATIONS[i % len(VARIATIONS)]
            cap = f"{trigger}, " + base
            print(f"  [{i:02d}] {v}")
            print(f"        caption: {cap[:140]}...")
        return []

    dtype = torch.float16 if torch.backends.mps.is_available() else torch.float32
    pipe = StableDiffusionXLImg2ImgPipeline.from_pretrained(
        P.SETTINGS["base_model"], dtype=dtype, use_safetensors=True,
        local_files_only=True,
    )
    pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(pipe.scheduler.config)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    pipe = pipe.to(device)
    pipe.enable_attention_slicing()

    init = Image.open(anchor).convert("RGB")
    tok = pipe.tokenizer

    written: list[Path] = []
    rng = random.Random(seed)
    for i in range(count):
        v = VARIATIONS[i % len(VARIATIONS)]
        # Trigger + variation first, then the constant identity prompt; fit to
        # CLIP's 77-subword budget keeping the trigger + MOTIF + quality.
        prompt = fit_clip(f"{trigger}, {v}, " + base, tok)
        s = rng.randint(0, 2**31 - 1)
        gen = torch.Generator(device="cpu").manual_seed(s)
        image = pipe(
            prompt=prompt,
            negative_prompt=negative,
            image=init,
            strength=strength,
            width=P.SETTINGS["width"],
            height=P.SETTINGS["height"],
            num_inference_steps=max(28, P.SETTINGS["steps"]),
            guidance_scale=P.SETTINGS["cfg"],
            generator=gen,
        ).images[0]
        path = out_dir / f"{character}-train-{i:02d}-{s}.png"
        image.save(path)
        # Caption: trigger + the SAME identity prompt (constant) + this variation.
        cap = f"{trigger}, {v}, " + base
        (out_dir / f"{character}-train-{i:02d}-{s}.txt").write_text(cap, encoding="utf-8")
        written.append(path)
        print(f"OK {path.name}", flush=True)
    return written


def main() -> int:
    ap = argparse.ArgumentParser(description="Build a consistent LoRA training set")
    ap.add_argument("--character", required=True)
    ap.add_argument("--anchor", type=Path, required=True,
                    help="strong txt2img image to use as the identity source")
    ap.add_argument("--count", type=int, default=8)
    ap.add_argument("--seed", type=int, default=4242)
    ap.add_argument("--strength", type=float, default=0.45,
                    help="img2img denoise strength (lower = more identity kept)")
    ap.add_argument("--out-dir", type=Path, default=None)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    P = _load_prompts()
    if args.character not in P.CHARACTERS:
        raise SystemExit(f"unknown character: {args.character}")
    if not args.anchor.exists():
        raise SystemExit(f"anchor not found: {args.anchor}")
    out = args.out_dir or (OUT_DIR / args.character / "train")
    written = build_set(args.character, args.anchor, args.count, args.seed,
                        args.strength, out, args.dry_run)
    if written:
        print(f"--- {args.character}: {len(written)} training image(s) -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
