# Plan — Issue #24 [TICKET-B09] 404 页最小文案与 metadata

## Scope

| Module | Files | Change summary |
|--------|-------|----------------|
| SEO utility | `apps/beatscape/src/seo/pageMeta.ts` | 新增 `NOT_FOUND_PAGE_META`（title 含站点名） |
| 404 page | `apps/beatscape/src/pages/NotFound.tsx` | 最小 fallback 文案 + `usePageMeta` |
| Router | `apps/beatscape/src/router.tsx` | 无匹配路由时渲染 `fallback`，不再静默回 Home |
| App | `apps/beatscape/src/App.tsx` | 注册 `NotFoundPage` 为 Router fallback |
| Tests | `apps/beatscape/src/seo/pageMeta.test.ts` | 断言 404 meta 文案 |

## Approach

1. **复用 B01/B06 模式**：静态页导出 `NOT_FOUND_PAGE_META` 常量，`usePageMeta` 在 mount/unmount 写入与恢复。
2. **文案规则**（对齐 `{Page} — BeatScape` 格式 + PRD「友好 404」）：
   - Title: `Page Not Found — BeatScape`
   - Description: `This page does not exist. Return to BeatScape home or browse the library. Feel the Beat, Own the Scape.`
   - Body: 最小 UI — `h1`「Page not found」+ 回首页 `Link`
3. **路由 fallback**：扩展 `Router` 接受可选 `fallback` prop；未匹配时渲染 fallback 而非 `/` Home（修复当前错误地将未知路径显示为首页的行为）。
4. **不改动**：判定窗、engine、Gateway、catalog、现有路由表。

## Verification

Issue AC 引用 `@beatscape/web typecheck`；本仓包名为 `@musicsaas/beatscape`，无独立 `typecheck` script。等价验收：

```bash
pnpm --filter @musicsaas/beatscape build   # tsc --noEmit
pnpm --filter @musicsaas/beatscape test    # pageMeta.test.ts
```

## Risks

- SPA 客户端 meta 对爬虫有限；范围与 B01/B06 一致。
- 404 为客户端路由 fallback，非 HTTP 404 状态码（Vite SPA 部署层另行配置，本 ticket 不涉及）。

## Open questions

<!-- Empty = ready to implement -->
