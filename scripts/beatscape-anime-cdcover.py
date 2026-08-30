#!/usr/bin/env python3
"""Generate a square music-CD / album-cover image for a BeatScape character.

Loads the character's SDXL LoRA (e.g. voltabs) so the face/identity stays
locked, then renders a square album-cover composition with a requested colour
theme (default: red). Reuses the project's MOTIF, NEGATIVE (§2 IP red lines)
and CLIP 77-BPE fit_clip logic so output matches the rest of the IP.

    python3 scripts/beatscape-anime-cdcover.py \
        --character volta --trigger voltabs \
        --lora data/beatscape-characters/anime/volta/lora/pytorch_lora_weights.safetensors \
        --theme red --count 1

Runtime: managed venv (torch / diffusers / transformers / accelerate / safetensors)
License: Animagine XL 4.0 is CreativeML Open RAIL++-M — commercial OK w/ licence.
"""
from __future__ import annotations

import argparse
import importlib.util
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "beatscape-characters" / "anime"


def _load_prompts():
    spec = importlib.util.spec_from_file_location(
        "beatscape_anime_prompts", ROOT / "scripts" / "beatscape-anime-prompts.py"
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def fit_clip(prompt: str, tokenizer, limit: int = 75, head_n: int = 14,
             tail_n: int = 4) -> str:
    """Same BPE-aware trim as beatscape-anime-gen.py (see there for rationale)."""
    tags = [t.strip() for t in prompt.split(",") if t.strip()]
    enc = lambda s: len(tokenizer(s, add_special_tokens=False).input_ids)
    if enc(prompt) <= limit:
        return prompt
    head, tail = tags[:head_n], tags[-tail_n:]
    mid = [t for t in tags[head_n:-tail_n] if t not in set(head) | set(tail)]
    while mid:
        cand = ", ".join(head + mid + tail)
        if enc(cand) <= limit:
            break
        mid.pop()
    return ", ".join(head + mid + tail)


# Colour-theme palettes (Danbooru tags). Red is the default per the brief.
THEMES = {
    "red": ["red theme", "crimson red", "vermilion red",
            "red background", "red spotlight", "red glow", "red neon",
            "concert stage", "sound waves"],
    "blue": ["blue theme", "azure", "blue background", "blue spotlight",
             "blue glow", "concert stage", "sound waves"],
}


def build_cd_prompt(P, character: str, theme: str) -> str:
    c = P.CHARACTERS[character]
    # Keep it lean so it fits CLIP's 77-BPE budget without dropping the motif;
    # the LoRA carries the identity, so we don't need every appearance tag.
    parts = [
        c["subject"],
        "rating:safe",
        P.MOTIF,                              # brand resonance-diamond motif
        c["clothing"],                        # character's signature outfit
        c["prop"],
        "album cover", "cd jacket", "music album artwork",
        "square composition", "centered", "textless",
    ]
    parts += THEMES.get(theme, THEMES["red"])
    parts.append(P.QUALITY_TAGS)
    return ", ".join(p for p in parts if p)


def main() -> int:
    ap = argparse.ArgumentParser(description="BeatScape character music-CD cover")
    ap.add_argument("--character", required=True)
    ap.add_argument("--trigger", required=True, help="LoRA trigger word")
    ap.add_argument("--lora", required=True, help="path to .safetensors")
    ap.add_argument("--theme", default="red", choices=sorted(THEMES))
    ap.add_argument("--count", type=int, default=1)
    ap.add_argument("--seed", type=int, default=777)
    ap.add_argument("--size", type=int, default=1024, help="square px (1024=SDXL native)")
    ap.add_argument("--out-dir", type=Path, default=OUT_DIR)
    ap.add_argument("--lora-scale", type=float, default=0.9)
    args = ap.parse_args()

    P = _load_prompts()
    if args.character not in P.CHARACTERS:
        raise SystemExit(f"unknown character: {args.character}")

    import torch
    from diffusers import StableDiffusionXLPipeline, EulerAncestralDiscreteScheduler

    dtype = torch.float16 if torch.backends.mps.is_available() else torch.float32
    pipe = StableDiffusionXLPipeline.from_pretrained(
        P.SETTINGS["base_model"], dtype=dtype, use_safetensors=True,
        local_files_only=True,
    )
    pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(pipe.scheduler.config)
    pipe = pipe.to("mps" if torch.backends.mps.is_available() else "cpu")
    pipe.enable_attention_slicing()

    pipe.load_lora_weights(args.lora)
    pipe.set_adapters(pipe.get_active_adapters(), adapter_weights=[args.lora_scale])

    base_prompt = build_cd_prompt(P, args.character, args.theme)
    prompt = f"{args.trigger}, " + base_prompt
    # Theme tags MUST survive CLIP trim — shrink head_n to 8 (trigger+subject+
    # rating+MOTIF only, let the LoRA carry clothing/prop identity) and grow
    # tail_n so the theme block sits in the "always kept" tail alongside the
    # quality tags. Verified by grid search on the volta/red case:
    #   head_n=8, tail_n=4+theme -> 72 BPE, 9/9 theme + 3/3 MOTIF preserved.
    theme_size = len(THEMES[args.theme])
    prompt = fit_clip(prompt, pipe.tokenizer, head_n=8, tail_n=4 + theme_size)
    bpe = len(pipe.tokenizer(prompt, add_special_tokens=False).input_ids)
    print(f"[prompt {bpe} BPE] {prompt}")
    assert bpe <= 75, f"CD prompt over budget after trim: {bpe} BPE"
    negative = P.NEGATIVE

    out_dir = args.out_dir / "cd" / args.character
    out_dir.mkdir(parents=True, exist_ok=True)
    rng = random.Random(args.seed)
    for i in range(args.count):
        s = rng.randint(0, 2**31 - 1)
        gen = torch.Generator(device="cpu").manual_seed(s)
        img = pipe(
            prompt=prompt, negative_prompt=negative,
            width=args.size, height=args.size,
            num_inference_steps=P.SETTINGS["steps"],
            guidance_scale=P.SETTINGS["cfg"], generator=gen,
            cross_attention_kwargs=None,
        ).images[0]
        path = out_dir / f"{args.character}-cd-{args.seed}-{i:02d}-{s}.png"
        img.save(path)
        print(f"OK {path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
