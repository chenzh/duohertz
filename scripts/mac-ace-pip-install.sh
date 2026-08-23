#!/usr/bin/env bash
# Install ACE-Step on macOS arm64 without cross-platform uv lock (no flash_attn).
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"
cd "$HOME/workers/ACE-Step-1.5"

echo "[ace-mac] create venv"
rm -rf .venv
uv venv --python 3.12
# shellcheck disable=SC1091
source .venv/bin/activate

echo "[ace-mac] install mlx + runtime deps"
uv pip install \
  "mlx>=0.25.2" "mlx-lm>=0.20.0" \
  "torch>=2.9.1" torchvision torchaudio \
  "transformers>=4.51.0,<4.58.0" diffusers "gradio==6.2.0" matplotlib scipy soundfile \
  loguru einops accelerate fastapi diskcache "uvicorn[standard]" numba \
  "vector-quantize-pytorch>=1.27.15" toml modelscope typer-slim peft \
  lycoris-lora lightning tensorboard pytorch-wavelets pywavelets "setuptools<72"

echo "[ace-mac] install ace-step package"
uv pip install -e . --no-deps

echo "[ace-mac] verify imports"
python - <<'PY'
import mlx
import mlx_lm
import acestep
print("mlx", mlx.__version__)
print("imports ok")
PY

echo "[ace-mac] done"
