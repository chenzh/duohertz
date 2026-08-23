# Local AI Music Platform

**MVP：音乐生成 API + 配套 Demo**

| 组件 | 说明 |
|------|------|
| **API** | REST Job 异步接口，双引擎路由 |
| **Demo** | 单页 Web 试用 + curl/Python 示例 |

| 业务 | 引擎 | MVP `mode` |
|------|------|------------|
| 人声 | ACE-Step 1.5 | `vocal_lyrics`, `vocal_desc` |
| 游戏 BGM | Stable Audio 3 | `game_bgm` |
| 游戏主题曲 | ACE-Step 1.5 | `game_theme_vocal` |

推理节点：MacBook Pro M5 Pro 48GB · `192.168.0.199`

## 文档

| 文档 | 说明 |
|------|------|
| [PRD.md](./PRD.md) | 产品需求 **v1.2** |
| [docs/DEMO.md](./docs/DEMO.md) | 配套 Demo 规格 |
| [docs/README.md](./docs/README.md) | 文档索引 |

## 状态

🟢 **MVP v0.1 代码已落地** — Gateway + Demo + Workers + examples（见 [docs/MODULES.md](./docs/MODULES.md)）

### 快速启动

```bash
pnpm install
cp apps/gateway/.env.example apps/gateway/.env
pnpm --filter gateway db:push
# Mac 上启动 Worker（需 Xcode CLT）：scripts/mac-worker-setup.sh
# 或开发机：python workers/ace-step/server.py & python workers/sa3/server.py
pnpm --filter gateway dev   # :8080
pnpm --filter demo dev      # :3000
```

验收：`pnpm test` · `python scripts/run-benchmark.py` · `docs/reports/M1-benchmark.md`

## 仓库

https://github.com/huagechen-lab/local-ai-music-platform
