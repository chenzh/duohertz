#!/usr/bin/env bash
# Deploy BeatScape (MusicSaas) to Cloudflare Pages via Direct Upload.
# Uses CLOUDFLARE_ACCOUNT_* from multica local.env — same pattern as meigen-replica.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="${CF_PAGES_PROJECT:-beatscape}"
APP="$ROOT/apps/beatscape"

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
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi
npm run build:cf

OUT="$APP/dist"
test -f "$OUT/index.html"

# --- 瘦身：stream.m4a 在 BeatScape 里从不播放（只被 streamLink.ts 用来判断是否
#     显示"跳转流媒体 App"的链接），却占 ~680MB。deploy 实际只需 audio.m4a（~355MB），
#     删掉 stream.m4a 直接省掉 2/3 体积，绕开 CF Pages 的部署体积上限。
find "$OUT/catalog" -name 'stream.m4a' -delete

cd "$ROOT"
if ! npx --yes wrangler@4 pages project list 2>/dev/null | grep -q "$PROJECT_NAME"; then
  npx --yes wrangler@4 pages project create "$PROJECT_NAME" \
    --production-branch main \
    --compatibility-date 2026-08-26 || true
fi

npx --yes wrangler@4 pages deploy "$OUT" \
  --project-name "$PROJECT_NAME" \
  --branch main \
  --commit-dirty=true

echo "公网: https://${PROJECT_NAME}.pages.dev/"
