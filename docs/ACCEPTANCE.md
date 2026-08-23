# 验收测试用例全集

**版本：** v1.0  
**MVP：** API + Demo · 通过标准 = 全部 P0 用例 PASS

---

## 1. 测试环境

| 项 | 要求 |
|----|------|
| Gateway | `http://localhost:8080` |
| Demo | `http://localhost:3000` |
| API_KEY | 与 `.env` 一致 |
| Mac Workers | ACE :8101、SA3 :8102 均为 ok |
| 工具 | curl、浏览器、可选 vitest |

---

## 2. API 功能用例

### 2.1 健康检查

| ID | 操作 | 预期 |
|----|------|------|
| H-01 | `GET /v1/health` 无 Key | 200，`status: ok` |
| H-02 | `GET /v1/health/inference` | 200，`ace`/`sa3` 均为 `ok` |
| H-03 | 停止 SA3 Worker 后 H-02 | `sa3.status` 为 `down` |

### 2.2 鉴权

| ID | 操作 | 预期 |
|----|------|------|
| A-01 | `POST /v1/jobs` 无 Key | 401 `UNAUTHORIZED` |
| A-02 | 错误 Key | 401 |
| A-03 | 正确 Key | 201 |

### 2.3 参数校验

| ID | 操作 | 预期 |
|----|------|------|
| V-01 | `mode: invalid` | 400 `INVALID_MODE` |
| V-02 | `vocal_lyrics` 缺 `lyrics` | 400 `INVALID_LYRICS` |
| V-03 | `vocal_lyrics` 缺 `style_tags` | 400 `INVALID_STYLE_TAGS` |
| V-04 | `game_bgm` 缺 `prompt` | 400 `INVALID_PROMPT` |
| V-05 | `duration_sec: 5` on `game_bgm` | 400 `INVALID_DURATION` |
| V-06 | `duration_sec: 300` on `vocal_lyrics` | 400 `INVALID_DURATION` |

### 2.4 人声生成（ACE）

| ID | 操作 | 预期 |
|----|------|------|
| U-01 | POST `vocal_lyrics` 合法体 | 201 → 轮询 completed ≤180s P95 |
| U-02 | 完成后 GET `/audio` | 200，WAV 可播放，有人声 |
| U-03 | POST `vocal_desc` | 同上，有伴奏+人声 |
| U-04 | POST `game_theme_vocal` | 完成，有人声 |

### 2.5 游戏 BGM（SA3）

| ID | 操作 | 预期 |
|----|------|------|
| G-01 | POST `game_bgm` prompt 含 dark dungeon | completed ≤120s |
| G-02 | 下载 WAV | 可导入 DAW；**无人声**（人工听 3/3） |
| G-03 | `duration_sec: 60` | 文件时长约 60s ±5s |

### 2.6 Job 查询

| ID | 操作 | 预期 |
|----|------|------|
| J-01 | GET 不存在 job_id | 404 |
| J-02 | GET 他人 job（换 Key） | 404 |
| J-03 | generating 时 GET `/audio` | 409 `JOB_NOT_READY` |
| J-04 | 状态序列 | 仅合法状态迁移，无回退 |

### 2.7 限流

| ID | 操作 | 预期 |
|----|------|------|
| R-01 | 快速 POST 超过 QPS | 429 `RATE_LIMIT_EXCEEDED` |

---

## 3. Demo 用例（见 DEMO.md §7）

| ID | 操作 | 预期 |
|----|------|------|
| D-01 | Web `game_bgm` | 完成可播放 |
| D-02 | Web `vocal_lyrics` | 人声可听 |
| D-03 | Worker 离线提交 | 错误展示，不白屏 |
| D-04 | curl 与 Web 同参数 | 同类结果 |
| D-05 | `python minimal_client.py` | 本地生成 `.wav` |
| D-06 | curl 无 Key | 401 |

---

## 4. examples 用例

| ID | 操作 | 预期 |
|----|------|------|
| E-01 | `examples/curl/health.sh` | exit 0 |
| E-02 | `examples/curl/create_game_bgm.sh` | 返回 job_id |
| E-03 | `examples/curl/poll_job.sh <id>` | 最终 completed |
| E-04 | `examples/curl/download_audio.sh <id>` | 文件 &gt; 1KB |

---

## 5. 非功能

| ID | 项 | 标准 |
|----|-----|------|
| P-01 | Gateway 启动 | &lt;5s |
| P-02 | GET /v1/jobs/{id} | P95 &lt;100ms（非 generating 长轮询） |
| P-03 | 日志 | 无 API Key 全量泄露 |
| P-04 | 控制台 | Gateway/Demo 无 uncaught error |

---

## 6. 自动化（vitest）

路径：`apps/gateway/src/__tests__/api.test.ts`

最低覆盖：

- H-01, A-01, A-03, V-01, V-02, J-03（可 mock Worker）

集成测试（需 Workers）：

- G-01, U-01 标记 `integration`，CI 可选 nightly。

---

## 7. 验收签字表

| 阶段 | 条件 | 签字 |
|------|------|------|
| M1 | INFERENCE 实测 + U-01/G-01 手工 PASS | |
| M2 | 本节 P0 API + Demo 全 PASS | |

**P0 用例：** H-01~03, A-01~03, V-01~06, U-01~04, G-01~03, J-01~04, D-01~06, E-01~04, P-01~04。

---

## 8. 失败处理

| 结果 | 动作 |
|------|------|
| FAIL | 开 issue，标用例 ID，修复后回归全量 P0 |
| SKIP | 须注明原因（如 Worker 未装），不得标 MVP 完成 |
