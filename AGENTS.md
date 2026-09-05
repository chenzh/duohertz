# MusicSaas — Agent 指南

音乐生成 API + BeatScape + ScapeMusic；pnpm workspace，Node >=22。
中文沟通，代码英文，UI 按产品 locale；交付说明结果、验证与阻塞。

## 开始与续作

- 首次确认 `.secondbrain`，读 [知识库](docs/KNOWLEDGE-BASE.md)、[代码索引](docs/CODE-INDEX.md) 定位模块及 [SESSION](SESSION.md) 的 `phase/next/blockers`；后续只补读任务相关且变化的内容。
- “继续”沿用当前会话；可靠 ID 对应的 `sessions/<chat-id>.md` 存在时使用，否则沿用对话。仅在用户推进项目时执行项目 SESSION 待办，勿借用其他会话 ID。
- [Vault 快照](docs/VAULT-HARNESS.md) 与 `.delivery/company-os/` 按需参考；历史自动 push、全量预读条款不覆盖本指南。同步后审查 diff，保留本仓适配。

## 执行

- 在已授权范围内完成实现与验证，常规可逆选择自行判断，不重复确认；缺少关键需求时继续不依赖答案的工作。
- 用户当前明确要求优先于旧指南和 skill 建议，系统/工具权限仍生效。agent-safe 规则只约束队列任务；用户明确要求的仓库维护按本任务范围执行。
- 规则导致暂停时指出文件、原句和具体冲突；缺少可选工具或外部知识库时用仓内资料继续。
- 先看工作区 diff，保留用户/其他 agent 改动；只改任务相关文件，复用周边约定。
- 独立检索、审查或不同文件实现有收益时并行委派，明确文件归属、验收和结果；主 agent 集成。无需固定五角色流水线，模型与推理档位默认继承当前任务。

## 项目不变量

- Gateway `apps/gateway/` 用 Hono + Prisma；推理走 `workers/`，不内嵌 PyTorch。
- BeatScape 先读 `docs/PRD-BEATSCAPE.md` 相关章节，实现细节见 `apps/beatscape/PRD.md`；判定 **15/30/50 ms**，勿混入 NeonBeat 常量。
- 角色/LoRA 任务先读 `docs/BEATSCAPE-WORLDBIBLE.md`、`docs/BEATSCAPE-CHARACTER-LORA.md`；当前 NIGHTSHIFT 三人组，Animagine XL **4.0**，rank **8** / **8 epoch** / lr **5e-5**；权重转换与加载按 runbook。

## 验证与交付

- 按 [music-verify](.agents/skills/music-verify/SKILL.md) 选择相关验收，完成任务 AC、必需 CI 和发布门禁；仅在新改动、失败或未解决风险需要时扩测/重跑。
- `pnpm test` 仅 Gateway + Python unit，**不含 BeatScape**；`bash scripts/harness.sh all` 为 unit + workspace build + mock integration。
- agent-safe Issue 按需使用 [music-delivery](.agents/skills/music-delivery/SKILL.md)；普通开发不预读公司手册。
- 不提交 `.env`、密钥、token；未经要求不 commit/push。部署、合并、外部消息须有对应授权；技术检查不替代人工耳检、真机验收或上线签审。
- 有实质推进时更新 `SESSION.md` 的 `updated` 和本任务相关 `next`，追加 `worklog/YYYY-MM-DD.md`“已完成”；保留其他工作线。已有会话文件只更新本会话。里程碑可用现有工具沉淀第二大脑，工具不可用则本地记录。
