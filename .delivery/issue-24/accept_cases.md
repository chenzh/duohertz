# Acceptance Cases — Issue #24 404 页

## Verification commands

```bash
pnpm --filter @musicsaas/beatscape build
pnpm --filter @musicsaas/beatscape test
```

## Functional

- [x] AC-B1: 改动仅落在 `apps/beatscape/**` 与 `.delivery/issue-24/**`
- [x] AC-B2: `pnpm --filter @musicsaas/beatscape build` exit 0（TypeScript / tsc --noEmit）
- [x] AC-B3: `pnpm --filter @musicsaas/beatscape test` exit 0（含 `pageMeta.test.ts`）
- [x] AC-B4: 未修改判定窗 15/30/50（`apps/beatscape/src/engine/`）
- [x] AC-I24-1: 未知路径渲染 404 fallback 页（非 Home 内容）
- [x] AC-I24-2: 404 页 `document.title` 为 `Page Not Found — BeatScape`
- [x] AC-I24-3: 404 页 `meta[name=description]` 含 not-found 语义与全站 tagline
- [x] AC-I24-4: 离开 404 页恢复全站默认 title/description
- [x] AC-I24-5: 404 页含回首页链接

## Evidence

| Command | Exit code | UTC |
|---------|-----------|-----|
| `pnpm --filter @musicsaas/beatscape build` | 0 | 2026-08-28T23:41:13Z |
| `pnpm --filter @musicsaas/beatscape test` | 0 | 2026-08-28T23:41:13Z |

## Max iterations

If verification still fails after **3** fix loops → mark **BLOCKED** and output `NEED_CLARIFY` or list blockers.
