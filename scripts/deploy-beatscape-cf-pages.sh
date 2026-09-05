#!/usr/bin/env bash
# The same verified artifact is used locally and in CI. --check never publishes.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="${CF_PAGES_PROJECT:-beatscape}"
MODE="${1:-deploy}"
if [[ "$MODE" != "--check" && "$MODE" != "deploy" ]]; then
  echo 'Usage: bash scripts/deploy-beatscape-cf-pages.sh [--check]' >&2
  exit 2
fi
cd "$ROOT"
pnpm release:beatscape
if [[ "$MODE" == "--check" ]]; then exit 0; fi
pnpm --filter @musicsaas/beatscape launch:check

# Load credentials only after the artifact is concrete and verified.
if [[ -f "$HOME/Projects/multica/.ai-company/config/proxy.env" ]]; then
  source "$HOME/Projects/multica/.ai-company/config/proxy.env"
fi
if [[ -f "$HOME/Projects/multica/.ai-company/config/local.env" ]]; then
  source "$HOME/Projects/multica/.ai-company/config/local.env"
fi
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-${CLOUDFLARE_ACCOUNT_API_TOKEN:-}}"
: "${CLOUDFLARE_API_TOKEN:?missing CLOUDFLARE_API_TOKEN}"
: "${CLOUDFLARE_ACCOUNT_ID:?missing CLOUDFLARE_ACCOUNT_ID}"
if [[ "${NODE_TLS_REJECT_UNAUTHORIZED:-1}" == "0" ]]; then
  echo 'TLS verification must be enabled for deployment. Configure NODE_EXTRA_CA_CERTS for a custom CA.' >&2
  exit 1
fi
pnpm --filter @musicsaas/beatscape release:verify
cd "$ROOT/apps/beatscape"
npx --yes wrangler@4 pages deploy dist --project-name "$PROJECT_NAME" --branch "${CF_PAGES_BRANCH:-main}" --commit-dirty=true
echo "Deployed artifact identity: https://${PROJECT_NAME}.pages.dev/release.json"
