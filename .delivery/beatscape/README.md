# BeatScape delivery package (MusicSaas)

真实出海音乐游戏产品线 — 仓库根：`/Users/zhenhuachen/Desktop/MusicSaas`

| 文件 | 说明 |
|------|------|
| [brief.md](./brief.md) | Agent 可改范围（仅 `apps/beatscape`） |
| [accept_cases.md](./accept_cases.md) | `pnpm --filter @musicsaas/beatscape test` |
| [backlog.md](./backlog.md) | agent-safe ticket 队列 |

灌 Issue：

```bash
bash ~/Projects/multica/scripts/ai-company/sync-backlog-to-issues.sh \
  --backlog /Users/zhenhuachen/Desktop/MusicSaas/.delivery/beatscape/backlog.md \
  --repo chenzh/MusicSaas \
  --dry-run
```

CEO 仪表盘会显示 `beatscape` → `chenzh/MusicSaas`。
