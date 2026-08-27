# Plan — Issue #19 [TICKET-B07] Calibration 页 SEO title/description

## Scope

| Module | Files | Change summary |
|--------|-------|----------------|
| SEO utility | `apps/beatscape/src/seo/pageMeta.ts` | 新增 `CALIBRATION_PAGE_META`（静态 title/description） |
| Calibration page | `apps/beatscape/src/pages/Calibration.tsx` | `usePageMeta(CALIBRATION_PAGE_META)`；卸载恢复默认 |
| Tests | `apps/beatscape/src/seo/pageMeta.test.ts` | 断言 Calibration meta 文案 |

## Approach

1. **复用 B06 模式**：Library 页已通过 `usePageMeta` + 静态常量设置 meta；Calibration 同为静态引导页，导出常量即可。
2. **文案规则**（对齐 PRD §15 + `{Page} — BeatScape` 格式，语义来自页面 copy）：
   - Title: `Calibration — BeatScape`
   - Description: `Tap D F J K on each lane flash across 8 beats. Save your timing offset or skip to play. Feel the Beat, Own the Scape.`
3. **生命周期**：mount 写入 Calibration meta，unmount 由 `usePageMeta` cleanup 恢复 `DEFAULT_PAGE_META`（与 Library / Play 一致）。
4. **不改动**：判定窗、engine、Gateway、catalog、路由、offset 逻辑。

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
