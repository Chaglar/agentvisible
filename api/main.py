"""
AgentVisible.ai FastAPI backend
Main application entry point with CORS, health endpoint, scan API, and reports
"""

import time
from collections import defaultdict
from typing import Dict

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOWED_ORIGINS, SCANS_PER_HOUR
from database import get_report, save_scan
from models import APIResponse, ScanRequest, ScanResult
from scanner.engine import run_scan
from scanner.fetcher import is_safe_url

app = FastAPI(
    title="AgentVisible API",
    description="AI Agent Readiness Scanner API",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint for monitoring and deployment verification"""
    return {"status": "ok", "version": "0.1.0"}


# Rate limiting: simple in-memory store (10 scans/hour per IP)
# Format: {ip: [(timestamp1, timestamp2, ...)]}
rate_limit_store: Dict[str, list] = defaultdict(list)


def check_rate_limit(client_ip: str) -> bool:
    """
    Check if client IP is within rate limit

    Args:
        client_ip: Client IP address

    Returns:
        True if within limit, False if exceeded
    """
    now = time.time()
    hour_ago = now - 3600  # 1 hour ago

    # Clean old entries
    rate_limit_store[client_ip] = [
        timestamp for timestamp in rate_limit_store[client_ip]
        if timestamp > hour_ago
    ]

    # Check if under limit
    if len(rate_limit_store[client_ip]) >= SCANS_PER_HOUR:
        return False

    # Record this request
    rate_limit_store[client_ip].append(now)
    return True


@app.post("/api/v1/scan", response_model=APIResponse)
async def scan_url(request: ScanRequest, req: Request):
    """
    Scan a URL for AI agent readiness
    Returns complete analysis with score, rating, and actionable fixes
    """
    try:
        # Get client IP for rate limiting
        client_ip = req.client.host if req.client else "unknown"

        # Check rate limit
        if not check_rate_limit(client_ip):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Maximum 10 scans per hour per IP."
            )

        # Validate URL safety (SSRF protection)
        url_str = str(request.url)
        if not is_safe_url(url_str):
            raise HTTPException(
                status_code=400,
                detail="Invalid URL. Only public HTTP/HTTPS URLs are allowed."
            )

        # Run the scan
        scan_result = await run_scan(url_str)

        # Store result in Supabase
        await save_scan(scan_result)

        # Return successful response
        return APIResponse(
            status="ok",
            data=scan_result.dict()
        )

    except HTTPException:
        # Re-raise HTTP exceptions (rate limit, validation errors)
        raise
    except Exception as e:
        # Handle unexpected errors
        return APIResponse(
            status="error",
            message=f"Scan failed: {str(e)}",
            code="SCAN_ERROR"
        )


@app.get("/api/v1/report/{slug}", response_model=APIResponse)
async def get_scan_report(slug: str):
    """
    Retrieve a stored scan report by slug

    Args:
        slug: Report identifier (generated during scan)

    Returns:
        Stored scan result or 404 if not found
    """
    try:
        # Retrieve scan from database
        scan_result = await get_report(slug)

        if scan_result is None:
            raise HTTPException(
                status_code=404,
                detail=f"Report with slug '{slug}' not found"
            )

        return APIResponse(
            status="ok",
            data=scan_result.dict()
        )

    except HTTPException:
        # Re-raise HTTP exceptions (404)
        raise
    except Exception as e:
        # Handle unexpected errors
        return APIResponse(
            status="error",
            message=f"Failed to retrieve report: {str(e)}",
            code="REPORT_ERROR"
        )

# Root route for testing
@app.get("/")
async def root():
    return {"message": "AgentVisible API is running"}
