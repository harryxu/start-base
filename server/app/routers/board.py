"""Board aggregation endpoint."""

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models import BoardRead, Group, GroupWithSites, Site, SiteRead
from app.services.plugin_service import to_site_read

router = APIRouter(prefix="/api/board", tags=["board"])


@router.get("/", response_model=BoardRead)
def get_board(session: Session = Depends(get_session)) -> BoardRead:
    """Return all groups with their sites and all ungrouped sites, sorted by sort_order."""
    groups = list(session.exec(select(Group).order_by(Group.sort_order)).all())
    sites = list(session.exec(select(Site).order_by(Site.sort_order)).all())

    valid_group_ids = {g.id for g in groups if g.id is not None}
    sites_by_group: dict[int, list[SiteRead]] = {}
    ungrouped_sites: list[SiteRead] = []

    for site in sites:
        site_read = to_site_read(site)
        if site.group_id is None or site.group_id not in valid_group_ids:
            ungrouped_sites.append(site_read)
        else:
            sites_by_group.setdefault(site.group_id, []).append(site_read)

    groups_with_sites: list[GroupWithSites] = []
    for group in groups:
        group_read = GroupWithSites(
            **group.model_dump(),
            sites=sites_by_group.get(group.id, []),
        )
        groups_with_sites.append(group_read)

    return BoardRead(
        ungrouped_sites=ungrouped_sites,
        groups=groups_with_sites,
    )
