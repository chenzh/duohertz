# MusicSaas

**主线：音乐生成 API + 配套 Demo + duohertz（真我赫兹）节奏游戏**

> **Harness：** [SESSION.md](./SESSION.md) · [知识库](./docs/KNOWLEDGE-BASE.md) · [代码索引](./docs/CODE-INDEX.md) · [AGENTS.md](./AGENTS.md)  
> 进展：`bash scripts/print-status.sh`

主线节奏游戏自 2026-09-23 起为 **duohertz**（中文名 真我赫兹，一键／双键电音）；迁移期代码目录、包名、线上站点与旧存档仍沿用 BeatScape 原样，旧版内容与旧站不作为 duohertz 的已完成内容。

| 组件 | 说明 |
|------|------|
| **API** | REST Job 异步接口，双引擎路由 |
| **Demo** | 单页 Web 试用 + curl/Python 示例 |
| **duohertz** | 主线节奏游戏：一键／双键、105 首电音技术候选、315 张 format-2 谱；目录 `apps/beatscape/` |
| **ScapeMusic** | `apps/scapemusic/` 音乐站（共用曲库与电台） |

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
| [docs/KNOWLEDGE-BASE.md](./docs/KNOWLEDGE-BASE.md) | **Harness 知识库** |
| [docs/CODE-INDEX.md](./docs/CODE-INDEX.md) | **代码索引** |
| [apps/beatscape/PRD.md](./apps/beatscape/PRD.md) | **duohertz 主线 PRD**（v2.0 目标版，真相源） |
| [docs/DUOHERTZ-CATALOG-PROMOTION.md](./docs/DUOHERTZ-CATALOG-PROMOTION.md) | duohertz 曲库候选与推广 |
| [docs/DUOHERTZ-PERFORMANCE.md](./docs/DUOHERTZ-PERFORMANCE.md) | duohertz 性能基线 |
| [docs/DUOHERTZ-VISUAL-DESIGN-BRIEF.md](./docs/DUOHERTZ-VISUAL-DESIGN-BRIEF.md) | duohertz 视觉设计简报 |
| [docs/PRD-BEATSCAPE.md](./docs/PRD-BEATSCAPE.md) | 旧版 BeatScape 主 PRD（历史） |
| [docs/DEMO.md](./docs/DEMO.md) | 配套 Demo 规格 |
| [docs/README.md](./docs/README.md) | 文档索引 |

## 状态

### duohertz（主线节奏游戏）

🟡 **本机技术候选** — 105 首电音技术候选（Melodic House / Synthwave / Future Bass / Drum & Bass / Trance 各 21）、315 张 `format: 2` 谱、三名暂名角色；人工耳检签审 **0/105**，未部署、未 push。

- 线上站点仍是**旧版 BeatScape**，不代表 duohertz 已完成内容。
- 真实音频与谱面目前只在本机候选暂存目录 `apps/beatscape/candidates/duohertz/`（未入库）；`apps/beatscape/public/catalog/dh-*/` 仅含 `cover-thumb.webp`。
- 谱面生成／重生成须过 [BS-D002](./docs/BEATSCAPE-DECISIONS.md) 门禁；续作按 [BS-D003](./docs/BEATSCAPE-DECISIONS.md) 默认只做本机测试。

### 音乐 API / Gateway

🟢 **MVP v0.2 + 双引擎 Mac MLX 已跑通** — Gateway + Demo + ACE + SA3（见 [docs/MODULES.md](./docs/MODULES.md)）

| 能力 | 状态 | 预期耗时 |
|------|------|----------|
| ACE MLX 人声 (`vocal_lyrics` 10s) | ✅ 实测 PASS | **~3s**（P50） |
| SA3 MLX BGM (`game_bgm` 15s) | ✅ 实测 PASS | **~1s**（权重缓存后） |
| Demo Web 四 mode | ✅ `acceptance-demo-web.py` 12/12 | ~40s |
| Gateway → MLX 端到端 | ✅ vocal + BGM 验收脚本 | 见 M1-benchmark |

详见 [docs/reports/M1-benchmark.md](./docs/reports/M1-benchmark.md) · [docs/reports/mlx-acceleration-plan.md](./docs/reports/mlx-acceleration-plan.md)

### 快速启动

**duohertz（主线节奏游戏，本机）**

```bash
pnpm install

# 本地开发：dev lab 路由（Vite dev 下启用）
pnpm --filter @musicsaas/beatscape dev
open http://localhost:5175/beatscape/lab/duohertz/home   # duohertz 开发 hub
open http://localhost:5175/beatscape/lab/duohertz/v2/home # v2 目标版入口

# 本机测试与构建
pnpm --filter @musicsaas/beatscape test        # Vitest
pnpm --filter @musicsaas/beatscape test:lab    # Playwright（lab-e2e）
pnpm --filter @musicsaas/beatscape build:duohertz:preview   # 独立审查包 → dist-duohertz/
pnpm --filter @musicsaas/beatscape build:duohertz:source    # 新品牌源码包 → dist-duohertz-source/
```

真实音频／谱面在本机候选目录 `apps/beatscape/candidates/duohertz/`；线上站点仍为旧版 BeatScape。默认只做本机测试（[BS-D003](./docs/BEATSCAPE-DECISIONS.md)）。

**音乐 API / Demo**

```bash
cp apps/gateway/.env.example apps/gateway/.env   # 编辑 API_KEY、Worker URL
pnpm --filter gateway db:push

# Mac 双引擎 MLX（ACE API + Workers + Gateway）
bash scripts/mac-services-up.sh
bash scripts/mac-stack-verify.sh

# 路演 / 开发者 Demo
bash scripts/demo-present.sh
open http://127.0.0.1:8080/demo/?demo=1    # 路演（隐藏调试）
open http://127.0.0.1:8080/demo/?dev=1       # 开发者（轮询调试）

# 开机自启（可选）
bash scripts/mac-launchd-install.sh
```

验收：`pnpm test` · `bash scripts/mac-mlx-test.sh` · `bash scripts/mac-sa3-test.sh` · `python scripts/acceptance-demo-web.py`

## 仓库

https://github.com/chenzh/MusicSaas
