# AgentVisible.ai — Project Context

## What
Free URL scanner scoring any website's AI agent readiness (0–100).
Domain: agentvisible.ai | Revenue: Free scan → Pro $99/mo → Agency $299/mo

## Monorepo Structure
```
agentvisible/
├── api/                  # FastAPI backend (Vercel Python Runtime)
│   ├── main.py           # FastAPI app, CORS, health endpoint
│   ├── models.py         # Pydantic: ScanRequest, ScanResult, ModuleResult, Check
│   ├── config.py         # Settings, constants, scoring weights
│   ├── scanner/
│   │   ├── __init__.py
│   │   ├── fetcher.py    # httpx async URL fetcher + SSRF protection
│   │   ├── engine.py     # Orchestrator: runs all modules, calculates score
│   │   ├── structured_data.py
│   │   ├── ai_crawlability.py
│   │   ├── content_parseability.py
│   │   ├── commerce_protocols.py
│   │   └── agent_discovery.py
│   ├── database.py       # Supabase client
│   ├── tests/
│   └── pyproject.toml
├── web/                  # Next.js 14 frontend (Vercel)
│   ├── app/
│   │   ├── page.tsx      # Landing page
│   │   ├── scan/page.tsx # Results page
│   │   ├── report/[slug]/page.tsx  # Shareable report (SSR)
│   │   └── api/og/[slug]/route.tsx # Dynamic OG image
│   ├── components/
│   ├── tailwind.config.ts
│   └── package.json
├── CLAUDE.md
├── CLAUDE.local.md
├── .mcp.json
└── vercel.json           # Routes api/* to Python, everything else to Next.js
```

## Tech Stack
- **Backend**: Python 3.12, FastAPI, httpx (async)
- **Scanner**: httpx + re + json (stdlib). NO BeautifulSoup. NO lxml. NO Playwright.
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Deploy**: Vercel (both frontend + Python API in one project)
- **DNS**: Cloudflare

## Backend Dependencies (TOTAL: 4)
```
fastapi
uvicorn
httpx
pydantic
supabase  # for database only
```

## Scanner Architecture
Every check is one of two patterns:
1. **Endpoint check**: `httpx.get(url + "/robots.txt")` → check status + parse text
2. **HTML analysis**: regex on raw HTML → extract JSON-LD, meta tags, heading counts

NO parsing libraries. Regex + json.loads() + string methods only.

### Module Interface
```python
async def scan(url: str, html: str, headers: dict) -> ModuleResult:
    """Every scanner module implements this exact signature."""
```

### Modules & Weights
1. Structured Data (30%) — regex extract JSON-LD + OG + Twitter meta
2. AI Crawlability (20%) — GET /robots.txt, /llms.txt, /sitemap.xml
3. Content Parseability (15%) — regex count semantic HTML, heading hierarchy, SSR detection
4. Commerce Protocols (20%) — GET /.well-known/mcp.json, /products.json, cart APIs
5. Agent Discovery (15%) — GET /.well-known/ai-plugin.json, check JSON-LD types

### Scoring
- Each module: 0–100 points
- Overall = sum(module_score × weight)
- Rating: Strong (75–100), Moderate (50–74), Weak (25–49), Critical (0–24)
- Top 3 fixes: highest severity failed checks, ordered by module weight

## Coding Standards
- Python: ruff lint, type hints everywhere, async def for all I/O
- TypeScript: strict mode, functional components, Tailwind only
- Commits: conventional (feat:, fix:, test:)
- Branches: feature → PR → main. Never commit to main directly.
- Tests: pytest + pytest-asyncio. Each module tested against ≥5 real URLs.

## SSRF Prevention (Critical)
The scan endpoint accepts user URLs. MUST validate:
- HTTP(S) only, no file:// or ftp://
- Resolve hostname → check IP is global (not private/localhost)
- Use ipaddress.ip_address().is_global

## Current Sprint
See /tasks/ directory for the current task queue.
