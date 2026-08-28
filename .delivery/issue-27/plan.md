# Plan — Issue #27 [TICKET-B10] Home 页 SEO title/description

## Scope

| Module | Files | Change summary |
|--------|-------|----------------|
| SEO utility | `apps/beatscape/src/seo/pageMeta.ts` | 新增 `HOME_PAGE_META`（与全站默认 title/description 一致） |
| Home page | `apps/beatscape/src/pages/Home.tsx` | `usePageMeta(HOME_PAGE_META)` |
| Tests | `apps/beatscape/src/seo/pageMeta.test.ts` | 断言 Home meta 文案与 `index.html` 对齐 |

## Approach

1. **复用 B06–B09 模式**：静态页导出 `HOME_PAGE_META` 常量，页面 mount 时 `usePageMeta` 写入。
2. **文案规则**（对齐 `index.html` + `DEFAULT_PAGE_META`）：
   - Title: `BeatScape — Feel the Beat, Own the Scape`
   - Description: `Feel the Beat, Own the Scape. English pop & EDM browser rhythm game with owned AI originals.`
3. **生命周期**：Home mount 写入全站首页 meta；unmount 由 `usePageMeta` cleanup 恢复 `DEFAULT_PAGE_META`（与 Home 相同值，行为一致）。
4. **不改动**：判定窗、engine、Gateway、catalog、路由。

## Verification

Issue AC 引用 `@beatscape/web typecheck`；本仓包名为 `@musicsaas/beatscape`，无独立 `typecheck` script。等价验收：

```bash
pnpm --filter @musicsaas/beatscape build   # tsc --noEmit
pnpm --filter @musicsaas/beatscape test    # pageMeta.test.ts
```

## Risks

- SPA 客户端 meta 对爬虫有限；范围与 B01–B09 一致，不做 SSG。

## Open questions

<!-- Empty = ready to implement -->
