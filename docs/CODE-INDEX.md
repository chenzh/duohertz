# MusicSaas 代码索引

> Agent 改代码前先定位模块；**勿**全仓盲搜 `node_modules` / `dist`。  
> 索引边界见 [.cursorignore](../.cursorignore) · [.cursor/rules/code-index.mdc](../.cursor/rules/code-index.mdc)

---

## 1. 仓库地图

```text
MusicSaas/
├── apps/
│   ├── gateway/          # M1–M3 REST API + Job 队列 + Demo BFF
│   ├── demo/             # M8 Vite React 演示页
│   ├── beatscape/        # BeatScape Stage1 节奏游戏（主产品前端）
│   └── neonbeat/         # 参考节奏游戏（判定窗 22/45/50，勿混用）
├── workers/
│   ├── ace-step/         # M4 ACE MLX FastAPI Worker
│   ├── sa3/              # M5 SA3 MLX FastAPI Worker
│   └── common/           # Worker 共享工具
├── packages/shared/      # TS 共享类型（mode 枚举等）
├── scripts/              # 运维、验收、BeatScape 流水线
├── tests/                # pytest 单元 + harness
├── docs/                 # 产品与 Harness 文档
├── data/                 # 本地运行时（gitignore）
├── examples/             # curl / Python 调用示例
├── PRD.md                # 产品总纲
├── SESSION.md            # 项目续作真相
└── AGENTS.md             # Agent 入口
```

---

## 2. apps/gateway

| 路径 | 职责 |
|------|------|
| `src/index.ts` | Hono 入口、路由挂载 |
| `src/routes/jobs.ts` | POST/GET `/v1/jobs` |
| `src/routes/demo.ts` | Demo BFF `/demo/api/*` |
| `src/services/job-queue.ts` | 内存/DB 队列调度 |
| `src/services/worker-client.ts` | 调用 ACE/SA3 Worker |
| `src/services/storage.ts` | 音频文件存储 |
| `src/middleware/` | API Key、限流 |
| `prisma/schema.prisma` | Job 模型 |

**测试：** `pnpm --filter gateway test`（Vitest）

---

## 3. apps/demo

| 路径 | 职责 |
|------|------|
| `src/App.tsx` | 四 mode UI 入口 |
| `src/api.ts` | 仅调 Gateway `/demo/api` |
| `src/components/` | 表单、播放器、状态 |

**构建：** `pnpm --filter demo build` → Gateway 静态挂载 `/demo`

---

## 4. apps/beatscape（Stage1）

| 路径 | 职责 |
|------|------|
| `src/App.tsx` | 路由壳 |
| `src/router.tsx` | 轻量自研路由（无 react-router-dom） |
| `src/pages/` | Home · Library · Play · Results · Calibration · Settings |
| `src/components/PlayField.tsx` | 谱面渲染、Tap to Start、键盘 D/F/J/K |
| `src/engine/judge.ts` | 判定窗 15/30/50 ms |
| `src/storage/settings.ts` | `bs_*` localStorage |
| `public/catalog.json` | Stage1 曲库元数据 |
| `public/catalog/bs-s1-*/` | 每曲 m4a + easy/standard/hard JSON + cover |

**脚本：**

- `scripts/beatscape-ingest-stage1.py` — 预览 → public catalog
- `scripts/beatscape-audit.py` — 时长/元数据 QA

**预览：** `pnpm dev:beatscape` · base `/beatscape/`

---

## 5. apps/neonbeat（参考）

判定与 BeatScape 不同（22/45/50）。仅作 UI/引擎参考，**不要**把 NeonBeat 常量抄进 BeatScape。

---

## 6. workers/

| Worker | 入口 | 端口（默认） |
|--------|------|-------------|
| ACE | `workers/ace-step/server.py` | 8001 |
| SA3 | `workers/sa3/server.py` | 8002 |

Mac 启停：`scripts/mac-services-up.sh` · `scripts/mac-stack-verify.sh`

---

## 7. scripts/（精选）

| 脚本 | 用途 |
|------|------|
| `harness.sh` | 统一测试入口（unit/integration/e2e/mlx） |
| `print-status.sh` | Harness 进展快照 |
| `acceptance-p0.py` | Gateway 快速验收 |
| `acceptance-demo-web.py` | Demo Web 12 项验收 |
| `acceptance-mlx-vocal.py` | MLX 人声 E2E |
| `mac-services-up.sh` | Mac 全栈启动 |
| `beatscape-ingest-stage1.py` | BeatScape 内容入库 |
| `beatscape-audit.py` | BeatScape 内容 QA |

---

## 8. 测试矩阵

| 命令 | 范围 |
|------|------|
| `pnpm test` | gateway vitest + pytest unit |
| `pnpm test:integration` | mock workers + acceptance-p0 |
| `pnpm test:e2e` | demo web acceptance |
| `pnpm test:mlx` | Mac MLX（不可达则 skip） |
| `pnpm audit:beatscape` | Stage1 catalog QA |

---

## 9. 索引排除（勿当作源码）

以下目录 **存在但默认不参与 Agent 索引**：

- `**/node_modules/`
- `**/dist/`
- `data/`（本地 DB、预览音频、生成物）
- `apps/beatscape/public/catalog/**/*.m4a`（二进制资源，改元数据走 JSON + ingest）

---

## 10. 改哪里（决策树）

```text
改 API 契约？        → docs/DATA_API.md + apps/gateway/src/routes/
改 Demo UI？         → apps/demo/src/
改 BeatScape 玩法？  → apps/beatscape/src/engine/ + PRD-BEATSCAPE.md
改曲库/谱面？        → scripts/beatscape-* + public/catalog/
改推理？             → workers/* + docs/INFERENCE.md
改 Harness/续作？    → SESSION.md + worklog/
```
