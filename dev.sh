#!/usr/bin/env bash

# Script to run both backend and frontend development servers concurrently

# Setup a trap to kill all background processes when the script exits (e.g., via Ctrl+C)
trap 'kill 0' EXIT SIGINT SIGTERM

echo "Starting Backend Server (FastAPI)..."
(
  cd server || exit 1
  echo "Running database migrations..."
  uv run alembic upgrade head
  uv run uvicorn main:app --reload --port 5600
) &

echo "Starting Frontend Server (Angular)..."
(
  cd web || exit 1
  if [ -z "$NVM_DIR" ]; then
    for dir in "$HOME/.nvmsh" "$HOME/.nvm" "$HOME/.local/share/nvm"; do
      if [ -d "$dir" ]; then
        export NVM_DIR="$dir"
        break
      fi
    done
  fi
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  if command -v nvm &>/dev/null; then
    nvm use
  fi
  pnpm start
) &

echo -e "\nBoth servers are starting. Press Ctrl+C to stop both.\n"

# Wait for all background processes to finish
wait
