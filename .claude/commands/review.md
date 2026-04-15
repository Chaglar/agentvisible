# /project:review
Review latest changes for:
1. Type hints on all functions
2. No blocking calls in async functions
3. All httpx calls wrapped in try/except with timeouts
4. New code has tests
5. NO BeautifulSoup, lxml, or other parsing libs imported
6. Response schemas match api-conventions.md
7. No hardcoded secrets, SSRF protection on URL input
Output: brief report with ✅ / ⚠️ / ❌ per item.
