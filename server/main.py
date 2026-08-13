"""Start Base — FastAPI application entry point."""

import mimetypes
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel
from starlette.middleware.sessions import SessionMiddleware

from app import settings
from app.core.security import check_access_permission
from app.database import engine
from app.routers import auth, config, groups, sites, system

mimetypes.add_type("application/manifest+json", ".webmanifest")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database tables on startup."""
    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(
    title="Start Base API",
    description="Backend API for the Start Base homepage dashboard.",
    version="0.1.0",
    lifespan=lifespan,
    dependencies=[Depends(check_access_permission)],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    session_cookie=settings.SESSION_COOKIE_NAME,
    max_age=settings.MAX_AGE_SECONDS,
    same_site="lax",
    https_only=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://localhost:3000",
        "http://127.0.0.1:4200",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(config.router)
app.include_router(groups.router)
app.include_router(sites.router)
app.include_router(system.router)

os.makedirs("data/db", exist_ok=True)
os.makedirs("data/files/icons", exist_ok=True)
app.mount("/static", StaticFiles(directory="data/files"), name="static")


@app.get("/api/health", tags=["health"])
def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok"}


# Mount Angular built frontend files if they exist (production)
if os.path.exists("web-dist"):
    app.frontend("/", directory="web-dist", fallback="index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=5600, reload=True)
