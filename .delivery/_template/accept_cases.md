# Acceptance cases

<!-- 只保留本任务适用项，补成可观察、可验证的 AC；不要把模板空项当成验收失败。已有 Issue AC 足够时无需复制本文件。 -->

## Functional

- [ ] <!-- 正常路径：触发条件 → 预期行为 → 证据 -->

## Error / edge

- [ ] <!-- 本次改动影响的边界或错误路径 -->

## Verification commands

按 [music-verify](../../.agents/skills/music-verify/SKILL.md) 选择当前仓库实际命令，任务明确要求的检查仍须通过。以下是 BeatScape 代码任务示例；填写时删除不适用项，补充本任务检查。

- [ ] `pnpm --filter @musicsaas/beatscape test` → exit 0
- [ ] `pnpm build:beatscape` → exit 0（含类型检查）

## UI / reference checks（适用时）

<!-- 仅用户要求参考站/复刻交付时填写 competitor_inventory.md、wont_do.md，并对应其页面、组件和交互。普通任务不要求这些文件。 -->

- [ ] <!-- 受影响页面的交互与目标视口检查，附可查看证据 -->
- [ ] <!-- 若任务要求截图对比：填写已存在或本任务实现的具体命令及基线 -->

## Evidence

| AC / command | Result / exit code | Revision or diff / evidence |
|--------------|--------------------|-----------------------------|
| | | |

未运行、环境缺失和人工未验收项须分别说明，不能记为通过。失败先定位和修复；仅当相关工作无法继续时按需使用 [blocked 模板](../_template/blocked.md) 记录阻塞及下一步。
