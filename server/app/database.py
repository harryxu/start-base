"""Database engine and session factory for Start Base."""
from sqlmodel import Session, create_engine

DATABASE_URL = "sqlite:///./start_base.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)


def get_session():
    """Yield a database session for use as a FastAPI dependency."""
    with Session(engine) as session:
        yield session
