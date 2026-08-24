from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlmodel import Session, select

from app import database
from app.database import get_session
from app.models import Site, SiteCreate, SiteRead, SiteReorderItem, SiteUpdate
from app.services.metadata import download_icon, fetch_site_metadata
from app.services.plugin_service import (
    cleanup_unused_plugins,
    download_plugin,
    sync_plugin_for_site,
    to_site_read,
)

router = APIRouter(prefix="/api/sites", tags=["sites"])


async def _update_site_metadata(site_id: int, url: str) -> None:
    """Background task: fetch missing metadata and persist it."""
    metadata = await fetch_site_metadata(url)

    with Session(database.engine) as session:
        site = session.get(Site, site_id)
        if site:
            if metadata.get("title") and not site.title:
                site.title = metadata["title"]
            if metadata.get("icon_url") and not site.icon_url:
                local_icon_url = await download_icon(metadata["icon_url"], site.id)
                site.icon_url = local_icon_url or metadata["icon_url"]
            session.add(site)
            session.commit()


@router.get("/", response_model=list[SiteRead])
def list_sites(session: Session = Depends(get_session)) -> list[SiteRead]:
    """Return all sites ordered by sort_order."""
    sites = list(session.exec(select(Site).order_by(Site.sort_order)).all())
    return [to_site_read(site) for site in sites]


@router.post("/", response_model=SiteRead, status_code=201)
async def create_site(
    site_in: SiteCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> SiteRead:
    """Create a site. Missing title/icon or plugin JS are fetched asynchronously."""
    site = Site.model_validate(site_in)
    session.add(site)
    session.commit()
    session.refresh(site)

    if site.site_type == "builtin" and (not site.title or not site.icon_url):
        background_tasks.add_task(_update_site_metadata, site.id, site.url)
    elif site.site_type == "webcomponent" and site.url:
        background_tasks.add_task(sync_plugin_for_site, site.id, site.url)

    return to_site_read(site)


@router.patch("/{site_id}", response_model=SiteRead)
async def update_site(
    site_id: int,
    site_in: SiteUpdate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> SiteRead:
    """Update site fields."""
    site = session.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    old_site_type = site.site_type
    old_url = site.url

    update_data = site_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(site, key, value)

    session.add(site)
    session.commit()
    session.refresh(site)

    if site.site_type == "webcomponent" and site.url:
        background_tasks.add_task(sync_plugin_for_site, site.id, site.url)

    if old_site_type == "webcomponent" and (
        site.site_type != "webcomponent" or site.url != old_url
    ):
        cleanup_unused_plugins(session)

    return to_site_read(site)


@router.post("/{site_id}/sync-plugin", response_model=SiteRead)
async def sync_site_plugin(
    site_id: int,
    session: Session = Depends(get_session),
) -> SiteRead:
    """Force re-download and update the cached plugin script for a webcomponent site."""
    site = session.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    if site.site_type != "webcomponent" or not site.url:
        raise HTTPException(
            status_code=400, detail="Site is not a webcomponent plugin"
        )

    cached_url = await sync_plugin_for_site(site.id, site.url, force=True)
    if not cached_url:
        raise HTTPException(
            status_code=502,
            detail="Failed to fetch plugin script from remote URL",
        )

    session.refresh(site)
    return to_site_read(site)



@router.delete("/{site_id}", status_code=204)
def delete_site(site_id: int, session: Session = Depends(get_session)) -> None:
    """Delete a site and cleanup unused cached plugin files."""
    site = session.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    is_webcomponent = site.site_type == "webcomponent"
    session.delete(site)
    session.commit()

    if is_webcomponent:
        cleanup_unused_plugins(session)


@router.post("/reorder", status_code=204)
def reorder_sites(
    items: list[SiteReorderItem], session: Session = Depends(get_session)
) -> None:
    """Bulk-update sort_order and group_id for sites."""
    for item in items:
        site = session.get(Site, item.id)
        if site:
            site.sort_order = item.sort_order
            site.group_id = item.group_id
            session.add(site)
    session.commit()

