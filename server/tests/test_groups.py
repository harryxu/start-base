from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import Group, Site


def test_create_group(client: TestClient, session: Session) -> None:
    """Test creating a new group."""
    response = client.post(
        "/api/groups/", json={"name": "Social", "sort_order": 1.5, "site_border": "1"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Social"
    assert data["sort_order"] == 1.5
    assert data["site_border"] == "1"
    assert "id" in data

    # Verify database state directly
    group = session.get(Group, data["id"])
    assert group is not None
    assert group.name == "Social"
    assert group.sort_order == 1.5
    assert group.site_border == "1"


def test_list_groups(client: TestClient, session: Session) -> None:
    """Test listing groups, sorted by sort_order."""
    # Initially empty
    response = client.get("/api/groups/")
    assert response.status_code == 200
    assert response.json() == []

    # Insert two groups with different sort orders
    g1 = Group(name="Work", sort_order=2.0)
    g2 = Group(name="Fun", sort_order=1.0)
    session.add(g1)
    session.add(g2)
    session.commit()

    # Get ordered by sort_order
    response = client.get("/api/groups/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "Fun"
    assert data[1]["name"] == "Work"


def test_update_group(client: TestClient, session: Session) -> None:
    """Test updating a group's details."""
    g = Group(name="News", sort_order=1.0, site_border="")
    session.add(g)
    session.commit()
    session.refresh(g)

    # Patch group
    response = client.patch(
        f"/api/groups/{g.id}",
        json={"name": "Global News", "sort_order": 0.5, "site_border": "0"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Global News"
    assert data["sort_order"] == 0.5
    assert data["site_border"] == "0"

    # Try patching non-existent group
    response = client.patch("/api/groups/9999", json={"name": "Ghost"})
    assert response.status_code == 404


def test_delete_group_ungroups_sites(
    client: TestClient, session: Session
) -> None:
    """Test deleting a group and verifying its sites become ungrouped."""
    g = Group(name="Dev", sort_order=1.0)
    session.add(g)
    session.commit()
    session.refresh(g)

    # Create a site belonging to this group
    s = Site(url="https://github.com", title="GitHub", group_id=g.id)
    session.add(s)
    session.commit()
    session.refresh(s)

    # Delete group
    response = client.delete(f"/api/groups/{g.id}")
    assert response.status_code == 204

    # Verify group is deleted
    assert session.get(Group, g.id) is None

    # Verify site is orphaned (group_id = None)
    session.refresh(s)
    assert s.group_id is None

    # Try deleting non-existent group
    response = client.delete("/api/groups/9999")
    assert response.status_code == 404


def test_reorder_groups(client: TestClient, session: Session) -> None:
    """Test bulk-updating sort_order for multiple groups."""
    g1 = Group(name="A", sort_order=1.0)
    g2 = Group(name="B", sort_order=2.0)
    session.add_all([g1, g2])
    session.commit()
    session.refresh(g1)
    session.refresh(g2)

    # Bulk reorder
    payload = [
        {"id": g1.id, "sort_order": 3.0},
        {"id": g2.id, "sort_order": 0.5},
    ]
    response = client.post("/api/groups/reorder", json=payload)
    assert response.status_code == 204

    # Verify db
    session.refresh(g1)
    session.refresh(g2)
    assert g1.sort_order == 3.0
    assert g2.sort_order == 0.5


def test_group_icon_cleanup_on_update_and_delete(client: TestClient) -> None:
    """Test that updating or deleting a group cleans up its local static icon file."""
    import os

    # 1. Upload two icons
    f1 = {"file": ("gicon1.png", b"gicon1 bytes", "image/png")}
    d1 = {"folder": "icons"}
    r1 = client.post("/api/system/upload-image", files=f1, data=d1)
    assert r1.status_code == 200
    url1 = r1.json()["url"]
    file1 = os.path.join("data/files", url1.removeprefix("/static/"))
    assert os.path.isfile(file1)

    f2 = {"file": ("gicon2.png", b"gicon2 bytes", "image/png")}
    d2 = {"folder": "icons"}
    r2 = client.post("/api/system/upload-image", files=f2, data=d2)
    assert r2.status_code == 200
    url2 = r2.json()["url"]
    file2 = os.path.join("data/files", url2.removeprefix("/static/"))
    assert os.path.isfile(file2)

    # 2. Create group with url1
    res = client.post("/api/groups/", json={"name": "Tools", "icon_url": url1})
    assert res.status_code == 201
    group_id = res.json()["id"]

    # 3. Update group with url2 -> file1 deleted
    patch_res = client.patch(f"/api/groups/{group_id}", json={"icon_url": url2})
    assert patch_res.status_code == 200
    assert not os.path.isfile(file1)
    assert os.path.isfile(file2)

    # 4. Delete group -> file2 deleted
    del_res = client.delete(f"/api/groups/{group_id}")
    assert del_res.status_code == 204
    assert not os.path.isfile(file2)

