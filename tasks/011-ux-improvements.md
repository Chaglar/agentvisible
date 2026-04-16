# Task 011: Customer-Friendly UX Improvements

## Status: TODO | Priority: P1 | Est: 6h

## A. Scan Experience

### 1. Real-time scan progress (not just a spinner)
Show WHICH module is running as the scan progresses:
```
✅ Structured Data ............ done (72/100)
✅ AI Crawlability ............ done (45/100)
🔄 Content Parseability ....... scanning...
⏳ Commerce Protocols ......... waiting
⏳ Agent Discovery ............ waiting
```
Uses Server-Sent Events (SSE) or polling every 2s. Users see progress, not a black box.

### 2. Scan history (per browser)
Store last 5 scans in localStorage. Show "Recent scans" below the URL input:
```
Recent scans:
ooow.com.au        72/100  2 hours ago
apple.com          89/100  yesterday
optus.com.au       34/100  2 days ago
```
Click to view stored results instantly.

### 3. Compare two sites
"Compare" button on results page → enter second URL → side-by-side score comparison.
Great for agencies showing clients "You vs competitor". Also a viral sharing hook.

## B. Results Experience

### 4. Plain English summary (AI-generated)
Below the score, show a 2-3 sentence human-readable summary:
> "ooow.com.au scores 72/100 — Moderate readiness. Your structured data is strong thanks to Shopify's built-in JSON-LD, but AI crawlers like GPTBot are currently blocked by your robots.txt. Your biggest quick win is adding an llms.txt file — it takes 5 minutes and could boost your score by 15 points."

Generate server-side with Haiku (cheap). Cache per scan. Massively increases perceived value.

### 5. "What does this mean?" tooltips
Every module name, every check name — add a small ℹ️ icon that shows a plain English tooltip:
- "Structured Data" → "Machine-readable information about your products, business, and content that AI agents use to understand your site"
- "JSON-LD Product Schema" → "A code snippet that tells AI agents about your product's name, price, availability, and reviews"

Non-technical users need this. It's what separates a dev tool from a business tool.

### 6. Score badge / embeddable widget
After scanning, offer a badge users can embed on their site:
```html
<a href="https://agentvisible.ai/report/ooow-com-au">
  <img src="https://agentvisible.ai/api/badge/ooow-com-au" alt="AgentVisible Score: 72/100" />
</a>
```
Dynamic SVG badge (like shields.io). Free backlinks + brand awareness + SEO juice.

### 7. Fix priority with effort tags
Each fix gets an effort estimate:
- ⚡ 5 min (add llms.txt)
- 🔧 30 min (add JSON-LD schema)
- 🏗️ 2+ hours (enable SSR, add WebMCP)

Helps non-technical users prioritise. Shows which wins are easy.

## C. Sharing & Virality

### 8. "Scan your competitor" CTA
After viewing results, show: "How does your competitor compare? Scan another site →"
Pre-fills a second input. Drives 2x scan volume per visitor.

### 9. Social share cards with score
One-click share to Twitter/LinkedIn with pre-filled text:
- Twitter: "🤖 My website scored [X]/100 for AI agent readiness. Check yours free → agentvisible.ai"
- LinkedIn: More professional version
Share button already exists (Task 006) — this adds pre-filled social text.

### 10. Industry benchmarks
Show where the user's score sits relative to their industry:
```
Your score: 72/100
━━━━━━━━━━━━━━━━━━●━━━━━
Average e-commerce: 38    You: 72    Top 10%: 85
```
We'll have benchmark data from the 50 pre-scanned brands (Task 008). Group by vertical.

## D. Conversion & Retention

### 11. "Rescan" button with score change indicator
After initial scan, show "Rescan" button. On rescan, show:
```
Score: 72 → 78 (+6) ↑
Structured Data: 85 → 85 (=)
AI Crawlability: 45 → 65 (+20) ↑  ← you fixed robots.txt!
```
This is the hook for Pro monitoring ($99/mo). Free users get manual rescan. Pro gets weekly auto.

### 12. Email capture on results page (soft)
Below results, non-intrusive prompt:
"Get notified when AI agent standards change — we'll tell you how it affects your score."
Email input → store in Supabase. Future newsletter / Pro conversion funnel.
NOT a gate. Results are always free. Email is optional.

### 13. "Fix it for me" CTA (Phase 2 revenue)
Below each failed check, subtle link:
"Need help fixing this? → Talk to an expert ($299 one-time setup)"
Leads to a Calendly link or Typeform. Agency revenue stream alongside Pro monitoring.

## Acceptance Criteria
- [ ] Real-time scan progress shows per-module status
- [ ] Recent scans stored in browser, shown below input
- [ ] Plain English summary generated (Haiku) and displayed
- [ ] Tooltips on all module names and check names
- [ ] Score badge endpoint generates dynamic SVG
- [ ] Effort tags (5 min / 30 min / 2+ hours) on each fix
- [ ] Social share buttons with pre-filled text
- [ ] "Scan your competitor" CTA on results page
- [ ] Rescan shows score change delta
- [ ] Optional email capture below results
