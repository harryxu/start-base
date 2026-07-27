"""Security, password hashing, Starlette SessionMiddleware integration, and global access control dependencies."""
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from pwdlib import PasswordHash
from sqlmodel import Session, select

from app import settings
from app.database import get_session
from app.models import SystemConfig, User

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def get_current_user_from_session(
    request: Request, session: Session
) -> Optional[User]:
    """Retrieve current authenticated user from Starlette request.session."""
    user_id = request.session.get("user_id")
    if not user_id:
        return None
    return session.get(User, user_id)


def check_access_permission(
    request: Request, session: Session = Depends(get_session)
) -> Optional[User]:
    """Global access control dependency attached to FastAPI app.

    Evaluates current access_mode and request method against user session.
    """
    path = request.url.path

    # Whitelist endpoints always accessible without authentication
    if (
        path == "/api/auth/login"
        or path == "/api/health"
        or path.startswith("/docs")
        or path.startswith("/openapi.json")
    ):
        return None

    # Get current access_mode from DB
    access_mode_item = session.exec(
        select(SystemConfig).where(SystemConfig.key == "access_mode")
    ).first()
    access_mode = (
        (access_mode_item.value or "none_guard").strip()
        if access_mode_item
        else "none_guard"
    )

    if access_mode == "none_guard":
        return None

    user = get_current_user_from_session(request, session)

    # full_guard: All requests require authenticated user
    if access_mode == "full_guard":
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required for full guard mode",
                headers={"X-Login-Location": "/login"},
            )
        return user

    # write_guard: Non-GET/HEAD/OPTIONS requests require authenticated user
    if access_mode == "write_guard":
        if request.method not in ["GET", "HEAD", "OPTIONS"]:
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required for write operations",
                    headers={"X-Login-Location": "/login"},
                )
        return user

    return user
