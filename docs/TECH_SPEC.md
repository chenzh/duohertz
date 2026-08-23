# 技术约束与项目配置

**版本：** v1.0  
**关联：** [DATA_API.md](./DATA_API.md) · [DEMO.md](./DEMO.md)

---

## 1. 技术栈锁定（MVP）

| 层级 | 选型 | 版本锁定 |
|------|------|----------|
| 运行时 | Node.js | **20 LTS** |
| Gateway | **Hono** + `@hono/node-server` | 最新稳定 |
| Demo | **Vite 6** + **React 19** + TypeScript | |
| Demo 样式 | 原生 CSS（Demo 极简，不用 Tailwind MVP） | |
| 数据库 | **SQLite**（内测）→ PostgreSQL 15（生产） | |
| ORM | **Prisma** | 6.x |
| 校验 | **zod** | |
| 测试 | **vitest** + supertest | |
| 推理 Worker | Python 3.11+（ACE / SA3 官方栈） | 独立进程 |
| 包管理 | **pnpm** workspace | |

### 1.1 禁止（MVP）

- Modal、Replicate 云推理（须本地 Mac Worker）
- MusicGen、SongGeneration 依赖
- 未经评审新增 UI 框架（Demo 外）
- 在 Gateway 内嵌 PyTorch 推理（必须 Worker 分离）

---

## 2. Monorepo 目录结构

```text
music-saas/
├── apps/
│   ├── gateway/              # REST API + Demo BFF + Job 调度
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   │   ├── job-queue.ts
│   │   │   ├── worker-client.ts
│   │   │   └── storage.ts
│   │   │   ├── middleware/
│   │   │   └── lib/
│   │   ├── prisma/
│   │   └── package.json
│   └── demo/                 # Vite React 单页
│       ├── src/
│       │   ├── App.tsx
│       │   ├── api.ts        # 只调 /demo/api/*
│       │   └── components/
│       └── package.json
├── workers/                  # 部署在 Mac 上（可 git submodule 或脚本同步）
│   ├── ace-step/
│   │   ├── server.py         # FastAPI /internal/generate
│   │   └── requirements.txt
│   └── sa3/
│       ├── server.py
│       └── requirements.txt
├── packages/
│   └── shared/               # 可选：mode 枚举、错误码 TS 类型
│       └── src/types.ts
├── examples/
│   ├── curl/
│   └── python/
├── scripts/
│   ├── dev-up.sh
│   └── dev-down.sh
├── data/                     # 本地 gitignore：audio、db
├── docs/
├── PRD.md
├── pnpm-workspace.yaml
└── package.json
```

---

## 3. 端口与环境

| 服务 | 端口 | 环境变量 |
|------|------|----------|
| Gateway | 8080 | `GATEWAY_PORT` |
| Demo (Vite dev) | 3000 | — |
| ACE Worker | 8101 | `ACE_WORKER_PORT` |
| SA3 Worker | 8102 | `SA3_WORKER_PORT` |

| 变量 | 必填 | 说明 |
|------|------|------|
| `API_KEY` | 是 | Gateway 校验与 BFF 注入 |
| `DATABASE_URL` | 是 | `file:./data/dev.db` 或 PG URL |
| `ACE_WORKER_URL` | 是 | 如 `http://192.168.0.199:8101` |
| `SA3_WORKER_URL` | 是 | 如 `http://192.168.0.199:8102` |
| `AUDIO_STORAGE_PATH` | 是 | 如 `./data/audio` |
| `AUDIO_TTL_HOURS` | 否 | 默认 72 |
| `RATE_LIMIT_QPS` | 否 | 默认 2 |
| `RATE_LIMIT_DAILY_JOBS` | 否 | 默认 200 |
| `JOB_TIMEOUT_SEC` | 否 | 默认 600 |
| `LOG_LEVEL` | 否 | info |

见根目录 `.env.example`（Gateway 用）。

---

## 4. 代码规范

| 项 | 规则 |
|----|------|
| 文件命名 | kebab-case.ts；React 组件 PascalCase.tsx |
| 导出 | 路由按文件拆分；禁止单文件 >400 行（拆 service） |
| 类型 | 禁止 `any`；API 入参/出参用 zod schema |
| 错误 | 统一 `AppError` → DATA_API 错误格式 |
| 日志 | structured JSON：`level, msg, job_id, request_id` |
| 注释 | 仅非显而易见业务规则；接口须有 JSDoc 链到 DATA_API |
| Git | 每模块一 commit；message: `feat(gateway): ...` |

---

## 5. Gateway 模块职责

| 模块 | 职责 |
|------|------|
| `routes/jobs.ts` | POST/GET jobs、audio 流 |
| `routes/health.ts` | health、inference |
| `routes/demo-proxy.ts` | `/demo/api/*` 转发 |
| `services/job-queue.ts` | FIFO；每 engine 1 并发 |
| `services/worker-client.ts` | 调 Worker internal API |
| `services/storage.ts` | 写 WAV、路径、TTL 清理 |
| `middleware/auth.ts` | X-API-Key |
| `middleware/rate-limit.ts` | QPS + 日限额 |

---

## 6. Demo 技术约束

- 仅请求同源 `/demo/api/v1/*`（Vite proxy → Gateway 8080）
- 状态：React `useState` + 轮询 hook，不用 Redux MVP
- 会话任务列表：`sessionStorage`，最多 10 条
- UI 遵循 [DEMO.md](./DEMO.md) §4

**vite.config.ts proxy：**

```ts
proxy: {
  '/demo/api': { target: 'http://localhost:8080', changeOrigin: true }
}
```

---

## 7. 统一接口返回（Gateway 实现）

所有 HTTP handler 使用：

```ts
// 成功
return c.json({ data: payload, meta: { request_id } }, status)

// 失败
return c.json({ error: { code, message, details }, meta: { request_id } }, status)
```

---

## 8. 跨域

| 环境 | 配置 |
|------|------|
| 本地 | Demo proxy，无需 CORS |
| 公网 | Gateway 仅允许 Demo 域名 `CORS_ORIGIN` |

---

## 9. 依赖安装

```bash
pnpm install
cd apps/gateway && pnpm prisma migrate dev
```

Mac Workers 见 [INFERENCE.md](./INFERENCE.md)。

---

## 10. 与 Prisma schema 同步

`apps/gateway/prisma/schema.prisma` 字段必须与 [DATA_API.md](./DATA_API.md) §4 一致。变更须同时改 DATA_API 与迁移。
