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
# 必须指到真实游戏站：catalog.ts 的 gameTrackUrl() 兜底是
# http://127.0.0.1:5175/beatscape，不设的话线上的"在游戏里玩这首"
# （NowPlaying / TrackPage 两处）全是死链。
GAME_URL="${VITE_GAME_URL:-https://beatscape.pages.dev}"

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
# wrangler 直连 api.cloudflare.com 会失败，走本机代理（与 git 同）。
# 放在 source 之后，外部显式设置的 HTTPS_PROXY 优先。
export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:7897}"
export HTTP_PROXY="${HTTP_PROXY:-http://127.0.0.1:7897}"

cd "$APP"
VITE_GAME_URL="$GAME_URL" pnpm build
test -f "$APP/dist/index.html"

# 兜底自查：VITE_ 环境变量若没被 vite 收进去，游戏深链会退回 127.0.0.1 死链，
# 而这种错误在线上只看页面是完全看不出来的（链接存在，只是点过去打不开）。
if grep -rq "127\.0\.0\.1:5175/beatscape" "$APP/dist/assets"/; then
  echo "FATAL: 产物里仍残留 127.0.0.1:5175/beatscape —— VITE_GAME_URL 没生效" >&2
  exit 1
fi
if ! grep -rq "$GAME_URL" "$APP/dist/assets"/; then
  echo "FATAL: 产物里找不到 $GAME_URL —— VITE_GAME_URL 没生效" >&2
  exit 1
fi

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
