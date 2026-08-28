# Plan — Issue #23 [TICKET-B08] Settings 页 SEO title/description

## Scope

| Module | Files | Change summary |
|--------|-------|----------------|
| SEO utility | `apps/beatscape/src/seo/pageMeta.ts` | 新增 `SETTINGS_PAGE_META`、`PRIVACY_PAGE_META`、`TERMS_PAGE_META` |
| Settings page | `apps/beatscape/src/pages/Settings.tsx` | `usePageMeta(SETTINGS_PAGE_META)` |
| Legal pages | `apps/beatscape/src/pages/Legal.tsx` | 按 `kind` 调用 `usePageMeta`（privacy / terms） |
| Tests | `apps/beatscape/src/seo/pageMeta.test.ts` | 断言 Settings 与 Legal meta 文案 |

## Approach

1. **复用 B06 模式**：Library 页已通过 `usePageMeta` + 静态常量设置 meta；Settings 相关页同样为静态文案。
2. **「Settings 相关页面」范围**（对齐 B02 隐私链接与路由）：
   - `/settings` → Settings
   - `/privacy` → Privacy（自 Settings 链出）
   - `/terms` → Terms of Use（自 Settings 链出）
   - **不含** `/calibrate`（属 onboarding 流，非 Settings 子页）
3. **文案规则**（`{Page} — BeatScape` + 全站 tagline）：
   - Settings title: `Settings — BeatScape`
   - Settings description: offset、hitsound、keys、本地存储语义 + `Feel the Beat, Own the Scape.`
   - Privacy title: `Privacy — BeatScape`
   - Privacy description: localStorage、无账号、无第三方追踪
   - Terms title: `Terms of Use — BeatScape`
   - Terms description: 浏览器节奏游戏、Owned Rights 内容、acceptable use
4. **生命周期**：mount 写入页专属 meta，unmount 由 `usePageMeta` cleanup 恢复 `DEFAULT_PAGE_META`。
5. **不改动**：判定窗、engine、Gateway、catalog、路由、Legal 正文 COPY。

## Verification

Issue AC 引用 `@beatscape/web typecheck`；本仓包名为 `@musicsaas/beatscape`，无独立 `typecheck` script。等价验收：

```bash
pnpm --filter @musicsaas/beatscape build   # tsc --noEmit
pnpm --filter @musicsaas/beatscape test    # pageMeta.test.ts
```

## Risks

- SPA 客户端 meta 对爬虫有限；范围与 B01/B06 一致，不做 SSG。

## Open questions

<!-- Empty = ready to implement -->
