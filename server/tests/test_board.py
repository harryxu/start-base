from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import Group, Site


def test_get_board_empty(client: TestClient) -> None:
    """Test getting board layout when no groups or sites exist."""
    response = client.get("/api/board/")
    assert response.status_code == 200
    data = response.json()
    assert data["ungrouped_sites"] == []
    assert data["groups"] == []


def test_get_board_mixed_and_sorted(client: TestClient, session: Session) -> None:
    """Test getting aggregated board with sorted groups, nested sorted sites, and ungrouped sites."""
    g1 = Group(name="Dev Tools", sort_order=20.0, site_view_mode="full", site_border="1")
    g2 = Group(name="Search Engines", sort_order=10.0, site_view_mode="icon", site_border="0")
    session.add_all([g1, g2])
    session.commit()
    session.refresh(g1)
    session.refresh(g2)

    # Sites in group 1
    s_dev2 = Site(url="https://gitlab.com", title="GitLab", sort_order=2.0, group_id=g1.id)
    s_dev1 = Site(url="https://github.com", title="GitHub", sort_order=1.0, group_id=g1.id)

    # Sites in group 2
    s_search1 = Site(url="https://google.com", title="Google", sort_order=1.0, group_id=g2.id)

    # Ungrouped sites
    s_ungrouped2 = Site(url="https://news.ycombinator.com", title="HN", sort_order=15.0, group_id=None)
    s_ungrouped1 = Site(url="https://example.com", title="Example", sort_order=5.0, group_id=None)

    session.add_all([s_dev2, s_dev1, s_search1, s_ungrouped2, s_ungrouped1])
    session.commit()

    response = client.get("/api/board/")
    assert response.status_code == 200
    data = response.json()

    # Verify ungrouped sites sorted by sort_order
    assert len(data["ungrouped_sites"]) == 2
    assert data["ungrouped_sites"][0]["title"] == "Example"
    assert data["ungrouped_sites"][1]["title"] == "HN"

    # Verify groups sorted by sort_order
    assert len(data["groups"]) == 2
    assert data["groups"][0]["name"] == "Search Engines"
    assert data["groups"][0]["site_view_mode"] == "icon"
    assert data["groups"][0]["site_border"] == "0"
    assert len(data["groups"][0]["sites"]) == 1
    assert data["groups"][0]["sites"][0]["title"] == "Google"

    assert data["groups"][1]["name"] == "Dev Tools"
    assert data["groups"][1]["site_view_mode"] == "full"
    assert data["groups"][1]["site_border"] == "1"
    assert len(data["groups"][1]["sites"]) == 2
    assert data["groups"][1]["sites"][0]["title"] == "GitHub"
    assert data["groups"][1]["sites"][1]["title"] == "GitLab"


def test_get_board_with_empty_group(client: TestClient, session: Session) -> None:
    """Test empty groups are preserved in the response."""
    g = Group(name="Empty Folder", sort_order=1.0)
    session.add(g)
    session.commit()

    response = client.get("/api/board/")
    assert response.status_code == 200
    data = response.json()
    assert len(data["groups"]) == 1
    assert data["groups"][0]["name"] == "Empty Folder"
    assert data["groups"][0]["sites"] == []
    assert data["ungrouped_sites"] == []


def test_get_board_orphaned_site(client: TestClient, session: Session) -> None:
    """Test site with non-existent group_id falls back into ungrouped_sites."""
    s = Site(url="https://orphan.com", title="Orphan", sort_order=1.0, group_id=99999)
    session.add(s)
    session.commit()

    response = client.get("/api/board/")
    assert response.status_code == 200
    data = response.json()
    assert len(data["ungrouped_sites"]) == 1
    assert data["ungrouped_sites"][0]["title"] == "Orphan"
    assert data["groups"] == []
