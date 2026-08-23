# P0 验收报告

**日期：** 2026-08-23  
**命令：** `python scripts/acceptance-p0.py`  
**结果：** **30/30 PASS**

## 环境

| 组件 | 地址 |
|------|------|
| Gateway | `http://localhost:8080` (Windows `192.168.0.135`) |
| Workers | Mac `192.168.0.199:8101/8102`（micromamba 本机进程） |
| Demo | `http://localhost:3000` |
| API_KEY | `dev-api-key-change-me` |
| API_KEY_ALT | `dev-api-key-alt`（J-02 隔离测试） |

## 通过用例

H-01, H-02, A-01~03, V-01~06, U-01~04, G-01~03, J-01~04, R-01, D-01-proxy, D-04-proxy, D-05, D-06, E-01~04

## 未自动化 / 待补

| ID | 说明 |
|----|------|
| H-03 | 需手动停止 SA3 Worker 后复测 |
| D-01/D-02 | 浏览器 Demo 四 mode（需人工或 E2E） |
| D-03 | Worker 离线 UI（需停 Worker 后手测） |
| P-01~P-04 | 非功能（启动时延/日志脱敏） |

## MLX 人声实测（2026-08-23）

| 脚本 | 结果 |
|------|------|
| `bash scripts/mac-mlx-test.sh` | **PASS** — 10s 音频 P50 **~3s**，`ok=true`，非 synth |
| `python scripts/acceptance-mlx-vocal.py` | **PASS** — Gateway → MLX，30s 音频 ~10s 完成 |

配置：`audio_format=wav` · `ACE_THINKING=false` · `ACE_BATCH_SIZE=1` · LM `0.6B`

## SA3 BGM + Demo Web（2026-08-23）

| 脚本 | 结果 |
|------|------|
| `bash scripts/mac-sa3-test.sh` | **PASS** — 15s BGM **~0.7s**（权重已缓存），立体声 44.1kHz |
| `python scripts/acceptance-sa3-bgm.py` | **PASS** |
| `python scripts/acceptance-demo-web.py` | **12/12 PASS** — 四 mode + BFF 代理 |

## 备注

- Gateway 已修复 `.env` 加载（`dotenv`）；Worker URL 可指向本机 `127.0.0.1` 或 LAN `192.168.0.199`。
- **ACE + SA3 均为 Mac MLX 真实推理**（见 `M1-benchmark.md`、`INFERENCE.md`）。
