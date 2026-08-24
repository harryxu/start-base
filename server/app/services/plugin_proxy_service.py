"""Plugin Proxy Service for forwarding external and LAN requests on behalf of plugins."""

import fnmatch
import ipaddress
import json
import socket
import urllib.parse
from fastapi import HTTPException, Response
import httpx

from app.models import PluginProxyRequest, Site

MAX_RESPONSE_SIZE = 5 * 1024 * 1024  # 5 MB
DEFAULT_TIMEOUT = 10.0
MAX_TIMEOUT = 30.0

# Dangerous IPs that are ALWAYS blocked, even when allow_lan is True
BLOCKED_METADATA_NETWORKS = [
    ipaddress.ip_network("169.254.0.0/16"),  # Link-Local / Cloud Metadata (AWS/GCP/Azure/OpenStack)
    ipaddress.ip_network("fe80::/10"),       # IPv6 Link-Local
    ipaddress.ip_network("224.0.0.0/4"),     # IPv4 Multicast
    ipaddress.ip_network("ff00::/8"),        # IPv6 Multicast
    ipaddress.ip_network("240.0.0.0/4"),     # Reserved / Future use
    ipaddress.ip_network("0.0.0.0/8"),       # Current network
]


def extract_allowed_hosts(plugin_meta_json: str | None) -> list[str]:
    """Extract list of allowed hosts from serialized plugin_meta JSON."""
    if not plugin_meta_json or not plugin_meta_json.strip():
        return []
    try:
        data = json.loads(plugin_meta_json)
        if isinstance(data, dict):
            hosts = data.get("allow_hosts", [])
            if isinstance(hosts, list):
                return [str(h).strip().lower() for h in hosts if str(h).strip()]
    except Exception:
        pass
    return []


def is_host_allowed(target_host: str, target_port: int | None, allow_hosts: list[str]) -> bool:
    """
    Check if target_host or target_host:port matches any entry in allow_hosts.
    Supports exact matching, wildcard matching (e.g. *.example.com), and port matching.
    """
    if not allow_hosts:
        return False

    normalized_host = target_host.lower().strip()
    host_with_port = f"{normalized_host}:{target_port}" if target_port else normalized_host

    for pattern in allow_hosts:
        pattern = pattern.lower().strip()
        if not pattern:
            continue

        # Match host:port exactly
        if pattern == host_with_port or pattern == normalized_host:
            return True

        # Wildcard match for domain (e.g., *.github.com)
        if pattern.startswith("*."):
            domain_suffix = pattern[2:]
            if normalized_host == domain_suffix or normalized_host.endswith("." + domain_suffix):
                return True
        elif "*" in pattern:
            if fnmatch.fnmatch(normalized_host, pattern) or fnmatch.fnmatch(host_with_port, pattern):
                return True

    return False


def is_ip_blocked(ip_str: str, allow_lan: bool) -> tuple[bool, str]:
    """
    Check if resolved IP address is blocked based on SSRF rules and allow_lan flag.
    Returns (is_blocked, reason).
    """
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return True, f"Invalid IP address: {ip_str}"

    # Always block cloud metadata and link-local / multicast
    for net in BLOCKED_METADATA_NETWORKS:
        if ip in net:
            return True, f"Access to cloud metadata / link-local address ({ip_str}) is strictly prohibited."

    # If LAN access is NOT allowed, block all private, loopback, and reserved addresses
    if not allow_lan:
        if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_unspecified:
            return True, (
                f"Access to private/LAN/loopback address ({ip_str}) is disabled for this plugin. "
                "You can enable 'Allow LAN Access' in the plugin settings if needed."
            )

    return False, ""


def validate_target_url(
    url: str, allow_hosts: list[str], allow_lan: bool
) -> tuple[bool, str, urllib.parse.ParseResult | None]:
    """
    Validate target URL: scheme, host whitelist, DNS resolution, and IP range checks.
    """
    if not url or not url.strip():
        return False, "Target URL is required", None

    try:
        parsed = urllib.parse.urlparse(url.strip())
    except Exception as e:
        return False, f"Malformed URL: {e}", None

    if parsed.scheme not in ("http", "https"):
        return False, f"Unsupported scheme '{parsed.scheme}'. Only 'http' and 'https' are allowed.", None

    hostname = parsed.hostname
    if not hostname:
        return False, "URL must include a valid hostname or IP.", None

    port = parsed.port

    # 1. Check against allowed hosts
    if not is_host_allowed(hostname, port, allow_hosts):
        return (
            False,
            f"Host '{parsed.netloc}' is not in the allowed hosts for this plugin. "
            "Please declare it via '@allow-host' in the plugin metadata.",
            None,
        )

    # 2. Resolve DNS and check all returned IPs against SSRF rules
    try:
        addr_info = socket.getaddrinfo(hostname, port or (443 if parsed.scheme == "https" else 80))
        resolved_ips = {item[4][0] for item in addr_info if item[4]}
    except socket.gaierror as e:
        return False, f"Failed to resolve host '{hostname}': {e}", None

    if not resolved_ips:
        return False, f"No IP address found for host '{hostname}'.", None

    for ip_str in resolved_ips:
        blocked, reason = is_ip_blocked(ip_str, allow_lan)
        if blocked:
            return False, reason, None

    return True, "", parsed


# Headers that should NOT be forwarded to external servers
FILTERED_REQUEST_HEADERS = {
    "host",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "cookie",
}

# Headers that should NOT be returned to frontend client
FILTERED_RESPONSE_HEADERS = {
    "connection",
    "transfer-encoding",
    "content-encoding",
    "set-cookie",
    "content-length",
}


async def forward_plugin_proxy(site: Site, req: PluginProxyRequest) -> Response:
    """
    Execute sanitized, safe HTTP proxy request for a plugin.
    """
    allow_hosts = extract_allowed_hosts(site.plugin_meta)
    is_valid, err_msg, parsed_url = validate_target_url(req.url, allow_hosts, site.allow_lan)

    if not is_valid:
        raise HTTPException(status_code=403, detail=err_msg)

    # Clean headers
    clean_headers: dict[str, str] = {}
    for k, v in req.headers.items():
        if k.lower() not in FILTERED_REQUEST_HEADERS:
            clean_headers[k] = v

    method = req.method.upper()
    timeout = min(max(req.timeout, 1.0), MAX_TIMEOUT)

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            # Prepare payload
            content = None
            json_body = None
            if req.body is not None:
                if isinstance(req.body, (dict, list)):
                    json_body = req.body
                else:
                    content = str(req.body).encode("utf-8")

            # Send request
            resp = await client.request(
                method=method,
                url=req.url,
                params=req.params or None,
                headers=clean_headers,
                content=content,
                json=json_body,
            )

            # Check response size limit
            content_bytes = resp.content
            if len(content_bytes) > MAX_RESPONSE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"Response payload exceeds maximum allowed size ({MAX_RESPONSE_SIZE // (1024 * 1024)}MB).",
                )

            # Filter response headers
            out_headers: dict[str, str] = {}
            for k, v in resp.headers.items():
                if k.lower() not in FILTERED_RESPONSE_HEADERS:
                    out_headers[k] = v

            media_type = resp.headers.get("content-type", "application/json")
            return Response(
                content=content_bytes,
                status_code=resp.status_code,
                headers=out_headers,
                media_type=media_type,
            )
    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=f"Proxy request to '{req.url}' timed out after {timeout}s.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to forward request to '{req.url}': {e}")
