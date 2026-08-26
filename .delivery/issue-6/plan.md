# Plan — Issue #6 [TICKET-B01] Play 页 SEO title/description

## Scope

| Module | Files | Change summary |
|--------|-------|----------------|
| SEO utility | `apps/beatscape/src/seo/pageMeta.ts` | `setPageMeta`, `buildPlayPageMeta`, `usePageMeta` hook |
| Play page | `apps/beatscape/src/pages/Play.tsx` | 曲目加载后设置 title/description；卸载恢复默认 |
| HTML fallback | `apps/beatscape/index.html` | 全站默认 `<meta name="description">` |
| Tests | `apps/beatscape/src/seo/pageMeta.test.ts` | `buildPlayPageMeta` 字符串与 fallback |

## Approach

1. **路由级 metadata（主方案）**：Play 为 `/play/:id`，每曲不同，必须在客户端按曲目动态设置 `document.title` 与 `meta[name=description]`。
2. **文案规则**（对齐 PRD §15 + catalog `seo` 样例）：
   - Title: `Play {track.title} — BeatScape`
   - Description: `{title} · {tier} · {mode}. {track.seo.description 或 Own the Scape. {bpm} BPM {genre} chart.} Feel the Beat, Own the Scape.`
3. **index.html**：补充全站默认 description，与现有 title 一致口径。
4. **生命周期**：`usePageMeta` 在 Play 页 mount 时写入，unmount 恢复 `BeatScape — Feel the Beat, Own the Scape` 与默认 description。
5. **不改动**：判定窗、engine、Gateway、catalog 数据。

## Risks

- SPA 动态 meta 对爬虫有限；本 ticket 范围仅为补齐 Play 页 title/description（与 backlog 一致），不做 SSG。
- 加载中/错误态保持全站默认 meta，避免闪烁错误曲目名。

## Open questions

<!-- Empty = ready to implement -->
