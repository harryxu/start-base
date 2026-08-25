"""Service for local file storage operations."""

import logging
import os

logger = logging.getLogger(__name__)


def delete_local_static_file(static_url: str | None, base_dir: str = "data/files") -> bool:
    """Safely delete a local static file if the URL points to a file within base_dir.

    Args:
        static_url: The static URL path, e.g. '/static/backgrounds/custom_123.jpg'.
        base_dir: The base directory where static files are located.

    Returns:
        True if the file existed and was successfully deleted, False otherwise.
    """
    if not static_url or not isinstance(static_url, str):
        return False

    clean_url = static_url.strip()
    if not clean_url.startswith("/static/"):
        return False

    rel_path = clean_url[len("/static/") :].lstrip("/\\")
    if not rel_path:
        return False

    abs_base = os.path.abspath(base_dir)
    target_path = os.path.abspath(os.path.join(abs_base, rel_path))

    # Path traversal protection: make sure target_path is within abs_base and not abs_base itself
    if target_path == abs_base or not target_path.startswith(abs_base + os.sep):
        return False

    if os.path.isfile(target_path):
        try:
            os.remove(target_path)
            logger.info("Deleted static file: %s", target_path)
            return True
        except OSError as e:
            logger.warning("Failed to delete static file %s: %s", target_path, e)
            return False

    return False
