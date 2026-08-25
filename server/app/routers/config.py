"""System configuration API endpoints."""

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.core.security import (
    get_current_user_from_session,
    hash_password,
)
from app.database import get_session
from app.models import AccessModeUpdate, SystemConfig, User
from app.services.file_service import delete_local_static_file
from app.settings import settings

router = APIRouter(prefix="/api/config", tags=["config"])

# Known default system configurations
DEFAULT_CONFIGS: dict[str, Any] = {
    "page_title": "Start Base",
    "theme": "emerald",
    "bg_url": "",
    "access_mode": "none_guard",
    "site_view_mode": "full",
    "site_border": "0",
}


def _parse_value(raw: str | None) -> Any:
    """Parse JSON string value if possible, otherwise return string or None."""
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return raw


def _serialize_value(val: Any) -> str | None:
    """Serialize input Python value to string stored in DB."""
    if val is None:
        return None
    if isinstance(val, str):
        return val
    return json.dumps(val)


def _check_demo_access_mode_restriction(target_mode: Any) -> None:
    """Ensure that non-none_guard access modes cannot be set when demo_mode is enabled."""
    if not settings.demo_mode:
        return
    mode_str = str(target_mode).strip() if target_mode is not None else ""
    if mode_str != "none_guard":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authentication mode cannot be modified in demo mode",
        )


@router.get("/", response_model=dict[str, Any])
def get_all_configs(session: Session = Depends(get_session)) -> dict[str, Any]:
    """Get dictionary of all system configurations with defaults merged."""
    configs = session.exec(select(SystemConfig)).all()
    db_map = {item.key: _parse_value(item.value) for item in configs}

    res = dict(DEFAULT_CONFIGS)
    res.update(db_map)

    if settings.demo_mode:
        res["demo"] = True
        res["demo_msg"] = (
            "You are currently viewing the Start Base Demo. Data will be reset every 3 hours."
        )

    return res


@router.get("/{key}", response_model=dict[str, Any])
def get_config_by_key(
    key: str, session: Session = Depends(get_session)
) -> dict[str, Any]:
    """Get a single config item by key."""
    item = session.get(SystemConfig, key)
    if not item:
        if key in DEFAULT_CONFIGS:
            return {"key": key, "value": DEFAULT_CONFIGS[key]}
        raise HTTPException(status_code=404, detail="Config key not found")
    return {"key": item.key, "value": _parse_value(item.value)}


@router.patch("/access-mode", response_model=dict[str, Any])
def update_access_mode(
    payload: AccessModeUpdate,
    request: Request,
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Update system access_mode configuration with permission and initial user checks."""
    valid_modes = {"none_guard", "write_guard", "full_guard"}
    target_mode = payload.access_mode.strip() if payload.access_mode else ""
    if target_mode not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid access_mode. Must be one of: {', '.join(valid_modes)}",
        )

    _check_demo_access_mode_restriction(target_mode)

    # 1. Permission check: if current access_mode is not none_guard, require authentication
    current_item = session.get(SystemConfig, "access_mode")
    current_mode = (
        (current_item.value or "none_guard").strip() if current_item else "none_guard"
    )

    if current_mode != "none_guard":
        user = get_current_user_from_session(request, session)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to modify access_mode",
            )

    # 2. Check if target access_mode requires an admin user
    if target_mode != "none_guard":
        users_count = len(session.exec(select(User)).all())
        if users_count == 0:
            if (
                not payload.username
                or not payload.username.strip()
                or not payload.password
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username and password are required to create initial admin user when enabling guard mode",
                )
            new_user = User(
                username=payload.username.strip(),
                hashed_password=hash_password(payload.password),
            )
            session.add(new_user)

    # 3. Save new access_mode
    if current_item:
        current_item.value = target_mode
        session.add(current_item)
    else:
        new_item = SystemConfig(key="access_mode", value=target_mode)
        session.add(new_item)

    session.commit()
    return get_all_configs(session)


def _set_config_value(
    session: Session, key: str, val: Any
) -> tuple[SystemConfig, str | None]:
    """Set or update a config item in session, returning the item and any obsolete static file to delete."""
    if key == "access_mode":
        _check_demo_access_mode_restriction(val)

    str_val = _serialize_value(val)
    item = session.get(SystemConfig, key)
    old_file: str | None = None

    if key == "bg_url":
        old_bg = _parse_value(item.value) if item else None
        new_bg = val if val is not None else ""
        if old_bg and old_bg != new_bg and isinstance(old_bg, str):
            old_file = old_bg

    if item:
        item.value = str_val
        session.add(item)
    else:
        item = SystemConfig(key=key, value=str_val)
        session.add(item)

    return item, old_file


@router.patch("/", response_model=dict[str, Any])
def batch_update_configs(
    payload: dict[str, Any], session: Session = Depends(get_session)
) -> dict[str, Any]:
    """Batch update or insert system configurations."""
    old_files: list[str] = []

    for key, val in payload.items():
        _, old_file = _set_config_value(session, key, val)
        if old_file:
            old_files.append(old_file)

    session.commit()

    for old_file in old_files:
        delete_local_static_file(old_file)

    return get_all_configs(session)


@router.put("/{key}", response_model=dict[str, Any])
def update_config_by_key(
    key: str, payload: dict[str, Any], session: Session = Depends(get_session)
) -> dict[str, Any]:
    """Update or insert a single config item."""
    val = payload.get("value")
    item, old_file = _set_config_value(session, key, val)

    session.commit()

    if old_file:
        delete_local_static_file(old_file)

    return {"key": key, "value": _parse_value(item.value)}
