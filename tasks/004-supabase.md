# Task 004: Supabase Database

## Status: TODO | Priority: P0 | Est: 1.5h

## Tables
```sql
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    overall_score FLOAT NOT NULL,
    rating TEXT NOT NULL,
    modules JSONB NOT NULL,
    top_fixes JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_scans_slug ON scans(slug);
CREATE INDEX idx_scans_domain ON scans(domain);
```

## database.py
- `save_scan(result: ScanResult)` — upsert by domain (keep latest)
- `get_report(slug: str) -> ScanResult | None`
- Async Supabase client

## Acceptance Criteria
- [ ] Tables created, database.py working
- [ ] Scans persist after POST /api/v1/scan
- [ ] GET /api/v1/report/{slug} retrieves stored scan
