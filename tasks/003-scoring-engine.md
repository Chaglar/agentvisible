# Task 003: Scoring Engine + POST /scan

## Status: TODO | Priority: P0 | Est: 4h

## Goal
Wire all 5 modules together. One endpoint, one scan, one score.

## scanner/engine.py
```python
async def run_scan(url: str) -> ScanResult:
    html, headers = await fetch_url(url)  # from fetcher.py
    results = await asyncio.gather(
        structured_data.scan(url, html, headers),
        ai_crawlability.scan(url, html, headers),
        content_parseability.scan(url, html, headers),
        commerce_protocols.scan(url, html, headers),
        agent_discovery.scan(url, html, headers),
    )
    overall = sum(r.score * r.weight for r in results)
    rating = "Strong" if overall >= 75 else "Moderate" if overall >= 50 else "Weak" if overall >= 25 else "Critical"
    top_fixes = _pick_top_fixes(results, n=3)  # highest severity, then highest weight
    slug = _make_slug(url)  # "ooow-com-au"
    return ScanResult(url=url, overall_score=overall, rating=rating, modules=results, ...)
```

## POST /api/v1/scan in main.py
- Accept `{"url": "https://example.com"}`
- Validate URL (is_safe_url from fetcher.py)
- Run engine.run_scan()
- Store result in Supabase
- Return ScanResult JSON
- Rate limit: 10/hour per IP (simple in-memory dict)

## Acceptance Criteria
- [ ] engine.py orchestrates all 5 modules concurrently
- [ ] Overall score correctly weighted
- [ ] Top 3 fixes selected by severity then weight
- [ ] POST /api/v1/scan works end-to-end
- [ ] SSRF protection rejects localhost/private IPs
- [ ] Total scan time < 20 seconds for typical site
- [ ] Integration test: scan ooow.com.au, verify all modules return results
