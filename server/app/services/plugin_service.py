"""Service for downloading, caching, deduplicating, and serving Web Component plugin scripts."""

import hashlib
import json
import logging
import re
import urllib.parse
from pathlib import Path

import httpx
from sqlmodel import Session, select

from app.models import Site, SiteRead

logger = logging.getLogger(__name__)

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

    if path_name.endswith((".js", ".mjs")):
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


def parse_plugin_metadata(script_text: str) -> dict | None:
    """
    Parse metadata comment block from a plugin JavaScript module.
    Extracts @api_urls, @name, @version, @description, @author.
    Returns a dict if metadata is found, otherwise None.
    """
    if not script_text or not script_text.strip():
        return None

    api_urls: list[str] = []
    metadata: dict = {}

    # Extract directives line by line
    for line in script_text.splitlines():
        line = line.strip()
        # Clean leading comment markers
        cleaned = re.sub(r"^(\/\*\*?|\*|\/\/)\s*", "", line)
        # Clean trailing comment marker */
        cleaned = re.sub(r"\s*\*\/$", "", cleaned).strip()

        # Match @api_urls <url1>, <url2>...
        match_urls = re.match(r"^@api_urls\s+([^\r\n]+)", cleaned, re.IGNORECASE)
        if match_urls:
            urls_str = match_urls.group(1).strip()
            for u in urls_str.split(","):
                u_val = u.strip()
                if u_val and u_val not in api_urls:
                    api_urls.append(u_val)
            continue

        # Match @name <name>
        match_name = re.match(r"^@name\s+([^\r\n]+)", cleaned, re.IGNORECASE)
        if match_name:
            metadata["name"] = match_name.group(1).strip()
            continue

        # Match @version <ver>
        match_version = re.match(r"^@version\s+([^\r\n]+)", cleaned, re.IGNORECASE)
        if match_version:
            metadata["version"] = match_version.group(1).strip()
            continue

        # Match @description <desc>
        match_desc = re.match(r"^@description\s+([^\r\n]+)", cleaned, re.IGNORECASE)
        if match_desc:
            metadata["description"] = match_desc.group(1).strip()
            continue

        # Match @author <author>
        match_author = re.match(r"^@author\s+([^\r\n]+)", cleaned, re.IGNORECASE)
        if match_author:
            metadata["author"] = match_author.group(1).strip()
            continue

    if api_urls:
        metadata["api_urls"] = api_urls

    return metadata if metadata else None


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
            logger.warning("Failed to download plugin from %s: HTTP %s", url, resp.status_code)
    except (httpx.HTTPError, OSError) as e:
        logger.warning("Failed to download plugin from %s: %s", url, e)
        return None
    return None


async def sync_plugin_for_site(site_id: int, url: str, force: bool = False) -> str | None:
    """
    Download/cache plugin script, parse metadata, and persist plugin_meta to the Site database record.
    """
    if not url or not url.strip():
        return None

    PLUGINS_DIR.mkdir(parents=True, exist_ok=True)
    target_path = get_plugin_cache_path(url)

    content_bytes: bytes | None = None

    if target_path.exists() and not force:
        try:
            content_bytes = target_path.read_bytes()
        except OSError as e:
            logger.debug("Failed to read cached plugin file %s: %s", target_path, e)

    if content_bytes is None:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url.strip())
                if resp.status_code == 200:
                    content_bytes = resp.content
                    target_path.write_bytes(content_bytes)
                else:
                    logger.warning("Failed to fetch remote plugin from %s: HTTP %s", url, resp.status_code)
        except (httpx.HTTPError, OSError) as e:
            logger.warning("Failed to download plugin from %s: %s", url, e)
            return None

    if content_bytes is not None:
        try:
            script_text = content_bytes.decode("utf-8", errors="replace")
            meta_dict = parse_plugin_metadata(script_text)
            meta_json = json.dumps(meta_dict, ensure_ascii=False) if meta_dict else None

            from app import database
            with Session(database.engine) as session:
                site = session.get(Site, site_id)
                if site:
                    site.plugin_meta = meta_json
                    session.add(site)
                    session.commit()
        except Exception as e:  # noqa: BLE001
            logger.warning("Failed to parse and persist plugin metadata for site %s: %s", site_id, e)

        return get_plugin_cached_url(url)

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
            except OSError as e:
                logger.warning("Failed to remove unused plugin file %s: %s", file_path, e)

