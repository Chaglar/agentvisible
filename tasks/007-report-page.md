# Task 007: Shareable Report Page + OG Image

## Status: TODO | Priority: P0 | Est: 5h

## /report/[slug]/page.tsx (Server Component)
- SSR: fetch scan from API on server, render full report
- URL: agentvisible.ai/report/ooow-com-au
- Same UI as results page but static (no loading state)
- 404 if slug not found

## Dynamic OG Image (/api/og/[slug]/route.tsx)
Using @vercel/og (1200×630px):
- Dark background
- Domain name (large)
- Overall score + rating badge
- 5 mini bars for module scores
- "Scanned by AgentVisible.ai" footer

## SEO Meta
- Title: "AgentVisible: [domain] — Score: [X]/100"
- Description: "[domain] scored [X]/100 on AI agent readiness. [rating] rating across structured data, crawlability, parseability, commerce protocols, and agent discovery."
- og:image pointing to dynamic OG endpoint

## Acceptance Criteria
- [ ] /report/[slug] renders server-side with full data
- [ ] 404 for missing slugs
- [ ] OG image generates correctly
- [ ] Twitter/LinkedIn preview shows score card
- [ ] Page loads < 2 seconds
- [ ] Google can crawl it (test with Lighthouse)
