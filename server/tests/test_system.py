"""Unit tests for system API endpoints."""

from fastapi.testclient import TestClient


def test_upload_image_default_folder(client: TestClient) -> None:
    """Test uploading an image file to default root folder (data/files)."""
    file_content = b"fake image bytes"
    files = {"file": ("test_logo.png", file_content, "image/png")}
    response = client.post("/api/system/upload-image", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert data["url"].startswith("/static/custom_")
    assert data["url"].endswith(".png")


def test_upload_image_custom_folder(client: TestClient) -> None:
    """Test uploading an image with a custom target folder relative to data/files."""
    file_content = b"fake image bytes"
    files = {"file": ("group_banner.png", file_content, "image/png")}
    data = {"folder": "groups/banners"}
    response = client.post("/api/system/upload-image", files=files, data=data)
    assert response.status_code == 200
    res_data = response.json()
    assert "url" in res_data
    assert res_data["url"].startswith("/static/groups/banners/custom_")
    assert res_data["url"].endswith(".png")


def test_upload_image_invalid_file_type(client: TestClient) -> None:
    """Test uploading non-image file type returns 400 Bad Request."""
    file_content = b"print('hello')"
    files = {"file": ("script.py", file_content, "text/x-python")}
    response = client.post("/api/system/upload-image", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "Only image or icon files are allowed" in data["detail"]


def test_upload_image_path_traversal(client: TestClient) -> None:
    """Test path traversal attempt in folder returns 400 Bad Request."""
    file_content = b"fake image bytes"
    files = {"file": ("test.png", file_content, "image/png")}
    data = {"folder": "../../outside"}
    response = client.post("/api/system/upload-image", files=files, data=data)
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid target path."


def test_upload_plugin_success(client: TestClient) -> None:
    """Test uploading a valid JS plugin file with metadata."""
    file_content = b"""/**
 * @name Sample Widget
 * @version 1.0.0
 * @api_urls https://api.example.com
 */
export default {};"""
    files = {"file": ("custom-widget.js", file_content, "application/javascript")}
    response = client.post("/api/system/upload-plugin", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert data["url"].startswith("/static/plugins/")
    assert data["url"].endswith("-custom-widget.js")
    assert data["filename"].endswith("-custom-widget.js")
    assert data["meta"] is not None
    assert data["meta"]["name"] == "Sample Widget"
    assert data["meta"]["version"] == "1.0.0"
    assert data["meta"]["api_urls"] == ["https://api.example.com"]


def test_upload_plugin_mjs(client: TestClient) -> None:
    """Test uploading a valid .mjs plugin file."""
    file_content = b"export default { mount() {} };"
    files = {"file": ("module.mjs", file_content, "application/javascript")}
    response = client.post("/api/system/upload-plugin", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["url"].startswith("/static/plugins/")
    assert data["url"].endswith("-module.js")


def test_upload_plugin_invalid_type(client: TestClient) -> None:
    """Test uploading non-js file returns 400 Bad Request."""
    file_content = b"fake content"
    files = {"file": ("photo.png", file_content, "image/png")}
    response = client.post("/api/system/upload-plugin", files=files)
    assert response.status_code == 400
    assert "Only JavaScript plugin files (.js, .mjs) are allowed" in response.json()["detail"]


def test_upload_plugin_empty_file(client: TestClient) -> None:
    """Test uploading empty plugin file returns 400 Bad Request."""
    files = {"file": ("empty.js", b"", "application/javascript")}
    response = client.post("/api/system/upload-plugin", files=files)
    assert response.status_code == 400
    assert "Plugin file is empty" in response.json()["detail"]

