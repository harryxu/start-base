import os

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/db/start_base.db")

# Security & Session Settings
SESSION_SECRET_KEY: str = os.environ.get(
    "SESSION_SECRET_KEY", "start-base-secret-session-key-change-in-production"
)
SESSION_COOKIE_NAME: str = "start_base_session"
MAX_AGE_SECONDS: int = 60 * 60 * 24 * 30  # 30 days
