# Project Brief — beatscape (MusicSaas)

## Meta

| 字段 | 值 |
|------|-----|
| Project ID | `beatscape` |
| Repo | `github.com/chenzh/MusicSaas` |
| Local path | `/Users/zhenhuachen/Desktop/MusicSaas` |
| Tier | **production** |
| App | `apps/beatscape/` (`@musicsaas/beatscape`) |

## What & Why

BeatScape 是 MusicSaas 出海可玩的 **Web 节奏游戏**（Vite + React）。AI 公司队列只处理 **前端/UI/测试/文档**，不碰推理与 Gateway。

## In Scope（agent-safe）

- `apps/beatscape/**` UI、路由、样式、无障碍
- `apps/beatscape/src/**/*.test.ts` 单测
- `docs/BEATSCAPE*.md` 文档（非 PRD 语义变更）
- `apps/beatscape/public/catalog/**` 仅当 ticket 明确允许且带验收脚本

## Out of Scope（禁止 Agent）

- `workers/**` · `apps/gateway/**` · `apps/demo/**`（除非单独 human-only brief）
- MLX / 推理 / `API_KEY` / `.env` 生产配置
- `scripts/beatscape-ingest*` · `pipeline*` · `regenerate*`（内容流水线）
- `PRD.md` 产品语义 · 定价 · 支付
- 修改判定窗常量 **15/30/50** 除非 ticket 写明

## Truth sources（Agent 必读顺序）

1. [AGENTS.md](../../../AGENTS.md)
2. [docs/KNOWLEDGE-BASE.md](../../../docs/KNOWLEDGE-BASE.md)
3. [docs/PRD-BEATSCAPE.md](../../../docs/PRD-BEATSCAPE.md)
4. [SESSION.md](../../../SESSION.md)
5. 本目录 `brief.md` / `accept_cases.md`

## Acceptance

见 [accept_cases.md](./accept_cases.md)。
