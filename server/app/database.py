import os

from sqlalchemy.engine import make_url
from sqlmodel import Session, create_engine

from app import settings

db_url = settings.DATABASE_URL


def ensure_db_directory(url: str) -> None:
    """Ensure the parent directory for SQLite database exists before connecting."""
    try:
        parsed_url = make_url(url)
        if (
            parsed_url.get_backend_name() == "sqlite"
            and parsed_url.database
            and parsed_url.database != ":memory:"
        ):
            dir_path = os.path.dirname(os.path.abspath(parsed_url.database))
            if dir_path:
                os.makedirs(dir_path, exist_ok=True)
    except (AttributeError, TypeError, ValueError):
        if url.startswith("sqlite"):
            clean_path = url.split("sqlite:///", 1)[-1]
            if clean_path and clean_path != ":memory:":
                dir_path = os.path.dirname(os.path.abspath(clean_path))
                if dir_path:
                    os.makedirs(dir_path, exist_ok=True)


ensure_db_directory(db_url)

engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False},
    echo=False,
)


def get_session():
    """Yield a database session for use as a FastAPI dependency."""
    with Session(engine) as session:
        yield session
