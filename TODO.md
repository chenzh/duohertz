# MusicSaas 项目 TODO

> **本文件是待办的唯一入口**，只登记**当前真实未完事项**，细节一律链接到对应权威文档，不在此复制正文。
> 整理日期：2026-09-06（本次含 `134115a` / `6418d3f` 之后的刷新）｜ 来源：[SESSION.md](SESSION.md) · [docs/BEATSCAPE-DECISIONS.md](docs/BEATSCAPE-DECISIONS.md) · [审计报告 §6](docs/COMPANY-PROJECT-HARNESS-AUDIT-2026-09-06.md)
> 整理原则：**已取消 ≠ 延期 ≠ 通过**。历史 PRD、工作日志、审计建议中的条目不得自动回填为本文件待办。

## 维护规则

1. 每条待办只在一个位置维护正文，本文件只做导航 + 记录状态与验收方式。
2. 新增/关闭条目时同步 `SESSION.md` 的 `next`，避免两处状态分叉。
3. **专项真机验收（BS-D001）已由用户取消，禁止再进入本文件或 `next`，也不得作为发布通过依据**（见下方「已取消」）。
4. 技术脚本通过 ≠ 人工验收通过。耳检、盲测、发布签审均为人工项，脚本只能记录结果。

---

## 当前状态速览

| 领域 | 状态 |
|---|---|
| 曲库 | **105/105**（s1 6 · s2 4 · s3 15 · s4 15 · s5 10 · s6 35 · p3 10 · p4 10） |
| 谱面 | 315 张已按「拍网格亲和力」全量重出 |
| 线上 | BeatScape <https://beatscape.pages.dev> · ScapeMusic <https://scapemusic.pages.dev> |
| 代码质量 | strict 全开 · 零 `any` · 零 `@ts-ignore` · **源码零 TODO/FIXME 标记**（本次实测 grep 零命中） |
| 性能 | 第二轮保障**进行中**：当前候选 `198acfbcd3dd` 仅完成功能与定向诊断，**矩阵证据待采集，未整体通过** |
| 阻塞发布 | 耳检 105 首 · 差异化盲测 · 发布签审（均人工） |

---

## 已取消（不自动恢复）

| ID | 事项 | 依据 |
|---|---|---|
| **BS-D001** | 专项真机验收（iPhone Safari / 中端 Android Chrome 真机矩阵；整局・连续多局・切后台・锁屏恢复・多指触控・音画同步） | [BEATSCAPE-DECISIONS.md#bs-d001](docs/BEATSCAPE-DECISIONS.md#bs-d001)，用户 2026-09-06 明确取消。仅用户明确要求才恢复 |
| — | 明确不做（本阶段） | 采购热单 · NeonBeat 常量混入 · 全球榜后端 API（见 [docs/TODO.md](docs/TODO.md)） |

> **发布门禁现状**：`launch-check.mjs` 仍要求 `deviceTestRecord`，当前无通过记录。移除该必需门禁的补丁已被自动审批拒绝（无放宽授权）。对外表述须写「未做专项真机验收（用户取消）」，**不得宣称真机通过**。

---

## P0 — 阻塞正式上线

### P0-1 人工耳检 105 首
- **为什么**：确认无「脱口而出第三方名曲」的衍生风险，命中即废弃重生成。这是上线前不可自动化替代的一关。
- **工具已备**：`python3 scripts/beatscape-earcheck-worksheet.py --all` → 浏览器打开 `apps/beatscape/earcheck-worksheet.html`，逐曲听 + 勾选，进度自动保存且**绑定音频指纹**，可导出审核记录。
- **范围**：105 首（s1 6 / s2 4 / s3 15 / s4 15 / s5 10 / s6 35 / p3 10 / p4 10）
- **重点**：`bs-p3-01 / 04 / 07` 已从母带循环扩展至 216s（原版已备份，audit **PASS=4726 WARN=9 FAIL=0**），**接缝听感待人工审核**。
- **阻塞**：正式发布签审。

### P0-2 差异化盲测
- **为什么**：阻塞「对外宣称原创差异化」的一切表述。
- **规格**：[docs/RESONANCE-BLINDTEST.md](docs/RESONANCE-BLINDTEST.md)
- **阻塞**：需 5–10 名「不玩日式 RPG」的观察者（人工招募）。
- **注意**：叙事优化后界面已变，旧候选 `74840f1fc466` 的视觉截图属历史工作包，**新界面需重新绑定视觉盲测材料**。

### P0-3 正式上线放行
- **前置**：P0-1、P0-2、P0-4 全部完成；另需 P0-6 取得**同一产物指纹**的完整性能矩阵证据（未通过前对外不得宣称性能达标）。
- **动作**：据实填写 `apps/beatscape/launch-signoff.json`。
- **门禁**：`launch:check` 当前**应阻止**正式发布（`deviceTestRecord` 缺失，按 BS-D001 如实报告，不得当作通过）；状态详见 [docs/BEATSCAPE-RELEASE-READINESS.md](docs/BEATSCAPE-RELEASE-READINESS.md)。

### P0-4 英语叙事真人试玩
- **规格**：[docs/BEATSCAPE-NARRATIVE-PLAYTEST.md](docs/BEATSCAPE-NARRATIVE-PLAYTEST.md)（五分钟协议）
- **采集**：理解度 · 角色记忆 · 继续意愿 · 英语自然度。**尚无参与者结果。**
- **背景**：叙事深度优化候选 `fa4bca512a38`（139 单测 / 6 发布器回归 / 28 浏览器流程通过，本地未提交）。

### P0-5 门户发布配置
- **等待**：门户域名 + Cloudflare Pages 项目名；确定后按真实域名重建并复核，**发布另需对应授权**。
- **现状**：[docs/PORTAL-RELEASE-READINESS.md](docs/PORTAL-RELEASE-READINESS.md)，候选 `53f83162ad6e`（本地未提交）。
- **CI 注意**：共享区公司派单脚本造成根 Python **38 项失败**；HEAD 基线叠加本任务 HTTP 修改已单独验证 70/70。**不得称整体 CI 已通过。**

### P0-6 性能保障第二轮（进行中 · 未部署）
- **为什么**：移动冷开局与 Duo 帧间隔超固定预算，正式发布前须有同指纹完整矩阵证据。
- **当前**：候选 `198acfbcd3dd`（里程碑文字预渲染缓存 + 提前下载当前曲 + 可见音符窗口）；仅过 172 单测 / 6 浏览器回归 / 11 发布器回归 / 50 性能脚本回归与**定向** Trace 诊断（26.35→14.80 ms）。
- **待采集**：18 次冷加载 · 两配置完整 Hard 矩阵（移动 Duo 最高特效 3 局复测中）· 两组反复游玩与内存。
- **预算与证据规则**：[docs/BEATSCAPE-PERFORMANCE.md](docs/BEATSCAPE-PERFORMANCE.md)（固定压力曲 `bs-s4-14`；不允许跨候选合并数据，报告须 `status: measured`）。
- **纪律**：中间候选 / 第一轮 / 诊断窗口数据**不得**拼成当前产物通过记录；BS-D001 仍生效，自动测量不等于真机验收。
- **工作区相关未提交文件**：`src/audio/earlyAudio.ts`、`src/components/playfield/milestoneTextSprites.ts`、`visibleNoteEnd.ts`、`scripts/performance-budget*.mjs`、`e2e/early-audio.spec.ts`（归本任务所有者提交）。

---

## 近期已完成（已提交到 main，勿重复列入待办）

| 事项 | commit | 说明 |
|---|---|---|
| 游戏内退出确认（替换 `window.confirm`） | `6418d3f` | 单人 / Duo 顶层面板，打开时暂停音频与判定；156 单测 + 28 浏览器回归通过，**未部署** |
| 自动性能基线与加载优化（第一轮） | `134115a` | 目录预加载/去重、首页按需谱面、64 MiB 解码缓存；移动冷开局仍 4.18 / 4.46s，**不等于性能达标**，第二轮见 P0-6 |

> 其余历史完成项见 [SESSION.md](SESSION.md)「已完成（勿再当 P0）」。

---

## P1 — 待拍板 / 待接线

### P1-1 商业化差距决策点（5 项待拍板）
- **来源**：[docs/BEATSCAPE-COMMERCIALIZATION-GAP.md](docs/BEATSCAPE-COMMERCIALIZATION-GAP.md) §6
- **五项**：变现模式 · 经营主体 · 后端栈 · 流媒体终点 · 商标批次
- **影响**：拍板后解锁对应 P0。属决策阻塞，非技术阻塞。

### P1-2 世界观 Bible 待办（仅剩人工项）
- **来源**：[docs/BEATSCAPE-WORLDBIBLE.md](docs/BEATSCAPE-WORLDBIBLE.md) §12（文档/文案/判定皮肤/美术/回归语/昵称合规/点歌文案包/S1 电台剧集包已完成）
- **商标深检索结论（2026-08-30）**：
  - `NIGHTSHIFT` — 游戏内可用，但 **Class 41 有 LIVE 在册近邻**（Kennelly Reg. 6359178 · 乐队现场演出）→ **商品化/对外品牌化前必须做 TSDR 全类正式检索**
  - `MONOLITH` — 证实 LIVE（华纳 Reg. 5880307 · Class 9 游戏软件全线）→ **限游戏内叙事，不得对外**
  - 备选名初筛已备：The Late Static（首推）/ Scape City（次选），均无精确同名

### P1-3 ScapeMusic 游戏侧接线
- **问题**：游戏侧 `VITE_STREAM_APP_URL` 仍 **0/85** 指向流媒体站。
- **来源**：[docs/BEATSCAPE-MUSIC-WEB.md](docs/BEATSCAPE-MUSIC-WEB.md)
- **另注**：「Scape Music」为工作名，对外前需商标初筛。

### P1-4 三人立绘市场评估
- **性质**：人工判断（非技术项）。
- **风险点**：女性首位（JUNO）的市场接受度。
- **背景**：LoRA 重出已完成并上线（commit `6b97c2e`），锚点 checklist 目验已过。

---

## P2 — 产品增强（可玩性 / 增长）

> 来源：[docs/BEATSCAPE-PLAYABILITY-GROWTH-TODO.md](docs/BEATSCAPE-PLAYABILITY-GROWTH-TODO.md)。**T1a（站点级 OG 卡）与 T2（全模式 Note speed）已确认落地**，不重复列为待办。

| ID | 事项 | 价值 | 状态 |
|---|---|---|---|
| **T5a** | 分享文案加 privacy 卖点（无账号 / 数据留在本机） | ★★ 低成本差异点 | **待做**（约 3 行） |
| **T3** | 判定偏早/偏晚提示 + 结算页误差条 | ★★★ 「能玩」→「能练」 | 待做（跨 4 文件） |
| **T4** | 从失败点重开（挂 `MissReplayPanel`） | ★★ 啃高难度谱的前提 | 待做（跨 5 文件，涉计分完整性） |
| **T1b / T5b** | OG 随路由同步 / 海报复制到剪贴板 | ★ 锦上添花 | 待做（约 20 行） |

---

## P3 — Reddit 首发运营（人工）

> 来源：[docs/TODO.md](docs/TODO.md)（P3/P4 段）。**不继承**：「Stage4 40 首」与「真 180s 流媒体母带」已被 105 首曲库 / 216s 双资产覆盖，属过期项。

- [ ] 发帖素材包 — 见 [docs/BEATSCAPE-REDDIT-LAUNCH.md](docs/BEATSCAPE-REDDIT-LAUNCH.md)
- [ ] 目标 sub 调研
- [ ] 开发者向帖子（可选）
- [ ] 反馈入口（Discord / Discussions）
- [ ] 公网 URL < 3s（需部署后测）
- [ ] 荣誉段位 / 成就
- [ ] PWA + 离线缓存
- [ ] Stage3+ AI 写实封面

---

## P4 — 跨仓 Harness 修复（2026-09-06 审计，本次未执行）

> 来源：[docs/COMPANY-PROJECT-HARNESS-AUDIT-2026-09-06.md](docs/COMPANY-PROJECT-HARNESS-AUDIT-2026-09-06.md) §6。**责任范围在本仓之外**，本文件只登记不认领；建议按「源规则与生成器 → 项目接入 → 受控同步 → 验收」推进，直接批量 `--force` 会传播已有错误。

| # | 待办 | 应修改位置 | 完成条件 |
|---|---|---|---|
| 1 | 修复相对链接转换；给复制/投影管道加链接检查 | Codex project-sync 生成器；HQ Company OS 导出 | 20 条坏链接修复且不复发 |
| 2 | 统一按需读取、写入授权、会话 ID、active-site 规则 | Vault canonical、Codex managed command | 同一行为无相反条款 |
| 3 | 补齐 MeiGen 项目说明/规范副本，恢复产品与单票文档分层 | meigen-replica；landing-tool-a | 无未填写占位；单票 AC 可追溯 |
| 4 | 完成 HQ 规范迁移，再按受控版本同步产品副本 | multica `.ai-company/`、manifest、各 `.delivery/company-os/` | 副本与来源逐项一致、版本可追溯 |
| 5 | 补项目入口与台账映射 | metadata-viewer、VideoSaas、zstock；HQ 与 Vault registry | 乱码/旧链接修复；profile 有续作入口 |
| 6 | 清理重复/过期状态，保持索引只做导航 | 各项目 SESSION/TODO/KB/CODE-INDEX | 旧 TODO 标明迁移；索引不维护易过期状态 |
| 7 | 把文件契约与语义校验接入规范 Doctor | HQ 检查脚本与 Codex projector verifier | 逐项目 PASS/FAIL/SKIP，未核验不计通过 |

---

## P5 — 仓库内部清理

### P5-1 归档过期冲刺清单
- `docs/BEATSCAPE-TODO-ACCEPTANCE.md` 仍有 **27 条未勾选项**，但全部属于 Stage1/Stage2 冲刺（2026-08-25），曲库现已 105/105。
- **风险**：这些条目会被误读为当前待办并回填。
- **动作**：标注为历史冲刺归档，或迁移到对应权威文档后清空勾选态。**本文件不继承其中任何条目。**

### P5-2 整理未提交的工作区改动
- 截至 2026-09-06（本次刷新时实测 `git status`），工作区有并行会话未提交改动：
  - **性能保障相关**：`apps/beatscape/src/audio/earlyAudio.ts`、`decodedAudioCache.*`、`renderLoop.ts`、`router.tsx`、`src/components/playfield/{milestoneTextSprites,visibleNoteEnd}.*`、`scripts/{early-audio,performance-budget,performance,performance-probe,release}*.mjs`、`e2e/early-audio.spec.ts`、`docs/BEATSCAPE-PERFORMANCE.md`（→ 归 P0-6 所有者）
  - **Harness / 派单**：`.agents/skills/company-harness|vault-harness|zbrain-session/`、`.codex/`、`AGENTS.md`、`SESSION.md`、`scripts/agent-delivery/*`（含新增 `review_codex.py`）、`.github/workflows/agent-delivery-dispatch.yml`、`scripts/ai-company/codex-run.py`
  - **其他**：`.delivery/`、`.workbuddy-ai/memory/`
- **动作**：由各改动所有者分别提交；**不要 `git add -A` 一次性扫入**，避免把并行会话的半成品混入。

---

## 验收命令

```bash
# 曲库与内容 QA
pnpm catalog:beatscape
pnpm audit:beatscape
pnpm earcheck:beatscape

# 耳检工作单（人工逐曲听）
python3 scripts/beatscape-earcheck-worksheet.py --all

# 单元 + 集成（pnpm test 仅含 Gateway + Python unit，不含 BeatScape）
pnpm test
bash scripts/harness.sh all

# 发布门禁（在 apps/beatscape 包内，当前应阻止正式发布）
pnpm --filter @musicsaas/beatscape launch:check

# 性能测量与固定预算核验（P0-6，在 apps/beatscape 包内）
npm run performance:measure   # 采集，产物指纹固定
npm run performance:check     # 按固定预算核验，缺证据或超预算即不通过
```

**说明**：`bash scripts/harness.sh all` = unit + workspace build + mock integration。技术检查通过不替代人工耳检、盲测与上线签审。
