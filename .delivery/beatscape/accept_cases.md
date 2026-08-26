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

## Evidence

| Command | Exit code | UTC |
|---------|-----------|-----|
| | | |

## CEO sign-off

- [ ] 已勾选或抽检 CI
