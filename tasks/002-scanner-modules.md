# Task 002: Build All 5 Scanner Modules

## Status: TODO | Priority: P0 | Est: 11h

## Goal
Build all 5 scanner modules using ONLY httpx + re + json. No parsing libraries.

## Module 1: Structured Data (30% weight) — scanner/structured_data.py
Checks:
- JSON-LD: `re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.DOTALL|re.IGNORECASE)` → `json.loads()` each block
- Schema.org types: parse JSON-LD for @type in [Product, Organization, LocalBusiness, BreadcrumbList, FAQPage, Review, AggregateRating, Offer]
- Open Graph: `re.findall(r'<meta\s+property=["\']og:(\w+)["\']\s+content=["\']([^"\']*)["\']', html, re.IGNORECASE)`
- Twitter Cards: same pattern for `name="twitter:..."`
- Review schema: check JSON-LD for AggregateRating
- Breadcrumbs: check JSON-LD for BreadcrumbList

## Module 2: AI Crawlability (20% weight) — scanner/ai_crawlability.py
All endpoint checks with `httpx.AsyncClient(timeout=5.0)`:
- `GET {base}/robots.txt` → parse for User-agent: GPTBot, ClaudeBot, PerplexityBot, Bytespider, CCBot rules
- `GET {base}/llms.txt` → check 200 status
- `GET {base}/llms-full.txt` → check 200 status
- `GET {base}/sitemap.xml` → check 200 + contains `<urlset` or `<sitemapindex`
- HTML: `re.search(r'<meta\s+name=["\']robots["\']\s+content=["\']([^"\']*)["\']', html)` → check for noindex, noai
- Headers: check `X-Robots-Tag` in response headers

## Module 3: Content Parseability (15% weight) — scanner/content_parseability.py
All regex on raw HTML:
- SSR: `re.sub(r'<[^>]+>', '', html)` → if len(stripped) > 500, SSR present
- Semantic HTML: count occurrences of `<article`, `<main`, `<nav`, `<section`, `<header`, `<footer`
- Headings: count `<h1` through `<h6`, check h1 count == 1, no level skipping
- Content ratio: `len(stripped_text) / len(html)` — good if > 0.15
- Alt text: count `<img` tags, count those with non-empty `alt="[text]"`

## Module 4: Commerce Protocols (20% weight) — scanner/commerce_protocols.py ⭐ DIFFERENTIATOR
Endpoint checks:
- `GET {base}/.well-known/mcp.json` → WebMCP manifest
- `GET {base}/products.json` → Shopify product API
- `GET {base}/wp-json/wc/v3/products` → WooCommerce API
- `GET {base}/cart/add.js` → Shopify cart API
- Check JSON-LD for paymentAccepted, acceptedPaymentMethod
- Check HTML for Shopify meta: `re.search(r'Shopify\.shop', html)`

## Module 5: Agent Discovery (15% weight) — scanner/agent_discovery.py
Mix of endpoints + HTML:
- `GET {base}/.well-known/ai-plugin.json` → ChatGPT plugin manifest
- RSS feed: `re.search(r'<link[^>]+type=["\']application/(rss|atom)\+xml["\']', html)`
- JSON-LD check for FAQPage, HowTo types (reuse parsed JSON-LD from Module 1)
- Organization.sameAs in JSON-LD

## Global Rules
- Every `httpx.get()` wrapped in try/except with 5s timeout
- Failed request = check fails gracefully (not crash)
- Every failed check includes a fix_hint string
- `_calculate_score(checks)` → weighted sum of passed checks
- Tests: each module against 5 real URLs (see testing.md)

## Acceptance Criteria
- [ ] All 5 files created in /api/scanner/
- [ ] Each implements `async def scan(url, html, headers) -> ModuleResult`
- [ ] `pytest api/tests/` passes with ≥25 test cases (5 per module)
- [ ] No imports of beautifulsoup4, lxml, or any parsing library
- [ ] All regex patterns handle malformed HTML without crashing
