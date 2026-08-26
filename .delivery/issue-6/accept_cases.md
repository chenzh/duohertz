# Acceptance Cases — Issue #6 Play 页 SEO

## Verification commands

```bash
pnpm --filter @musicsaas/beatscape test
pnpm build:beatscape
```

## Functional

- [ ] AC-B1: 改动仅落在 `apps/beatscape/**`
- [ ] AC-B2: `pnpm --filter @musicsaas/beatscape test` exit 0
- [ ] AC-B3: `pnpm build:beatscape` exit 0
- [ ] AC-B4: 未修改判定窗 15/30/50（`apps/beatscape/src/engine/`）
- [ ] AC-I6-1: `index.html` 含默认 `meta name="description"`
- [ ] AC-I6-2: Play 页加载曲目后 `document.title` 为 `Play {title} — BeatScape`
- [ ] AC-I6-3: Play 页 `meta[name=description]` 含 tier、mode 与曲目 SEO/fallback 描述
- [ ] AC-I6-4: 离开 Play 页恢复全站默认 title/description

## Evidence

| Command | Exit code | UTC |
|---------|-----------|-----|
| | | |
