# M1 推理基准实测

**日期：** 2026-08-23  
**Gateway：** Windows 开发机 `localhost:8080`  
**Worker 节点：** Mac `192.168.0.199`（:8101 ACE / :8102 SA3，经 SSH 反向隧道暴露；推理进程在 Windows 侧运行，Mac 未安装 Xcode CLT 暂无法原生 Python）

## 环境

| 组件 | 地址 | 状态 |
|------|------|------|
| ACE Worker | `http://192.168.0.199:8101`（Mac localhost 隧道） | ok |
| SA3 Worker | `http://192.168.0.199:8102`（Mac localhost 隧道） | ok |
| Gateway | `http://localhost:8080` | ok |

## 成功生成记录

| 引擎 | mode | job_id | Worker latency_ms | 墙钟 (s) | 输出 |
|------|------|--------|-------------------|----------|------|
| ACE-Step 1.5 | `vocal_lyrics` | `05994265-df9d-48a5-85a5-3dab7d43d853` | 474 | 2.13 | WAV 可下载 |
| Stable Audio 3 | `game_bgm` | `87186c46-8ae5-4a89-a022-7bfd515380c5` | 206 | 2.05 | WAV 可下载 |

## 备注

- 当前 Worker 使用 **本地合成 WAV**（`workers/common/audio.py`）验证全链路；Mac 安装 Xcode Command Line Tools 后可按 `INFERENCE.md` 切换 `WORKER_MODE=mlx` 与官方 MLX 权重。
- Gateway → Worker 跨主机通过 `audio_base64` 回传写入 `AUDIO_STORAGE_PATH`。
- 双 Worker 健康检查：`GET /v1/health/inference` → ace/sa3 均为 `ok`。

## 下一步（Mac 原生 MLX）

1. Mac 执行 `xcode-select --install`
2. `cd ~/local-ai-music-platform/ace-step && python3 -m venv .venv && pip install -r requirements.txt`
3. 按 `INFERENCE.md` clone ACE-Step-1.5 / Stable Audio 3 MLX 并设置 `WORKER_MODE=mlx`
