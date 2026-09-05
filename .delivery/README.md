# MusicSaas 交付入口

本目录保存 BeatScape 的任务范围、验收和队列集成。仓库通用规则见 [AGENTS.md](../AGENTS.md)；当前用户的明确指令优先于旧任务文档。普通本地任务不自动进入无人值守队列。

## 按需工作流

| 需要 | 入口 |
|------|------|
| 实现一张 Issue / 多步骤交付 | [music-delivery](../.agents/skills/music-delivery/SKILL.md) |
| 选择验证范围、记录证据 | [music-verify](../.agents/skills/music-verify/SKILL.md) |
| BeatScape 队列范围与最低验收 | [brief](beatscape/brief.md) · [accept_cases](beatscape/accept_cases.md) |
| 新任务资料 | [_template](./_template/)；已有 Issue AC 足够时无需复制整套模板 |
| 手动 kickoff / 派单 prompt | [orchestrator-kickoff](prompts/orchestrator-kickoff.md) |
| 按需委派的角色说明 | [.cursor/agents](../.cursor/agents/) |
| 公司规范与同步边界 | [COMPANY-OS](COMPANY-OS.md) |
| 正式发布与人工签审 | [发布准备](../docs/BEATSCAPE-RELEASE-READINESS.md) |

角色文件保留 Cursor 集成格式；其他执行器可按需读取角色说明，通过当前可用工具委派。模型默认继承主任务，任务工具和模型名称由运行环境提供。

## 无人值守队列

进入队列前按 [任务分级](company-os/docs/06-task-grading.md) 检查范围和 AC；`agent-safe` 是准入条件。实现、验证与审查各有明确责任，独立工作可以并行，依赖步骤依次执行。

完成证据包括当前变更的验收结果及 PR CI；进程退出 0 不代表交付完成。合并还需符合 [merge-policy.json](config/merge-policy.json) 与实际 required checks。策略未允许自动合并的变更交给人工处理，不扩大 allowlist 或跳过检查。

合并 workflow 额外要求仓库变量 `AGENT_DELIVERY_AUTO_MERGE=true`；未设置时只评估，不执行合并。修改本地规则不会设置这个远端开关。

现有自动化的启用、派单、评论通知、commit/push、PR、merge 和发布都要有相应授权；本页命令说明不构成执行授权。沿用当前任务已经给出的授权，无需重复询问。

## 操作入口

脚本使用 Cursor Cloud API 或已登录的 `cursor-agent`；这是现有执行器集成，不改变当前 Codex 任务的模型配置。详细参数见 [scripts/agent-delivery](../scripts/agent-delivery/README.md)。

前置：`gh` 已认证、`jq` / `curl` 可用；Cloud 路径配置 `CURSOR_API_KEY`，本地 CLI 路径使用会话登录。GitHub 设置中配置队列标签、required checks 和所需 Secrets，密钥不写入仓库。

```bash
# 生成可检查的 prompt；先准备 gh issue view --json title,body,url,number 的 JSON
bash scripts/agent-delivery/build-prompt.sh /tmp/issue.json

# 已授权派单时，123 为 Issue 编号
bash scripts/agent-delivery/dispatch-cursor-agent.sh 123

# 查询 PR 456 的自动合并资格
bash scripts/agent-delivery/check-merge-eligible.sh 456
```

GitHub 集成入口：[派单 workflow](../.github/workflows/agent-delivery-dispatch.yml)、[合并门禁](../.github/workflows/agent-delivery-gate.yml)、[Issue 模板](../.github/ISSUE_TEMPLATE/agent_safe_task.yml)。以当前文件和仓库设置为准；修改文档不会启用 schedule、Secrets 或通知。

## 同步维护

`.delivery/company-os/` 是上游只读快照，项目差异保留在本仓指南、skills 和脚本。同步前查看 [COMPANY-OS](COMPANY-OS.md)；上游 `install-harness.sh --force` 可能覆盖本地角色与 kickoff，先审查 diff 并保留本仓适配，不自动执行同步。
