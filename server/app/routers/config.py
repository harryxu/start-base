"""System configuration API endpoints."""

import json
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import SystemConfig

router = APIRouter(prefix="/api/config", tags=["config"])

# Known default system configurations
DEFAULT_CONFIGS: Dict[str, Any] = {
    "page_title": "Start Base",
    "theme": "emerald",
    "bg_url": "",
}


def _parse_value(raw: Optional[str]) -> Any:
    """Parse JSON string value if possible, otherwise return string or None."""
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return raw


def _serialize_value(val: Any) -> Optional[str]:
    """Serialize input Python value to string stored in DB."""
    if val is None:
        return None
    if isinstance(val, str):
        return val
    return json.dumps(val)


@router.get("/", response_model=Dict[str, Any])
def get_all_configs(session: Session = Depends(get_session)) -> Dict[str, Any]:
    """Get dictionary of all system configurations with defaults merged."""
    configs = session.exec(select(SystemConfig)).all()
    db_map = {item.key: _parse_value(item.value) for item in configs}

    res = dict(DEFAULT_CONFIGS)
    res.update(db_map)
    return res


@router.get("/{key}", response_model=Dict[str, Any])
def get_config_by_key(
    key: str, session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """Get a single config item by key."""
    item = session.get(SystemConfig, key)
    if not item:
        if key in DEFAULT_CONFIGS:
            return {"key": key, "value": DEFAULT_CONFIGS[key]}
        raise HTTPException(status_code=404, detail="Config key not found")
    return {"key": item.key, "value": _parse_value(item.value)}


@router.patch("/", response_model=Dict[str, Any])
def batch_update_configs(
    payload: Dict[str, Any], session: Session = Depends(get_session)
) -> Dict[str, Any]:
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


@router.put("/{key}", response_model=Dict[str, Any])
def update_config_by_key(
    key: str, payload: Dict[str, Any], session: Session = Depends(get_session)
) -> Dict[str, Any]:
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
