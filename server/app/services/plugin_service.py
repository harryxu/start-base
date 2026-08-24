"""Service for downloading, caching, deduplicating, and serving Web Component plugin scripts."""

import hashlib
from pathlib import Path
import re
import urllib.parse
import httpx
from sqlmodel import Session, select

from app.models import Site, SiteRead

PLUGINS_DIR = Path("data/files/plugins")


def to_site_read(site: Site) -> SiteRead:
    """Convert a Site model to SiteRead schema, computing plugin_cached_url if applicable."""
    cached_url = (
        get_plugin_cached_url(site.url)
        if site.site_type == "webcomponent" and site.url
        else None
    )
    return SiteRead(**site.model_dump(), plugin_cached_url=cached_url)


def get_plugin_filename(url: str) -> str:
    """
    Generate a deterministic, human-readable filename for a plugin URL.
    Format: {hash}-{sanitized_name}.js
    Example: a1b2c3d4e5f67890-demo-plugin.js
    """
    if not url or not url.strip():
        return "unknown.js"

    normalized = url.strip()
    url_hash = hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]

    # Extract base name from URL path
    parsed = urllib.parse.urlparse(normalized)
    path_name = Path(parsed.path).name

    if path_name.endswith(".js") or path_name.endswith(".mjs"):
        base_name = path_name.rsplit(".", 1)[0]
    else:
        base_name = path_name or "plugin"

    # Sanitize base_name: allow alphanumeric, dashes, underscores
    sanitized = re.sub(r"[^a-zA-Z0-9_-]", "-", base_name).strip("-")
    if not sanitized:
        sanitized = "plugin"
    # Cap length to 32 chars
    sanitized = sanitized[:32]

    return f"{url_hash}-{sanitized}.js"


def get_plugin_cache_path(url: str) -> Path:
    """Get the filesystem path for a cached plugin file."""
    filename = get_plugin_filename(url)
    return PLUGINS_DIR / filename


def get_plugin_cached_url(url: str) -> str:
    """Get the static URL path for a cached plugin."""
    filename = get_plugin_filename(url)
    return f"/static/plugins/{filename}"


async def download_plugin(url: str, force: bool = False) -> str | None:
    """
    Download a remote plugin JS script and cache it in PLUGINS_DIR.
    Returns the cached static URL (e.g. /static/plugins/{hash}-{name}.js),
    or None if download failed.
    """
    if not url or not url.strip():
        return None

    PLUGINS_DIR.mkdir(parents=True, exist_ok=True)
    target_path = get_plugin_cache_path(url)

    if target_path.exists() and not force:
        return get_plugin_cached_url(url)

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url.strip())
            if resp.status_code == 200:
                target_path.write_bytes(resp.content)
                return get_plugin_cached_url(url)
    except Exception as e:
        print(f"Warning: Failed to download plugin from {url}: {e}")
        return None
    return None


def cleanup_unused_plugins(session: Session) -> None:
    """
    Delete cached plugin files that are no longer referenced by any active webcomponent site.
    """
    if not PLUGINS_DIR.exists():
        return

    sites = session.exec(select(Site).where(Site.site_type == "webcomponent")).all()
    active_filenames = {get_plugin_filename(s.url) for s in sites if s.url}

    for file_path in PLUGINS_DIR.glob("*.js"):
        if file_path.name not in active_filenames:
            try:
                file_path.unlink()
            except Exception as e:
                print(f"Warning: Failed to remove unused plugin file {file_path}: {e}")
