# Acceptance Cases — Issue #18 Library 页 SEO

## Verification commands

```bash
pnpm --filter @musicsaas/beatscape build
pnpm --filter @musicsaas/beatscape test
```

## Functional

- [ ] AC-B1: 改动仅落在 `apps/beatscape/**` 与 `.delivery/issue-18/**`
- [ ] AC-B2: `pnpm --filter @musicsaas/beatscape build` exit 0（TypeScript / tsc --noEmit）
- [ ] AC-B3: `pnpm --filter @musicsaas/beatscape test` exit 0（含 `pageMeta.test.ts`）
- [ ] AC-B4: 未修改判定窗 15/30/50（`apps/beatscape/src/engine/`）
- [ ] AC-I18-1: `Library.tsx` 调用 `usePageMeta` 设置 Library 专属 title/description
- [ ] AC-I18-2: Library 页 `document.title` 为 `Library — BeatScape`
- [ ] AC-I18-3: Library 页 `meta[name=description]` 含 browse/search 语义与全站 tagline
- [ ] AC-I18-4: 离开 Library 页恢复全站默认 title/description

## Evidence

| Command | Exit code | UTC |
|---------|-----------|-----|
| `pnpm --filter @musicsaas/beatscape build` | 0 | 2026-08-26T21:47:45Z |
| `pnpm --filter @musicsaas/beatscape test` | 0 | 2026-08-26T21:47:45Z |
