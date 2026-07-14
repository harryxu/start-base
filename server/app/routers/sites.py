"""Site CRUD API endpoints."""
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlmodel import Session, select

from app.database import DATABASE_URL, get_session
from app.models import Site, SiteCreate, SiteRead, SiteReorderItem, SiteUpdate
from app.services.metadata import fetch_site_metadata

router = APIRouter(prefix="/api/sites", tags=["sites"])


async def _update_site_metadata(site_id: int, url: str, db_url: str) -> None:
    """Background task: fetch missing metadata and persist it."""
    from sqlmodel import Session as _Session
    from sqlmodel import create_engine

    metadata = await fetch_site_metadata(url)

    _engine = create_engine(db_url, connect_args={"check_same_thread": False})
    with _Session(_engine) as session:
        site = session.get(Site, site_id)
        if site:
            if metadata.get("title") and not site.title:
                site.title = metadata["title"]
            if metadata.get("icon_url") and not site.icon_url:
                site.icon_url = metadata["icon_url"]
            session.add(site)
            session.commit()


@router.get("/", response_model=List[SiteRead])
def list_sites(session: Session = Depends(get_session)) -> List[Site]:
    """Return all sites ordered by sort_order."""
    return list(session.exec(select(Site).order_by(Site.sort_order)).all())


@router.post("/", response_model=SiteRead, status_code=201)
async def create_site(
    site_in: SiteCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> Site:
    """Create a site. Missing title/icon are fetched asynchronously."""
    site = Site.model_validate(site_in)
    session.add(site)
    session.commit()
    session.refresh(site)

    if not site.title or not site.icon_url:
        background_tasks.add_task(
            _update_site_metadata, site.id, site.url, DATABASE_URL
        )

    return site


@router.patch("/{site_id}", response_model=SiteRead)
def update_site(
    site_id: int,
    site_in: SiteUpdate,
    session: Session = Depends(get_session),
) -> Site:
    """Update site fields."""
    site = session.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    update_data = site_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(site, key, value)

    session.add(site)
    session.commit()
    session.refresh(site)
    return site


@router.delete("/{site_id}", status_code=204)
def delete_site(
    site_id: int, session: Session = Depends(get_session)
) -> None:
    """Delete a site."""
    site = session.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    session.delete(site)
    session.commit()


@router.post("/reorder", status_code=204)
def reorder_sites(
    items: List[SiteReorderItem], session: Session = Depends(get_session)
) -> None:
    """Bulk-update sort_order and group_id for multiple sites."""
    for item in items:
        site = session.get(Site, item.id)
        if site:
            site.sort_order = item.sort_order
            site.group_id = item.group_id  # None = ungrouped
            session.add(site)
    session.commit()
