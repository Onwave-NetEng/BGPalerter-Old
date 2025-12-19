#!/usr/bin/env bash
set -euo pipefail

LOG="/tmp/bgpalerter-dashboard-deploy.log"
exec > >(tee -a "$LOG") 2>&1

REPO_ROOT="${REPO_ROOT:-$HOME/server-scripts}"
TEMPLATE_DIR="$REPO_ROOT/BGPalerter-dashboard"
APP_DIR="$HOME/BGPalerter-dashboard"

echo "[Dashboard deploy] Ensuring target directory exists at $APP_DIR..."
mkdir -p "$APP_DIR"

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo "[Dashboard deploy] ERROR: Template dir $TEMPLATE_DIR not found." >&2
  exit 1
fi

echo "[Dashboard deploy] Copying NEW files from $TEMPLATE_DIR into $APP_DIR (no overwrite)..."
rsync -av --ignore-existing "$TEMPLATE_DIR"/ "$APP_DIR"/

cd "$APP_DIR"
echo "[Dashboard deploy] Installing frontend dependencies..."
npm install

echo "[Dashboard deploy] Validation (Vite dev server)..."
npm run dev >/tmp/bgpalerter-dashboard-dev.log 2>&1 &
FRONT_PID=$!

sleep 12

if curl -sf http://localhost:5173 >/dev/null 2>&1; then
  echo "  - Vite dev server reachable on http://localhost:5173"
else
  echo "  - Vite dev server FAILED. See /tmp/bgpalerter-dashboard-dev.log" >&2
  kill "$FRONT_PID" 2>/dev/null || true
  exit 1
fi

kill "$FRONT_PID" 2>/dev/null || true
echo "[Dashboard deploy] Completed successfully (existing tree preserved)."
