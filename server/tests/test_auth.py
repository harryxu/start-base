"""Unit tests for authentication, credentials update, access_mode configuration, and guards."""

def test_none_guard_access(client) -> None:
    """In none_guard mode, all read and write endpoints are accessible without login."""
    res = client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["access_mode"] == "none_guard"
    assert res.json()["user"] is None

    # Unauthenticated write operation
    create_res = client.post(
        "/api/sites/",
        json={"url": "https://example.com", "title": "Example Site"},
    )
    assert create_res.status_code in (200, 201)


def test_access_mode_switch_requires_initial_admin(client) -> None:
    """Switching to write_guard with no existing users requires username and password."""
    # Attempt to enable write_guard without username/password
    res = client.patch("/api/config/access-mode", json={"access_mode": "write_guard"})
    assert res.status_code == 400
    assert "Username and password are required" in res.json()["detail"]

    # Enable write_guard while providing initial admin credentials
    res = client.patch(
        "/api/config/access-mode",
        json={
            "access_mode": "write_guard",
            "username": "admin",
            "password": "secretpassword",
        },
    )
    assert res.status_code == 200
    assert res.json()["access_mode"] == "write_guard"


def test_write_guard_enforcement(client) -> None:
    """In write_guard mode, GET is allowed but write operations require login."""
    # Setup initial admin user and write_guard mode
    client.patch(
        "/api/config/access-mode",
        json={
            "access_mode": "write_guard",
            "username": "admin",
            "password": "secretpassword",
        },
    )

    # Clear any session cookies if set
    client.cookies.clear()

    # GET is allowed
    get_res = client.get("/api/sites/")
    assert get_res.status_code == 200

    # Write operation without login should fail with 401
    write_res = client.post(
        "/api/sites/",
        json={"url": "https://test.com", "title": "Test Site"},
    )
    assert write_res.status_code == 401

    # Login
    login_res = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "secretpassword"},
    )
    assert login_res.status_code == 200
    assert login_res.json()["username"] == "admin"

    # Write operation with login should succeed
    write_res_auth = client.post(
        "/api/sites/",
        json={"url": "https://test.com", "title": "Test Site"},
    )
    assert write_res_auth.status_code in (200, 201)


def test_update_credentials(client) -> None:
    """Authenticated users can update their username and/or password."""
    # Setup initial admin and login
    client.patch(
        "/api/config/access-mode",
        json={
            "access_mode": "write_guard",
            "username": "admin",
            "password": "oldpassword",
        },
    )
    client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "oldpassword"},
    )

    # Fail to update password with wrong current_password
    bad_update = client.patch(
        "/api/auth/credentials",
        json={"current_password": "wrongpassword", "new_password": "newpassword"},
    )
    assert bad_update.status_code == 400

    # Successfully update username and password
    good_update = client.patch(
        "/api/auth/credentials",
        json={
            "username": "admin_new",
            "current_password": "oldpassword",
            "new_password": "newpassword",
        },
    )
    assert good_update.status_code == 200
    assert good_update.json()["username"] == "admin_new"

    # Logout and verify login with new credentials
    client.post("/api/auth/logout")

    login_new = client.post(
        "/api/auth/login",
        json={"username": "admin_new", "password": "newpassword"},
    )
    assert login_new.status_code == 200


def test_full_guard_enforcement(client) -> None:
    """In full_guard mode, all requests (including GET) require login."""
    # Setup admin and set access_mode to full_guard
    client.patch(
        "/api/config/access-mode",
        json={
            "access_mode": "full_guard",
            "username": "admin",
            "password": "secretpassword",
        },
    )
    client.cookies.clear()

    # GET without login fails with 401
    get_res = client.get("/api/sites/")
    assert get_res.status_code == 401

    # Login and verify GET succeeds
    client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "secretpassword"},
    )
    assert client.get("/api/sites/").status_code == 200
