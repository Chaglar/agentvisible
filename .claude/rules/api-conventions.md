# API Conventions

## Endpoints
- `POST /api/v1/scan` — Submit URL, returns ScanResult
- `GET /api/v1/report/{slug}` — Get report by slug
- `GET /api/v1/health` — Health check

## Response Envelope
- Success: `{ "status": "ok", "data": { ... } }`
- Error: `{ "status": "error", "message": "...", "code": "SCAN_TIMEOUT" }`

## Core Models
```python
class Check(BaseModel):
    name: str
    passed: bool
    severity: str        # "critical" | "warning" | "info"
    detail: str
    fix_hint: str | None

class ModuleResult(BaseModel):
    module: str
    score: float         # 0-100
    weight: float        # 0.0-1.0
    checks: list[Check]
    summary: str

class ScanResult(BaseModel):
    url: str
    overall_score: float
    rating: str          # "Strong" | "Moderate" | "Weak" | "Critical"
    modules: list[ModuleResult]
    top_fixes: list[Check]
    scanned_at: datetime
    report_slug: str
```

## Rate Limiting
- 10 scans/hour per IP (in-memory dict for MVP)
- Cloudflare rate limiting for production
