#!/bin/bash

# Script to run both backend and frontend development servers concurrently

# Setup a trap to kill all background processes when the script exits (e.g., via Ctrl+C)
trap 'kill 0' EXIT SIGINT SIGTERM

echo "Starting Backend Server (FastAPI)..."
(cd server && uv run uvicorn main:app --reload --port 5600) &

echo "Starting Frontend Server (Angular)..."
(cd web && pnpm start) &

echo -e "\nBoth servers are starting. Press Ctrl+C to stop both.\n"

# Wait for all background processes to finish
wait
