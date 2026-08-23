"""SQLModel database models and API schemas for Start Base."""

from datetime import UTC, datetime

from sqlmodel import Field, SQLModel

# ---- Database Models ----


class UserBase(SQLModel):
    """Base fields for User."""

    username: str = Field(unique=True, index=True, min_length=3, max_length=50)


class User(UserBase, table=True):
    """User account model."""

    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    hashed_password: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class Group(SQLModel, table=True):
    """Group for organizing sites on the dashboard."""

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(min_length=1, max_length=200)
    icon_url: str | None = Field(default=None)
    site_view_mode: str = Field(default="")
    site_border: str = Field(default="")
    sort_order: float = Field(default=0.0)


class Site(SQLModel, table=True):
    """A bookmarked website or plugin displayed on the dashboard."""

    id: int | None = Field(default=None, primary_key=True)
    url: str
    title: str | None = None
    icon_url: str | None = None
    description: str | None = None
    sort_order: float = Field(default=0.0)
    group_id: int | None = Field(default=None, foreign_key="group.id")
    col_span: int = Field(default=1)
    row_span: int = Field(default=1)
    site_type: str = Field(default="builtin")
    plugin_params: str | None = Field(default=None)


class SystemConfig(SQLModel, table=True):
    """Generic key-value system configuration entry."""

    key: str = Field(primary_key=True, max_length=100)
    value: str | None = Field(default=None)
    description: str | None = Field(default=None, max_length=255)


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

    username: str | None = None
    current_password: str | None = None
    new_password: str | None = None


class AccessModeUpdate(SQLModel):
    """Request payload for updating system access_mode."""

    access_mode: str  # none_guard | write_guard | full_guard
    username: str | None = None
    password: str | None = None


class SystemConfigRead(SQLModel):
    key: str
    value: str | None = None
    description: str | None = None


class SystemConfigUpdate(SQLModel):
    value: str | None = None
    description: str | None = None


class GroupCreate(SQLModel):
    name: str
    icon_url: str | None = None
    site_view_mode: str = ""
    site_border: str = ""
    sort_order: float = 0.0


class GroupUpdate(SQLModel):
    name: str | None = None
    icon_url: str | None = None
    site_view_mode: str | None = None
    site_border: str | None = None
    sort_order: float | None = None


class GroupRead(SQLModel):
    id: int
    name: str
    icon_url: str | None = None
    site_view_mode: str = ""
    site_border: str = ""
    sort_order: float


class SiteCreate(SQLModel):
    url: str
    title: str | None = None
    icon_url: str | None = None
    description: str | None = None
    sort_order: float = 0.0
    group_id: int | None = None
    col_span: int = 1
    row_span: int = 1
    site_type: str = "builtin"
    plugin_params: str | None = None


class SiteUpdate(SQLModel):
    url: str | None = None
    title: str | None = None
    icon_url: str | None = None
    description: str | None = None
    sort_order: float | None = None
    group_id: int | None = None
    col_span: int | None = None
    row_span: int | None = None
    site_type: str | None = None
    plugin_params: str | None = None


class SiteRead(SQLModel):
    id: int
    url: str
    title: str | None
    icon_url: str | None
    description: str | None
    sort_order: float
    group_id: int | None
    col_span: int
    row_span: int
    site_type: str
    plugin_params: str | None = None
    plugin_cached_url: str | None = None


class GroupWithSites(GroupRead):
    """Group schema with nested sites."""

    sites: list[SiteRead] = []


class BoardRead(SQLModel):
    """Aggregated dashboard layout schema containing ungrouped sites and groups with their sites."""

    ungrouped_sites: list[SiteRead] = []
    groups: list[GroupWithSites] = []


class ReorderItem(SQLModel):
    """Payload item for bulk-reordering groups."""

    id: int
    sort_order: float


class SiteReorderItem(SQLModel):
    """Payload item for bulk-reordering sites (can also change group membership)."""

    id: int
    sort_order: float
    group_id: int | None = None

