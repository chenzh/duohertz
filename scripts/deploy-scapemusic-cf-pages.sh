#!/usr/bin/env bash
# Deploy Scape Music (apps/scapemusic) to Cloudflare Pages via Direct Upload.
# Same credential pattern as deploy-beatscape-cf-pages.sh (multica local.env).
# Deploys a TRIMMED dist: the app only requests stream.m4a / cover.svg / og.png
# per track, so game charts, game slices and previews are excluded
# (~960MB full dist → ~500MB upload).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="${CF_PAGES_PROJECT:-scapemusic}"
APP="$ROOT/apps/scapemusic"

if [[ -f "$HOME/Projects/multica/.ai-company/config/proxy.env" ]]; then
  # shellcheck disable=SC1091
  source "$HOME/Projects/multica/.ai-company/config/proxy.env"
fi
if [[ -f "$HOME/Projects/multica/.ai-company/config/local.env" ]]; then
  # shellcheck disable=SC1091
  source "$HOME/Projects/multica/.ai-company/config/local.env"
fi

: "${CLOUDFLARE_ACCOUNT_API_TOKEN:?missing CLOUDFLARE_ACCOUNT_API_TOKEN}"
: "${CLOUDFLARE_ACCOUNT_ID:?missing CLOUDFLARE_ACCOUNT_ID}"
export CLOUDFLARE_API_TOKEN="$CLOUDFLARE_ACCOUNT_API_TOKEN"
export NODE_TLS_REJECT_UNAUTHORIZED="${NODE_TLS_REJECT_UNAUTHORIZED:-0}"

cd "$APP"
pnpm build
test -f "$APP/dist/index.html"

OUT="$APP/dist-deploy"
rm -rf "$OUT"
rsync -a "$APP/dist/" "$OUT/" \
  --exclude 'audio.m4a' \
  --exclude 'preview_48s.m4a' \
  --exclude 'easy.json' \
  --exclude 'standard.json' \
  --exclude 'hard.json'
test -f "$OUT/catalog/bs-s1-01/stream.m4a"

cd "$ROOT"
if ! npx --yes wrangler@4 pages project list 2>/dev/null | grep -q "$PROJECT_NAME"; then
  npx --yes wrangler@4 pages project create "$PROJECT_NAME" \
    --production-branch main \
    --compatibility-date 2026-08-30 || true
fi

npx --yes wrangler@4 pages deploy "$OUT" \
  --project-name "$PROJECT_NAME" \
  --branch main \
  --commit-dirty=true

echo "公网: https://${PROJECT_NAME}.pages.dev/"
