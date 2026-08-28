# Plan — Issue #28 [TICKET-B11] Play 页 SEO 回归测试补强

## Scope

| Module | Files | Change summary |
|--------|-------|----------------|
| Tests | `apps/beatscape/src/seo/pageMeta.test.ts` | 补强 `buildPlayPageMeta` 无 `seo` block 边界断言 |

## Approach

1. **Issue 要求**：`pageMeta.test.ts` 覆盖 `buildPlayPageMeta` 在 catalog 曲目缺少 `seo` 时的 fallback 行为（B01 已实现逻辑，本 ticket 只补测试）。
2. **现有缺口**：已有 `"falls back when track has no seo block"` 仅断言 description 含 fallback 片段，未覆盖 title、tier/mode、全站 tagline，也未区分 `seo` 缺失 vs 显式 `undefined`。
3. **补强用例**（不改 `pageMeta.ts` 实现）：
   - 无 `seo` 属性：title 仍为 `Play {title} — BeatScape`
   - description 含 `{title} · {tier} · {mode}.`
   - description 含 `Own the Scape. {bpm} BPM {genre} chart.`（非 catalog seo.description）
   - description 含 `Feel the Beat, Own the Scape.`
   - 显式 `seo: undefined` 与解构去掉 `seo` 行为一致
4. **不改动**：`pageMeta.ts` 实现、判定窗、engine、Gateway、路由。

## Verification

Issue AC 引用 `@beatscape/web`；本仓包名为 `@musicsaas/beatscape`：

```bash
pnpm --filter @musicsaas/beatscape test
```

## Risks

- 纯测试 diff，无运行时行为变更。

## Open questions

<!-- Empty = ready to implement -->
