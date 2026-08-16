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
from app.settings import settings

router = APIRouter(prefix="/api/config", tags=["config"])

# Known default system configurations
DEFAULT_CONFIGS: dict[str, Any] = {
    "page_title": "Start Base",
    "theme": "emerald",
    "bg_url": "",
    "access_mode": "none_guard",
    "site_view_mode": "full",
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


@router.patch("/", response_model=dict[str, Any])
def batch_update_configs(
    payload: dict[str, Any], session: Session = Depends(get_session)
) -> dict[str, Any]:
    """Batch update or insert system configurations."""
    for key, val in payload.items():
        str_val = _serialize_value(val)
        item = session.get(SystemConfig, key)
        if item:
            item.value = str_val
            session.add(item)
        else:
            new_item = SystemConfig(key=key, value=str_val)
            session.add(new_item)

    session.commit()
    return get_all_configs(session)


@router.put("/{key}", response_model=dict[str, Any])
def update_config_by_key(
    key: str, payload: dict[str, Any], session: Session = Depends(get_session)
) -> dict[str, Any]:
    """Update or insert a single config item."""
    val = payload.get("value")
    str_val = _serialize_value(val)

    item = session.get(SystemConfig, key)
    if item:
        item.value = str_val
        session.add(item)
    else:
        new_item = SystemConfig(key=key, value=str_val)
        session.add(new_item)

    session.commit()
    return {"key": key, "value": _parse_value(str_val)}
