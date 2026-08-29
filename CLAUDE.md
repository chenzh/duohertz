# CLAUDE.md — beatscape (MusicSaas)

## Meta

| Field | Value |
|-------|-------|
| Project ID | `beatscape` |
| Delivery slug | `beatscape` → `.delivery/beatscape/` |
| Tier | production |
| Repo | `chenzh/MusicSaas` |
| App scope | `apps/beatscape/` (`@musicsaas/beatscape`) |

## Stack

- Vite + React (beatscape app inside MusicSaas monorepo)
- pnpm workspace; Python harness scripts for catalog/MLX (human-only)

## Commands

```bash
pnpm install
pnpm --filter @musicsaas/beatscape test
pnpm build:beatscape
# PR前全量（env 允许时）:
pnpm test
```

## Forbidden paths (agent-safe)

- `apps/gateway/**`, `apps/demo/**`, `workers/**`
- MLX / inference / `scripts/beatscape-ingest*` / `pipeline*` / `regenerate*`
- `.env`, API keys, production gateway config
- `apps/beatscape/src/engine/` timing constants **15/30/50** unless ticket allows
- `.github/workflows/**` (human-only)

## Product truth sources (read before coding)

1. Repo root `AGENTS.md` and `docs/KNOWLEDGE-BASE.md` (MusicSaas product rules)
2. `.delivery/beatscape/brief.md`
3. `.delivery/beatscape/accept_cases.md`
4. `docs/PRD-BEATSCAPE.md` (read-only for agents; semantic changes = human-only)

## Company norms (AI delivery layer)

- `.delivery/company-os/README.md`
- `.delivery/company-os/docs/06-task-grading.md`
- `.delivery/company-os/docs/18-definition-of-done.md`

Refresh: `bash ~/Projects/multica/scripts/ai-company/sync-company-norms.sh --id beatscape`

## Agent pipeline

- `.delivery/prompts/orchestrator-kickoff.md`
- `.cursor/agents/`
- `.delivery/config/merge-policy.json`

## Hard rules

1. Agent changes stay in `apps/beatscape/**` unless ticket says otherwise.
2. Verifier: `pnpm --filter @musicsaas/beatscape test` + `pnpm build:beatscape` exit 0.
3. No gateway/MLX side effects from UI tickets.
