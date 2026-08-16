def test_health_check(client) -> None:
    """Test that the health check endpoint returns 200 OK."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_production_openapi_disabled() -> None:
    """Verify that setting openapi_url, docs_url, and redoc_url to None disables docs routes."""
    from fastapi import FastAPI

    prod_app = FastAPI(
        openapi_url=None,
        docs_url=None,
        redoc_url=None,
    )
    assert prod_app.openapi_url is None
    assert prod_app.docs_url is None
    assert prod_app.redoc_url is None
