# Company OS reference

[Snapshot inventory](company-os/README.md): multica `97718c9`, synced `2026-08-29T01:35:47Z`. `.delivery/company-os/` is a read-only copy of the upstream multica `.ai-company/` directory.

Use only the relevant sections for an active delivery job:

- [Task grading](company-os/docs/06-task-grading.md) and [Definition of Done](company-os/docs/18-definition-of-done.md).
- [Quality gates](company-os/docs/07-quality-gates.md), [label state machine](company-os/docs/21-label-state-machine.md), and [blocked triage](company-os/runbooks/blocked-triage.md).
- [Layer ownership](company-os/docs/28-norm-layers.md) and [sync procedure](company-os/docs/27-norm-sync.md).

Repository adaptations live in [AGENTS.md](../AGENTS.md), [delivery workflow](../.agents/skills/music-delivery/SKILL.md), and [verification workflow](../.agents/skills/music-verify/SKILL.md). The snapshot contains generic examples and historical rules; use actual MusicSaas commands and current task authorization. Do not treat references to push, notifications, or sync as authorization to perform them.

Refresh only when requested, from the configured HQ checkout using its `scripts/ai-company/sync-company-norms.sh --id beatscape`. Inspect the resulting diff. Do not edit the snapshot locally or run `install-harness.sh --force` without checking for overwritten repository adapters.
