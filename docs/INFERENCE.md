# 推理节点部署（Mac 双 Worker）

**版本：** v1.0  
**硬件：** MacBook Pro M5 Pro · 48GB · `192.168.0.199`

---

## 1. 架构

```text
Gateway (任意主机 :8080)
    │ HTTP LAN
    ├─► ACE Worker (:8101)  → ACE-Step 1.5 MLX
    └─► SA3 Worker  (:8102)  → Stable Audio 3 optimized/mlx
```

**原则：** 推理仅在 Mac 运行；Gateway 可在 Windows 开发机或同 Mac。

---

## 2. ACE-Step 1.5 Worker

| 项 | 值 |
|----|-----|
| 仓库 | https://github.com/ace-step/ACE-Step-1.5 |
| 运行时 | MLX（Apple Silicon） |
| 许可 | MIT |
| 负责 mode | `vocal_lyrics`, `vocal_desc`, `game_theme_vocal` |

### 2.1 安装（Mac SSH）

```bash
# 在 Mac 上
cd ~/workers
git clone https://github.com/ace-step/ACE-Step-1.5.git ace-step
cd ace-step
# 按官方 INSTALL.md 安装 MLX 依赖
```

### 2.2 Worker 服务

`workers/ace-step/server.py`（FastAPI）：

- `GET /health` → `{ "status": "ok", "engine": "ace-step-1.5", "mode": "mlx", "ace_api": "ok", "lm_model": "..." }`
- `POST /internal/generate` → 见 DATA_API.md §7

**MLX 加速（2026-08-23）：**

| 项 | 推荐值 | 说明 |
|----|--------|------|
| `audio_format` | `wav` | Worker 请求体显式指定，避免无 ffmpeg 时 MP3 保存失败 |
| `ACESTEP_LM_MODEL_PATH` | `acestep-5Hz-lm-0.6B` | 开发/测试默认；生产可切 `1.7B` |
| `ACE_THINKING` | `false` | 快速模式；探索模式设 `true` |
| `ACE_BATCH_SIZE` | `1` | 单路生成 |
| `ACESTEP_NO_INIT` | `false` | 启动时预加载模型，避免首请求懒加载超时 |

可选依赖：`ffmpeg`（MP3 导出）；无 ffmpeg 时仅用 WAV 即可。

环境变量：

| 变量 | 说明 |
|------|------|
| `WORKER_MODE` | `mlx`（真实推理）或 `synth`（合成验证） |
| `ACE_API_URL` | ACE-Step API 地址，默认 `http://127.0.0.1:8200` |
| `ACE_THINKING` | `true`/`false`，是否开启 LM CoT |
| `ACE_BATCH_SIZE` | 生成 batch，默认 `1` |
| `ACE_FALLBACK_SYNTH` | MLX 失败时是否降级合成音频 |
| `ACE_MODEL_VARIANT` | `turbo`（默认）或 `xl` |
| `ACE_WORKER_PORT` | 8101 |
| `ACE_OUTPUT_DIR` | `/Users/zhenhuachen/data/audio` |

### 2.3 资源预期（M5 Pro 48GB）

| 配置 | 预期 |
|------|------|
| turbo + 4B LM | 推荐默认；整曲 P95 &lt;180s（M1 实测校准） |
| 并发 | **1** 路；第二路排队 |

---

## 3. Stable Audio 3 Worker

| 项 | 值 |
|----|-----|
| 仓库 | https://github.com/Stability-AI/stable-audio-3 |
| 运行时 | `optimized/mlx` |
| 许可 | Community License（须登记） |
| 负责 mode | `game_bgm` |

### 3.1 安装（推荐：项目脚本）

```bash
# 克隆 stable-audio-3 并创建 optimized/mlx/.venv（权重首次生成时自动下载）
bash scripts/mac-sa3-mlx-bootstrap.sh
```

或官方一键安装：

```bash
curl -LsSf https://raw.githubusercontent.com/Stability-AI/stable-audio-3/main/optimized/mlx/bootstrap.sh | bash
```

默认仓库路径：`~/workers/stable-audio-3`（`SA3_REPO` 可覆盖）。

### 3.2 Worker 服务

`workers/sa3/server.py`：

- `GET /health` — 含 `mode`、`sa3_mlx`、`model_variant`
- `POST /internal/generate` — `prompt`, `duration_sec`, `model_variant`（small/medium）

| 变量 | 说明 |
|------|------|
| `SA3_WORKER_MODE` | `mlx`（真实推理）或 `synth`（占位音） |
| `SA3_REPO` | stable-audio-3 克隆路径 |
| `SA3_MODEL_VARIANT` | `small`（`sm-music`）或 `medium` |
| `SA3_WORKER_PORT` | 8102 |
| `SA3_FALLBACK_SYNTH` | MLX 失败时是否回退占位音（默认 `true`） |

验收：`bash scripts/mac-sa3-test.sh`（15s `game_bgm`，稳态约 1–3s）

### 3.3 BGM 生成注意

- prompt 中建议 Gateway 自动追加：`instrumental, no vocals`（可配置）
- 时长默认 90s，最大 180s

---

## 4. 进程管理（MVP）

### 4.1 手动启动

```bash
# Mac 上一键启动（ACE API + Workers + Gateway）
bash scripts/mac-services-up.sh

# 或分步：
bash scripts/mac-ace-api-restart.sh    # :8200，预加载 0.6B LM
bash scripts/mac-worker-mlx.sh         # :8101 / :8102
# Gateway（需 pnpm install + Node 20+）
cd apps/gateway && ./node_modules/.bin/tsx watch src/index.ts
```

### 4.2 保活

- Mac **勿休眠**（系统设置 → 节能 → 防止自动睡眠）
- 可选 `launchd` plist（OPS.md §5）

### 4.3 Gateway 健康检查

每 30s：

- `GET ACE_WORKER_URL/health`
- `GET SA3_WORKER_URL/health`

连续 3 次失败 → `workers.*.status = down`

---

## 5. 网络与安全

| 规则 | 说明 |
|------|------|
| 绑定 | Worker `0.0.0.0` 仅内网；**勿暴露公网** |
| 防火墙 | 仅允许 Gateway IP 访问 8101/8102 |
| 认证 | Worker internal API MVP 可用 `WORKER_SECRET` Header |

---

## 6. 存储

- Worker 写入 `output_path`（Gateway 下发绝对路径或 Worker 本地目录 + job_id）
- 推荐：Gateway 挂载 Mac 共享目录，或 Worker 完成后 HTTP 回传（MVP 用共享路径更简单）

**局域网路径示例：**

- Gateway `AUDIO_STORAGE_PATH` 与 Mac 输出目录同步（NFS / SMB）  
- 或 Gateway 与 Worker 同机部署在 Mac，`AUDIO_STORAGE_PATH=./data/audio`

---

## 7. M1 实测清单

- [ ] ACE：`vocal_lyrics` 120s 耗时、内存峰值
- [ ] SA3：`game_bgm` 90s 耗时
- [ ] 双 Worker 同时健康检查
- [ ] Windows Gateway → Mac Worker 延迟 &lt;50ms
- [ ] BGM 10 首无人声泄漏人工听检

结果写入 `docs/reports/M1-benchmark.md`（实测后创建）。

---

## 8. 故障排查

| 现象 | 检查 |
|------|------|
| Job 长期 queued | Worker health、Gateway `ACE_WORKER_URL` |
| ACE OOM | 降 `model_variant` 为 turbo |
| SA3 慢 | 用 small 而非 medium |
| 无法从 Windows 连 Mac | ping 192.168.0.199、防火墙 |
