import mimetypes
import os
from typing import List
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from app.database import DATABASE_URL, get_session
from app.models import Site, SiteCreate, SiteRead, SiteReorderItem, SiteUpdate
from app.services.metadata import fetch_site_metadata

router = APIRouter(prefix="/api/sites", tags=["sites"])


ALLOWED_IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".ico",
    ".bmp",
    ".avif",
}


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = Form(""),
) -> dict:
    """Upload an image file to a subpath inside data/files and return static URL."""
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    content_type = (file.content_type or "").lower()

    if not ext and content_type:
        guessed = mimetypes.guess_extension(content_type)
        if guessed:
            ext = guessed.lower()

    is_image_mime = content_type.startswith("image/") or content_type in (
        "application/octet-stream",
        "",
    )
    is_allowed_ext = ext in ALLOWED_IMAGE_EXTENSIONS

    if not (is_allowed_ext and is_image_mime):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only image or icon files are allowed.",
        )

    # Determine target subpath relative to data/files
    target_folder = (folder or "").strip()

    base_dir = os.path.abspath("data/files")
    clean_target = target_folder.lstrip("/\\")
    dest_dir = os.path.abspath(os.path.join(base_dir, clean_target))

    # Path traversal security check
    if not (dest_dir == base_dir or dest_dir.startswith(base_dir + os.sep)):
        raise HTTPException(
            status_code=400,
            detail="Invalid target path.",
        )

    os.makedirs(dest_dir, exist_ok=True)

    saved_filename = f"custom_{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(dest_dir, saved_filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    rel_path = os.path.relpath(filepath, base_dir).replace("\\", "/")
    url = f"/static/{rel_path}"

    return {"url": url}


async def _update_site_metadata(site_id: int, url: str, db_url: str) -> None:
    """Background task: fetch missing metadata and persist it."""
    from sqlmodel import Session as _Session
    from sqlmodel import create_engine
    from app.services.metadata import download_icon

    metadata = await fetch_site_metadata(url)

    _engine = create_engine(db_url, connect_args={"check_same_thread": False})
    with _Session(_engine) as session:
        site = session.get(Site, site_id)
        if site:
            if metadata.get("title") and not site.title:
                site.title = metadata["title"]
            if metadata.get("icon_url") and not site.icon_url:
                local_icon_url = await download_icon(metadata["icon_url"], site.id)
                site.icon_url = local_icon_url or metadata["icon_url"]
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
