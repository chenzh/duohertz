# CLAUDE.md — MusicSaas

Repository instructions live in [AGENTS.md](AGENTS.md). Use that entry point for module boundaries, context loading, authorization, and verification; do not reload context already supplied by the parent task.

## BeatScape delivery queue

These defaults apply to unattended `agent-safe` delivery jobs. Direct user tasks use their authorized scope; queue eligibility and permission to auto-merge remain separate decisions.

- Project / delivery slug: `beatscape`; repository: `chenzh/MusicSaas`.
- App: `apps/beatscape/` (`@musicsaas/beatscape`), Vite + React in the pnpm workspace.
- Scope and acceptance: [brief](.delivery/beatscape/brief.md), [acceptance cases](.delivery/beatscape/accept_cases.md), and the current Issue's explicit scope.
- The queue excludes Gateway, Demo, workers, inference/content generation, secrets, production configuration, and `.github/workflows/**`. Changes to product semantics or judgment windows **15/30/50** need explicit task authorization and appropriate grading.
- Workflow: [music-delivery](.agents/skills/music-delivery/SKILL.md). Commands and evidence: [music-verify](.agents/skills/music-verify/SKILL.md). Release sign-off: [release readiness](docs/BEATSCAPE-RELEASE-READINESS.md).
- Auto-merge eligibility: [merge policy](.delivery/config/merge-policy.json). Passing local tests does not establish CI status or authorize a merge.

[Company OS](.delivery/COMPANY-OS.md) is a read-only upstream snapshot reference. The [delivery entry point](.delivery/README.md) documents local integration and sync boundaries.
