# M1 推理基准实测

**日期：** 2026-08-23（MLX 加速改造后更新）  
**Worker 节点：** Mac `192.168.0.199`（M5 Pro 48GB）  
**ACE API：** `:8200`（`acestep-5Hz-lm-0.6B`）  
**ACE Worker：** `:8101`（`WORKER_MODE=mlx`，`ACE_THINKING=false`，`ACE_BATCH_SIZE=1`）

## 环境

| 组件 | 地址 | 状态 |
|------|------|------|
| ACE API | `http://127.0.0.1:8200` | ok，`models_initialized=true` |
| ACE Worker | `http://127.0.0.1:8101` | ok，`mode=mlx`，`ace_api=ok` |
| SA3 Worker | `http://127.0.0.1:8102` | ok（仍为 synth，另项） |

## MLX 人声基准（10s `vocal_lyrics`）

配置：`audio_format=wav` · `thinking=false` · `batch_size=1` · `ACE_FALLBACK_SYNTH=false`

| 运行 | 墙钟 (s) | Worker latency_ms | 输出 |
|------|----------|-------------------|------|
| 1 | 3 | 3008 | `/tmp/mlx-test-1.wav` 3.84MB |
| 2 | 3 | 3013 | 同上 |
| 3 | 3 | 3012 | 同上 |
| **P50** | **3** | **3012** | 真实 MLX 人声（非 synth） |

对比改造前异常基线（无 ffmpeg / 默认 MP3）：~15–20 min → **~3s**（约 300× 加速）。

## 推理阶段耗时（ace-api 日志摘录）

| 阶段 | 耗时 |
|------|------|
| LM CoT metadata | ~1.0s |
| DiT diffusion (MLX) | ~0.37s |
| VAE decode (MLX) | ~2.3s |
| WAV 保存 | <0.2s |
| **合计** | **~3–7s** |

## 历史记录（合成链路验证）

| 引擎 | mode | job_id | Worker latency_ms | 墙钟 (s) | 输出 |
|------|------|--------|-------------------|----------|------|
| ACE-Step 1.5 (synth) | `vocal_lyrics` | `a6b38da7-...` | 2081 | 4.12 | WAV 可下载 |
| Stable Audio 3 (synth) | `game_bgm` | `99c3dde5-...` | 66 | 2.12 | WAV 可下载 |

## P0 验收

`python scripts/acceptance-p0.py` → **30/30 PASS**（合成链路时代）

MLX 人声：`bash scripts/mac-mlx-test.sh` → **PASS**（`ok=true`，latency &lt; 3min，实测 ~3s）

## 备注

- **根因修复：** Worker 请求 `audio_format: wav`，避免 Mac 无 ffmpeg 时 MP3 保存失败导致空轮询。
- **路径修复：** `ace_client.py` 解析新版 API 的 `file` 字段（`/v1/audio?path=...`）。
- **LM 选型：** 开发/测试默认 `acestep-5Hz-lm-0.6B`；生产可切 `1.7B` + `ACE_THINKING=true`。
- SA3 真实 MLX 仍为 Post-MVP 项。
