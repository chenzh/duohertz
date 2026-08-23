#!/usr/bin/env bash
# Staged ACE-Step install for macOS arm64 (avoids huge single pip resolve).
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"
cd "$HOME/workers/ACE-Step-1.5"

# Optional proxy (ClashX default)
if curl -fsS --max-time 2 http://127.0.0.1:7890 >/dev/null 2>&1; then
  export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890
  echo "[ace-mac] using proxy 7890"
fi

source .venv/bin/activate 2>/dev/null || { uv venv --python 3.12 && source .venv/bin/activate; }

install() {
  echo "[ace-mac] pip: $*"
  uv pip install --default-index https://pypi.org/simple "$@"
}

echo "[ace-mac] stage 1: mlx"
install "mlx>=0.25.2" "mlx-lm>=0.20.0"

echo "[ace-mac] stage 2: torch (pinned stack — mismatched torchvision/torchaudio break acestep-api)"
install "torch==2.7.1" "torchvision==0.22.1" "torchaudio==2.7.1"

echo "[ace-mac] stage 3: core deps"
install \
  "transformers>=4.51.0,<4.58.0" diffusers "gradio==6.2.0" matplotlib scipy soundfile \
  loguru einops accelerate fastapi diskcache "uvicorn[standard]" numba \
  "vector-quantize-pytorch>=1.27.15" toml modelscope typer-slim peft \
  lycoris-lora lightning tensorboard pytorch-wavelets pywavelets "setuptools<72"

echo "[ace-mac] stage 4: ace-step editable"
uv pip install -e . --no-deps

python - <<'PY'
import mlx, torch, acestep
print("mlx", mlx.__version__)
print("torch", torch.__version__)
print("imports ok")
PY
echo "[ace-mac] all stages done"
