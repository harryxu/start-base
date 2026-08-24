"""Router for plugin HTTP proxy requests."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.models import PluginProxyRequest, Site
from app.services.plugin_proxy_service import forward_plugin_proxy

router = APIRouter(prefix="/api/plugins", tags=["plugins"])


@router.post("/proxy", summary="Forward an authorized HTTP request on behalf of a plugin")
async def plugin_proxy(
    req: PluginProxyRequest,
    session: Session = Depends(get_session),
):
    """
    Proxy an external or LAN request for a plugin.
    Verifies site existence, metadata host whitelist, and LAN access permission.
    """
    site = session.get(Site, req.site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    return await forward_plugin_proxy(site, req)
