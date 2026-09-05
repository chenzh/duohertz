#!/usr/bin/env bash
# Verify locally by default. Publishing consumes the exact artifact reviewed by its operator.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:---check}"
case "$MODE" in
  --check)
    cd "$ROOT"
    pnpm --filter demo release:check
    exit 0
    ;;
  deploy) ;;
  *) echo 'Usage: bash scripts/deploy-portal-cf-pages.sh [--check|deploy]' >&2; exit 2 ;;
esac

: "${PORTAL_SITE_URL:?Set the approved public portal origin}"
: "${CF_PAGES_PROJECT:?Set the existing Cloudflare Pages project explicitly}"
: "${PORTAL_ARTIFACT_SHA256:?Set the full reviewed portal-release.json artifactSha256}"
if [[ ! "$CF_PAGES_PROJECT" =~ ^[a-z0-9]([a-z0-9-]{0,56}[a-z0-9])?$ ]]; then
  echo 'Invalid CF_PAGES_PROJECT name' >&2
  exit 1
fi
if [[ ! "$PORTAL_ARTIFACT_SHA256" =~ ^[a-f0-9]{64}$ ]]; then
  echo 'PORTAL_ARTIFACT_SHA256 must be a full lowercase SHA-256 value' >&2
  exit 1
fi
cd "$ROOT/apps/demo"
node scripts/release.mjs verify-public-url
node scripts/release.mjs verify

# Never discover credentials, create a project, change DNS, or weaken TLS implicitly.
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-${CLOUDFLARE_ACCOUNT_API_TOKEN:-}}"
: "${CLOUDFLARE_API_TOKEN:?missing CLOUDFLARE_API_TOKEN}"
: "${CLOUDFLARE_ACCOUNT_ID:?missing CLOUDFLARE_ACCOUNT_ID}"
if [[ "${NODE_TLS_REJECT_UNAUTHORIZED:-1}" == "0" ]]; then
  echo 'TLS verification must remain enabled. Configure NODE_EXTRA_CA_CERTS for a custom CA.' >&2
  exit 1
fi
# Recheck immediately before upload; do not rebuild or modify the approved output.
node scripts/release.mjs verify
npx --yes wrangler@4 pages deploy dist-portal \
  --project-name "$CF_PAGES_PROJECT" \
  --branch "${CF_PAGES_BRANCH:-main}" \
  --commit-dirty=true </dev/null
echo "Uploaded reviewed portal artifact: $PORTAL_ARTIFACT_SHA256"
echo "Verify the configured domain: $PORTAL_SITE_URL/portal-release.json"
