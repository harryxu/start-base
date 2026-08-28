#!/usr/bin/env bash

# Script to run both backend and frontend development servers concurrently.
# If you want to use different ports, you can set env vars in a .env file:
# DEV_API_PORT=5800
# DEV_WEB_PORT=5700

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load environment variables from .env if available
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$SCRIPT_DIR/.env" 2>/dev/null || true
  set +a
fi

# Fallback to default ports if not set and export for child processes
export DEV_API_PORT="${DEV_API_PORT:-5600}"
export DEV_WEB_PORT="${DEV_WEB_PORT:-4200}"

# Setup a trap to kill all background processes when the script exits (e.g., via Ctrl+C)
cleanup() {
  trap - SIGINT SIGTERM EXIT
  kill "$SERVER_PID" "$WEB_PID" 2>/dev/null
  wait "$SERVER_PID" "$WEB_PID" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "Starting Backend Server (FastAPI) on port $DEV_API_PORT..."
(
  cd "$SCRIPT_DIR/server" || exit 1
  echo "Running database migrations..."
  uv run alembic upgrade head
  exec uv run uvicorn main:app --reload --port "$DEV_API_PORT"
) &
SERVER_PID=$!

echo "Starting Frontend Server (Angular) on port $DEV_WEB_PORT..."
(
  cd "$SCRIPT_DIR/web" || exit 1
  if command -v mise &>/dev/null; then
    eval "$(mise env -s bash)"
    if ! command -v pnpm &>/dev/null && command -v corepack &>/dev/null; then
      corepack enable
    fi
  fi
  exec pnpm run --silent start --port "$DEV_WEB_PORT"
) &
WEB_PID=$!

# Wait for all background processes to finish
wait
