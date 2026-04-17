"""
AgentVisible.ai FastAPI backend
Main application entry point with CORS, health endpoint, scan API, and reports
"""

import os
import time
import jwt
from collections import defaultdict
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from fastapi.responses import StreamingResponse
from fastapi import BackgroundTasks

from config import ALLOWED_ORIGINS, SCANS_PER_HOUR, MODULE_EXPLANATIONS, CHECK_EXPLANATIONS
from database import get_report, save_scan
from models import APIResponse, ScanRequest, ScanResult
from scanner.engine import run_scan
from scanner.fetcher import is_safe_url
from utils import (
    generate_ai_summary,
    generate_badge_svg,
    get_effort_estimate,
    get_industry_benchmark,
    get_social_share_text,
    detect_competitor_suggestions
)
from stripe_routes import router as stripe_router
from stripe_webhooks import router as stripe_webhook_router

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

# Include Stripe routers
app.include_router(stripe_router)
app.include_router(stripe_webhook_router)


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint for monitoring and deployment verification"""
    return {"status": "ok", "version": "0.1.0"}


# Rate limiting: simple in-memory store (10 scans/hour per IP)
# Format: {ip: [(timestamp1, timestamp2, ...)]}
rate_limit_store: Dict[str, list] = defaultdict(list)

# JWT Authentication
security = HTTPBearer(auto_error=False)
JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")


def verify_jwt(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """
    Verify JWT token from Authorization header

    Args:
        credentials: Authorization credentials from header

    Returns:
        Decoded JWT payload if valid, None if no token or invalid
    """
    if not credentials or not JWT_SECRET:
        return None

    try:
        # Decode JWT using Supabase JWT secret
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_auth(user: Optional[dict] = Depends(verify_jwt)) -> dict:
    """
    Require valid authentication for protected endpoints

    Args:
        user: User payload from JWT verification

    Returns:
        User payload if authenticated

    Raises:
        HTTPException: 401 if not authenticated
    """
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please sign in."
        )
    return user


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

        # Generate AI summary
        ai_summary = await generate_ai_summary(scan_result)

        # Get industry benchmark
        industry_benchmark = get_industry_benchmark(url_str)

        # Add effort estimates to checks
        for module in scan_result.modules:
            for check in module.checks:
                if not check.passed:
                    check.effort_estimate = get_effort_estimate(check)

        # Add social share text
        social_share = {
            "twitter": get_social_share_text(scan_result, "twitter"),
            "linkedin": get_social_share_text(scan_result, "linkedin")
        }

        # Get competitor suggestions
        competitor_suggestions = detect_competitor_suggestions(url_str)

        # Store result in Supabase
        await save_scan(scan_result)

        # Return enhanced response
        return APIResponse(
            status="ok",
            data={
                **scan_result.dict(),
                "ai_summary": ai_summary,
                "industry_benchmark": industry_benchmark,
                "social_share": social_share,
                "competitor_suggestions": competitor_suggestions
            }
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


@app.get("/api/v1/badge/{slug}", responses={200: {"content": {"image/svg+xml": {}}}})
async def get_badge(slug: str):
    """
    Generate SVG badge for embedding on websites

    Args:
        slug: Report identifier

    Returns:
        SVG badge with score and rating
    """
    try:
        # Retrieve scan from database
        scan_result = await get_report(slug)

        if scan_result is None:
            # Return default "not found" badge
            svg_content = generate_badge_svg(0, "Not Found")
        else:
            svg_content = generate_badge_svg(scan_result.overall_score, scan_result.rating)

        return StreamingResponse(
            iter([svg_content]),
            media_type="image/svg+xml",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Content-Type": "image/svg+xml"
            }
        )

    except Exception:
        # Return error badge
        svg_content = generate_badge_svg(0, "Error")
        return StreamingResponse(
            iter([svg_content]),
            media_type="image/svg+xml"
        )


@app.get("/api/v1/explanations")
async def get_explanations():
    """
    Get tooltip explanations for modules and checks

    Returns:
        Dict with module and check explanations
    """
    return APIResponse(
        status="ok",
        data={
            "modules": MODULE_EXPLANATIONS,
            "checks": CHECK_EXPLANATIONS
        }
    )


@app.post("/api/v1/summary")
async def generate_summary(request: dict):
    """
    Generate AI summary for existing scan result

    Args:
        request: Dict with scan_result data

    Returns:
        Generated summary text
    """
    try:
        # Convert dict back to ScanResult object
        scan_result = ScanResult(**request.get("scan_result", {}))

        # Generate AI summary
        summary = await generate_ai_summary(scan_result)

        return APIResponse(
            status="ok",
            data={"summary": summary}
        )

    except Exception as e:
        return APIResponse(
            status="error",
            message=f"Summary generation failed: {str(e)}",
            code="SUMMARY_ERROR"
        )


@app.get("/api/v1/competitors/{domain}")
async def get_competitor_suggestions(domain: str):
    """
    Get competitor suggestions for a domain

    Args:
        domain: Domain to get competitors for

    Returns:
        List of suggested competitor URLs
    """
    try:
        url = f"https://{domain}" if not domain.startswith("http") else domain
        suggestions = detect_competitor_suggestions(url)

        return APIResponse(
            status="ok",
            data={"competitors": suggestions}
        )

    except Exception as e:
        return APIResponse(
            status="error",
            message=f"Failed to get competitors: {str(e)}",
            code="COMPETITOR_ERROR"
        )


# Root route for testing
@app.get("/")
async def root():
    return {"message": "AgentVisible API is running"}
