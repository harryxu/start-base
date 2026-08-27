# Stage 1: Build Angular frontend
FROM node:24-alpine AS frontend-builder

# Install pnpm (matching packageManager in package.json)
RUN npm install -g pnpm@11.24.0

WORKDIR /web

# Copy frontend dependency files
COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy frontend config and source files
COPY web/tsconfig.json web/tsconfig.app.json web/angular.json web/ngsw-config.json web/.postcssrc.json ./
COPY web/src ./src
COPY web/public ./public

# Build frontend (will output to dist/start-base/browser)
RUN pnpm build


# Stage 2: Serve using Python FastAPI backend
FROM python:3.13-slim

# Install uv for Python dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Enable bytecode compilation, python optimizations, and set production environment
ENV UV_COMPILE_BYTECODE=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Copy backend dependency files
COPY server/pyproject.toml server/uv.lock ./

# Install the backend dependencies (without dev dependencies)
RUN uv sync --frozen --no-install-project --no-dev

# Copy backend application source code
COPY server/main.py ./
COPY server/app ./app
COPY server/alembic ./alembic
COPY server/alembic.ini ./

# Copy built frontend assets from Stage 1 into the FastAPI served directory
COPY --from=frontend-builder /web/dist/start-base/browser ./web-dist

# Add virtualenv to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5600

ENTRYPOINT ["/entrypoint.sh"]
