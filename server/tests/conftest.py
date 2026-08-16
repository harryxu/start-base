import os
import sys
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

# Ensure the server directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import database as db_mod
from app.settings import settings
from main import app as fastapi_app


@pytest.fixture(autouse=True)
def default_test_settings():
    """Ensure settings.demo_mode defaults to False during test runs unless explicitly overridden in a test."""
    original_demo_mode = settings.demo_mode
    settings.demo_mode = False
    yield
    settings.demo_mode = original_demo_mode


@pytest.fixture(name="session")
def session_fixture() -> Generator[Session]:
    """
    Fixture to set up an in-memory SQLite database for each test.
    Overrides the database engine inside app.database to ensure the
    lifespan startup/shutdown uses the testing database.
    """
    # Create testing engine with StaticPool so all connections share the same memory DB
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Backup the original database engine
    original_engine = db_mod.engine
    # Set the app's database engine to the in-memory testing engine
    db_mod.engine = engine

    # Ensure tables are created in the test database via Alembic migrations
    from alembic.config import Config

    from alembic import command

    alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    alembic_cfg.set_main_option(
        "script_location", os.path.join(os.path.dirname(__file__), "..", "alembic")
    )
    alembic_cfg.attributes["connection"] = engine.connect()
    command.upgrade(alembic_cfg, "head")

    with Session(engine) as session:
        yield session

    # Drop tables after test runs
    SQLModel.metadata.drop_all(engine)
    # Restore original database engine
    db_mod.engine = original_engine


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient]:
    """
    Fixture to set up the FastAPI TestClient with dependency overrides.
    """

    def get_session_override() -> Generator[Session]:
        yield session

    # Override get_session dependency
    fastapi_app.dependency_overrides[db_mod.get_session] = get_session_override

    # Initialize TestClient which triggers the app lifespan
    with TestClient(fastapi_app) as client:
        yield client

    # Clear dependency overrides after test runs
    fastapi_app.dependency_overrides.clear()
