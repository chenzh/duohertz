#!/usr/bin/env python3
"""Generate BeatScape character reference sheets with Animagine XL 4.0.

Step 1 of the character IP pipeline: produce a batch of reference images per
character, from which a consistent subset gets picked for LoRA training.

    python3 scripts/beatscape-anime-gen.py --check
    python3 scripts/beatscape-anime-gen.py --character volta --count 24
    python3 scripts/beatscape-anime-gen.py --character volta --view side --count 8
    python3 scripts/beatscape-anime-gen.py --all --count 6 --dry-run

Runtime: managed venv at ~/.workbuddy/binaries/python/envs/default
    pip install torch torchvision diffusers transformers accelerate safetensors

License note: Animagine XL 4.0 is CreativeML Open RAIL++-M — **commercial use
permitted**, but you must ship a copy of the licence, state changes, and
preserve notices. See docs/licenses/README.md.
"""

from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "beatscape-characters" / "anime"

VENV_PY = Path.home() / ".workbuddy/binaries/python/envs/default/bin/python"

INSTALL_HINT = """missing dependencies.

Install into the managed venv:
  {py} -m venv {venv}
  {venv}/bin/pip install torch torchvision diffusers transformers accelerate safetensors sentencepiece protobuf

Or use Draw Things (Mac App Store, free) instead — paste the prompts from
`python3 scripts/beatscape-anime-prompts.py --character volta`.
Draw Things also does on-device LoRA training, which this script does not.
"""


def _load_prompts():
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "beatscape_anime_prompts", ROOT / "scripts" / "beatscape-anime-prompts.py"
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def check_env() -> int:
    try:
        import torch  # noqa: F401
        import diffusers  # noqa: F401
        import transformers  # noqa: F401
    except ImportError as exc:
        print(f"FAIL {exc.name} not importable", file=sys.stderr)
        print(INSTALL_HINT.format(py=sys.executable, venv=str(VENV_PY.parent.parent)),
              file=sys.stderr)
        return 2
    import torch

    print(f"torch      {torch.__version__}")
    import diffusers
    print(f"diffusers  {diffusers.__version__}")
    print(f"MPS        {torch.backends.mps.is_available()}")
    if torch.backends.mps.is_available():
        print("backend    mps (Apple Silicon)")
    else:
        print("backend    cpu (slow — expect minutes per image)")
    return 0


def fit_clip(prompt: str, tokenizer, limit: int = 75, head_n: int = 14,
             tail_n: int = 4) -> str:
    """Trim a Danbooru prompt to CLIP's real 77-subword budget.

    CLIP counts BPE subwords of the *whole* string (commas/spaces become real
    subwords), so a 34-tag prompt can blow 77 even though per-tag costs sum low.
    Keep the HEAD (subject + rating + resonance-diamond MOTIF + start of
    identity) and the TAIL (quality tags); drop redundant MIDDLE tags from the
    back until the whole string fits. Always returns <= limit tokens.
    """
    tags = [t.strip() for t in prompt.split(",") if t.strip()]
    enc = lambda s: len(tokenizer(s, add_special_tokens=False).input_ids)
    if enc(prompt) <= limit:
        return prompt
    head, tail = tags[:head_n], tags[-tail_n:]
    mid = [t for t in tags[head_n:-tail_n] if t not in set(head) | set(tail)]
    # Drop middle tags from the back until head+mid+tail fits the budget.
    while mid:
        candidate = ", ".join(head + mid + tail)
        if enc(candidate) <= limit:
            break
        mid.pop()
    return ", ".join(head + mid + tail)


def generate(character: str, view: str, count: int, seed: int, out_dir: Path,
             dry_run: bool = False, steps: int | None = None,
             lora: str | None = None, trigger: str | None = None,
             lora_scale: float = 0.9) -> list[Path]:
    P = _load_prompts()
    import torch
    from diffusers import StableDiffusionXLPipeline, EulerAncestralDiscreteScheduler

    settings = dict(P.SETTINGS)
    if steps:
        settings["steps"] = steps

    prompt = P.build_prompt(character, view)
    negative = P.NEGATIVE

    out_dir.mkdir(parents=True, exist_ok=True)
    prefix = f"{character}-{view}"

    if dry_run:
        print(f"[dry-run] {prefix} × {count}  seed={seed}")
        print(f"  prompt: {prompt[:160]}...")
        return []

    dtype = torch.float16 if torch.backends.mps.is_available() else torch.float32
    # Local-only: the model is fully cached; never hit the network (proxy blocks
    # huggingface.co and the hosted API is rate-limited at 429).
    pipe = StableDiffusionXLPipeline.from_pretrained(
        settings["base_model"], dtype=dtype, use_safetensors=True,
        local_files_only=True,
    )
    pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(pipe.scheduler.config)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    pipe = pipe.to(device)
    pipe.enable_attention_slicing()

    # Optionally load a character LoRA (e.g. rivetbs) for consistent identity.
    if lora:
        pipe.load_lora_weights(lora)
        # set_adapters is the canonical way to control LoRA strength in
        # diffusers 0.40 (cross_attention_kwargs scale is deprecated).
        pipe.set_adapters(pipe.get_active_adapters(), adapter_weights=[lora_scale])
        if trigger:
            # Trigger word goes first so fit_clip keeps it as the HEAD.
            prompt = f"{trigger}, " + prompt
        print(f"[lora] loaded {lora}  trigger={trigger}  scale={lora_scale}")

    # Fit to CLIP's real 77-subword budget (BPE, not comma tags) using the
    # pipeline's own tokenizer — keeps the resonance-diamond MOTIF and quality
    # tags, drops redundant middle filler instead.
    prompt = fit_clip(prompt, pipe.tokenizer)
    print(f"[prompt {len(prompt)} chars] {prompt[:120]}...")

    written: list[Path] = []
    rng = random.Random(seed)
    for i in range(count):
        s = rng.randint(0, 2**31 - 1)
        gen = torch.Generator(device="cpu").manual_seed(s)
        image = pipe(
            prompt=prompt,
            negative_prompt=negative,
            width=settings["width"],
            height=settings["height"],
            num_inference_steps=settings["steps"],
            guidance_scale=settings["cfg"],
            generator=gen,
            cross_attention_kwargs=None,
        ).images[0]
        path = out_dir / f"{prefix}-{seed}-{i:02d}-{s}.png"
        image.save(path)
        written.append(path)
        print(f"OK {path.name}", flush=True)
    return written


def main() -> int:
    ap = argparse.ArgumentParser(description="BeatScape anime character generation")
    ap.add_argument("--character")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--view", default="front")
    ap.add_argument("--count", type=int, default=8)
    ap.add_argument("--seed", type=int, default=1337)
    ap.add_argument("--steps", type=int, default=None)
    ap.add_argument("--out-dir", type=Path, default=OUT_DIR)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--check", action="store_true", help="Verify the runtime only")
    ap.add_argument("--lora", type=str, default=None,
                    help="Path to a .safetensors LoRA to load (e.g. rivetbs)")
    ap.add_argument("--trigger", type=str, default=None,
                    help="Trigger word for the LoRA (prepended to prompt)")
    ap.add_argument("--lora-scale", type=float, default=0.9)
    args = ap.parse_args()

    if args.check:
        return check_env()

    P = _load_prompts()
    keys = list(P.CHARACTERS) if args.all else ([args.character] if args.character else [])
    if not keys:
        ap.error("specify --character or --all")

    for key in keys:
        if key not in P.CHARACTERS:
            raise SystemExit(f"unknown character: {key}")
        written = generate(key, args.view, args.count, args.seed,
                           args.out_dir / key, args.dry_run, args.steps,
                           lora=args.lora, trigger=args.trigger,
                           lora_scale=args.lora_scale)
        if written:
            print(f"--- {key}: {len(written)} image(s) -> {args.out_dir / key}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
