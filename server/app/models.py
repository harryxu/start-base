"""SQLModel database models and API schemas for Start Base."""
from typing import Optional

from sqlmodel import Field, SQLModel


# ---- Database Models ----


class Group(SQLModel, table=True):
    """Group for organizing sites on the dashboard."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(min_length=1, max_length=200)
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


# ---- API Schemas ----


class GroupCreate(SQLModel):
    name: str
    sort_order: float = 0.0


class GroupUpdate(SQLModel):
    name: Optional[str] = None
    sort_order: Optional[float] = None


class GroupRead(SQLModel):
    id: int
    name: str
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
