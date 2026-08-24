# Vault Harness Snapshot
> slug: musicsaas · generated: 2026-08-24 18:51

---

## Global

---
type: system
status: evergreen
created: 2026-06-30
tags:
  - harness
  - global
---

# Global Harness — 所有外接仓必遵守

> 工作区根目录存在 `.secondbrain` 时生效。

## 开干前（强制）

1. 读 `10-SYSTEM/HARNESS/registry.json`，匹配当前仓 `slug` / `path` / `remote`
2. 依次读：`global.md` → `profiles/{profile}.md` → `projects/{slug}.md`
3. Monorepo 子项目：读 registry 中 `subprojects[]` 对应 `projects/{slug}.md`
4. **Brain-first（强制倾向）**：优先 gbrain MCP；否则 `打包第二大脑上下文` / `/zbrain-pack` → `think-vault`；合成 + `[[笔记]]` + `缺口：…`。见 [[GBRAIN-LAYER]] · [[AI-CONTRACT]]
5. **Vibecoding**：先解析当前 **chat-id** → 读 `{项目根}/sessions/<chat-id>.md`（若有）；项目级读 `{项目根}/SESSION.md`。见 [[session-protocol]] · [[2026-07-06-map-vibecoding-scratchpad]]

## Vibecoding 会话内

- **「继续 / 推进」按会话 ID 路由**（见 [[session-protocol]]）：有 `sessions/<chat-id>.md` 只跑该文件 next；勿串台到项目 SESSION  
- 明示「继续项目 / 推进 SESSION」才读项目级 `SESSION.md`  
- openworld **monorepo**：子项目仍各有项目级 SESSION；会话文件放在该子项目 `sessions/`  
- **不读不写** `active-site.json`（防多会话污染）  
- `记 scratch：…` → 写入**当前 chat-id** 的会话文件（无则建）

## 收工（有实质推进时）

1. **PATCH** `sessions/<chat-id>.md`（本聊天 next/done）；仅当变更属仓级战略债时再 PATCH 项目 `SESSION.md`  
2. **追加** 根或项目 `worklog/yyyy-MM-dd.md`「已完成」  
3. **milestone** → 静默 `deposit-second-brain -Source milestone`  
4. **git push**（项目 SESSION/worklog 为换机续作；会话文件可一并提交）

## 多执行器（Cursor · Hermes · OpenClaw）

- 项目真相：**SESSION.md**；Cursor 聊天进度：**sessions/\<chat-id\>.md**（见 [[session-protocol]]）
- 知识沉淀：**Vault**（见 [[AUTO-DEPOSIT]]）
- Hermes 运行时 vs 第二大脑 Portfolio：见 [[SECOND-BRAIN-HERMES-COLLAB]]
- Hermes Kanban **默认关闭**；战略 todo 不写 Kanban

## 编码原则

- **最小 diff**：只改任务相关文件，不顺手重构
- **复用现有约定**：命名、目录、抽象与周边代码一致
- **可执行优先**：直接给能跑的结果，不过度设计
- **中文沟通，代码英文**：UI 文案按项目 locale（见 profile / project harness）

## 安全

- 禁止把 API 密钥、token、`.env` 写入 Vault 或 commit
- 破坏性命令先确认；优先 `trash` 而非 `rm`

## 沉淀（默认自动）

里程碑（修完 / 部署 / 定方案 / 踩坑解决）→ 静默 `deposit-second-brain -Source milestone`  
详见 `10-SYSTEM/AUTO-DEPOSIT.md`。

## 禁止

- 在代码仓复制 SecondBrain 全文规则（仅允许薄指针 `vault-harness.mdc`）
- 空壳交付、构建失败仍称完成
- 未经要求的 git commit / push

## 连接

- [[AI-CONTRACT]]
- [[2026-06-14-permanent-multi-ide-secondbrain]]
- [[session-protocol]]
- [[SECOND-BRAIN-HERMES-COLLAB]]

---

## Profile: generic

---
type: system
status: active
created: 2026-06-30
tags:
  - harness
  - profile
---

# Profile: generic

未匹配专用 profile 时的默认栈规范。

## 约定

- 读项目根 `README.md` / `AGENTS.md`（若有）
- 沿用现有 linter / formatter / CI
- 改前先 `search-vault` 项目名，避免重复踩坑

## 构建门禁

- 项目文档声明的 build/test 命令通过再交付

---

## Project: musicsaas

---
type: project
status: active
created: 2026-08-23
updated: 2026-08-24
tags:
  - harness
  - musicsaas
project: musicsaas
---

# Harness: MusicSaas

## 项目

- **名称**：MusicSaas — 音乐生成 API + Demo + BeatScape
- **路径**：`/Users/zhenhuachen/Desktop/MusicSaas`
- **远程**：`chenzh/MusicSaas` · https://github.com/chenzh/MusicSaas
- **Profile**：`generic`

## 架构（Monorepo）

| 模块 | 路径 | 说明 |
|------|------|------|
| Gateway | `apps/gateway/` | Hono REST · Job 队列 · Demo BFF |
| Demo | `apps/demo/` | Vite React 四 mode 试用 |
| BeatScape | `apps/beatscape/` | Stage1 节奏游戏（主产品前端） |
| NeonBeat | `apps/neonbeat/` | 参考实现，勿混用判定常量 |
| ACE Worker | `workers/ace-step/` | 人声 MLX |
| SA3 Worker | `workers/sa3/` | BGM MLX |

## 仓内知识库 / 索引（Basic Harness）

| 文件 | 职责 |
|------|------|
| `docs/KNOWLEDGE-BASE.md` | 知识库 MOC |
| `docs/CODE-INDEX.md` | 代码地图 |
| `AGENTS.md` | Agent 入口 |
| `.cursor/rules/code-index.mdc` | 索引边界规则 |
| `.cursorignore` | Cursor 跳过路径 |
| `SESSION.md` | 项目续作真相 |

## 约定

- 写代码前读：`KNOWLEDGE-BASE` → `CODE-INDEX` → `SESSION`
- BeatScape 判定窗 **15/30/50**（PRD-BEATSCAPE）；NeonBeat 为参考
- Gateway 禁止内嵌 PyTorch；推理走 Worker
- 构建/验收通过再交付：`pnpm test` · `bash scripts/harness.sh all`

## Tier 2（本仓扩展）

| 文件 | 职责 |
|------|------|
| `docs/PRD-BEATSCAPE.md` | BeatScape 主 PRD |
| `scripts/beatscape-audit.py` | Stage1 内容 QA |
| `scripts/harness.sh` | 统一测试 harness |
| `worklog/` | 日流水 |

## 推理节点

MacBook Pro M5 Pro 48GB · `192.168.0.199` · MLX 双引擎已跑通

## 连接

- Vault MOC：`04-PROJECTS/2026-08-23-project-musicsaas.md`
- [[repo-contract]] · [[session-protocol]]
