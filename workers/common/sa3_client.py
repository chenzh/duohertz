"""Call local Stable Audio 3 MLX CLI from the thin SA3 worker."""

from __future__ import annotations

import os
import shutil
import subprocess
import time
from pathlib import Path
from typing import Any


def mlx_root() -> Path:
    explicit = os.getenv("SA3_MLX_DIR")
    if explicit:
        return Path(explicit).expanduser().resolve()
    repo = Path(os.getenv("SA3_REPO", os.path.expanduser("~/workers/stable-audio-3"))).expanduser()
    return (repo / "optimized" / "mlx").resolve()


def mlx_enabled() -> bool:
    mode = os.getenv("SA3_WORKER_MODE", os.getenv("WORKER_MODE", "synth"))
    return mode == "mlx"


def mlx_ready() -> bool:
    root = mlx_root()
    return (root / "scripts" / "sa3_mlx.py").is_file()


def _dit_decoder(model_variant: str | None) -> tuple[str, str]:
    v = (model_variant or os.getenv("SA3_MODEL_VARIANT", "small")).lower()
    if v == "medium":
        return "medium", "same-l"
    return "sm-music", "same-s"


def _runner_cmd(root: Path) -> list[str] | None:
    venv_py = root / ".venv" / "bin" / "python"
    if venv_py.is_file():
        return [str(venv_py)]
    uv = shutil.which("uv")
    if uv:
        return [uv, "run", "--no-project", "python"]
    return None


def generate_via_sa3_mlx(payload: dict[str, Any], out_path: str) -> tuple[bool, int, str | None]:
    if not mlx_enabled():
        return False, 0, "SA3_WORKER_MODE != mlx"

    root = mlx_root()
    script = root / "scripts" / "sa3_mlx.py"
    if not script.is_file():
        return False, 0, f"SA3 MLX script missing: {script}"

    runner = _runner_cmd(root)
    if not runner:
        return False, 0, "SA3 MLX python/uv not found (run scripts/mac-sa3-mlx-bootstrap.sh)"

    prompt = (payload.get("prompt") or "").strip()
    if not prompt:
        prompt = "instrumental background music, cinematic, no vocals"

    duration = int(payload.get("duration_sec", 30))
    duration = max(5, min(duration, 180))
    dit, decoder = _dit_decoder(payload.get("model_variant"))

    job_id = str(payload.get("job_id", "job"))
    seed_env = os.getenv("SA3_SEED")
    seed = int(seed_env) if seed_env else abs(hash(job_id)) % (2**31)

    negative = os.getenv("SA3_NEGATIVE_PROMPT", "vocals, singing, speech, lyrics")
    cfg = float(os.getenv("SA3_CFG", "1.0"))
    steps = int(os.getenv("SA3_STEPS", "8"))

    tmp_out = Path(f"/tmp/sa3-{job_id}.wav")
    if tmp_out.exists():
        tmp_out.unlink()

    cmd = [
        *runner,
        str(script),
        "--prompt",
        prompt,
        "--negative-prompt",
        negative,
        "--dit",
        dit,
        "--decoder",
        decoder,
        "--seconds",
        str(duration),
        "--out",
        str(tmp_out),
        "--seed",
        str(seed),
        "--steps",
        str(steps),
        "--cfg",
        str(cfg),
    ]

    timeout = int(os.getenv("SA3_GEN_TIMEOUT_SEC", str(max(180, duration * 3 + 60))))
    env = os.environ.copy()
    venv = root / ".venv"
    if venv.is_dir():
        env["VIRTUAL_ENV"] = str(venv)
        env["PATH"] = f"{venv / 'bin'}:{env.get('PATH', '')}"

    started = time.time()
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(root),
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
        )
    except subprocess.TimeoutExpired:
        return False, int((time.time() - started) * 1000), f"SA3 timeout after {timeout}s"
    except OSError as exc:
        return False, 0, str(exc)

    latency_ms = int((time.time() - started) * 1000)
    if proc.returncode != 0:
        tail = (proc.stderr or proc.stdout or "").strip()[-800:]
        return False, latency_ms, f"SA3 exit {proc.returncode}: {tail}"

    if not tmp_out.is_file():
        return False, latency_ms, "SA3 produced no output file"

    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(tmp_out, out)
    return True, latency_ms, None
