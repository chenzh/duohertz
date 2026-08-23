# 部署、运维与迭代

**版本：** v1.0  
**MVP 拓扑：** Gateway + Demo（开发机） + Mac Workers

---

## 1. 环境矩阵

| 环境 | Gateway | Demo | Workers | DB |
|------|---------|------|---------|-----|
| local | localhost:8080 | localhost:3000 | Mac 192.168.0.199 | SQLite |
| staging | 内网 IP | 同机或静态挂载 | Mac | PostgreSQL |
| production | 待定 | 同 Gateway `/demo` 或独立 | Mac / 扩展 | PostgreSQL + R2 |

---

## 2. 本地开发启动

### 2.1 前置

1. Mac：ACE + SA3 Worker 已启动（[INFERENCE.md](./INFERENCE.md)）
2. `cp apps/gateway/.env.example apps/gateway/.env` 并填写
3. `pnpm install`

### 2.2 启动命令

```bash
# 终端 1 — Gateway
pnpm --filter gateway dev

# 终端 2 — Demo
pnpm --filter demo dev
```

### 2.3 `scripts/dev-up.sh`（目标）

```bash
#!/usr/bin/env bash
set -euo pipefail
curl -sf http://localhost:8080/v1/health || { echo "Gateway down"; exit 1; }
curl -sf http://localhost:8080/v1/health/inference
echo "Open http://localhost:3000"
```

### 2.4 验证

```bash
./examples/curl/health.sh
```

---

## 3. 构建与打包

```bash
pnpm --filter gateway build
pnpm --filter demo build
# Demo 静态资源可由 Gateway 挂载 dist（staging）
```

产物：

- `apps/gateway/dist/`
- `apps/demo/dist/`

---

## 4. CI/CD（规划）

| 阶段 | 动作 |
|------|------|
| PR | `pnpm lint && pnpm test`（unit） |
| main | 构建 artifact；可选部署 staging |
| nightly | `integration` 测试（需 Mac runner 或跳过） |

**MVP：** GitHub Actions 仅 lint + unit test；部署手工。

### 4.1 示例 workflow 路径

`.github/workflows/ci.yml` — Post-MVP 添加。

---

## 5. Mac Worker 运维

### 5.1 launchd（可选）

`~/Library/LaunchAgents/com.local-ai.ace-worker.plist`  
`~/Library/LaunchAgents/com.local-ai.sa3-worker.plist`

- `RunAtLoad: true`
- `KeepAlive: true`
- 日志：`~/logs/ace-worker.log`

### 5.2 磁盘

- 监控 `data/audio` 体积
- 每日 cron 清理超过 `AUDIO_TTL_HOURS` 的文件

```bash
find /path/to/audio -mtime +3 -delete
```

---

## 6. 日志规范

### 6.1 Gateway JSON 行

```json
{
  "level": "info",
  "msg": "job_completed",
  "request_id": "uuid",
  "job_id": "uuid",
  "mode": "game_bgm",
  "engine": "stable-audio-3",
  "latency_ms": 45000
}
```

### 6.2 级别

| level | 场景 |
|-------|------|
| info | 请求完成、Job 状态变更 |
| warn | Worker degraded、重试 |
| error | 5xx、Worker 失败 |

### 6.3 禁止记录

- 完整 `X-API-Key`
- 完整 `lyrics`（可配置 `LOG_PROMPTS=true` 仅 dev）

---

## 7. 监控与告警（MVP 轻量）

| 指标 | 方式 |
|------|------|
| Gateway 存活 | 外部 cron `GET /v1/health` |
| Worker 存活 | `GET /v1/health/inference` |
| 队列深度 | 日志聚合 `status=queued` count |
| 失败率 | `status=failed` / 总量 |

告警 MVP：脚本 + 邮件/微信（手动）；v0.2 Prometheus。

---

## 8. 回滚

| 组件 | 回滚 |
|------|------|
| Gateway | `git revert` + 重启进程 |
| Demo 静态 | 替换上一版 `dist` |
| DB | Prisma migrate 向前-only；回滚用备份 |
| Worker | 保留上一版 `server.py` + 模型版本标签 |

**数据库备份（staging/prod）：** 每日 `pg_dump` 或复制 SQLite。

---

## 9. 迭代与分支规范

| 分支 | 用途 |
|------|------|
| `main` | 可部署稳定线 |
| `feat/*` | 功能 |
| `fix/*` | 修复 |

- PR 须更新相关 `docs/`（API 变更 → DATA_API + ACCEPTANCE）
- 合并前 P0 自动化测试绿

### 9.1 CHANGELOG 模板

```markdown
## [0.1.0] - 2026-xx-xx
### Added
- Job API 4 modes
- Demo web
### Fixed
- ...
```

---

## 10. SSL / 域名（公网时）

- Gateway 前置 Caddy/Nginx
- `demo.example.com` → Demo 静态
- `api.example.com` → Gateway
- Workers **不**挂公网

---

## 11. 故障 Runbook

| 症状 | 步骤 |
|------|------|
| 全部 Job queued | 查 inference health → 重启 Worker |
| 仅 BGM 失败 | 查 SA3 日志、模型路径 |
| 仅人声失败 | 查 ACE MLX、显存 |
| 磁盘满 | 清理 audio + 扩盘 |
| 429 激增 | 调限流或扩容队列 |
