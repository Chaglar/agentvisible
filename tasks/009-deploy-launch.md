# Task 009: Deploy + Launch

## Status: TODO | Priority: P0 | Est: 5h

## Vercel Deployment
- [ ] Connect GitHub monorepo to Vercel
- [ ] Set custom domain: agentvisible.ai
- [ ] Set env vars: SUPABASE_URL, SUPABASE_KEY, ALLOWED_ORIGINS
- [ ] Verify Python API: agentvisible.ai/api/v1/health returns OK
- [ ] Verify frontend: agentvisible.ai renders landing page
- [ ] End-to-end: scan a URL on production, verify report page
- [ ] Upgrade to Pro ($20/mo) for 60s function timeout

## Cloudflare DNS
- [ ] CNAME agentvisible.ai → cname.vercel-dns.com
- [ ] SSL: Full (strict)
- [ ] Cache /report/ pages (1hr TTL)

## Post-Deploy
- [ ] Scan ooow.com.au — verify full results
- [ ] Share report URL — verify OG image on Twitter/LinkedIn
- [ ] Test on mobile (iPhone + Android)
- [ ] Lighthouse > 90
- [ ] Rate limiting works (10 scans/hour per IP)
- [ ] Submit sitemap to Google Search Console

## Monitoring
- [ ] Plausible analytics installed
- [ ] Vercel error logs accessible

## Soft Launch
- [ ] r/ecommerce: "I built a free tool that scores your website's readiness for AI shopping agents"
- [ ] r/shopify: "Most Shopify stores score under 30 for AI agent readiness — here's a free checker"
- [ ] Twitter/data community: scan 10 popular sites, post scores as thread
- [ ] LinkedIn: personal post about why AI agent readiness matters
- [ ] Launch blog post on agentvisible.ai/blog

## Acceptance Criteria
- [ ] agentvisible.ai live and serving scans
- [ ] Report pages shareable with OG images
- [ ] 50 pre-scanned brand pages indexed
- [ ] Analytics tracking visitors
