# Acceptance Cases — Issue #28 Play 页 SEO 回归测试

## Verification commands

```bash
pnpm --filter @musicsaas/beatscape test
```

## Functional

- [x] AC-B1: 改动仅落在 `apps/beatscape/**` 与 `.delivery/issue-28/**`
- [x] AC-B2: `pnpm --filter @musicsaas/beatscape test` exit 0（含 `pageMeta.test.ts`）
- [x] AC-B3: `buildPlayPageMeta` 无 `seo` block 时 title / tier·mode / BPM·genre fallback / tagline 均有断言
- [x] AC-B4: 未修改判定窗 15/30/50（`apps/beatscape/src/engine/`）
- [x] AC-I28-1: 显式 `seo: undefined` 与无 `seo` 属性行为一致

## Evidence

| Command | Exit code | UTC |
|---------|-----------|-----|
| `pnpm --filter @musicsaas/beatscape test` | 0 | 2026-08-28T22:51:33Z |

## Max iterations

If verification still fails after **3** fix loops → mark **BLOCKED** and output `NEED_CLARIFY` or list blockers.
