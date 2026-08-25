"""System-level API endpoints (file uploads, system info, etc.)."""

import mimetypes
import os
import uuid

import anyio
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.plugin_service import save_uploaded_plugin

router = APIRouter(prefix="/api/system", tags=["system"])

ALLOWED_IMAGE_EXTENSIONS: set[str] = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".ico",
    ".bmp",
    ".avif",
    ".heic",
    ".heif",
}

ALLOWED_PLUGIN_EXTENSIONS: set[str] = {
    ".js",
    ".mjs",
}


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = Form(""),
) -> dict:
    """Upload an image file to a subpath inside data/files and return static URL."""
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    content_type = (file.content_type or "").lower()

    if not ext and content_type:
        guessed = mimetypes.guess_extension(content_type)
        if guessed:
            ext = guessed.lower()

    if ext == ".jpe":
        ext = ".jpeg"

    is_image_mime = content_type.startswith("image/") or content_type in (
        "application/octet-stream",
        "",
    )
    is_allowed_ext = ext in ALLOWED_IMAGE_EXTENSIONS or (not ext and is_image_mime)

    if not is_allowed_ext:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only image or icon files are allowed.",
        )

    if not ext:
        ext = ".jpg"

    # Determine target subpath relative to data/files
    target_folder = (folder or "").strip()

    base_dir = os.path.abspath("data/files")
    clean_target = target_folder.lstrip("/\\")
    dest_dir = os.path.abspath(os.path.join(base_dir, clean_target))

    # Path traversal security check
    if not (dest_dir == base_dir or dest_dir.startswith(base_dir + os.sep)):
        raise HTTPException(
            status_code=400,
            detail="Invalid target path.",
        )

    os.makedirs(dest_dir, exist_ok=True)

    saved_filename = f"custom_{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(dest_dir, saved_filename)

    contents = await file.read()
    await anyio.Path(filepath).write_bytes(contents)

    rel_path = os.path.relpath(filepath, base_dir).replace("\\", "/")
    url = f"/static/{rel_path}"

    return {"url": url}


@router.post("/upload-plugin")
async def upload_plugin(
    file: UploadFile = File(...),
) -> dict:
    """Upload a JavaScript plugin module (.js, .mjs), compute hash name, and store in data/files/plugins."""
    filename = file.filename or "plugin.js"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_PLUGIN_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JavaScript plugin files (.js, .mjs) are allowed.",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Plugin file is empty.",
        )

    url, saved_filename, meta = save_uploaded_plugin(filename, contents)
    return {
        "url": url,
        "filename": saved_filename,
        "meta": meta,
    }

