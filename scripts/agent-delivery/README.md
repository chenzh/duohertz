# Agent delivery scripts

See [.delivery/README.md](../../.delivery/README.md) for the full setup guide.

## Requirements

- `gh` CLI authenticated
- `jq`, `curl`, `python3`
- `CURSOR_API_KEY` from [Cursor Dashboard](https://cursor.com/dashboard/api)

## Examples

```bash
# Build prompt from issue #123 (stdout)
gh issue view 123 --repo chenzh/MusicSaas --json title,body,url,number > /tmp/issue.json
bash scripts/agent-delivery/build-prompt.sh /tmp/issue.json

# Dispatch Cloud Agent
export CURSOR_API_KEY=crsr_...
bash scripts/agent-delivery/dispatch-cursor-agent.sh 123

# Poll until done (optional; dispatch workflow does not wait by default)
bash scripts/agent-delivery/poll-agent-run.sh <agent_id> <run_id>

# Check auto-merge eligibility for PR
bash scripts/agent-delivery/check-merge-eligible.sh 456
```

Dispatch and merge checks infer the repository from the script's project root;
`GITHUB_REPOSITORY=owner/name` overrides it. Every issue operation uses that same
repository explicitly. These dispatchers use the existing Cursor service/CLI;
they do not select or configure GPT-6 Astra.

The merge checker is read-only and requires the configured labels, an approved
review, and complete allowlisted changes. The workflow also checks CI for the
same commit and requires the explicit repository variable
`AGENT_DELIVERY_AUTO_MERGE=true` before enabling auto-merge. Leave it unset until
the policy and branch protection have been reviewed.
