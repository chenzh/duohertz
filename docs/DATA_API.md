# 数据库与接口字典

**版本：** v1.0  
**关联：** [PRD.md](../PRD.md) v1.2 · MVP API

---

## 1. 通用约定

| 项 | 值 |
|----|-----|
| Base URL | `http://localhost:8080`（Gateway） |
| API 版本 | `/v1` |
| 认证 | Header `X-API-Key: <key>` |
| Content-Type | `application/json`（POST） |
| 时间 | ISO 8601 UTC，`created_at` 等 |
| ID | UUID v4 |

### 1.1 统一成功响应包装

```json
{
  "data": { ... },
  "meta": { "request_id": "uuid" }
}
```

### 1.2 统一错误响应

```json
{
  "error": {
    "code": "INVALID_MODE",
    "message": "mode must be one of: vocal_lyrics, vocal_desc, game_bgm, game_theme_vocal",
    "details": {}
  },
  "meta": { "request_id": "uuid" }
}
```

### 1.3 HTTP 状态码

| 状态 | 场景 |
|------|------|
| 200 | 成功 |
| 400 | 参数校验失败 |
| 401 | 无 Key 或 Key 无效 |
| 404 | Job 不存在或无权 |
| 409 | Job 未完成无法下载音频 |
| 429 | 限流 |
| 500 | 内部错误 |
| 503 | Gateway 不可用 |

---

## 2. 错误码枚举

| code | HTTP | 说明 |
|------|------|------|
| `INVALID_MODE` | 400 | mode 不在白名单 |
| `INVALID_PROMPT` | 400 | prompt 缺失或超长 |
| `INVALID_STYLE_TAGS` | 400 | style_tags 无效 |
| `INVALID_LYRICS` | 400 | lyrics 无效 |
| `INVALID_DURATION` | 400 | duration_sec 超范围 |
| `CONTENT_POLICY` | 400 | 内容策略拒绝 |
| `UNAUTHORIZED` | 401 | 鉴权失败 |
| `JOB_NOT_FOUND` | 404 | Job 不存在 |
| `JOB_NOT_READY` | 409 | 未完成不能取音频 |
| `RATE_LIMIT_EXCEEDED` | 429 | 超限 |
| `WORKER_UNAVAILABLE` | 503 | 目标 Worker 不可用 |
| `GENERATION_TIMEOUT` | — | Job failed 内嵌 |
| `STORAGE_ERROR` | — | Job failed 内嵌 |
| `INTERNAL_ERROR` | 500 | 未分类错误 |

---

## 3. mode 枚举与引擎映射

| mode | engine | worker | model_variant（默认） |
|------|--------|--------|------------------------|
| `vocal_lyrics` | `ace-step-1.5` | `ace` | `turbo` |
| `vocal_desc` | `ace-step-1.5` | `ace` | `turbo` |
| `game_bgm` | `stable-audio-3` | `sa3` | `small` |
| `game_theme_vocal` | `ace-step-1.5` | `ace` | `turbo` |

可选请求字段 `model_variant`：`turbo` | `xl`（ACE）；`small` | `medium`（SA3）。

---

## 4. 数据库表结构（PostgreSQL + Prisma）

MVP 最少 2 表；可用 SQLite 内测（TECH_SPEC 可切换）。

### 4.1 `api_keys`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | |
| `key_hash` | VARCHAR(64) | UNIQUE, NOT NULL | SHA-256(hex) |
| `label` | VARCHAR(100) | | 如 `mvp-internal` |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | NOT NULL | |

MVP 可仅环境变量 `API_KEY` 校验，不建表。

### 4.2 `jobs`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 对外 job_id |
| `api_key_id` | UUID | FK nullable | 环境变量模式可 NULL |
| `mode` | VARCHAR(32) | NOT NULL | |
| `engine` | VARCHAR(32) | NOT NULL | |
| `model_variant` | VARCHAR(32) | | |
| `status` | VARCHAR(20) | NOT NULL | 状态机 |
| `prompt` | TEXT | | |
| `style_tags` | TEXT | | |
| `lyrics` | TEXT | | |
| `duration_sec` | INTEGER | NOT NULL | |
| `audio_path` | VARCHAR(512) | | 本地路径或 object key |
| `audio_mime` | VARCHAR(64) | DEFAULT `audio/wav` | |
| `error_code` | VARCHAR(64) | | failed 时 |
| `error_message` | TEXT | | |
| `latency_ms` | INTEGER | | 完成时 |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |
| `completed_at` | TIMESTAMPTZ | | |

**索引：**

- `idx_jobs_api_key_created` ON (`api_key_id`, `created_at` DESC)
- `idx_jobs_status` ON (`status`) WHERE `status` IN ('queued','routing','generating','uploading')

### 4.3 Post-MVP 表（勿在 MVP 实现）

`users`, `tracks`, `credit_ledger`, `game_projects` — 见 PRD SaaS v1.0。

---

## 5. 接口字典

### 5.1 `GET /v1/health`

**鉴权：** 否

**响应 200：**

```json
{
  "data": {
    "status": "ok",
    "version": "0.1.0",
    "uptime_sec": 3600
  }
}
```

---

### 5.2 `GET /v1/health/inference`

**鉴权：** 否（内网）或 是（公网部署时建议加 Key）

**响应 200：**

```json
{
  "data": {
    "gateway": "ok",
    "workers": {
      "ace": {
        "status": "ok",
        "url": "http://192.168.0.199:8101",
        "last_check_ms": 12
      },
      "sa3": {
        "status": "ok",
        "url": "http://192.168.0.199:8102",
        "last_check_ms": 15
      }
    }
  }
}
```

`workers.*.status`：`ok` | `degraded` | `down`

---

### 5.3 `POST /v1/jobs`

**鉴权：** 是

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `mode` | string | 是 | 见 §3 |
| `prompt` | string | 条件 | `vocal_desc`, `game_bgm`, `game_theme_vocal` 至少其一与 lyrics |
| `style_tags` | string | 条件 | `vocal_lyrics` 必填 |
| `lyrics` | string | 条件 | `vocal_lyrics` 必填；`game_theme_vocal` 可选 |
| `duration_sec` | integer | 否 | 默认见 RULES.md |
| `model_variant` | string | 否 | 覆盖默认变体 |

**响应 201：**

```json
{
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "queued",
    "mode": "game_bgm",
    "engine": "stable-audio-3",
    "created_at": "2026-08-23T01:00:00Z"
  }
}
```

---

### 5.4 `GET /v1/jobs/{job_id}`

**鉴权：** 是

**响应 200（进行中）：**

```json
{
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "generating",
    "mode": "vocal_lyrics",
    "engine": "ace-step-1.5",
    "duration_sec": 120,
    "created_at": "2026-08-23T01:00:00Z",
    "updated_at": "2026-08-23T01:01:30Z",
    "error": null
  }
}
```

**响应 200（完成）：**

```json
{
  "data": {
    "job_id": "...",
    "status": "completed",
    "mode": "game_bgm",
    "engine": "stable-audio-3",
    "duration_sec": 90,
    "latency_ms": 45200,
    "audio": {
      "mime": "audio/wav",
      "download_url": "/v1/jobs/550e8400.../audio"
    },
    "created_at": "...",
    "completed_at": "..."
  }
}
```

**响应 200（失败）：**

```json
{
  "data": {
    "job_id": "...",
    "status": "failed",
    "error": {
      "code": "GENERATION_TIMEOUT",
      "message": "worker did not complete within 600s"
    }
  }
}
```

---

### 5.5 `GET /v1/jobs/{job_id}/audio`

**鉴权：** 是

**条件：** `status === completed`

**响应 200：** `Content-Type: audio/wav`，body 为二进制流。

**响应 409：** `JOB_NOT_READY`

---

### 5.6 Demo BFF 代理（同源）

| 方法 | 路径 | 转发 |
|------|------|------|
| * | `/demo/api/v1/*` | Gateway `/v1/*` + 注入 Key |

Demo 前端只请求 `/demo/api/v1/...`，不配置 Key。

---

## 6. 数据流转

```text
POST /v1/jobs
  → 校验 mode/字段/限流
  → INSERT jobs status=queued
  → 返回 job_id

Worker 循环 / Gateway 调度
  → routing → 调 Worker HTTP
  → generating
  → 写 data/audio/{job_id}.wav
  → uploading → UPDATE jobs
  → status=completed, audio_path

GET /v1/jobs/{id}
  → SELECT jobs WHERE id AND api_key match
  → 返回 status + download_url

GET /v1/jobs/{id}/audio
  → 读文件流返回
```

---

## 7. Worker 内部接口（Gateway ↔ Mac Worker）

非公开；内网 HTTP。

### ACE Worker `POST /internal/generate`

```json
{
  "job_id": "uuid",
  "mode": "vocal_lyrics",
  "style_tags": "...",
  "lyrics": "...",
  "duration_sec": 120,
  "model_variant": "turbo",
  "output_path": "/data/audio/{job_id}.wav"
}
```

响应：`{ "ok": true, "latency_ms": 120000 }` 或 `{ "ok": false, "error": "..." }`

### SA3 Worker 同结构，`prompt` 替代 lyrics/style_tags 组合。

---

## 8. 与 Demo / examples 对齐清单

- [ ] `examples/curl/*.sh` 字段与本文件一致
- [ ] `apps/demo` 表单字段与本文件一致
- [ ] `examples/python/minimal_client.py` 轮询逻辑与状态枚举一致
