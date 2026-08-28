# Acceptance Cases — Issue #27 Home 页 SEO

## Verification commands

```bash
pnpm --filter @musicsaas/beatscape build
pnpm --filter @musicsaas/beatscape test
```

## Functional

- [x] AC-B1: 改动仅落在 `apps/beatscape/**` 与 `.delivery/issue-27/**`
- [x] AC-B2: `pnpm --filter @musicsaas/beatscape build` exit 0（TypeScript / tsc --noEmit）
- [x] AC-B3: `pnpm --filter @musicsaas/beatscape test` exit 0（含 `pageMeta.test.ts`）
- [x] AC-B4: 未修改判定窗 15/30/50（`apps/beatscape/src/engine/`）
- [x] AC-I27-1: `Home.tsx` 调用 `usePageMeta` 设置 Home 专属 title/description
- [x] AC-I27-2: Home 页 `document.title` 为 `BeatScape — Feel the Beat, Own the Scape`
- [x] AC-I27-3: Home 页 `meta[name=description]` 含 rhythm game / owned AI originals 语义与全站 tagline
- [x] AC-I27-4: Home meta 与 `index.html` 默认 title/description 一致

## Evidence

| Command | Exit code | UTC |
|---------|-----------|-----|
| `pnpm --filter @musicsaas/beatscape build` | 0 | 2026-08-28T22:45:49Z |
| `pnpm --filter @musicsaas/beatscape test` | 0 | 2026-08-28T22:45:49Z |
