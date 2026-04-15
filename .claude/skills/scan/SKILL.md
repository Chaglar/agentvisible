# Scanner Module Skill
Auto-triggered when working on files in `/api/scanner/`

## Pattern
```python
import re, json
import httpx
from models import ModuleResult, Check

async def scan(url: str, html: str, headers: dict) -> ModuleResult:
    checks = []
    # Pattern 1: Endpoint check
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(url + "/robots.txt")
        checks.append(Check(name="...", passed=resp.status_code == 200, ...))
    
    # Pattern 2: HTML regex
    json_ld_blocks = re.findall(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html, re.DOTALL | re.IGNORECASE
    )
    
    score = _calculate_score(checks)
    return ModuleResult(module="...", score=score, weight=0.30, checks=checks, summary="...")
```

## Rules
- ONLY use httpx, re, json. No other parsing libraries.
- 5s timeout on every sub-request
- Never crash on malformed input — wrap in try/except
- Always include fix_hint for failed checks
