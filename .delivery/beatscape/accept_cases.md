# Acceptance Cases — beatscape

## Verification commands（Verifier 最低栏）

```bash
pnpm --filter @musicsaas/beatscape test
pnpm build:beatscape
```

**全量（PR 前，env 允许时）：**

```bash
pnpm test
python3 scripts/beatscape-audit.py --dir apps/beatscape/public --catalog apps/beatscape/public/catalog.json
```

## Functional（按 ticket 勾选）

- [ ] AC-B1: 改动仅落在 `apps/beatscape/**`（或 ticket 允许路径）
- [ ] AC-B2: `pnpm --filter @musicsaas/beatscape test` exit 0
- [ ] AC-B3: `pnpm build:beatscape` exit 0
- [ ] AC-B4: 未修改判定窗 15/30/50（`apps/beatscape/src/engine/`）除非 ticket 允许

### TICKET-B04（Issue #11）

- [ ] B04-1: Leaderboard 空列表文案来自 `apps/beatscape/src/i18n/`（非硬编码 JSX 字符串）
- [ ] B04-2: 默认 locale 为 `en`；`zh` locale 文件存在且含 `leaderboard.emptyState` 占位
- [ ] B04-3: 空状态元素带 `role="status"` 便于读屏

## Evidence

| Command | Exit code | UTC |
|---------|-----------|-----|
| | | |

## CEO sign-off

- [ ] 已勾选或抽检 CI
