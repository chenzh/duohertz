# MusicSaas 知识库（Harness Basic）

> **slug:** `musicsaas` · **Vault:** `10-SYSTEM/HARNESS/projects/musicsaas.md`  
> 先用本页 + [CODE-INDEX.md](./CODE-INDEX.md) 定位模块，只读任务相关资料；执行约定见 [AGENTS.md](../AGENTS.md)。

---

## 1. 项目是什么

**MusicSaas** = 音乐生成 API（双引擎 MLX）+ Demo Web + 主线节奏游戏 **duohertz（真我赫兹）**。

| 子系统 | 路径 | 说明 |
|--------|------|------|
| Gateway API | `apps/gateway/` | REST Job 异步、鉴权、Worker 调度 |
| Demo Web | `apps/demo/` | 四 mode 试用页，BFF 代理 |
| ACE Worker | `workers/ace-step/` | 人声 / 主题曲（ACE-Step 1.5 MLX） |
| SA3 Worker | `workers/sa3/` | 游戏 BGM（Stable Audio 3 MLX） |
| **duohertz（主线节奏游戏）** | `apps/beatscape/` | 一键／双键电音；目录沿用 BeatScape 名（迁移期） |
| ScapeMusic | `apps/scapemusic/` | 音乐站（共用曲库与电台） |
| NeonBeat | `apps/neonbeat/` | 节奏游戏参考实现（非主产品） |

主线节奏游戏自 2026-09-23 起为 **duohertz**；BeatScape 是迁移期仍沿用的旧版名称与历史 IP 线（目录名、包名、线上站点、旧存档保持原样，旧版内容与旧站不作为 duohertz 的已完成内容）。

**远程：** https://github.com/chenzh/MusicSaas  
**推理节点：** MacBook Pro M5 Pro 48GB · `192.168.0.199`

---

## 2. 按任务选文档（无需逐项预读）

### API / 平台（MVP v0.2）

**门户上线准备（2026-09-05）**：[PORTAL-RELEASE-READINESS.md](./PORTAL-RELEASE-READINESS.md) — 独立静态门户、候选证据、发布输入与回滚；当前域名/Pages 项目待定。

1. [PRD.md](../PRD.md) — 产品总纲 v1.2
2. [docs/RULES.md](./RULES.md) — 规则与边界
3. [docs/DATA_API.md](./DATA_API.md) — 接口与数据库
4. [docs/TECH_SPEC.md](./TECH_SPEC.md) — 技术栈与目录
5. [docs/MODULES.md](./MODULES.md) — 模块拆分与开发顺序
6. [docs/INFERENCE.md](./INFERENCE.md) — Mac 双 Worker 部署
7. [docs/ACCEPTANCE.md](./ACCEPTANCE.md) — 验收用例

### duohertz 主线（当前）

1. [apps/beatscape/PRD.md](../apps/beatscape/PRD.md) — **duohertz v2.0 目标 PRD（真相源）**；一键／双键核心玩法、The Soundfield 世界观与暂名角色；下半部保留 BeatScape 旧版实现快照
2. [docs/DUOHERTZ-CATALOG-PROMOTION.md](./DUOHERTZ-CATALOG-PROMOTION.md) — 曲库候选与推广口径
3. [docs/DUOHERTZ-PERFORMANCE.md](./DUOHERTZ-PERFORMANCE.md) — 性能基线与优化证据
4. [docs/DUOHERTZ-VISUAL-DESIGN-BRIEF.md](./DUOHERTZ-VISUAL-DESIGN-BRIEF.md) — **视觉交付入口（2026-09-25）**：纯视觉方向、设计系统、核心页面、组件／动效／响应式规范、交付物与验收清单；不含迁移历史或发布结论
5. 候选暂存与流水线：`apps/beatscape/candidates/duohertz/`（本机未入库）· `apps/beatscape/public/duohertz-v2/catalog.json` · `scripts/duohertz-*`

### BeatScape 旧版（历史）

**上线准备入口（2026-09-05）**：[BEATSCAPE-RELEASE-READINESS.md](./BEATSCAPE-RELEASE-READINESS.md) — 105 首候选包、技术证据、内容阻塞、人工验收工作包与发布/回退流程。

**自动性能记录（2026-09-06）**：[BEATSCAPE-PERFORMANCE.md](./BEATSCAPE-PERFORMANCE.md) — 同条件冷加载、完整 Hard / 最高特效 / 双人、连续重开及切歌的基线与优化证据；取消项先核对 [项目决策](BEATSCAPE-DECISIONS.md)。

1. [docs/PRD-BEATSCAPE.md](./PRD-BEATSCAPE.md) — BeatScape v1.9 历史产品总纲
2. [docs/PRD-WEB-RHYTHM-GAME.md](./PRD-WEB-RHYTHM-GAME.md) — NeonBeat 参考
3. [docs/BEATSCAPE-STAGE1-DUAL-ASSET.md](./BEATSCAPE-STAGE1-DUAL-ASSET.md) — BeatScape Stage1 双资产历史清单
4. [docs/BEATSCAPE-CATALOG-ROADMAP.md](./BEATSCAPE-CATALOG-ROADMAP.md) — BeatScape 旧版 50 首路线图
5. [docs/BEATSCAPE-SONIC-DIRECTION.md](./BEATSCAPE-SONIC-DIRECTION.md) — BeatScape 旧版声学方向（车载 + 都市爵士战斗感）
6. [docs/BEATSCAPE-STAGE6-EXPANSION-MUSIC.md](./BEATSCAPE-STAGE6-EXPANSION-MUSIC.md) — BeatScape 旧版扩容记录
7. [docs/BEATSCAPE-STAGE4-RESONANCE-MUSIC.md](./BEATSCAPE-STAGE4-RESONANCE-MUSIC.md) — BeatScape 旧版补曲记录
8. [docs/BEATSCAPE-RESONANCE-PRESETS.md](./BEATSCAPE-RESONANCE-PRESETS.md) — 旧版风格包附录
9. [docs/BEATSCAPE-STAGE2-DELIVERY.md](./BEATSCAPE-STAGE2-DELIVERY.md) — BeatScape Stage2 历史交付
10. [docs/BEATSCAPE-TODO-ACCEPTANCE.md](./BEATSCAPE-TODO-ACCEPTANCE.md) — **历史冲刺归档**：Stage1–3 验收规格（2026-08-25），27 条未勾选项属过期冲刺，**不是当前待办**；当前入口为仓库根 `TODO.md`
11. 旧版内容流水线见 PRD-BEATSCAPE §6.0 · `catalog.json` · `catalog-roadmap.json` · `scripts/beatscape-*`

### BeatScape 世界观 / IP / 商业化（2026-08 新增线）

1. [docs/BEATSCAPE-WORLDBIBLE.md](./BEATSCAPE-WORLDBIBLE.md) — **叙事唯一真相源**（Scape City / The Hush / NIGHTSHIFT 三人组 / 电台 Year 1 三季 24 集 / 商标筛查与备选名）
2. [docs/BEATSCAPE-CHARACTER-LORA.md](./BEATSCAPE-CHARACTER-LORA.md) — 角色 LoRA 管线真相源（跨 IDE 必读，Animagine XL 4.0 / rank 8 铁律）
3. [docs/BEATSCAPE-IP-STRATEGY.md](./BEATSCAPE-IP-STRATEGY.md) — 角色 IP 战略（Art Brief / 叙事 Bible / 商业化差距索引）
4. [docs/BEATSCAPE-REDDIT-LAUNCH.md](./BEATSCAPE-REDDIT-LAUNCH.md) — Reddit 首发文案包（发帖前红线自查 + 三篇成稿）
5. [docs/BEATSCAPE-COMMERCIALIZATION-GAP.md](./BEATSCAPE-COMMERCIALIZATION-GAP.md) — 商业化差距 7 域 34 项（5 决策点待拍板）
6. [docs/RESONANCE-BLINDTEST.md](./RESONANCE-BLINDTEST.md) — 差异化盲测规程（上线前人工关卡，6 展示面）
7. [docs/BEATSCAPE-NARRATIVE-PLAYTEST.md](./BEATSCAPE-NARRATIVE-PLAYTEST.md) — 五分钟英语叙事试玩：理解、人物记忆、继续意愿与英语自然度；待真实参与者执行
8. [docs/BEATSCAPE-NARRATIVE-UPDATE.md](./BEATSCAPE-NARRATIVE-UPDATE.md) — 2026-09-05 本地叙事优化：三节点可玩开场、24 集对白、人物页与验证证据

### Harness / 续作

工作流入口：[验证技能](../.agents/skills/music-verify/SKILL.md) · [Issue 交付技能](../.agents/skills/music-delivery/SKILL.md) · [规则审计与官方依据](./AGENT-WORKFLOW-AUDIT.md)。

1. [SESSION.md](../SESSION.md) — 项目级战略 todo（唯一真相）
2. [docs/VAULT-HARNESS.md](./VAULT-HARNESS.md) — Vault 规范快照
3. [AGENTS.md](../AGENTS.md) — Agent 导航
4. Vault `04-PROJECTS/2026-08-23-project-musicsaas.md` — 第二大脑项目 MOC

---

## 3. 双引擎速查

| 业务 | `mode` | 引擎 |
|------|--------|------|
| 人声（歌词） | `vocal_lyrics` | ACE-Step 1.5 |
| 人声（描述） | `vocal_desc` | ACE-Step 1.5 |
| 游戏 BGM | `game_bgm` | Stable Audio 3 |
| 游戏主题曲 | `game_theme_vocal` | ACE-Step 1.5 |

---

## 4. 常用命令

```bash
# API 栈
pnpm install
bash scripts/mac-services-up.sh      # Mac MLX 全栈
bash scripts/harness.sh all          # unit + build + integration

# duohertz（主线节奏游戏，迁移期目录 apps/beatscape/）
pnpm dev:beatscape                   # http://127.0.0.1:5175/beatscape/lab/duohertz/home
pnpm --filter @musicsaas/beatscape test        # Vitest
pnpm --filter @musicsaas/beatscape test:lab    # Playwright lab-e2e
pnpm --filter @musicsaas/beatscape build:duohertz:preview  # 独立审查包

# 旧版 BeatScape 内容 QA（历史线）
pnpm audit:beatscape                 # Stage1 内容 QA
python3 scripts/beatscape-ingest-stage1.py

# 进展
bash scripts/print-status.sh
```

---

## 5. 已知约束 / 踩坑

- **Worker 分离**：Gateway 禁止内嵌 PyTorch；推理走 `workers/*`
- **BeatScape 谱面**：当前实现和验收状态见 `SESSION.md`；生成器入口 `scripts/beatscape-chartgen.py`，勿把历史 Stage1 占位描述当成当前实现
- **依赖安装**：使用仓库 pnpm 锁文件；遇到网络/证书问题先诊断，不复制其他 app 的 `node_modules`
- **预览音频**：`data/beatscape-preview/` gitignore；Range 服务 `serve.py`
- **秘密**：`.env` 禁止 commit / 写入 Vault

---

## 6. Vault 连接

```
.secondbrain → https://github.com/chenzh/SecondBrain
registry slug: musicsaas · profile: generic
```

口令：`同步第二大脑规则` · `同步项目规范到全部外接仓库` · `打包第二大脑上下文：musicsaas`
