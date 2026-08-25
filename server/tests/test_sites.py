import asyncio
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import Group, Site
from app.routers.sites import _update_site_metadata


def test_create_site(client: TestClient, session: Session) -> None:
    """Test creating a site with all fields provided (no background tasks)."""
    with patch("app.routers.sites._update_site_metadata") as mock_update:
        response = client.post(
            "/api/sites/",
            json={
                "url": "https://example.com",
                "title": "Example Website",
                "icon_url": "https://example.com/icon.png",
                "description": "An example site for testing",
                "sort_order": 1.2,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["url"] == "https://example.com"
        assert data["title"] == "Example Website"
        assert data["icon_url"] == "https://example.com/icon.png"
        assert data["description"] == "An example site for testing"
        assert data["sort_order"] == 1.2
        assert data["col_span"] == 1
        assert data["row_span"] == 1
        assert "id" in data

        # Verify database state directly
        site = session.get(Site, data["id"])
        assert site is not None
        assert site.url == "https://example.com"
        assert site.col_span == 1
        assert site.row_span == 1

        # Background task should NOT be added
        mock_update.assert_not_called()


def test_create_site_triggers_background_task(
    client: TestClient, session: Session
) -> None:
    """Test creating a site with missing title/icon triggers background metadata fetching."""
    with patch("app.routers.sites._update_site_metadata") as mock_update:
        response = client.post(
            "/api/sites/", json={"url": "https://example.com"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["url"] == "https://example.com"
        assert data["title"] is None
        assert data["icon_url"] is None

        # Background task should be registered
        mock_update.assert_called_once()


def test_list_sites(client: TestClient, session: Session) -> None:
    """Test listing sites, sorted by sort_order."""
    # Initially empty
    response = client.get("/api/sites/")
    assert response.status_code == 200
    assert response.json() == []

    # Insert sites with different sort orders
    s1 = Site(url="https://a.com", title="A", sort_order=2.0)
    s2 = Site(url="https://b.com", title="B", sort_order=1.0)
    session.add_all([s1, s2])
    session.commit()

    # Get sorted list
    response = client.get("/api/sites/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["title"] == "B"
    assert data[1]["title"] == "A"


def test_update_site(client: TestClient, session: Session) -> None:
    """Test updating site fields."""
    s = Site(url="https://old.com", title="Old", sort_order=1.0)
    session.add(s)
    session.commit()
    session.refresh(s)

    response = client.patch(
        f"/api/sites/{s.id}",
        json={"url": "https://new.com", "title": "New", "sort_order": 0.5},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["url"] == "https://new.com"
    assert data["title"] == "New"
    assert data["sort_order"] == 0.5

    # Try updating non-existent site
    response = client.patch("/api/sites/9999", json={"title": "Ghost"})
    assert response.status_code == 404


def test_create_and_update_site_spans(client: TestClient, session: Session) -> None:
    """Test creating and updating sites with custom col_span and row_span."""
    # Create with custom spans
    response = client.post(
        "/api/sites/",
        json={
            "url": "https://dashboard.example.com",
            "title": "Custom Spans Site",
            "icon_url": "https://example.com/icon.png",
            "col_span": 2,
            "row_span": 3,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["col_span"] == 2
    assert data["row_span"] == 3
    site_id = data["id"]

    # Verify db state
    site = session.get(Site, site_id)
    assert site is not None
    assert site.col_span == 2
    assert site.row_span == 3

    # Update col_span and row_span
    response = client.patch(
        f"/api/sites/{site_id}",
        json={"col_span": 4, "row_span": 1},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["col_span"] == 4
    assert data["row_span"] == 1

    session.refresh(site)
    assert site.col_span == 4
    assert site.row_span == 1


def test_delete_site(client: TestClient, session: Session) -> None:
    """Test deleting a site."""
    s = Site(url="https://delete.com", title="Delete Me")
    session.add(s)
    session.commit()
    session.refresh(s)

    response = client.delete(f"/api/sites/{s.id}")
    assert response.status_code == 204

    # Verify deleted from database
    assert session.get(Site, s.id) is None

    # Try deleting non-existent site
    response = client.delete("/api/sites/9999")
    assert response.status_code == 404


def test_reorder_sites(client: TestClient, session: Session) -> None:
    """Test bulk-updating sort_order and group membership for multiple sites."""
    g = Group(name="Work", sort_order=1.0)
    session.add(g)
    session.commit()
    session.refresh(g)

    s1 = Site(url="https://a.com", title="A", sort_order=1.0, group_id=None)
    s2 = Site(url="https://b.com", title="B", sort_order=2.0, group_id=g.id)
    session.add_all([s1, s2])
    session.commit()
    session.refresh(s1)
    session.refresh(s2)

    # Bulk reorder: move s1 to group g and update sort orders
    payload = [
        {"id": s1.id, "sort_order": 0.5, "group_id": g.id},
        {"id": s2.id, "sort_order": 1.5, "group_id": None},
    ]
    response = client.post("/api/sites/reorder", json=payload)
    assert response.status_code == 204

    # Verify db state updates
    session.refresh(s1)
    session.refresh(s2)
    assert s1.sort_order == 0.5
    assert s1.group_id == g.id
    assert s2.sort_order == 1.5
    assert s2.group_id is None


def test_update_site_metadata_task(session: Session) -> None:
    """Test the _update_site_metadata background helper function directly with mocked metadata services."""
    s = Site(url="https://example.com", title=None, icon_url=None)
    session.add(s)
    session.commit()
    session.refresh(s)

    mock_metadata = {
        "title": "Fetched Title",
        "icon_url": "https://example.com/favicon.png",
    }

    with patch(
        "app.routers.sites.fetch_site_metadata",
        AsyncMock(return_value=mock_metadata),
    ), patch(
        "app.routers.sites.download_icon",
        AsyncMock(return_value="/static/icons/1.png"),
    ):
        # Run the async background task synchronously in our test thread
        asyncio.run(_update_site_metadata(s.id, s.url))

        # Invalidate session cache to read fresh state from DB
        session.expire_all()

        updated_site = session.get(Site, s.id)
        assert updated_site is not None
        assert updated_site.title == "Fetched Title"
        assert updated_site.icon_url == "/static/icons/1.png"


def test_create_plugin_site(client: TestClient, session: Session) -> None:
    """Test creating iframe and webcomponent plugin sites with plugin_params."""
    with patch("app.routers.sites._update_site_metadata") as mock_update:
        response = client.post(
            "/api/sites/",
            json={
                "url": "https://example.com/widget.html",
                "site_type": "iframe",
                "plugin_params": "key1=value1\nkey2=value2",
                "col_span": 2,
                "row_span": 1,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["site_type"] == "iframe"
        assert data["plugin_params"] == "key1=value1\nkey2=value2"
        assert data["col_span"] == 2
        assert data["row_span"] == 1
        # Should not trigger metadata scraper for non-builtin sites
        mock_update.assert_not_called()

        site_id = data["id"]
        # Update to webcomponent plugin
        update_res = client.patch(
            f"/api/sites/{site_id}",
            json={
                "site_type": "webcomponent",
                "plugin_params": "theme=dark\nrefresh=30",
            },
        )
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["site_type"] == "webcomponent"
        assert updated["plugin_params"] == "theme=dark\nrefresh=30"


def test_site_icon_cleanup_on_update_and_delete(client: TestClient) -> None:
    """Test that updating or deleting a site cleans up its local static icon file."""
    import os

    # 1. Upload two icons
    f1 = {"file": ("icon1.png", b"icon1 bytes", "image/png")}
    d1 = {"folder": "icons"}
    r1 = client.post("/api/system/upload-image", files=f1, data=d1)
    assert r1.status_code == 200
    url1 = r1.json()["url"]
    file1 = os.path.join("data/files", url1.removeprefix("/static/"))
    assert os.path.isfile(file1)

    f2 = {"file": ("icon2.png", b"icon2 bytes", "image/png")}
    d2 = {"folder": "icons"}
    r2 = client.post("/api/system/upload-image", files=f2, data=d2)
    assert r2.status_code == 200
    url2 = r2.json()["url"]
    file2 = os.path.join("data/files", url2.removeprefix("/static/"))
    assert os.path.isfile(file2)

    # 2. Create site with icon1
    res = client.post("/api/sites/", json={"url": "https://example.com", "title": "Example", "icon_url": url1})
    assert res.status_code == 201
    site_id = res.json()["id"]

    # 3. Update icon to icon2 -> icon1 file deleted
    patch_res = client.patch(f"/api/sites/{site_id}", json={"icon_url": url2})
    assert patch_res.status_code == 200
    assert not os.path.isfile(file1)
    assert os.path.isfile(file2)

    # 4. Delete site -> icon2 file deleted
    del_res = client.delete(f"/api/sites/{site_id}")
    assert del_res.status_code == 204
    assert not os.path.isfile(file2)








