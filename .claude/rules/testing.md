# Testing

## Framework
pytest + pytest-asyncio. Tests in `/api/tests/`.

## Test URLs (use for ALL scanner validation)
1. ooow.com.au — Shopify, has JSON-LD Product
2. apple.com — strong structured data
3. news.ycombinator.com — minimal, should score near 0
4. etsy.com — marketplace, rich schema
5. optus.com.au — JS-heavy telecom

## Rules
- Every scanner module: tests against ≥5 real URLs
- Test: happy path, empty HTML, timeout, malformed data
- Mock external HTTP with `respx` for unit tests
- Real HTTP allowed in integration tests (`@pytest.mark.integration`)
- Before pushing: `cd api && ruff check . && pytest`
