"""Unit tests for plugin proxy service, metadata parsing, security rules, and router endpoint."""

import json
from unittest.mock import AsyncMock, patch
import httpx
import pytest
from sqlmodel import Session

from app.models import Site
from app.services.plugin_proxy_service import (
    extract_api_urls,
    is_ip_blocked,
    is_url_allowed,
    validate_target_url,
)
from app.services.plugin_service import parse_plugin_metadata


def test_parse_plugin_metadata_full():
    sample_js = """
    /**
     * @name Weather Widget
     * @version 1.2.0
     * @author Harry
     * @description Real-time forecast & status
     * @api_urls https://api.weatherapi.com/v1/, http://192.168.1.100:8123/api/, https://jsonplaceholder.typicode.com/users
     */

    class WeatherPlugin extends HTMLElement {
        connectedCallback() {
            this.innerHTML = "<div>Weather</div>";
        }
    }
    export default WeatherPlugin;
    """

    meta = parse_plugin_metadata(sample_js)
    assert meta is not None
    assert meta["name"] == "Weather Widget"
    assert meta["version"] == "1.2.0"
    assert meta["author"] == "Harry"
    assert meta["description"] == "Real-time forecast & status"
    assert "https://api.weatherapi.com/v1/" in meta["api_urls"]
    assert "http://192.168.1.100:8123/api/" in meta["api_urls"]
    assert "https://jsonplaceholder.typicode.com/users" in meta["api_urls"]


def test_parse_plugin_metadata_empty():
    sample_js = "export default { mount(el) { el.textContent = 'hi'; } };"
    meta = parse_plugin_metadata(sample_js)
    assert meta is None


def test_is_url_allowed():
    allowed = [
        "https://jsonplaceholder.typicode.com/users",
        "https://api.weatherapi.com/v1/",
        "http://192.168.1.100:8123/api/",
        "https://example.com/",
    ]

    # Prefix matches
    assert is_url_allowed("https://jsonplaceholder.typicode.com/users", allowed)
    assert is_url_allowed("https://jsonplaceholder.typicode.com/users/1", allowed)
    assert is_url_allowed("https://jsonplaceholder.typicode.com/users?page=1", allowed)
    assert is_url_allowed("https://api.weatherapi.com/v1/current.json", allowed)
    assert is_url_allowed("http://192.168.1.100:8123/api/states", allowed)
    assert is_url_allowed("https://example.com/anything/else", allowed)

    # Case-insensitive scheme and hostname
    assert is_url_allowed("HTTPS://JSONPlaceholder.typicode.com/users/1", allowed)

    # Non-matching prefix
    assert not is_url_allowed("https://jsonplaceholder.typicode.com/", allowed)
    assert not is_url_allowed("https://jsonplaceholder.typicode.com/posts", allowed)
    assert not is_url_allowed("http://jsonplaceholder.typicode.com/users", allowed)
    assert not is_url_allowed("https://api.weatherapi.com/v2/current.json", allowed)
    assert not is_url_allowed("https://evil.com/data", allowed)
    assert not is_url_allowed("https://example.com", allowed)
    assert not is_url_allowed("https://test.com", [])


def test_is_ip_blocked_security():
    # Cloud metadata is ALWAYS blocked even if allow_lan=True
    blocked, _ = is_ip_blocked("169.254.169.254", allow_lan=True)
    assert blocked is True
    blocked, _ = is_ip_blocked("169.254.1.1", allow_lan=False)
    assert blocked is True

    # Private IP when allow_lan=False -> BLOCKED
    blocked, _ = is_ip_blocked("192.168.1.1", allow_lan=False)
    assert blocked is True
    blocked, _ = is_ip_blocked("10.0.0.5", allow_lan=False)
    assert blocked is True
    blocked, _ = is_ip_blocked("127.0.0.1", allow_lan=False)
    assert blocked is True

    # Private IP when allow_lan=True -> ALLOWED
    blocked, _ = is_ip_blocked("192.168.1.1", allow_lan=True)
    assert blocked is False
    blocked, _ = is_ip_blocked("10.0.0.5", allow_lan=True)
    assert blocked is False

    # Public IP -> ALLOWED in both
    blocked, _ = is_ip_blocked("8.8.8.8", allow_lan=False)
    assert blocked is False
    blocked, _ = is_ip_blocked("1.1.1.1", allow_lan=True)
    assert blocked is False


def test_plugin_proxy_api_site_not_found(client):
    res = client.post(
        "/api/plugins/proxy",
        json={"site_id": 9999, "url": "https://jsonplaceholder.typicode.com/users"},
    )
    assert res.status_code == 404
    assert res.json()["detail"] == "Site not found"


def test_plugin_proxy_api_no_metadata_forbidden(client, session: Session):
    site = Site(
        url="http://localhost:8016/demo.js",
        title="Plugin without meta",
        site_type="webcomponent",
        plugin_meta=None,
    )
    session.add(site)
    session.commit()
    session.refresh(site)

    res = client.post(
        "/api/plugins/proxy",
        json={"site_id": site.id, "url": "https://jsonplaceholder.typicode.com/users"},
    )
    assert res.status_code == 403
    assert "not in the allowed" in res.json()["detail"]


def test_plugin_proxy_api_host_not_in_allowlist(client, session: Session):
    site = Site(
        url="http://localhost:8016/demo.js",
        title="Plugin with meta",
        site_type="webcomponent",
        plugin_meta=json.dumps({"api_urls": ["https://api.weatherapi.com/v1/"]}),
    )
    session.add(site)
    session.commit()
    session.refresh(site)

    res = client.post(
        "/api/plugins/proxy",
        json={"site_id": site.id, "url": "https://evil.com/data"},
    )
    assert res.status_code == 403
    assert "not in the allowed" in res.json()["detail"]


def test_plugin_proxy_api_lan_access_control(client, session: Session):
    site = Site(
        url="http://localhost:8016/demo.js",
        title="LAN Plugin",
        site_type="webcomponent",
        allow_lan=False,
        plugin_meta=json.dumps({"api_urls": ["http://192.168.1.50:8123/api/"]}),
    )
    session.add(site)
    session.commit()
    session.refresh(site)

    # 1. LAN disabled -> 403
    res = client.post(
        "/api/plugins/proxy",
        json={"site_id": site.id, "url": "http://192.168.1.50:8123/api/states"},
    )
    assert res.status_code == 403
    assert "disabled for this plugin" in res.json()["detail"]

    # 2. LAN enabled -> forwards request
    site.allow_lan = True
    session.add(site)
    session.commit()

    mock_resp = httpx.Response(
        status_code=200,
        headers={"content-type": "application/json"},
        json={"state": "on"},
        request=httpx.Request("GET", "http://192.168.1.50:8123/api/states"),
    )

    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_req:
        mock_req.return_value = mock_resp
        res = client.post(
            "/api/plugins/proxy",
            json={"site_id": site.id, "url": "http://192.168.1.50:8123/api/states"},
        )
        assert res.status_code == 200
        assert res.json() == {"state": "on"}


def test_plugin_proxy_api_success_and_headers_filtering(client, session: Session):
    site = Site(
        url="http://localhost:8016/weather.js",
        title="Weather Widget",
        site_type="webcomponent",
        plugin_meta=json.dumps({"api_urls": ["https://api.weatherapi.com/v1/"]}),
    )
    session.add(site)
    session.commit()
    session.refresh(site)

    fake_data = {"location": "London", "temp_c": 21.5}
    mock_resp = httpx.Response(
        status_code=200,
        headers={"content-type": "application/json", "x-custom-header": "valid-val", "set-cookie": "secret=1"},
        json=fake_data,
        request=httpx.Request("GET", "https://api.weatherapi.com/v1/current.json"),
    )

    with patch("socket.getaddrinfo") as mock_dns, patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_req:
        # Mock DNS resolution to public IP 93.184.216.34
        mock_dns.return_value = [(2, 1, 6, "", ("93.184.216.34", 443))]
        mock_req.return_value = mock_resp

        res = client.post(
            "/api/plugins/proxy",
            json={
                "site_id": site.id,
                "url": "https://api.weatherapi.com/v1/current.json?q=London",
                "method": "GET",
                "headers": {"Authorization": "Bearer token123", "Cookie": "session=bad"},
            },
        )

        assert res.status_code == 200
        assert res.json() == fake_data
        # Verify set-cookie was stripped from output headers
        assert "set-cookie" not in res.headers
        assert res.headers.get("x-custom-header") == "valid-val"

        # Verify outgoing request stripped host session cookie
        call_kwargs = mock_req.call_args.kwargs
        assert "Authorization" in call_kwargs["headers"]
        assert "Cookie" not in call_kwargs["headers"]
        assert "cookie" not in call_kwargs["headers"]
