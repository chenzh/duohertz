#!/usr/bin/env bash
# MusicSaas harness status — SESSION + quick health
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== MusicSaas print-status ==="
echo "root: $ROOT"
echo ""

if [[ -f SESSION.md ]]; then
  echo "--- SESSION.md ---"
  grep -E '^\*\*(phase|updated|blockers)\*\*|^\- \[' SESSION.md 2>/dev/null | head -20 || true
  echo ""
fi

if [[ -f .secondbrain ]]; then
  echo "--- .secondbrain ---"
  head -2 .secondbrain
  echo ""
fi

echo "--- git ---"
git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "no git"
git log -1 --oneline 2>/dev/null || true
echo ""

echo "--- quick checks ---"
if [[ -d apps/gateway ]]; then echo "[OK] apps/gateway"; else echo "[--] apps/gateway"; fi
if [[ -d apps/beatscape ]]; then echo "[OK] apps/beatscape"; else echo "[--] apps/beatscape"; fi
if [[ -f docs/KNOWLEDGE-BASE.md ]]; then echo "[OK] docs/KNOWLEDGE-BASE.md"; else echo "[--] docs/KNOWLEDGE-BASE.md"; fi
if [[ -f docs/CODE-INDEX.md ]]; then echo "[OK] docs/CODE-INDEX.md"; else echo "[--] docs/CODE-INDEX.md"; fi
