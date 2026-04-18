"""
Async URL fetcher with SSRF protection
Handles HTTP requests with safety checks for private IP ranges
"""

import ipaddress
import socket
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse

import httpx

from config import HTTP_TIMEOUT, MAX_HTML_SIZE


def is_safe_url(url: str) -> bool:
    """
    Check if URL is safe to fetch (SSRF protection)
    Prevents requests to private IPs, localhost, etc.
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False

        if not parsed.hostname:
            return False

        # Resolve hostname to IP address
        ip = ipaddress.ip_address(socket.gethostbyname(parsed.hostname))
        return ip.is_global

    except (socket.gaierror, ValueError, ipaddress.AddressValueError):
        return False


async def fetch_url(
    url: str,
    client: httpx.AsyncClient,
    max_size: int = MAX_HTML_SIZE
) -> Tuple[Optional[str], Optional[Dict[str, str]], int]:
    """
    Fetch URL content with safety checks

    Args:
        url: URL to fetch
        client: httpx AsyncClient instance
        max_size: Maximum response size in bytes

    Returns:
        Tuple of (html_content, response_headers, status_code)
        Returns (None, None, 0) on failure
    """
    if not is_safe_url(url):
        return None, None, 0

    try:
        response = await client.get(
            url,
            timeout=HTTP_TIMEOUT,
            follow_redirects=True,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        )

        # Check content length
        content_length = response.headers.get("content-length")
        if content_length and int(content_length) > max_size:
            return None, None, response.status_code

        # Read content with size limit
        content = await response.aread()
        if len(content) > max_size:
            return None, None, response.status_code

        # Convert bytes to string, handling encoding
        html_content = content.decode(response.encoding or "utf-8", errors="ignore")

        return html_content, dict(response.headers), response.status_code

    except (httpx.RequestError, httpx.TimeoutException, UnicodeDecodeError):
        return None, None, 0


async def fetch_endpoint(
    base_url: str,
    endpoint: str,
    client: httpx.AsyncClient
) -> Tuple[Optional[str], int]:
    """
    Fetch a specific endpoint (robots.txt, sitemap.xml, etc.)

    Args:
        base_url: Base URL of the site
        endpoint: Endpoint path (e.g., "/robots.txt")
        client: httpx AsyncClient instance

    Returns:
        Tuple of (content, status_code)
        Returns (None, 0) on failure
    """
    if not base_url.endswith("/"):
        base_url += "/"

    if endpoint.startswith("/"):
        endpoint = endpoint[1:]

    full_url = base_url + endpoint

    try:
        response = await client.get(
            full_url,
            timeout=HTTP_TIMEOUT,
            follow_redirects=True,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        )

        content = await response.aread()
        text_content = content.decode(response.encoding or "utf-8", errors="ignore")

        return text_content, response.status_code

    except (httpx.RequestError, httpx.TimeoutException, UnicodeDecodeError):
        return None, 0
