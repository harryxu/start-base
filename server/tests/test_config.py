"""Tests for system configuration endpoints."""

from fastapi.testclient import TestClient


def test_get_default_configs(client: TestClient) -> None:
    """GET /api/config/ returns default configs when database is empty."""
    res = client.get("/api/config/")
    assert res.status_code == 200
    data = res.json()
    assert data["page_title"] == "Start Base"
    assert data["theme"] == "emerald"
    assert data["site_view_mode"] == "full"
    assert data["site-border"] == "0"


def test_batch_update_configs(client: TestClient) -> None:
    """PATCH /api/config/ updates or creates key-value pairs."""
    payload = {
        "page_title": "My Dashboard",
        "theme": "dark",
    }
    res = client.patch("/api/config/", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["page_title"] == "My Dashboard"
    assert data["theme"] == "dark"

    # Verify persistent GET
    get_res = client.get("/api/config/")
    assert get_res.status_code == 200
    assert get_res.json()["page_title"] == "My Dashboard"
    assert get_res.json()["theme"] == "dark"


def test_complex_json_config(client: TestClient) -> None:
    """PATCH /api/config/ handles nested JSON objects/lists cleanly."""
    payload = {
        "custom_menu": [
            {"title": "Link 1", "url": "https://example.com"},
            {"title": "Link 2", "url": "https://test.com"},
        ],
        "layout_settings": {"columns": 3, "compact": True},
    }
    res = client.patch("/api/config/", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data["custom_menu"], list)
    assert len(data["custom_menu"]) == 2
    assert data["custom_menu"][0]["title"] == "Link 1"
    assert data["layout_settings"]["compact"] is True


def test_single_config_crud(client: TestClient) -> None:
    """GET and PUT single config key /api/config/{key}."""
    # Default get
    res = client.get("/api/config/page_title")
    assert res.status_code == 200
    assert res.json() == {"key": "page_title", "value": "Start Base"}

    # Update single key
    put_res = client.put("/api/config/page_title", json={"value": "Custom Title"})
    assert put_res.status_code == 200
    assert put_res.json() == {"key": "page_title", "value": "Custom Title"}

    # Fetch all to confirm
    all_res = client.get("/api/config/")
    assert all_res.json()["page_title"] == "Custom Title"


def test_get_nonexistent_key(client: TestClient) -> None:
    """GET /api/config/{key} returns 404 for unknown non-default key."""
    res = client.get("/api/config/unknown_key_xyz")
    assert res.status_code == 404


def test_update_access_mode_in_demo_mode(client: TestClient) -> None:
    """Modifying access_mode to non-none_guard in demo mode returns 400, while none_guard succeeds."""
    from unittest.mock import patch

    with patch("app.routers.config.settings.demo_mode", True):
        # 1. Submitting none_guard in demo mode succeeds
        ok_res = client.patch("/api/config/access-mode", json={"access_mode": "none_guard"})
        assert ok_res.status_code == 200

        # 2. PATCH /api/config/access-mode with full_guard fails
        res = client.patch("/api/config/access-mode", json={"access_mode": "full_guard"})
        assert res.status_code == 400
        assert res.json()["detail"] == "Authentication mode cannot be modified in demo mode"

        # 3. PATCH /api/config/ with access_mode write_guard fails
        batch_res = client.patch("/api/config/", json={"access_mode": "write_guard"})
        assert batch_res.status_code == 400
        assert batch_res.json()["detail"] == "Authentication mode cannot be modified in demo mode"

        # 4. PUT /api/config/access_mode with full_guard fails
        put_res = client.put("/api/config/access_mode", json={"value": "full_guard"})
        assert put_res.status_code == 400
        assert put_res.json()["detail"] == "Authentication mode cannot be modified in demo mode"

