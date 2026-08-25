"""Unit tests for plugin_service (download, caching, deduplication, and cleanup)."""

import hashlib
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from sqlmodel import Session, SQLModel, create_engine

from app.models import Site
from app.services import plugin_service
from app.services.plugin_service import (
    cleanup_unused_plugins,
    download_plugin,
    get_plugin_cache_path,
    get_plugin_cached_url,
    get_plugin_filename,
    to_site_read,
)


@pytest.fixture
def mock_plugins_dir(tmp_path, monkeypatch):
    test_plugins_dir = tmp_path / "plugins"
    test_plugins_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(plugin_service, "PLUGINS_DIR", test_plugins_dir)
    return test_plugins_dir


def test_get_plugin_filename():
    url1 = "http://localhost:8016/demo-plugin.js"
    hash1 = hashlib.sha256(url1.encode("utf-8")).hexdigest()[:16]
    assert get_plugin_filename(url1) == f"{hash1}-demo-plugin.js"

    url2 = "https://cdn.example.com/assets/weather-widget.min.js?v=2"
    hash2 = hashlib.sha256(url2.encode("utf-8")).hexdigest()[:16]
    assert get_plugin_filename(url2) == f"{hash2}-weather-widget-min.js"

    url_empty = ""
    assert get_plugin_filename(url_empty) == "unknown.js"

    url_root = "http://example.com/"
    hash_root = hashlib.sha256(url_root.encode("utf-8")).hexdigest()[:16]
    assert get_plugin_filename(url_root) == f"{hash_root}-plugin.js"

    # Local static plugin URL
    url_local = "/static/plugins/1234567890abcdef-custom-widget.js"
    assert get_plugin_filename(url_local) == "1234567890abcdef-custom-widget.js"


def test_save_uploaded_plugin(mock_plugins_dir):
    from app.services.plugin_service import save_uploaded_plugin

    js_content = b"""/**
 * @name Weather Card
 * @version 1.2.0
 * @api_urls https://api.weather.com/v1/
 */
export default {};
"""
    url, filename, meta = save_uploaded_plugin("my_weather_plugin.v1.js", js_content)
    expected_hash = hashlib.sha256(js_content).hexdigest()[:16]
    expected_filename = f"{expected_hash}-my_weather_plugin-v1.js"

    assert filename == expected_filename
    assert url == f"/static/plugins/{expected_filename}"
    assert meta is not None
    assert meta["name"] == "Weather Card"
    assert meta["version"] == "1.2.0"
    assert meta["api_urls"] == ["https://api.weather.com/v1/"]

    saved_file = mock_plugins_dir / expected_filename
    assert saved_file.exists()
    assert saved_file.read_bytes() == js_content


def test_to_site_read():
    site_builtin = Site(id=1, url="https://example.com", site_type="builtin")
    read_builtin = to_site_read(site_builtin)
    assert read_builtin.plugin_cached_url is None

    url = "http://localhost:8016/demo-plugin.js"
    site_plugin = Site(id=2, url=url, site_type="webcomponent")
    read_plugin = to_site_read(site_plugin)
    assert read_plugin.plugin_cached_url == get_plugin_cached_url(url)

    # Local uploaded plugin URL
    local_url = "/static/plugins/a1b2c3d4e5f67890-demo.js"
    site_local = Site(id=3, url=local_url, site_type="webcomponent")
    read_local = to_site_read(site_local)
    assert read_local.plugin_cached_url == local_url


import asyncio


def test_download_plugin_and_deduplication(mock_plugins_dir):
    async def _test():
        url = "http://localhost:8016/demo-plugin.js"
        fake_js = b"console.log('hello plugin');"

        mock_resp = httpx.Response(
            status_code=200,
            content=fake_js,
            request=httpx.Request("GET", url),
        )

        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_resp

            # First download
            cached_url = await download_plugin(url)
            assert cached_url == get_plugin_cached_url(url)
            assert mock_get.call_count == 1

            file_path = get_plugin_cache_path(url)
            assert file_path.exists()
            assert file_path.read_bytes() == fake_js

            # Second download (same URL) -> Should use cache and not make HTTP call
            cached_url_2 = await download_plugin(url)
            assert cached_url_2 == cached_url
            assert mock_get.call_count == 1

            # Force download -> Should re-fetch
            cached_url_3 = await download_plugin(url, force=True)
            assert cached_url_3 == cached_url
            assert mock_get.call_count == 2

    asyncio.run(_test())


def test_cleanup_unused_plugins(mock_plugins_dir):
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)

    url_a = "http://localhost:8016/plugin-a.js"
    url_b = "http://localhost:8016/plugin-b.js"
    url_orphan = "http://localhost:8016/orphan.js"

    # Create dummy cached files on disk
    file_a = get_plugin_cache_path(url_a)
    file_b = get_plugin_cache_path(url_b)
    file_orphan = get_plugin_cache_path(url_orphan)

    file_a.write_text("plugin a")
    file_b.write_text("plugin b")
    file_orphan.write_text("orphan plugin")

    with Session(engine) as session:
        # Site 1 and Site 2 use URL A (reuse/deduplication test)
        site1 = Site(url=url_a, site_type="webcomponent", title="Site 1")
        site2 = Site(url=url_a, site_type="webcomponent", title="Site 2")
        # Site 3 uses URL B
        site3 = Site(url=url_b, site_type="webcomponent", title="Site 3")
        # Site 4 is a builtin site with URL A (should not count towards webcomponent)
        site4 = Site(url="https://google.com", site_type="builtin", title="Google")

        session.add_all([site1, site2, site3, site4])
        session.commit()

        # Run GC
        cleanup_unused_plugins(session)

        # File A and File B should still exist, orphan should be deleted
        assert file_a.exists()
        assert file_b.exists()
        assert not file_orphan.exists()

        # Delete Site 1 (Site 2 still references URL A)
        session.delete(site1)
        session.commit()
        cleanup_unused_plugins(session)
        assert file_a.exists()

        # Delete Site 2 (now zero sites reference URL A)
        session.delete(site2)
        session.commit()
        cleanup_unused_plugins(session)
        assert not file_a.exists()
        assert file_b.exists()
