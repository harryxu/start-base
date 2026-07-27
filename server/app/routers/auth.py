"""Authentication API router using Starlette SessionMiddleware."""
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.core.security import (
    get_current_user_from_session,
    hash_password,
    verify_password,
)
from app.database import get_session
from app.models import SystemConfig, UpdateCredentials, User, UserLogin, UserPublic

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=UserPublic)
def login(
    payload: UserLogin, request: Request, session: Session = Depends(get_session)
) -> UserPublic:
    """Authenticate user with username and password, storing user_id in request.session."""
    user = session.exec(
        select(User).where(User.username == payload.username.strip())
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    request.session["user_id"] = user.id
    return UserPublic.model_validate(user)


@router.post("/logout")
def logout(request: Request) -> Dict[str, str]:
    """Log out current user by clearing request.session."""
    request.session.clear()
    return {"status": "ok"}


@router.get("/me")
def get_me(request: Request, session: Session = Depends(get_session)) -> Dict[str, Any]:
    """Get currently authenticated user information and system access_mode."""
    user = get_current_user_from_session(request, session)

    access_mode_item = session.exec(
        select(SystemConfig).where(SystemConfig.key == "access_mode")
    ).first()
    access_mode = (
        (access_mode_item.value or "none_guard").strip()
        if access_mode_item
        else "none_guard"
    )

    return {
        "user": UserPublic.model_validate(user) if user else None,
        "access_mode": access_mode,
    }


@router.patch("/credentials", response_model=UserPublic)
def update_credentials(
    payload: UpdateCredentials,
    request: Request,
    session: Session = Depends(get_session),
) -> UserPublic:
    """Update current user's username and/or password. Requires authentication."""
    current_user = get_current_user_from_session(request, session)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"X-Login-Location": "/login"},
        )

    if payload.new_password:
        if not payload.current_password or not verify_password(
            payload.current_password, current_user.hashed_password
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required and must be correct",
            )
        current_user.hashed_password = hash_password(payload.new_password)

    if payload.username:
        new_username = payload.username.strip()
        if new_username != current_user.username:
            existing = session.exec(
                select(User).where(
                    User.username == new_username, User.id != current_user.id
                )
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username is already taken",
                )
            current_user.username = new_username

    current_user.updated_at = datetime.now(timezone.utc)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return UserPublic.model_validate(current_user)
