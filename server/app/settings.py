"""Application settings management using Pydantic Settings."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

SERVER_ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_FILE_PATH = SERVER_ROOT_DIR / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    database_url: str = "sqlite:///./data/db/start_base.db"

    # Security & Session Settings
    session_secret_key: str = (
        "start-base-secret-session-key-change-in-production"
    )
    session_cookie_name: str = "start_base_session"
    max_age_seconds: int = 60 * 60 * 24 * 30  # 30 days

    # Demo Mode Setting
    demo_mode: bool = False

    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached Settings instance."""
    return Settings()


settings = get_settings()
