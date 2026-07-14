"""Service for fetching website metadata (title and favicon)."""
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup


async def fetch_site_metadata(url: str) -> dict:
    """
    Fetch the page title and favicon URL for a website.

    Returns a dict with keys 'title' and 'icon_url'; either may be None.
    Falls back to Google Favicons API if HTML parsing fails.
    """
    result: dict = {"title": None, "icon_url": None}

    try:
        async with httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; StartBase/1.0)"},
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            # Extract page title
            title_tag = soup.find("title")
            if title_tag and title_tag.string:
                result["title"] = title_tag.string.strip()[:200]

            # Extract favicon from <link> tags
            icon_url: str | None = None
            for rel_value in ["icon", "shortcut icon", "apple-touch-icon"]:
                link = soup.find(
                    "link",
                    rel=lambda r, rv=rel_value: r
                    and (rv in r if isinstance(r, list) else rv == r),
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
        # On any failure, use Google Favicons API as fallback
        try:
            parsed = urlparse(url)
            result["icon_url"] = (
                f"https://www.google.com/s2/favicons?domain={parsed.netloc}&sz=64"
            )
        except Exception:
            pass

    return result
