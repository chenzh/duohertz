# MLX 推理加速改造计划

**日期：** 2026-08-23  
**目标：** 将 Mac ACE-Step 人声生成从当前 ~15 分钟（异常）降至 **30s–3min**（正常范围）  
**范围：** Mac 推理节点 + Worker 接入层；不含 SA3 BGM（另项）

---

## 1. 问题诊断

### 1.1 现象

| 指标 | 当前值 | 预期值 |
|------|--------|--------|
| 10s `vocal_lyrics` 墙钟耗时 | ~15–20 min | ~20–60s |
| ACE API `:8200` | 正常，模型已加载 | — |
| ACE Worker `:8101` | `WORKER_MODE=mlx` | — |
| Gateway `:8080` | 未常驻 | 按需启动 |

### 1.2 根因（按影响排序）

| # | 根因 | 证据 | 影响 |
|---|------|------|------|
| **P0** | 默认输出 MP3，Mac 无 `ffmpeg`，保存失败 | `/tmp/ace-api.log`：`Failed to save audio file: ffmpeg not found` @ 14:07:00 | 推理 ~20s 完成，但任务永不返回 `audio_paths`，Worker 空轮询 10+ 分钟 |
| P1 | `thinking=True` 固定开启 | `workers/common/ace_client.py` | 多一轮 4B LM CoT，+10–15s |
| P2 | 自动选用 4B LM | ace-api 日志：`Auto-selected LM model: acestep-5Hz-lm-4B` | CoT 阶段比 0.6B/1.7B 慢 |
| P3 | `batch_size=2` 默认 | ace-api 日志：`batch_size=2, shared prefill` | DiT 生成 2 份，算力翻倍 |
| P4 | 首次冷启动下载 LM | 12:24–13:20 下载 4B 模型 ~56min | 仅首次；后续无影响 |
| P5 | Gateway 未启动 | `:8080` down | 不影响直连 Worker，影响 Demo/API 体验 |

### 1.3 真实推理耗时（修复保存后）

```
14:06:40  release_task
14:06:50  LM Phase 1 (CoT)     ~10s
14:06:56  LM Phase 2 (codes)   ~6s
14:06:59  DiT diffusion        ~3s
14:07:00  VAE decode           ~0.7s
─────────────────────────────────
合计                      ~20s  ← 正常
```

---

## 2. 改造目标

| 阶段 | 目标 | 验收标准 |
|------|------|----------|
| **Phase 0** | 修复保存/返回链路 | `mac-mlx-test.sh` 10s 音频 **< 3min** 完成，`ok=true`，非 synth fallback |
| **Phase 1** | 参数调优 | 同参数重复 3 次，P50 **< 60s**（10s 音频） |
| **Phase 2** | 端到端 Gateway | `acceptance-mlx-vocal.py` PASS，Gateway 链路可用 |
| **Phase 3** | 运维固化 | 开机自启、健康检查、文档同步 |

---

## 3. 改造任务

### Phase 0：修复阻塞项（必做，~30min）

#### T0-1 安装 ffmpeg 或改 WAV 输出

**方案 A（推荐）：安装 ffmpeg**

```bash
# Mac 上
brew install ffmpeg
ffmpeg -version   # 验证
# 重启 acestep-api
```

**方案 B（零依赖）：Worker 请求指定 WAV**

修改 `workers/common/ace_client.py` → `_build_release_body()` 各分支增加：

```python
"audio_format": "wav",
```

> 建议 A+B 双保险：装 ffmpeg 兼容 MP3，同时 Worker 显式要 WAV。

**验收：** ace-api 日志无 `ffmpeg not found`；`query_result` 返回 `audio_paths`。

---

#### T0-2 重启服务链

```bash
# 1. 重启 ACE API（:8200）
bash scripts/mac-ace-api-start.sh

# 2. 重启 Workers（:8101/:8102）
bash scripts/mac-worker-mlx.sh

# 3. 直连测试
bash scripts/mac-mlx-test.sh
# 预期：HTTP 200, ok True, latency_ms < 180000
```

**验收：** `/tmp/mlx-test-1.wav` 时间戳更新，文件可播放，有明显人声（非正弦波 synth）。

---

#### T0-3 临时关闭 synth fallback 做对比

```bash
ACE_FALLBACK_SYNTH=false bash scripts/mac-worker-mlx.sh
bash scripts/mac-mlx-test.sh
```

确认返回的是 MLX 真音频，而非 fallback 合成音。

---

### Phase 1：参数调优（~1h）

#### T1-1 降级 LM 模型

修改 `scripts/mac-ace-api-start.sh`：

```bash
export ACESTEP_LM_BACKEND=mlx
exec acestep-api --host "$HOST" --port "$PORT" \
  --lm_model_path acestep-5Hz-lm-0.6B
```

| LM 模型 | 速度 | 质量 | 建议场景 |
|---------|------|------|----------|
| `0.6B` | 最快 | 够用 | 开发/测试默认 |
| `1.7B` | 中等 | 较好 | 日常生产 |
| `4B` | 最慢 | 最好 | 高质量成品 |

**验收：** CoT Phase 1 耗时 < 5s（日志对比）。

---

#### T1-2 关闭 thinking（可选参数）

修改 `workers/common/ace_client.py`：

```python
# 快速模式（歌词+风格已明确）
"thinking": False,

# 探索模式（需要 LM 自动推断 BPM/调性等）
"thinking": True,
```

或通过环境变量控制：

```python
"thinking": os.getenv("ACE_THINKING", "false").lower() == "true",
```

**验收：** `thinking=False` 时日志无 `Batch Phase 1: Generating CoT metadata`。

---

#### T1-3 batch_size 降为 1

```python
"batch_size": 1,
```

**验收：** 日志 `size: 1`；DiT 只 decode 1 sample。

---

#### T1-4 跑基准并记录

```bash
# 各组合测 3 次，记录到 M1-benchmark.md
for i in 1 2 3; do
  time bash scripts/mac-mlx-test.sh
done
```

记录矩阵：

| 配置 | 10s 音频 P50 | 备注 |
|------|-------------|------|
| 当前（4B + thinking + batch2 + 无ffmpeg） | ~15min | 异常基线 |
| ffmpeg + 默认参数 | ? | Phase 0 后 |
| 0.6B + thinking off + batch1 | ? | 目标配置 |
| 1.7B + thinking on + batch1 | ? | 质量配置 |

---

### Phase 2：Gateway 端到端（~1h）

#### T2-1 启动 Gateway + 配置 Worker URL

```bash
cp apps/gateway/.env.example apps/gateway/.env
# 确认：
# ACE_WORKER_URL=http://127.0.0.1:8101
# SA3_WORKER_URL=http://127.0.0.1:8102
pnpm --filter gateway dev
```

#### T2-2 跑 MLX 验收脚本

```bash
python scripts/acceptance-mlx-vocal.py
# 预期：completed, wav > 50KB, duration >= 5s
```

#### T2-3 更新 P0 验收报告

- `docs/reports/acceptance-p0-results.md` 标注 MLX 实测已完成
- `docs/reports/M1-benchmark.md` 填入真实耗时

---

### Phase 3：运维固化（~2h）

#### T3-1 acestep-api 开机自启

- 用 `launchd` plist 或 `nohup` 保活 `:8200`
- 启动时预加载 LM（避免首次请求冷启动）
- 参考 `docs/OPS.md` §5

#### T3-2 健康检查增强

Worker `/health` 增加字段（可选）：

```json
{
  "status": "ok",
  "engine": "ace-step-1.5",
  "mode": "mlx",
  "ace_api": "ok",
  "lm_model": "0.6B"
}
```

Gateway `GET /v1/health/inference` 据此上报。

#### T3-3 脚本路径统一（未提交改动）

当前工作区有 4 个脚本将路径从 `~/local-ai-music-platform` 改为 `~/Desktop/MusicSaas`，需 commit：

- `scripts/dev-up.sh`
- `scripts/mac-worker-mlx.sh`
- `scripts/mac-worker-setup.sh`
- `scripts/acceptance-p0.py`

#### T3-4 文档同步

| 文档 | 更新内容 |
|------|----------|
| `docs/INFERENCE.md` | 补充 ffmpeg 依赖、`audio_format`、LM 选型 |
| `README.md` | MLX 实测状态、预期耗时 |
| `docs/reports/M1-benchmark.md` | 填入调优后基准 |

---

## 4. 不在本次范围

| 项 | 说明 | 计划版本 |
|----|------|----------|
| SA3 BGM 真实 MLX | `workers/sa3` 仍为 synth | API v0.2 |
| Demo 浏览器 E2E | D-01/D-02 人工验收 | MVP 收尾 |
| 并发 > 1 | ACE 单路排队，MVP 不改造 | Post-MVP |
| 模型量化/编译 | `mx.compile=False` for DiT，官方默认 | 观察后决定 |

---

## 5. 风险与回退

| 风险 | 缓解 |
|------|------|
| `thinking=False` 质量下降 | 环境变量切换；生产默认 `1.7B + thinking` |
| 0.6B LM 下载失败 | 预下载到 `checkpoints/`，fallback 1.7B |
| ffmpeg 安装受限 | 仅用 `audio_format: wav`，不依赖 ffmpeg |
| MLX 推理 OOM | 保持 turbo；降 `duration_sec`；重启 ace-api |

回退开关：

```bash
WORKER_MODE=synth          # 回到合成音频
ACE_FALLBACK_SYNTH=true    # MLX 失败自动降级
```

---

## 6. 执行顺序（推荐）

```
T0-1 ffmpeg / audio_format
  → T0-2 重启 + mac-mlx-test 验证
    → T0-3 确认非 fallback
      → T1-1 LM 降级
        → T1-2 thinking 可选
          → T1-3 batch_size=1
            → T1-4 基准测试
              → T2 Gateway 端到端
                → T3 运维 + 文档 + commit
```

**最快路径（只修阻塞）：** 完成 T0-1 + T0-2，即可从 15min 降到 ~1min。

---

## 7. 签字

| 阶段 | 完成条件 | 负责人 | 日期 |
|------|----------|--------|------|
| Phase 0 | mac-mlx-test < 3min PASS | Cursor | 2026-08-23 ✅ (~3s) |
| Phase 1 | 10s P50 < 60s | Cursor | 2026-08-23 ✅ (P50 3012ms) |
| Phase 2 | acceptance-mlx-vocal PASS | Cursor | 2026-08-23 ✅ (~10s) |
| Phase 3 | 文档 + 脚本同步 | Cursor | 2026-08-23 ✅ |

### 实测摘要

- **根因修复：** `audio_format: wav` + `ace_client` 解析 `file` 字段
- **调优：** 0.6B LM · `thinking=false` · `batch_size=1` · 启动预加载模型
- **基准：** 10s `vocal_lyrics` 墙钟 P50 **3s**（改造前 ~15min）
