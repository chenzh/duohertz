# 产品规则与边界手册

**版本：** v1.0  
**关联：** [PRD.md](../PRD.md) v1.2 · MVP = API + Demo

本文定义 **做什么、不做什么、怎么判定对错**。Cursor 开发须严格遵守。

---

## 1. MVP 功能边界

### 1.1 必做（In Scope）

| 类别 | 内容 |
|------|------|
| API | `POST/GET /v1/jobs`、`GET /v1/jobs/{id}/audio`、health |
| 鉴权 | 静态 `X-API-Key`（环境变量或 DB 单 Key） |
| 路由 | 4 个 `mode` → ACE-Step 1.5 或 SA3（见 DATA_API.md） |
| Demo | 单页 Web + curl/Python 示例 |
| 队列 | 异步 Job；Mac 双 Worker |
| 存储 | 任务级音频文件（本地目录或 S3/R2） |

### 1.2 暂缓（Out of Scope — v0.2+）

- `game_sfx`、`game_bgm_inpaint`、Webhook、批量 Job
- 分轨导出、LoRA 训练 API
- 多 API Key 管理 UI、按 Key 计费
- YuE 引擎

### 1.3 永久不做（MVP 及 Demo）

| 不做 | 说明 |
|------|------|
| 用户注册 / 登录 | SaaS v1.0 |
| 积分 / Polar / Stripe | SaaS v1.0 |
| 社区 Feed、公开作品墙 | SaaS v1.0 |
| 封面图生成 API | MVP |
| 永久作品库 `GET /v1/tracks` | MVP（Demo 仅会话列表） |
| 闭源 Suno/Udio API 套壳 | 架构禁止 |
| MusicGen / SongGeneration 权重 | 合规禁止（见 COMPLIANCE.md） |
| Demo 直连 Worker | 必须经 Gateway |

---

## 2. 双引擎路由铁律

| mode | 引擎 | 禁止行为 |
|------|------|----------|
| `vocal_lyrics`, `vocal_desc`, `game_theme_vocal` | ACE-Step 1.5 | 不得路由到 SA3 |
| `game_bgm` | Stable Audio 3 | 不得路由到 ACE-Step |

**`game_bgm` 不得出现明显人声** — 若抽检泄漏，记为生成失败或质量缺陷（v0.2 可加自动检测）。

---

## 3. Job 状态机

```text
queued → routing → generating → uploading → completed
   │         │          │            │
   └─────────┴──────────┴────────────┴→ failed
   │
   └→ cancelled（仅 MVP 预留，可不实现取消 API）
```

| 状态 | 含义 | 客户端行为 |
|------|------|------------|
| `queued` | 已入库，等待 Worker 空闲 | 继续轮询 |
| `routing` | 已选定引擎，准备下发 | 继续轮询 |
| `generating` | Worker 推理中 | 继续轮询 |
| `uploading` | 写存储 / 生成 URL | 继续轮询 |
| `completed` | 可下载音频 | 调 `/audio` |
| `failed` | 失败，见 `error` | 展示错误，可重试新 Job |
| `cancelled` | 已取消 | — |

**规则：**

- 状态只能按上表前进，禁止从 `completed` 回退。
- `failed` 须写入 `error.code` 与 `error.message`。
- 同一 `job_id` 状态查询幂等。

---

## 4. 鉴权与隔离

| 规则 | 说明 |
|------|------|
| Header | `X-API-Key: <key>`，缺失或错误 → `401` |
| 查询隔离 | `GET /v1/jobs/{id}` 仅 Key 匹配的任务可访问 → 否则 `404`（不暴露存在性） |
| Demo BFF | 浏览器不持 Key；由 Gateway `/demo/api/*` 注入 |
| 日志 | 禁止打印完整 API Key；可记录 Key 前缀 8 位 |

---

## 5. 限流（MVP）

| 项 | 默认值 | 环境变量 |
|----|--------|----------|
| 全局 QPS | 2 req/s | `RATE_LIMIT_QPS` |
| 每 Key 日上限 | 200 Job/天 | `RATE_LIMIT_DAILY_JOBS` |
| 单 Job 最长生成 | 600s 墙钟 | Worker 超时 |

超限 → `429`，body 含 `RATE_LIMIT_EXCEEDED`。

---

## 6. 输入校验规则

| 字段 | 规则 | 错误码 |
|------|------|--------|
| `mode` | 枚举 4 值 | `INVALID_MODE` |
| `prompt` | 1–2000 字符；`game_bgm`/`vocal_desc` 必填 | `INVALID_PROMPT` |
| `style_tags` | 1–500 字符；`vocal_lyrics` 必填 | `INVALID_STYLE_TAGS` |
| `lyrics` | 1–8000 字符；`vocal_lyrics` 必填 | `INVALID_LYRICS` |
| `duration_sec` | 整数；见下表 | `INVALID_DURATION` |

| mode | duration_sec 范围 |
|------|-------------------|
| `vocal_*`, `game_theme_vocal` | 30–240 |
| `game_bgm` | 15–180 |

**内容安全（MVP 轻量）：**

- 拒绝空字符串、仅空白。
- 可选：拒绝明显违法关键词列表（`CONTENT_POLICY`，v0.1 可 stub 返回通过）。

---

## 7. 异常场景与交互/报错

| 场景 | API 行为 | Demo 展示文案 |
|------|----------|---------------|
| 无 API Key | `401` | 「服务未授权」 |
| 错误 mode | `400` + `INVALID_MODE` | 「请选择有效任务类型」 |
| Worker 离线 | Job `queued` 持久化；routing 超时后 `failed` `WORKER_UNAVAILABLE` | 「推理节点离线，请稍后重试」 |
| 生成超时 | `failed` `GENERATION_TIMEOUT` | 「生成超时，请缩短时长或重试」 |
| 存储失败 | `failed` `STORAGE_ERROR` | 「保存失败，请重试」 |
| 重复提交（Demo） | 按钮 disabled 至返回 job_id | 「正在提交…」 |
| 轮询 10min 未完成 | 客户端停止轮询 | 「生成时间较长，请稍后在任务列表查看」 |
| 查询他人 job_id | `404` | 「任务不存在」 |
| 未完成调 `/audio` | `409` `JOB_NOT_READY` | 「尚未完成」 |

---

## 8. 业务约束

| 约束 | 说明 |
|------|------|
| 音频格式 | MVP 输出 **WAV**（PCM 或 float）；可选同时提供 MP3 |
| 文件 TTL | 本地存储默认 **72h** 后清理（`AUDIO_TTL_HOURS`） |
| 并发 | 每引擎 Worker **最多 1 路**生成；Gateway 队列 FIFO |
| 幂等 | `POST /v1/jobs` **不**做幂等键；重复 POST 产生多个 Job |
| 审计字段 | 每 Job 记录：`mode`, `engine`, `duration_sec`, `status`, `latency_ms`, `created_at` |

---

## 9. 与积分相关的规则（Post-MVP）

MVP **无积分**。`credits_charged` 字段固定 0。SaaS v1.0 再启用扣费/退还规则。

---

## 10. 文档冲突处理

优先级：`RULES.md` > `DATA_API.md` > `PRD.md` 概要 > 代码注释。

变更规则或错误码须同步更新 `DATA_API.md` 与 `ACCEPTANCE.md`。
