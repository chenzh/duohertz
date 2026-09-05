# MusicSaas Agent / Skills / Workflow 审计

核查日期：2026-09-05。目标模型：GPT-6 Astra。范围：仓库指令入口、Cursor 规则与角色、交付模板/脚本、GitHub Actions；保留当前工作区已有产品改动。

## 官方依据与本仓取舍

GPT-6 Astra 官方指导明确建议审计可能影响行为的 skills / AGENTS 指令，消除冲突、在既有授权内持续完成工作、明确并行协作时机，并按变更规模验证。本次采用这些原则，保留产品不变量和实际验收门禁。[GPT-6 Astra 模型指导](https://developers.openai.com/api/docs/guides/latest-model)

Codex 按目录层级加载 AGENTS；因此根文件保留项目约定与导航，专项流程移出常驻上下文，不靠增大指令上限解决重复内容。[AGENTS.md 官方说明](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

Skills 的名称/描述用于选择，正文按需加载；官方仓库级路径为 `.agents/skills/<name>/SKILL.md`。本仓原先没有自有 SKILL.md，本次新增两个职责明确的入口，没有复制系统或个人插件技能。[Skills 官方说明](https://learn.chatgpt.com/docs/build-skills)

Codex 原生自定义角色与 Cursor Markdown 角色的注册格式不同。本次保留 `.cursor/agents/` 兼容现有 Cursor 交付脚本，Codex 使用宿主实际可用的协作工具；不声称角色文件会自动注册。模型/推理档位继承当前任务，不为所有子任务强制最高档。[Subagents 官方说明](https://learn.chatgpt.com/docs/agent-configuration/subagents)

## 发现与处理

| 发现 | 处理 |
|------|------|
| 四份 `alwaysApply` 同时要求预读索引、Vault、公司规范与会话协议 | 仅保留一个常驻入口；其余按任务/文件触发，已读且未变的内容不重读 |
| Vault 快照同时写收工 push 和禁止未经要求 push | 根指南明确当前授权边界，历史快照不能自动触发 push；保留只读上游内容 |
| 公司规则被应用到所有开发，且声称文件可覆盖当前用户要求 | agent-safe 限于该队列；当前任务授权和纠正优先于旧模板，宿主权限仍有效 |
| 角色混入 Go、React Query、Zustand 与不存在的 `make check` | 改用 MusicSaas 实际架构和命令；保留 `model: inherit` |
| 固定五阶段、Planner 只读却要求写文件、任意歧义立即停工 | 按需委派与文件归属；Planner 返回计划由主任务按需保存；继续不依赖缺失答案的工作 |
| AGENTS 仍把已退役的七角色当现状 | 入口指向 NIGHTSHIFT 三人组与 LoRA runbook；保留 Animagine XL 4.0、rank 8 / 8 epoch / lr 5e-5 |
| `pnpm test` 被当成前端或全仓验收 | 新验证技能明确 Gateway/Python 与三个前端的范围；发布候选、人工签审另行核验 |
| API gate 在 checkout 前用 `hashFiles`，有契约也会跳过 | checkout 后检测当前/基线契约，覆盖新增与删除情形；比较实际文件 |
| CI 的 build、BeatScape、integration 无必要地等待 unit | 四个既有 job 并行，保留名称和检查内容；删除重复全局 pip 安装，保留 harness venv 安装 |
| 合并 gate 等待本仓不存在的检查名；glob 空前缀使策略失效，labels 未验证 | 使用实际四个 CI job；完整路径匹配、deny 优先、标签/审批/文件分页/rename/HEAD 复核 |
| PR 自身脚本可在持写令牌时参与资格判断 | 从 base checkout 执行资格脚本与策略，复核同一提交；不执行 PR 版本策略 |
| 修复失效合并规则可能意外激活自动合并 | 保留原 merge-policy，并要求 `AGENT_DELIVERY_AUTO_MERGE=true` 才进入写操作；本次不设置远端变量 |
| 手动派单输入和本地脚本残留跨仓模板 | 验证编号、显式绑定仓库、输入通过 env 传给 shell；用 fixture 检查，避免真实派单 |
| 已完成/人工任务仍能入队；CLI exit 0 就标记交付完成 | 队列排除 done/human-only/assisted；CLI 保持 running 待 PR/CI/验收证据核验 |

Workflow 实现核对了 [GitHub contexts](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)、[workflow 语法](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) 和 [脚本输入处理](https://docs.github.com/en/actions/concepts/security/script-injections)。合并绑定提交的参数来自 [gh pr merge](https://cli.github.com/manual/gh_pr_merge)；API 对比参数核对了 [oasdiff action 定义](https://raw.githubusercontent.com/oasdiff/oasdiff-action/v0/breaking/action.yml)。

## 当前工作流

- 普通任务：根 AGENTS → 相关模块资料 → 实现 → [music-verify](../.agents/skills/music-verify/SKILL.md) 对应检查 → 记录结果。
- Issue 交付：按需使用 [music-delivery](../.agents/skills/music-delivery/SKILL.md)，沿用任务 AC；审查与独立实现可并行，相关依赖顺序执行。
- 规则维护：先读对应文件与调用者，再修改；新增 skill 先明确触发范围。上游同步后审查 diff，防止重新引入模板默认值。
- 正式发布：现有 launch 签审不变；技术 PASS 不等于耳检、真机体验或发布获批。

## 验证与效果记录

| 检查 | 实际结果 |
|------|----------|
| skill-creator 的 `quick_validate.py` 分别检查两个新 skill | 两项均 valid |
| 26 个指令/模板/参考文件相对链接与相关 frontmatter | 通过；保留 Issue 字段 id、必填与 agent-safe 标签契约 |
| 6 份 workflow YAML 解析与内嵌 shell 语法；3 份改动 shell 的 `bash -n` | 通过；四个 CI job ID 保持不变 |
| `tests/.venv/bin/python -m pytest tests/unit/test_agent_delivery.py tests/unit/test_agent_dispatch.py -q` | 最终 **51 passed**；真实 shell + gh/curl/cursor 本地替身，无远端副作用 |
| `pnpm test`（使用本机已安装的锁定 pnpm 9.15.0） | Gateway **6** + Python **52** 通过；发生于最后 7 个队列/CLI 案例新增前，后续变更已由上述 51 项相关回归覆盖 |
| `git diff --check` 与独立审查 | 通过；发现的跨仓派单、失效链接均修复后复核 |

本机默认 pnpm 的在线版本切换遇到 registry signature/代理限制，改用已有 9.15.0 完成验证，未修改全局配置或项目锁文件。诊断缓存已移至 `/tmp`。未运行真实 GitHub Actions；仓库当前无 `api/openapi.yaml`，因此 vacuum/oasdiff 部分只完成静态语义核验。

独立只读演练的四个场景均符合新规则：文档修复只做相关检查；交互 bug 完成 ticket test/build 与浏览器验收；用户明确 CI 维护不被无人队列规则误拦；“继续”保持当前任务且不执行 SESSION 的无关 P0。这是规则行为推演，不是模型 A/B 性能基准。

衡量口径：常驻内容仅统计 root AGENTS + `alwaysApply: true` 的 Cursor 规则 UTF-8 字节，**5,263 → 3,351（减少 36.3%）**，常驻规则 **4 → 1**；排除宿主系统指令、个人技能列表和按需参考资料。字节减少只表示这部分上下文精简，不等于实际 token、延迟或成功率提升。

## 边界与后续

- 未修改个人/系统技能、全局模型设置或外部 SecondBrain / multica 真相源；只读快照保持来源可追溯。未来同步应保留本次本仓适配，通用修复可另行回传上游。
- 未将 Cursor Cloud/CLI 执行器迁移为 OpenAI API。当前 Codex Astra 任务沿用宿主模型；现有 Cursor 云派单能用哪些模型由其执行环境决定。
- 未 commit、push、派单、评论、部署或修改 GitHub 分支保护。远端 required checks/Secrets/变量需以仓库实际设置为准，本地无法证明线上 workflow 运行结果。
- 新增/编辑 skill 若未出现在宿主选择器，按官方技能文档重新载入；不要通过复制到多个目录制造重名技能。
- 后续实测可固定提交与代表性任务，比较完成率、无谓确认次数、工具调用数、总耗时和实际用量。先保持当前推理档位，再根据证据调整，不把所有任务无条件升到最高档。
