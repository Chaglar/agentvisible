"""
Pydantic models for AgentVisible API
All request/response schemas following api-conventions.md
"""

from datetime import datetime

from pydantic import BaseModel, HttpUrl


class ScanRequest(BaseModel):
    """Request model for URL scanning"""
    url: HttpUrl


class Check(BaseModel):
    """Individual check within a scanner module"""
    name: str
    passed: bool
    severity: str  # "critical" | "warning" | "info"
    detail: str
    fix_hint: str | None = None


class ModuleResult(BaseModel):
    """Result from a single scanner module"""
    module: str
    score: float  # 0-100
    weight: float  # 0.0-1.0
    checks: list[Check]
    summary: str


class ScanResult(BaseModel):
    """Complete scan result for a URL"""
    url: str
    overall_score: float
    rating: str  # "Strong" | "Moderate" | "Weak" | "Critical"
    modules: list[ModuleResult]
    top_fixes: list[Check]
    scanned_at: datetime
    report_slug: str


class APIResponse(BaseModel):
    """Standard API response envelope"""
    status: str  # "ok" | "error"
    data: dict | None = None
    message: str | None = None
    code: str | None = None
