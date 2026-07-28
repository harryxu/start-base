"""SQLModel database models and API schemas for Start Base."""
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


# ---- Database Models ----


class UserBase(SQLModel):
    """Base fields for User."""

    username: str = Field(unique=True, index=True, min_length=3, max_length=50)


class User(UserBase, table=True):
    """User account model."""

    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Group(SQLModel, table=True):
    """Group for organizing sites on the dashboard."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(min_length=1, max_length=200)
    icon_url: Optional[str] = Field(default=None)
    sort_order: float = Field(default=0.0)


class Site(SQLModel, table=True):
    """A bookmarked website displayed on the dashboard."""

    id: Optional[int] = Field(default=None, primary_key=True)
    url: str
    title: Optional[str] = None
    icon_url: Optional[str] = None
    description: Optional[str] = None
    sort_order: float = Field(default=0.0)
    group_id: Optional[int] = Field(default=None, foreign_key="group.id")


class SystemConfig(SQLModel, table=True):
    """Generic key-value system configuration entry."""

    key: str = Field(primary_key=True, max_length=100)
    value: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None, max_length=255)


# ---- API Schemas ----


class UserPublic(UserBase):
    """Public user schema returned in API responses."""

    id: int
    created_at: datetime


class UserLogin(SQLModel):
    """Request payload for logging in."""

    username: str
    password: str


class UpdateCredentials(SQLModel):
    """Request payload for updating username and/or password."""

    username: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class AccessModeUpdate(SQLModel):
    """Request payload for updating system access_mode."""

    access_mode: str  # none_guard | write_guard | full_guard
    username: Optional[str] = None
    password: Optional[str] = None


class SystemConfigRead(SQLModel):
    key: str
    value: Optional[str] = None
    description: Optional[str] = None


class SystemConfigUpdate(SQLModel):
    value: Optional[str] = None
    description: Optional[str] = None


class GroupCreate(SQLModel):
    name: str
    icon_url: Optional[str] = None
    sort_order: float = 0.0


class GroupUpdate(SQLModel):
    name: Optional[str] = None
    icon_url: Optional[str] = None
    sort_order: Optional[float] = None


class GroupRead(SQLModel):
    id: int
    name: str
    icon_url: Optional[str] = None
    sort_order: float


class SiteCreate(SQLModel):
    url: str
    title: Optional[str] = None
    icon_url: Optional[str] = None
    description: Optional[str] = None
    sort_order: float = 0.0
    group_id: Optional[int] = None


class SiteUpdate(SQLModel):
    url: Optional[str] = None
    title: Optional[str] = None
    icon_url: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[float] = None
    group_id: Optional[int] = None


class SiteRead(SQLModel):
    id: int
    url: str
    title: Optional[str]
    icon_url: Optional[str]
    description: Optional[str]
    sort_order: float
    group_id: Optional[int]


class ReorderItem(SQLModel):
    """Payload item for bulk-reordering groups."""

    id: int
    sort_order: float


class SiteReorderItem(SQLModel):
    """Payload item for bulk-reordering sites (can also change group membership)."""

    id: int
    sort_order: float
    group_id: Optional[int] = None
