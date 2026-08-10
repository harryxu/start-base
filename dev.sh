#!/usr/bin/env bash

# Script to run both backend and frontend development servers concurrently

# Setup a trap to kill all background processes when the script exits (e.g., via Ctrl+C)
cleanup() {
  trap - SIGINT SIGTERM EXIT
  kill "$SERVER_PID" "$WEB_PID" 2>/dev/null
  wait "$SERVER_PID" "$WEB_PID" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "Starting Backend Server (FastAPI)..."
(
  cd server || exit 1
  echo "Running database migrations..."
  uv run alembic upgrade head
  exec uv run uvicorn main:app --reload --port 5600
) &
SERVER_PID=$!

echo "Starting Frontend Server (Angular)..."
(
  cd web || exit 1
  if command -v mise &>/dev/null; then
    eval "$(mise env -s bash)"
    if ! command -v pnpm &>/dev/null && command -v corepack &>/dev/null; then
      corepack enable
    fi
  fi
  exec pnpm run --silent start
) &
WEB_PID=$!

# Wait for all background processes to finish
wait
