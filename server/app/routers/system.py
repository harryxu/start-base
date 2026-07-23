"""System-level API endpoints (file uploads, system info, etc.)."""

import mimetypes
import os
import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

router = APIRouter(prefix="/api/system", tags=["system"])

ALLOWED_IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".ico",
    ".bmp",
    ".avif",
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

    is_image_mime = content_type.startswith("image/") or content_type in (
        "application/octet-stream",
        "",
    )
    is_allowed_ext = ext in ALLOWED_IMAGE_EXTENSIONS

    if not (is_allowed_ext and is_image_mime):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only image or icon files are allowed.",
        )

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
    with open(filepath, "wb") as f:
        f.write(contents)

    rel_path = os.path.relpath(filepath, base_dir).replace("\\", "/")
    url = f"/static/{rel_path}"

    return {"url": url}
