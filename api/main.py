"""
AgentVisible.ai FastAPI backend
Main application entry point with CORS, health endpoint, scan API, and reports
"""

import os
import time
from collections import defaultdict
from typing import Dict

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import StreamingResponse
from fastapi import BackgroundTasks

from config import ALLOWED_ORIGINS, SCANS_PER_HOUR, MODULE_EXPLANATIONS, CHECK_EXPLANATIONS
from database import get_report, save_scan, get_supabase_client
from models import APIResponse, ScanRequest, ScanResult
from auth import verify_jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
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
from debug_jwt import router as debug_router

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

# Include debug router (for development)
app.include_router(debug_router)


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


async def has_pro_subscription(user_id: str) -> bool:
    """Check if user has an active Pro subscription"""
    try:
        supabase = get_supabase_client()
        result = supabase.table('subscriptions').select('tier, status').eq('user_id', user_id).eq('status', 'active').execute()
        if result.data:
            subscription = result.data[0]
            return subscription.get('tier') in ['pro', 'agency']
        return False
    except Exception as e:
        print(f"Failed to check subscription status: {e}")
        return False


@app.post("/api/v1/scan", response_model=APIResponse)
async def scan_url(request: ScanRequest, req: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    """
    Scan a URL for AI agent readiness
    Returns complete analysis with score, rating, and actionable fixes
    """
    try:
        # Check if user has Pro subscription (unlimited scans)
        is_pro_user = False
        user = None

        if credentials:
            user = verify_jwt(credentials)
            if user:
                user_id = user.get('sub')
                if user_id:
                    is_pro_user = await has_pro_subscription(user_id)
                    print(f"User {user.get('email')} has Pro subscription: {is_pro_user}")

        # Apply rate limiting only to free users
        if not is_pro_user:
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


async def get_optional_user_id(authorization: str = None) -> Optional[str]:
    """Extract user ID from JWT token"""
    if not authorization or not authorization.startswith('Bearer '):
        return None

    try:
        token = authorization.replace('Bearer ', '')
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user = verify_jwt(credentials)
        return user.get('sub') if user else None
    except:
        return None


async def get_required_user_id(authorization: str = Header(default=None)) -> str:
    """Extract user ID from JWT token, raise 401 if not found"""
    uid = await get_optional_user_id(authorization)
    if not uid:
        raise HTTPException(status_code=401, detail='Auth required')
    return uid


@app.get('/api/v1/dashboard')
async def get_dashboard(user_id: str = Depends(get_required_user_id)):
    supabase = get_supabase_client()
    # Note: scans table doesn't have user_id column yet, showing recent scans for now
    scans = supabase.table('scans').select('url,overall_score,created_at,slug').order('created_at', desc=True).limit(10).execute()
    subs = supabase.table('subscriptions').select('*').eq('user_id', user_id).eq('status', 'active').limit(1).execute()
    purchases = supabase.table('purchases').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
    tier = 'pro' if subs.data else 'free'
    return {'tier': tier, 'subscription': subs.data[0] if subs.data else None, 'scans': scans.data or [], 'purchases': purchases.data or [], 'scan_count': len(scans.data or [])}


# Root route for testing
@app.get("/")
async def root():
    return {"message": "AgentVisible API is running"}
