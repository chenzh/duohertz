# M1 推理基准实测

**日期：** 2026-08-23  
**Gateway：** Windows 开发机 `192.168.0.135:8080`  
**Worker 节点：** Mac `192.168.0.199` 本机进程（micromamba Python 3.11，:8101 ACE / :8102 SA3）

## 环境

| 组件 | 地址 | 状态 |
|------|------|------|
| ACE Worker | `http://192.168.0.199:8101` | ok |
| SA3 Worker | `http://192.168.0.199:8102` | ok |
| Gateway | `http://localhost:8080` | ok |
| Demo | `http://localhost:3000` | ok |

## 成功生成记录

| 引擎 | mode | job_id | Worker latency_ms | 墙钟 (s) | 输出 |
|------|------|--------|-------------------|----------|------|
| ACE-Step 1.5 | `vocal_lyrics` | `a6b38da7-5d47-4189-ac5e-d6a35fcaa3a4` | 2081 | 4.12 | WAV 可下载 |
| Stable Audio 3 | `game_bgm` | `99c3dde5-a2d5-4889-badd-001b3b963d83` | 66 | 2.12 | WAV 可下载 |

## P0 验收

`python scripts/acceptance-p0.py` → **30/30 PASS**（含 Mac curl E-01~E-04、D-05 minimal_client）

## 备注

- Mac 已安装 Xcode；Worker 通过 **micromamba** 运行（系统 Python 3.9 无法安装 `numpy==2.2.4`）。
- 当前 Worker 使用 **本地合成 WAV**（`workers/common/audio.py`）验证全链路；Gateway → Worker 经 LAN，`audio_base64` 回传写入 `AUDIO_STORAGE_PATH`。
- Mac 从 GitHub clone ACE-Step-1.5 / SA3 MLX 仓库因网络失败（HTTP2/Empty reply）；待网络恢复后按 `INFERENCE.md` 设置 `WORKER_MODE=mlx`。

## 下一步（真实 MLX）

1. Mac 网络可访问 GitHub 后 clone 官方仓库
2. 按 `INFERENCE.md` 安装 MLX 权重
3. 设置 `WORKER_MODE=mlx`、`ACE_STEP_REPO`、`SA3_REPO` 并重启 Worker
