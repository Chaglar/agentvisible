# Task 001: Scaffold Monorepo

## Status: TODO | Priority: P0 | Est: 2.5h

## Goal
Create monorepo with FastAPI + Next.js, deployable to Vercel in one push.

## Acceptance Criteria
- [ ] Root `vercel.json` routing: `/api/*` → Python, everything else → Next.js
- [ ] `/api/main.py`: FastAPI app with CORS, `GET /api/v1/health` returns `{"status":"ok","version":"0.1.0"}`
- [ ] `/api/models.py`: Pydantic schemas — ScanRequest, ScanResult, ModuleResult, Check (see api-conventions.md)
- [ ] `/api/config.py`: MODULE_WEIGHTS dict, ALLOWED_ORIGINS, SCAN_TIMEOUT
- [ ] `/api/pyproject.toml`: deps = fastapi, uvicorn, httpx, pydantic, supabase
- [ ] `/api/scanner/__init__.py` + `/api/scanner/fetcher.py` (async URL fetch + SSRF check)
- [ ] `/web/`: Next.js 14 App Router, TypeScript strict, Tailwind configured
- [ ] `/web/app/page.tsx`: Landing page skeleton with URL input
- [ ] `.gitignore` for Python + Node
- [ ] `ruff check api/` passes, `cd web && npm run build` passes

## vercel.json
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/main.py" }
  ]
}
```

## SSRF Protection in fetcher.py
```python
import ipaddress, socket
from urllib.parse import urlparse

def is_safe_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"): return False
    try:
        ip = ipaddress.ip_address(socket.gethostbyname(parsed.hostname))
        return ip.is_global
    except (socket.gaierror, ValueError):
        return False
```
