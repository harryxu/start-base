#!/bin/sh
set -e

# Generate .env file with a random SESSION_SECRET_KEY if no .env exists and SESSION_SECRET_KEY env var is not set
if [ ! -f .env ] && [ -z "$SESSION_SECRET_KEY" ]; then
    echo "No .env file or SESSION_SECRET_KEY environment variable found. Generating random SESSION_SECRET_KEY..."
    echo "SESSION_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')" > .env
fi

# Run database migrations
alembic upgrade head

# Start FastAPI application
exec uvicorn main:app --host 0.0.0.0 --port 5600
