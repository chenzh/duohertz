# Acceptance Cases — Issue #19 Calibration 页 SEO

## Verification commands

```bash
pnpm --filter @musicsaas/beatscape build
pnpm --filter @musicsaas/beatscape test
```

## Functional

- [x] AC-B1: 改动仅落在 `apps/beatscape/**` 与 `.delivery/issue-19/**`
- [x] AC-B2: `pnpm --filter @musicsaas/beatscape build` exit 0（TypeScript / tsc --noEmit）
- [x] AC-B3: `pnpm --filter @musicsaas/beatscape test` exit 0（含 `pageMeta.test.ts`）
- [x] AC-B4: 未修改判定窗 15/30/50（`apps/beatscape/src/engine/`）
- [x] AC-I19-1: `Calibration.tsx` 调用 `usePageMeta` 设置 Calibration 专属 title/description
- [x] AC-I19-2: Calibration 页 `document.title` 为 `Calibration — BeatScape`
- [x] AC-I19-3: Calibration 页 `meta[name=description]` 含 tap/offset 语义与全站 tagline
- [x] AC-I19-4: 离开 Calibration 页恢复全站默认 title/description

## Evidence

| Command | Exit code | UTC |
|---------|-----------|-----|
| `pnpm --filter @musicsaas/beatscape build` | 0 | 2026-08-28T07:22:20Z |
| `pnpm --filter @musicsaas/beatscape test` | 0 | 2026-08-28T07:22:20Z |
