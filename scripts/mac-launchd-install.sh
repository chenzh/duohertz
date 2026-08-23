#!/usr/bin/env bash
# Install MusicSaas launchd agents (ACE API, Workers, Gateway).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="${NODE_BIN:-/Users/zhenhuachen/Library/Application Support/TRAE SOLO CN/ModularData/ai-agent/vm/tools/opt/node/26.3.1/bin}"
AGENT_DIR="$HOME/Library/LaunchAgents"
mkdir -p "$AGENT_DIR"

install_plist() {
  local src="$1"
  local name
  name="$(basename "$src")"
  sed -e "s|__MUSICSASS_ROOT__|$ROOT|g" -e "s|__NODE_BIN__|$NODE_BIN|g" "$src" >"$AGENT_DIR/$name"
  echo "installed $AGENT_DIR/$name"
}

for label in com.musicsaas.ace-api com.musicsaas.workers com.musicsaas.gateway; do
  launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true
done

install_plist "$ROOT/scripts/launchd/com.musicsaas.ace-api.plist"
install_plist "$ROOT/scripts/launchd/com.musicsaas.workers.plist"
install_plist "$ROOT/scripts/launchd/com.musicsaas.gateway.plist"

launchctl bootstrap "gui/$(id -u)" "$AGENT_DIR/com.musicsaas.ace-api.plist"
launchctl bootstrap "gui/$(id -u)" "$AGENT_DIR/com.musicsaas.workers.plist"
launchctl bootstrap "gui/$(id -u)" "$AGENT_DIR/com.musicsaas.gateway.plist"

echo ""
echo "LaunchAgents loaded. Logs:"
echo "  /tmp/ace-api.log"
echo "  /tmp/musicsaas-workers.log"
echo "  /tmp/musicsaas-gateway.log"
echo ""
echo "Verify: bash scripts/mac-stack-verify.sh"
echo "Demo:   open http://127.0.0.1:8080/demo/?demo=1"
