# Acceptance Cases — Issue #23 Settings 页 SEO

## Verification commands

```bash
pnpm --filter @musicsaas/beatscape build
pnpm --filter @musicsaas/beatscape test
```

## Functional

- [x] AC-B1: 改动仅落在 `apps/beatscape/**` 与 `.delivery/issue-23/**`
- [x] AC-B2: `pnpm --filter @musicsaas/beatscape build` exit 0（TypeScript / tsc --noEmit）
- [x] AC-B3: `pnpm --filter @musicsaas/beatscape test` exit 0（含 `pageMeta.test.ts`）
- [x] AC-B4: 未修改判定窗 15/30/50（`apps/beatscape/src/engine/`）
- [x] AC-I23-1: `Settings.tsx` 调用 `usePageMeta(SETTINGS_PAGE_META)`
- [x] AC-I23-2: Settings 页 `document.title` 为 `Settings — BeatScape`
- [x] AC-I23-3: `Legal.tsx` privacy/terms 分别设置对应 title/description
- [x] AC-I23-4: Privacy 页 title 为 `Privacy — BeatScape`；Terms 页 title 为 `Terms of Use — BeatScape`
- [x] AC-I23-5: 离开上述页面恢复全站默认 title/description

## Evidence

| Command | Exit code | UTC |
|---------|-----------|-----|
| `pnpm --filter @musicsaas/beatscape build` | 0 | 2026-08-27T23:43:46Z |
| `pnpm --filter @musicsaas/beatscape test` | 0 | 2026-08-27T23:43:46Z |
