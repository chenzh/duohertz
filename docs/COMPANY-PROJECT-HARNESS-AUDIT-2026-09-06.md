# 公司项目文件与 Harness 一致性审计

日期：2026-09-06。性质：本机只读审计；本报告是检查结果与建议待办，不是新的公司规范权威源。

**结论：有共同的规范分层设计，但实际文件、项目接入状态和宿主投影尚未统一。** 主要问题是生成后的断链、旧新行为条款并存、Company OS 副本落后，以及项目文档被单票内容占用。技术栈、研究仓、内容线和 monorepo 的差异应保留。

本次未同步规范、修改其他项目或 Vault、提交、推送、派单或部署。HQ 与部分产品仓已有并行修改，结果以检查时的本地文件为准，不代表远端默认分支已经更新。

## 1. 范围与覆盖

综合三个入口，而非只看 Codex 侧栏：

- 公司调度台账：[project-registry.yaml](/Users/zhenhuachen/Projects/multica/.ai-company/templates/project-registry.yaml)，实际调度源虽然放在 `templates/`，内含 8 条产品／内容线。
- SecondBrain 外接台账：[registry.json](/Users/zhenhuachen/Documents/SecondBrain/10-SYSTEM/HARNESS/registry.json)，9 个根登记项，另含 openworld 子项目；BeatScape 对应 MusicSaas，TickFocus 在 openworld 内，避免重复计仓。
- Codex 已登记工作区与本机目录：补充 zstock；两个 Codex 管理条目指向同一个非 Git 运维目录，去重。

实际核验 **10 个本地 Git 仓**：multica、MusicSaas、metadata-viewer、openworld、zstock、VideoSaas、landing-tool-a、saas-stripe-mvp、json-site、meigen-replica。补查 openworld 的 hermes-mobile、revoice、games/RainSwamp、mew-cue、tickfocus，五者均存在并有 SESSION。

以下登记对象在已检查的本机路径未发现，保持“未核验”：content-youtube-sea、blackbox-android、kuiklyui-mirror、sop_ai_company。未连接远程服务器或内网仓，不能据此宣布全公司全部通过。

另外发现 music-game-sea、hello-cf-smoke、hello-cloudflare、test-dry 等本机 Git 目录未在上述公司调度台账登记；本次只确认存在，不根据名字断言其仍是活跃产品。MusicSaas 的其他 checkout/worktree 不重复算公司产品；第三方工具仓不默认纳入。后续需要在项目台账明确 active / experiment / archived / tool 与是否适用公司交付规范。

## 2. 当前应该认哪一层

| 内容 | 当前来源 | 职责 |
|---|---|---|
| 公司文件布局与交付规范 | [28 规范分层](/Users/zhenhuachen/Projects/multica/.ai-company/docs/28-norm-layers.md)、[29 Harness 布局](/Users/zhenhuachen/Projects/multica/.ai-company/docs/29-harness-layout.md)、[30 文档规范](/Users/zhenhuachen/Projects/multica/.ai-company/docs/30-silicon-valley-doc-standards.md) | 公司通用规则、项目 brief／AC、单票 Issue 分开；产品读取 manifest 指定副本 |
| SecondBrain 外接文件契约 | [repo-contract.md](/Users/zhenhuachen/Documents/SecondBrain/10-SYSTEM/HARNESS/repo-contract.md)、[session-protocol.md](/Users/zhenhuachen/Documents/SecondBrain/10-SYSTEM/HARNESS/session-protocol.md) | `.secondbrain`、项目 SESSION、会话 sessions、worklog 与 profile 扩展 |
| Codex 宿主适配 | [全局 AGENTS](/Users/zhenhuachen/.codex/AGENTS.md)、各仓 AGENTS／override 与 managed skills | 原生会话 ID、按需上下文、当前授权边界、宿主限定的同步行为 |
| 产品技术约束 | 各仓 AGENTS／CLAUDE、PRD、brief、验收命令 | 产品不变量、实际构建测试命令、范围；不应被通用模板覆盖 |

系统／宿主权限与当前用户授权始终约束执行。公司文档中的操作示例不等于本次任务授权。文件名不必处处一样，但每类内容应有清楚且可访问的入口。

## 3. 项目矩阵

| 项目 | 文件与待办入口 | Harness 状态 | 审计判断 |
|---|---|---|---|
| MusicSaas／BeatScape | AGENTS、知识库、代码索引、SESSION、worklog、`.delivery/beatscape/` | SecondBrain + Company OS + Codex skills | 入口较完整；生成区及 skills 共 10 条坏链接；Company OS 副本落后；索引部分产品信息过时 |
| multica（HQ） | AGENTS + CLAUDE + override、知识库、代码索引、SESSION、公司台账与 `.ai-company/` | 公司权威源 + SecondBrain + Codex 适配 | 分层较完整；legacy AGENTS 与 context reference 共 10 条坏链接；旧规范文档与新 Codex 安装说明不同步 |
| landing-tool-a | AGENTS + CLAUDE、`.delivery/landing-tool-a/` brief／AC／backlog | Company OS 交付；无 SecondBrain | 无 SESSION 本身不判缺陷；产品 AC 文件当前仅描述 TICKET-005；副本落后 |
| saas-stripe-mvp | AGENTS + CLAUDE、`.delivery/saas-stripe-mvp/` brief／AC／backlog | Company OS 交付；无 SecondBrain | 基础入口存在；AGENTS 仍是旧流水线措辞；副本落后；支付等项目约束保留 |
| json-site | AGENTS + CLAUDE、`.delivery/json-site/` brief／AC／backlog | Company OS 交付；无 SecondBrain | 基础入口存在；AGENTS 仍是旧流水线措辞；副本落后；静态站 profile 合理 |
| meigen-replica | AGENTS + 未填写 CLAUDE 模板、`.delivery/meigen-replica/` | 已装交付入口，Company OS 指针存在但副本目录缺失 | 活跃调度条目的项目接入不完整；brief 当前仅描述 TICKET-011 |
| metadata-viewer | AGENTS、SESSION、sessions、Vault 快照；产品索引在 `new-games/README.md` | SecondBrain；公司队列 paused | 根 README 乱码；OpenClaw 记忆模板与项目规范混杂；自动 push 条款冲突；旧 TODO 未明确归档 |
| openworld | 根 SESSION 聚合 + 子项目 SESSION；AGENTS + override | SecondBrain + Codex monorepo 适配；公司队列 paused | 子项目分轨合理；根及 TickFocus SESSION 对 active-site 的说明与 override 相反 |
| zstock | README、PRD、CORE-ALGORITHMS、专题 HANDOFF；AGENTS 仅 Multica runtime | 无 SecondBrain／项目 SESSION／通用 Codex 项目入口 | 领域文档存在；普通开发与平台派单的规则适用范围尚未分开，不能只依赖 runtime AGENTS |
| VideoSaas | README 与研究报告、AGENTS、`.secondbrain`、Vault 快照 | 已登记 SecondBrain generic | 研究仓不必强造代码索引／应用构建；但缺外接契约要求的 SESSION，AGENTS 仍是旧预读规则 |

缺少根 `KNOWLEDGE-BASE.md`／`CODE-INDEX.md` 并非一概违规：小仓可用 README 索引，monorepo 可分项目导航。审计关注是否能找到真相源，而不是统一凑齐文件名。

## 4. 优先修复的已证实问题

### F1 — 投影转换保留旧相对路径，产生 20 条坏链接

范围是 MusicSaas 与 multica 的生成入口／skills，并非声称扫描了全公司每个 Markdown：

- [MusicSaas AGENTS:39](/Users/zhenhuachen/Desktop/MusicSaas/AGENTS.md:39)：3 条 `../../` 链接从仓根跳到用户目录。
- [company-harness:8](/Users/zhenhuachen/Desktop/MusicSaas/.agents/skills/company-harness/SKILL.md:8)、[vault-harness:8](/Users/zhenhuachen/Desktop/MusicSaas/.agents/skills/vault-harness/SKILL.md:8)、[zbrain-session:8](/Users/zhenhuachen/Desktop/MusicSaas/.agents/skills/zbrain-session/SKILL.md:8)：共 7 条，搬入 `.agents/skills/<name>/` 后仍按原 `.cursor/rules/` 深度解析。
- [multica AGENTS:124](/Users/zhenhuachen/Projects/multica/AGENTS.md:124)：5 条；[context reference:16](/Users/zhenhuachen/Projects/multica/.agents/skills/multica-project-context/references/cursor-rules/code-index.md:16)：同类 5 条。

根因在 [project-sync.mjs:1688](/Users/zhenhuachen/Documents/Codex/cursor-codex-sync/project-sync.mjs:1688) 等转换入口直接传入原正文；同文件 635、729 行也直接拼接原规则。验证部分从 2556 行起检查结构、标记等，未检查迁移后链接可达性。应在生成器修复路径转换并验收，避免手工修产物后下次同步复发。

Company OS 复制管道也有跨仓链接依赖：例如 [产品副本 30 文档规范:5](/Users/zhenhuachen/Desktop/MusicSaas/.delivery/company-os/docs/30-silicon-valley-doc-standards.md:5) 指向总部 `apps/docs/...` 的链接在产品仓不可达；同文档还指向未下发的 manifest。上述 20 条不包括这类副本链接问题。

### F2 — 行为与会话规范存在相反条款

- [Vault global:35](/Users/zhenhuachen/Documents/SecondBrain/10-SYSTEM/HARNESS/global.md:35) 要求收工 `git push`，同文件 [65 行](/Users/zhenhuachen/Documents/SecondBrain/10-SYSTEM/HARNESS/global.md:65) 又禁止未经要求的 commit／push。矛盾已进入多个仓的 `docs/VAULT-HARNESS.md`。
- [metadata-viewer AGENTS:189](/Users/zhenhuachen/Projects/metadata-viewer/AGENTS.md:189) 将 `Commit and push your own changes` 列为自主动作；该仓没有 override 隔离旧模板。
- [Codex 全局 AGENTS:9](/Users/zhenhuachen/.codex/AGENTS.md:9) 按需读取；[second-brain SKILL:42](/Users/zhenhuachen/.agents/skills/second-brain/SKILL.md:42) 仍写指针存在即全链预读，18 行写 Vault 写入需授权，67 行附近又保留默认静默沉淀。
- [zbrain-continue Codex reference:19](/Users/zhenhuachen/.agents/skills/zbrain-continue/references/codex-commands/zbrain-continue.md:19) 仍按 Cursor transcript 解析会话；[Codex 全局 AGENTS:28](/Users/zhenhuachen/.codex/AGENTS.md:28) 则优先 `CODEX_THREAD_ID`。
- [openworld SESSION:42](/Users/zhenhuachen/Projects/openworld/SESSION.md:42)、[TickFocus SESSION:3](/Users/zhenhuachen/Projects/openworld/tickfocus/SESSION.md:3) 提示读 active-site；[openworld override:6](/Users/zhenhuachen/Projects/openworld/AGENTS.override.md:6) 明确禁止依它猜项目。

MusicSaas 的当前 AGENTS、multica／openworld 的 override 已明确限制旧规则，降低当前 Codex 执行影响。不能把每段历史规则都直接认作当前动作授权，但源文档和其他宿主仍需统一。

### F3 — Company OS 副本版本与接入覆盖未闭环

按 [24 项 manifest](/Users/zhenhuachen/Projects/multica/.ai-company/config/company-os-sync-manifest.yaml) 逐文件比较：

| 产品仓 | 副本标记 | 与 HQ 当前文件相比 |
|---|---|---|
| MusicSaas | `97718c9` · `2026-08-29T01:35:47Z` | 12 项相同、11 项不同、缺 1 项 |
| landing-tool-a | 同上 | 同上 |
| saas-stripe-mvp | 同上 | 同上 |
| json-site | 同上 | 同上 |
| meigen-replica | 只有 COMPANY-OS 指针 | 副本目录不存在 |

缺项为 `docs/31-harness-learnings-routing.md`。不同的 11 项为 HANDS-OFF、docs/02、17、19、23、24、27、28、29，以及 employee-autopilot、onboard-new-project 两份 runbook。

同样比较 HQ 已提交 HEAD `5a84c192c`，仍得到 11 项不同、1 项缺失，因而不只是本轮未提交修改造成。HQ 的 HANDS-OFF、docs/19、onboard runbook 另有未提交变化，不能把工作区全文直接视为已发布规范版本。

metadata-viewer／openworld 的公司队列明确 paused，暂无 Company OS 副本可列为接入待办，不能写成正在运行的派单失败。VideoSaas／zstock 未在公司调度台账中，先明确适用 profile。

### F4 — 项目层文件被任务层内容占用

- [meigen-replica CLAUDE:1](/Users/zhenhuachen/Projects/meigen-replica/CLAUDE.md:1) 仍为 `<project-name>`、`<registry-id>`、`<slug>`，栈为空，测试命令还是示例；AGENTS 明确让开发者读它，因而不是无害的备用模板。
- [MeiGen brief:1](/Users/zhenhuachen/Projects/meigen-replica/.delivery/meigen-replica/brief.md:1) 只描述 TICKET-011 的视觉／locale CI 修复，不能完整承担产品范围定义。
- [landing-tool-a CLAUDE:39](/Users/zhenhuachen/Projects/landing-tool-a/CLAUDE.md:39) 将项目 accept_cases 作为产品真相，但 [accept_cases:1](/Users/zhenhuachen/Projects/landing-tool-a/.delivery/landing-tool-a/accept_cases.md:1) 当前仅 TICKET-005 favicon／manifest。

公司 [28 规范分层:12](/Users/zhenhuachen/Projects/multica/.ai-company/docs/28-norm-layers.md:12) 已区分项目与单票。修复时应恢复稳定的产品 brief／DoD，将单票 AC 留在 Issue 或可链接的任务文档中；不凭空丢弃现有验收记录。

### F5 — 文件入口和台账存在可见缺口

- [metadata-viewer README:3](/Users/zhenhuachen/Projects/metadata-viewer/README.md:3) 为实际 UTF-8 乱码，SESSION 链接语法也受损；[AGENTS:228](/Users/zhenhuachen/Projects/metadata-viewer/AGENTS.md:228) 保留 Windows 旧工作路径。旧 [TODO:48](/Users/zhenhuachen/Projects/metadata-viewer/TODO.md:48) 仍含会话待办且未标明迁移／归档。
- [zstock AGENTS:1](/Users/zhenhuachen/Projects/zstock/AGENTS.md:1) 全篇为 Multica runtime，没有普通项目开发入口；专题 PRD／算法文档质量不应因此否定。
- [VideoSaas README:3](/Users/zhenhuachen/Desktop/VideoSaas/README.md:3) 说明它是研究仓；但已登记外接，缺 [Repo Contract](/Users/zhenhuachen/Documents/SecondBrain/10-SYSTEM/HARNESS/repo-contract.md) 要求的项目 SESSION，也没有登记 sessionOptional 例外。
- [MusicSaas CODE-INDEX:85](/Users/zhenhuachen/Desktop/MusicSaas/docs/CODE-INDEX.md:85) 仍写 85 首，[知识库:10](/Users/zhenhuachen/Desktop/MusicSaas/docs/KNOWLEDGE-BASE.md:10) 产品图未覆盖 ScapeMusic，当前 SESSION 已写 105 首及 ScapeMusic 工作。索引应链接当前状态，减少重复维护数字。

三份台账职责不同可以保留，但必须共享稳定的项目 ID／repo 映射并明确适用 profile。Vault 多项 path 仍是 Windows／Linux 路径，不能用这些字段直接宣布 Mac 全仓覆盖；现有 Tier-0 检查脚本 [167 行](/Users/zhenhuachen/Projects/multica/scripts/ai-company/verify-harness-tier0.sh:167) 仅按 registry.path 是否存在筛选，会漏掉未被其他入口补上的本机 checkout。

### F6 — 同步与验收工具尚未覆盖这些缺陷

正向证据：实际重新计算 SHA-256，112 个 managed Skill 文件、35 条 command source／projected 记录、28 个 canonical 来源均匹配；五仓最新 apply 的 63 个目标文件无目标 hash 漂移，multica／openworld 的 10 个 reference 来源 hash 也匹配。来源见 [secondbrain-sync state](/Users/zhenhuachen/.codex/secondbrain-sync/state.json) 与 [项目同步输出](/Users/zhenhuachen/Documents/Codex/cursor-codex-sync/outputs/project-sync)。这是“生成结果可追溯”，不代表“规范内容正确”。

- [verify-harness-tier0.sh:55](/Users/zhenhuachen/Projects/multica/scripts/ai-company/verify-harness-tier0.sh:55) 主要验 `.cursor/rules` 文件存在，未检查原生 Codex 入口、模板占位、链接、任务层级与语义冲突。
- [27 规范同步:15](/Users/zhenhuachen/Projects/multica/.ai-company/docs/27-norm-sync.md:15) 仍以 Cursor 规则／agents 为主，而 [当前安装说明:16](/Users/zhenhuachen/Projects/multica/.ai-company/harness/README.md:16) 已迁到 Codex supervisor／reviewer。后者有未提交变化，属于迁移未收尾。
- [SaaS AGENTS:16](/Users/zhenhuachen/Projects/saas-stripe-mvp/AGENTS.md:16)、[json-site AGENTS:16](/Users/zhenhuachen/Projects/json-site/AGENTS.md:16) 仍把 `.cursor/agents/` 称作流水线；两仓 `.delivery/README.md` 已是新 Codex 说明。landing-tool-a／MeiGen 则已在根 AGENTS 限定旧角色文件仅供参考。这是入口迁移不齐，不能据此断言实际派单仍使用 Cursor。
- [sync-company-norms.sh:204](/Users/zhenhuachen/Projects/multica/scripts/ai-company/sync-company-norms.sh:204) 每次全文重写 COMPANY-OS.md，会覆盖 [MusicSaas pointer:11](/Users/zhenhuachen/Desktop/MusicSaas/.delivery/COMPANY-OS.md:11) 的项目适配链接与说明。根 AGENTS 仍可约束执行，但该入口的项目信息会丢失，需区分生成段与手写段。
- canonical [zbrain-kickoff:24](/Users/zhenhuachen/Documents/SecondBrain/10-SYSTEM/HARNESS/projection/commands/zbrain-kickoff.md:24) 与 [Vault Cursor mirror](/Users/zhenhuachen/Documents/SecondBrain/.cursor/commands/zbrain-kickoff.md) 有一处真实语义差异：后者缺“用户要求先探索”的例外及 L1／L2／L3 分级。其余已核对差异主要为编码／路径渲染，不能全部视为冲突。

## 5. 建议统一的最小文件协议

这是建议方案，尚未发布为公司规范。沿用既有 Company OS／Vault 权威，避免再建一套规范副本。

| 层级 | 统一职责 | 允许的项目差异 |
|---|---|---|
| 所有活跃项目 | README 作为人类入口；AGENTS 作为 Agent 入口；实际命令、适用规则和权威文档可找到 | 技术正文可继续放 CLAUDE、PRD、README；不强制复制正文 |
| 任务状态 | 每种状态只在一个位置维护，其他文件链接过去 | 项目战略 SESSION、当前会话 sessions、单票 Issue、待投 backlog 分工；不让四者重复维护同一票状态 |
| SecondBrain profile | `.secondbrain` + 项目 SESSION + worklog + 宿主适配声明 | monorepo 可子项目 SESSION，研究仓可轻量 SESSION；不用强制增加应用代码索引 |
| 公司队列 profile | `.delivery/<slug>/brief.md`、产品 accept_cases、backlog→Issue、Company OS 副本 | 未接 SecondBrain 的卫星仓可不设 SESSION；内容线使用独立发布门禁 |
| 大仓导航 | 有统一文档索引与代码定位入口 | 可为 KB／CODE-INDEX，也可为清晰的 README／子项目索引 |
| Harness 投影 | 来源、版本／hash、适用 host、生成／手写边界、按需读取、授权与会话路由 | profile 与项目补充只覆盖其所属职责；生成器保持链接可达 |
| 规范验收 | 路径存在、链接、模板占位、manifest 完整性、hash、语义冲突、项目适配保留 | 只跑规范检查；无需为纯文档一致性启动所有应用或部署 |

## 6. 修复 TODO（本次未执行）

| 顺序 | 待办 | 应修改的权威位置／责任范围 | 可验证完成条件 |
|---|---|---|---|
| 1 | 修复相对链接转换；给两条复制／投影管道加链接检查 | Codex project-sync 生成器；HQ Company OS 导出逻辑 | 20 条已证实坏链接修复；HQ-only 链接在产品副本有有效目标；重生成不复发 |
| 2 | 统一按需读取、写入授权、会话 ID、active-site 规则 | Vault canonical、Codex managed command 转换、项目适配 | 同一行为没有相反条款；Codex 用 native ID；历史规则有明确适用范围 |
| 3 | 补齐 MeiGen 项目说明／规范副本，恢复产品与单票文档分层 | meigen-replica；landing-tool-a | 无未填写项目占位；项目 brief／DoD 独立完整；每张票仍能找到原 AC |
| 4 | 完成 HQ 规范迁移，再按受控版本同步产品副本 | multica `.ai-company/`、manifest、各产品 `.delivery/company-os/` | 副本与指定来源逐项一致；版本可追溯；Company OS pointer 与项目适配不被覆盖 |
| 5 | 补项目入口与台账映射 | metadata-viewer、VideoSaas、zstock；HQ 与 Vault registry | 乱码／旧链接修复；各 profile 有明确续作入口；未登记目录和远程对象明确状态 |
| 6 | 清理重复／过期状态，保持索引只做导航 | 各项目 SESSION／TODO／KB／CODE-INDEX | 旧 TODO 标明迁移；项目／会话／Issue 分工清楚；索引不维护易过期的重复状态 |
| 7 | 把文件契约与语义校验接入规范 Doctor | HQ 检查脚本与 Codex projector verifier | 报告逐项目 PASS／FAIL／SKIP；覆盖 Codex 入口、模板、路径、manifest 与适配保留；未核验对象不计通过 |

建议按“源规则与生成器 → 项目接入 → 受控同步 → 验收”推进。直接批量 `--force` 只会传播已有错误，并可能覆盖项目适配。

## 7. 本次验证与限制

执行了本机目录／Git 根检查、核心入口与相关子项目文档读取、本地链接路径检查、manifest 逐文件比较、HQ HEAD 对比及上述 SHA-256 检查。未运行应用测试：本次没有业务代码变化。报告完成后仅验证新增报告链接与本任务文档 diff。

未核验远程主机、网页链接内容、每个 Markdown 锚点、全仓任意文件、云端默认分支、实际派单运行、真实人工发布门禁。现有检查脚本的能力结论来自源码审阅，没有运行会带来同步或派单副作用的流程。
