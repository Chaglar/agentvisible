# Task 008: SEO Page Factory

## Status: TODO | Priority: P1 | Est: 5h

## Goal
Generate 50+ pre-scanned brand pages for organic traffic.
URL pattern: agentvisible.ai/scan/apple-com

## How
1. Create brand list (50 domains): top Shopify stores, AU brands, Fortune 500
2. Batch scan script: iterate list, POST /api/v1/scan each, store results
3. /scan/[slug]/page.tsx (SSR): fetch stored scan, render report + CTA
4. Each page unique: title, meta description, H1 with brand name

## Page Template
- H1: "[Brand] AI Agent Readiness Score"
- Score summary (same module cards as report page)
- "How does [Brand] compare?" — show average score context
- CTA: "Check YOUR website — free scan"
- Internal links to related brand pages (same industry)

## First 50 Brands
ooow.com.au, kogan.com.au, theiconic.com.au, gymshark.com, allbirds.com,
apple.com, nike.com, amazon.com, etsy.com, shopify.com, squarespace.com,
wix.com, hubspot.com, optus.com.au, telstra.com.au, woolworths.com.au,
coles.com.au, bunnings.com.au, jbhifi.com.au, myer.com.au, davidjones.com,
catch.com.au, booktopia.com.au, adore.com.au, cultureking.com.au,
canva.com, atlassian.com, airtasker.com, envato.com, safety-culture.com,
stripe.com, vercel.com, supabase.com, railway.app, notion.so,
figma.com, linear.app, slack.com, zoom.us, calendly.com,
airbnb.com, booking.com, uber.com, doordash.com, grubhub.com,
zara.com, hm.com, uniqlo.com, asos.com, shein.com

## SEO
- Unique meta per page
- FAQPage + Article schema in JSON-LD
- Sitemap includes all /scan/ pages
- Submit to Google Search Console

## Acceptance Criteria
- [ ] Batch scan script runs against 50 URLs
- [ ] /scan/[slug] renders pre-scanned report
- [ ] Unique title, description, H1 per page
- [ ] Internal links between pages
- [ ] Sitemap.xml updated
