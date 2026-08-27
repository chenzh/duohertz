# Plan — Issue #18 [TICKET-B06] Library 页 SEO title/description

## Scope

| Module | Files | Change summary |
|--------|-------|----------------|
| SEO utility | `apps/beatscape/src/seo/pageMeta.ts` | 新增 `LIBRARY_PAGE_META`（静态 title/description） |
| Library page | `apps/beatscape/src/pages/Library.tsx` | `usePageMeta(LIBRARY_PAGE_META)`；卸载恢复默认 |
| Tests | `apps/beatscape/src/seo/pageMeta.test.ts` | 断言 Library meta 文案 |

## Approach

1. **复用 B01 模式**：Play 页已通过 `usePageMeta` + `buildPlayPageMeta` 设置动态 meta；Library 为静态列表页，导出常量即可。
2. **文案规则**（对齐 PRD §15 + Play 页 `{Page} — BeatScape` 格式）：
   - Title: `Library — BeatScape`
   - Description: `Browse owned AI originals. Search tracks, filter by genre, and save favorites. Feel the Beat, Own the Scape.`
3. **生命周期**：mount 写入 Library meta，unmount 由 `usePageMeta` cleanup 恢复 `DEFAULT_PAGE_META`（与 Play 一致）。
4. **不改动**：判定窗、engine、Gateway、catalog、路由。

## Verification

Issue AC 引用 `@beatscape/web typecheck`；本仓包名为 `@musicsaas/beatscape`，无独立 `typecheck` script。等价验收：

```bash
pnpm --filter @musicsaas/beatscape build   # tsc --noEmit
pnpm --filter @musicsaas/beatscape test    # pageMeta.test.ts
```

## Risks

- SPA 客户端 meta 对爬虫有限；范围与 B01 一致，不做 SSG。

## Open questions

<!-- Empty = ready to implement -->
