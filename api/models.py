"""
Pydantic models for AgentVisible API
All request/response schemas following api-conventions.md
"""

from datetime import datetime
from typing import List, Optional, Union

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
    fix_hint: Optional[str] = None


class ModuleResult(BaseModel):
    """Result from a single scanner module"""
    module: str
    score: float  # 0-100
    weight: float  # 0.0-1.0
    checks: List[Check]
    summary: str


class ScanResult(BaseModel):
    """Complete scan result for a URL"""
    url: str
    overall_score: float
    rating: str  # "Strong" | "Moderate" | "Weak" | "Critical"
    modules: List[ModuleResult]
    top_fixes: List[Check]
    scanned_at: datetime
    report_slug: str


class APIResponse(BaseModel):
    """Standard API response envelope"""
    status: str  # "ok" | "error"
    data: Optional[dict] = None
    message: Optional[str] = None
    code: Optional[str] = None
