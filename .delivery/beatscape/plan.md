# Plan — TICKET-B04 Leaderboard 空状态文案 i18n-ready

Issue: https://github.com/chenzh/MusicSaas/issues/11

## Scope

| Module | Files | Change summary |
|--------|-------|----------------|
| i18n scaffold | `apps/beatscape/src/i18n/types.ts`, `en.ts`, `zh.ts`, `index.ts` | Minimal locale map (`en` default, `zh` stub); `leaderboard` message namespace |
| Leaderboard UI | `apps/beatscape/src/pages/Leaderboard.tsx` | Replace inline empty-state string with `getMessages().leaderboard.emptyState`; add `role="status"` |
| Tests | `apps/beatscape/src/i18n/leaderboard.test.ts` | Assert English empty copy + zh stub exists |

## Approach

1. Mirror demo app i18n pattern (`Record<Locale, Messages>` + `getMessages`) but scoped to BeatScape leaderboard strings only.
2. Keep **English** as `DEFAULT_LOCALE` (`"en"`). No settings/locale switcher in this ticket.
3. Empty-state copy (EN): `No scores yet — play Arcade to rank locally.` (retain current wording; aligns with PRD §6.0.15 Local Board).
4. `zh.ts` provides a stub `emptyState` translation to prove structure; other leaderboard keys may stay English (不必全量翻译).
5. Do **not** touch judge windows, engine, or gateway.

## Risks

- Low: none blocking. Future full i18n will extend `Messages` type and wire locale from settings.

## Open questions

<!-- Empty = ready to implement -->
