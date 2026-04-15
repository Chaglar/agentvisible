# Task 006: Scan Results Page

## Status: TODO | Priority: P0 | Est: 7h

## Components
1. **Score Gauge**: circular, colour-coded (green 75+, amber 50+, orange 25+, red 0+)
2. **Module Cards**: 5 cards with score bar, pass/fail count, expandable checks
3. **Check List**: ✅/❌ per check, severity badge, expandable fix_hint
4. **Top 3 Fixes**: numbered, prominent, with "How to fix" section
5. **Share Button**: copy report URL
6. **CTA**: "Monitor weekly — Pro $99/mo" (non-functional MVP)

## Flow
1. User arrives at /scan?url=example.com
2. Page calls POST /api/v1/scan
3. Show skeleton/loading while scanning (~15s)
4. Render results
5. Store in URL: /scan?url=example.com (client-side, no page reload)

## Acceptance Criteria
- [ ] Score gauge renders with correct colour
- [ ] All 5 module cards expand to show checks
- [ ] Top 3 fixes section visible
- [ ] Share button copies URL
- [ ] Loading skeleton during scan
- [ ] Error state if scan fails
- [ ] Mobile responsive
