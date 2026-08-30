#!/usr/bin/env python
"""Self-contained SDXL LoRA training for BeatScape characters.

Trains a character LoRA on Animagine XL 4.0 (SDXL) using the LOCAL cached
weights only (no network). Reads an imagefolder-style train set produced by
beatscape-anime-trainset.py:

    <train_dir>/<name>-train-NN-<seed>.png   (image)
    <train_dir>/<name>-train-NN-<seed>.txt   (caption, trigger word first)

No `datasets` dependency: images are loaded with PIL, captions with plain file IO.
Single process, MPS (Mac), fp32. LoRA is applied to the UNet attention layers.

Usage:
    python scripts/beatscape-anime-lora-train.py \
        --train-dir data/beatscape-characters/anime/rivet/train \
        --output-dir data/beatscape-characters/anime/rivet/lora \
        --character rivet --epochs 20 --resolution 768 --rank 16 --lr 1e-4
"""
from __future__ import annotations
import argparse
import math
import os
import re
from pathlib import Path

import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image

from diffusers import StableDiffusionXLPipeline
from diffusers.utils.state_dict_utils import convert_state_dict_to_diffusers
from peft import LoraConfig, get_peft_model, get_peft_model_state_dict
from transformers import CLIPTextModel, CLIPTextModelWithProjection

BASE_MODEL = "cagliostrolab/animagine-xl-4.0"
TRIGGER_DEFAULT = "{char}bs"  # e.g. rivetbs

_LORA_TARGETS = [
    "to_q", "to_k", "to_v", "to_out.0",
    "add_q_proj", "add_k_proj", "add_v_proj", "add_out_proj",
]


def tokenize_prompt(tokenizer, prompt, max_len):
    ids = tokenizer(
        prompt, padding="max_length", max_length=max_len,
        truncation=True, return_tensors="pt",
    ).input_ids
    return ids


def encode_prompt(text_encoders, tokenizers, prompts):
    embeds_list = []
    pooled_list = []
    for i, te in enumerate(text_encoders):
        tok = tokenizers[i]
        ids = torch.cat([tokenize_prompt(tok, p, tok.model_max_length) for p in prompts])
        out = te(ids.to(te.device), output_hidden_states=True, return_dict=False)
        pooled = out[0]
        hidden = out[-1][-2]
        embeds_list.append(hidden)
        pooled_list.append(pooled)
    prompt_embeds = torch.cat(embeds_list, dim=-1)
    pooled_prompt_embeds = pooled_list[-1]
    return prompt_embeds, pooled_prompt_embeds


class TrainSet(Dataset):
    def __init__(self, train_dir: Path, resolution: int):
        self.files = sorted(train_dir.glob("*.png"))
        self.resolution = resolution
        self.tf = transforms.Compose([
            transforms.Resize((resolution, resolution), interpolation=Image.BICUBIC),
            transforms.ToTensor(),  # -> [0,1] float
        ])

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        img = self.tf(Image.open(self.files[idx]).convert("RGB"))
        cap = (self.files[idx].with_suffix(".txt")).read_text(encoding="utf-8").strip()
        return {"pixel_values": img, "caption": cap}


def collate(batch):
    px = torch.stack([b["pixel_values"] for b in batch]).contiguous().float()
    caps = [b["caption"] for b in batch]
    return {"pixel_values": px, "captions": caps}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--train-dir", required=True)
    ap.add_argument("--output-dir", required=True)
    ap.add_argument("--character", required=True)
    ap.add_argument("--base-model", default=BASE_MODEL)
    ap.add_argument("--epochs", type=int, default=20)
    ap.add_argument("--resolution", type=int, default=768)
    ap.add_argument("--rank", type=int, default=16)
    ap.add_argument("--alpha", type=int, default=16)
    ap.add_argument("--lr", type=float, default=1e-4)
    ap.add_argument("--batch-size", type=int, default=1)
    ap.add_argument("--seed", type=int, default=1337)
    ap.add_argument("--steps-per-epoch", type=int, default=None,
                    help="If set, cap steps per epoch (useful for tiny sets)")
    args = ap.parse_args()

    torch.manual_seed(args.seed)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"[info] device={device}  base={args.base_model}  local_files_only")

    # ---- load pipeline components (cached, offline) ----
    pipe = StableDiffusionXLPipeline.from_pretrained(
        args.base_model, torch_dtype=torch.float32, use_safetensors=True,
        local_files_only=True,
    )
    pipe = pipe.to(device)
    vae, te1, te2 = pipe.vae, pipe.text_encoder, pipe.text_encoder_2
    tok1, tok2 = pipe.tokenizer, pipe.tokenizer_2
    unet = pipe.unet
    noise_scheduler = pipe.scheduler

    # freeze everything; LoRA only
    vae.requires_grad_(False)
    te1.requires_grad_(False)
    te2.requires_grad_(False)
    unet.requires_grad_(False)

    # ---- inject LoRA into UNet ----
    lora_config = LoraConfig(
        r=args.rank, lora_alpha=args.alpha,
        target_modules=_LORA_TARGETS, lora_dropout=0.0, bias="none",
    )
    unet = get_peft_model(unet, lora_config)
    unet.train()
    n_train = sum(p.numel() for p in unet.parameters() if p.requires_grad)
    print(f"[info] LoRA trainable params = {n_train:,}")

    # ---- dataset ----
    ds = TrainSet(Path(args.train_dir), args.resolution)
    loader = DataLoader(ds, batch_size=args.batch_size, shuffle=True, collate_fn=collate)
    print(f"[info] train images = {len(ds)}  resolution = {args.resolution}")

    # ---- optim + lr ----
    opt = torch.optim.AdamW(
        (p for p in unet.parameters() if p.requires_grad), lr=args.lr
    )
    total_steps = args.epochs * max(1, len(loader))
    print(f"[info] total steps ~ {total_steps}")

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # SDXL uses v_prediction
    noise_scheduler.register_to_config(prediction_type="v_prediction")

    target_res = (args.resolution, args.resolution)
    global_step = 0
    for epoch in range(args.epochs):
        running = 0.0
        for step, batch in enumerate(loader):
            if args.steps_per_epoch and step >= args.steps_per_epoch:
                break
            with torch.no_grad():
                px = batch["pixel_values"].to(device)
                latents = vae.encode(px).latent_dist.sample()
                latents = latents * vae.config.scaling_factor

                noise = torch.randn_like(latents)
                bsz = latents.shape[0]
                timesteps = torch.randint(
                    0, noise_scheduler.config.num_train_timesteps,
                    (bsz,), device=device
                ).long()
                noisy = noise_scheduler.add_noise(latents, noise, timesteps)
                target = noise_scheduler.get_velocity(latents, noise, timesteps)

                caps = batch["captions"]
                prompt_embeds, pooled = encode_prompt(
                    [te1, te2], [tok1, tok2], caps
                )
                prompt_embeds = prompt_embeds.to(device)
                pooled = pooled.to(device)
                add_time_ids = torch.tensor(
                    [list(target_res + (0, 0) + target_res)],
                    device=device, dtype=torch.float32,
                ).repeat(bsz, 1)

            unet.zero_grad(set_to_none=True)
            model_pred = unet(
                noisy, timesteps, prompt_embeds,
                added_cond_kwargs={"text_embeds": pooled, "time_ids": add_time_ids},
                return_dict=False,
            )[0]
            loss = torch.nn.functional.mse_loss(model_pred.float(), target.float())
            loss.backward()
            opt.step()

            running += loss.item()
            global_step += 1
            if step % 5 == 0 or step == len(loader) - 1:
                print(f"  epoch {epoch+1}/{args.epochs} step {step} loss={loss.item():.4f}")

        print(f"[epoch {epoch+1}] avg loss = {running / max(1, len(loader)):.4f}")

    # ---- save ----
    sd = convert_state_dict_to_diffusers(get_peft_model_state_dict(unet))
    # Strip the peft wrapper segment ("base_model.model.") so diffusers'
    # load_lora_weights can map keys onto the real UNet modules. Without this
    # the keys read "unet.base_model.model.up_blocks..." and peft errors with
    # "Target modules ... not found in the base model".
    sd = {k.replace("base_model.model.", ""): v for k, v in sd.items()}
    StableDiffusionXLPipeline.save_lora_weights(
        str(out_dir), unet_lora_layers=sd, safe_serialization=True,
    )
    print(f"[done] LoRA saved to {out_dir}/pytorch_lora_weights.safetensors")
    print(f"[done] trigger word: {TRIGGER_DEFAULT.format(char=args.character)}")


if __name__ == "__main__":
    main()
