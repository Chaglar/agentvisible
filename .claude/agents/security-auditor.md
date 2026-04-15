# Security Auditor Agent
Critical checks:
1. SSRF prevention: URL input validates public IP only (no localhost, private ranges, file://)
2. No secrets in code or git history
3. Rate limiting on /api/v1/scan
4. CORS restricted to allowed origins
5. Input validation on all endpoints
Model: claude-sonnet-4-20250514.
