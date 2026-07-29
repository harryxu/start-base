"""Service for fetching website metadata (title and favicon)."""

from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup


async def fetch_site_metadata(url: str) -> dict:
    """
    Fetch the page title and favicon URL for a website.

    Returns a dict with keys 'title' and 'icon_url'; either may be None.
    Falls back to domain name and Google Favicons API if HTML parsing fails or site blocks bot requests.
    """
    result: dict = {"title": None, "icon_url": None}
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        async with httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=True,
            headers=headers,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            # Extract page title
            title_tag = soup.find("title")
            if title_tag and title_tag.string:
                title_str = title_tag.string.strip()[:200]
                # Filter out Cloudflare / CDN anti-bot challenge titles
                if title_str.lower() not in {
                    "just a moment...",
                    "attention required!",
                    "403 forbidden",
                    "access denied",
                }:
                    result["title"] = title_str

            if not result["title"]:
                parsed = urlparse(url)
                result["title"] = parsed.netloc.split(":")[0].replace("www.", "")

            # Extract favicon from <link> tags
            icon_url: str | None = None
            for rel_value in ["icon", "shortcut icon", "apple-touch-icon"]:
                link = soup.find(
                    "link",
                    rel=lambda r, rv=rel_value: (
                        r and (rv in r if isinstance(r, list) else rv == r)
                    ),
                )
                if link and link.get("href"):
                    icon_url = urljoin(str(response.url), link["href"])
                    break

            # Fallback: try /favicon.ico
            if not icon_url:
                parsed = urlparse(url)
                favicon_url = f"{parsed.scheme}://{parsed.netloc}/favicon.ico"
                try:
                    fav_resp = await client.head(favicon_url)
                    if fav_resp.status_code == 200:
                        icon_url = favicon_url
                except Exception:
                    pass

            # Final fallback: Google Favicons API
            if not icon_url:
                parsed = urlparse(url)
                icon_url = (
                    f"https://www.google.com/s2/favicons?domain={parsed.netloc}&sz=64"
                )

            result["icon_url"] = icon_url

    except Exception:
        # On any failure (e.g. Cloudflare 403 / network timeout), fallback title to domain and icon to Google Favicons
        try:
            parsed = urlparse(url)
            result["title"] = parsed.netloc.split(":")[0].replace("www.", "")
            result["icon_url"] = (
                f"https://www.google.com/s2/favicons?domain={parsed.netloc}&sz=64"
            )
        except Exception:
            pass

    return result


import mimetypes
import os


async def download_icon(icon_url: str, site_id: int) -> str | None:
    """Download the icon and save it locally, returning the local URL."""
    try:
        async with httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; StartBase/1.0)"},
        ) as client:
            response = await client.get(icon_url)
            response.raise_for_status()

            content_type = response.headers.get("Content-Type", "")
            ext = mimetypes.guess_extension(content_type.split(";")[0])
            if not ext:
                parsed = urlparse(icon_url)
                _, ext = os.path.splitext(parsed.path)
            if not ext:
                ext = ".png"

            os.makedirs("data/files/icons", exist_ok=True)
            filename = f"{site_id}{ext}"
            filepath = os.path.join("data/files/icons", filename)
            with open(filepath, "wb") as f:
                f.write(response.content)

            return f"/static/icons/{filename}"
    except Exception:
        return None
