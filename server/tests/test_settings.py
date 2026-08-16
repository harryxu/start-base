"""Unit tests for Pydantic Settings configuration."""

import os
from unittest.mock import patch

from app.settings import Settings, get_settings


def test_default_settings() -> None:
    """Test default values for application settings."""
    settings = Settings()
    assert settings.database_url == "sqlite:///./data/db/start_base.db"
    assert (
        settings.session_secret_key
        == "start-base-secret-session-key-change-in-production"
    )
    assert settings.session_cookie_name == "start_base_session"
    assert settings.max_age_seconds == 60 * 60 * 24 * 30


def test_settings_from_env() -> None:
    """Test that environment variables properly override default settings."""
    with patch.dict(
        os.environ,
        {
            "DATABASE_URL": "sqlite:///./test_custom.db",
            "SESSION_SECRET_KEY": "custom-secret-key-12345",
            "SESSION_COOKIE_NAME": "custom_session_cookie",
            "MAX_AGE_SECONDS": "3600",
        },
        clear=False,
    ):
        settings = Settings()
        assert settings.database_url == "sqlite:///./test_custom.db"
        assert settings.session_secret_key == "custom-secret-key-12345"
        assert settings.session_cookie_name == "custom_session_cookie"
        assert settings.max_age_seconds == 3600


def test_get_settings_caching() -> None:
    """Test that get_settings() returns a cached singleton instance."""
    s1 = get_settings()
    s2 = get_settings()
    assert s1 is s2


def test_env_file_path_resolution() -> None:
    """Test that ENV_FILE_PATH points to the server root directory .env file."""
    from app.settings import ENV_FILE_PATH, SERVER_ROOT_DIR

    assert ENV_FILE_PATH == SERVER_ROOT_DIR / ".env"
    assert (SERVER_ROOT_DIR / "app").is_dir()

