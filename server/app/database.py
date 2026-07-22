import os
from sqlmodel import Session, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/db/start_base.db")


def ensure_db_directory(url: str) -> None:
    """Ensure the parent directory for SQLite database exists before connecting."""
    if url.startswith("sqlite:///"):
        db_path = url.replace("sqlite:///", "")
        if db_path and db_path != ":memory:":
            dir_path = os.path.dirname(db_path)
            if dir_path:
                os.makedirs(dir_path, exist_ok=True)


ensure_db_directory(DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)


def get_session():
    """Yield a database session for use as a FastAPI dependency."""
    with Session(engine) as session:
        yield session
