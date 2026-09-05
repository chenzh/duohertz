---
name: music-delivery
description: 执行 MusicSaas 的 agent-safe Issue 或 .delivery 交付任务，整理验收证据与交付结果；普通开发不默认启动公司队列流程。
---

# MusicSaas Issue 交付

仓库级约定见 [AGENTS.md](../../../AGENTS.md)。仅对已分配的 Issue 或用户指定的交付任务使用本流程；模板本身不构成发消息、提交、推送或合并授权。

## 确定范围

读当前任务、[CLAUDE.md](../../../CLAUDE.md) 的队列边界及对应 `.delivery/<slug>/brief.md` / `accept_cases.md`；BeatScape slug 为 `beatscape`。只在分类、门禁或完成标准需要时查看 `.delivery/company-os/docs/06-task-grading.md`、`07-quality-gates.md`、`18-definition-of-done.md` 的相关章节，不加载整套公司手册。

用户当前明确要求优先于旧模板；工具权限与真实发布验收不变。常规实现细节自主判断；影响验收的需求缺口具体说明，继续独立工作。未经授权的队列任务不得因使用本 skill 越过 agent-safe 边界。

## 执行与验证

- 明确可观察的验收结果；复杂任务在对应交付目录维护简短计划，小任务直接实现。不要求另建重复计划或把所有角色依次运行。
- 独立检索/审查/不同文件的实现有收益时并行委派，明确文件归属与输出；依赖步骤按结果串联。使用当前宿主实际可用的协作工具，无协作工具时本地完成。
- 角色按需参考 `.cursor/agents/`；这些是 Cursor 角色文件，不能假定 Codex 自动注册它们。默认继承主任务模型与推理设置。
- 按 [music-verify](../music-verify/SKILL.md) 和当前任务 AC 验证；同一状态的检查结果可复用。失败定位到具体步骤；只有同一阻塞反复出现且没有新证据可推进时，交付该阻塞与需要的输入。

## 交付

交付变更摘要、逐项 AC 证据、遗留风险。已授权提交/PR 才执行对应操作，PR 内容先在本地准备。对外评论/通知需要明确授权；无授权时将状态记录在本地。

自动合并资格以 [.delivery/config/merge-policy.json](../../../.delivery/config/merge-policy.json) 和 `.github/workflows/agent-delivery-gate.yml` 的实际校验为准；allow 匹配不等于所有任务必须落在 allow 内，也不单独构成合并授权。不得规避 deny、审批或 required checks。CI 通过不代替人工耳检、真机体验和正式发布签审。

仅在被授权更新队列状态时使用现有状态码；需要查询编码见 `.delivery/company-os/docs/21-label-state-machine.md`。更新项目/会话记录遵循 AGENTS 的收工约定。
