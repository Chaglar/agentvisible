# Task 014: Design Polish + Copy Fixes (Demo Panel OFF LIMITS)

## Status: TODO | Priority: P0 | Est: 2h

## CRITICAL CONSTRAINT
**DO NOT modify any file related to the demo animation panel.** 
The demo is currently working on commit 4afed4c and must remain untouched.

Files OFF LIMITS:
- Any file named `LiveDemoPanel.tsx`, `ScanAnimation.tsx`, `DemoScanPanel.tsx`, or similar
- Any component that renders the animated scanning demo
- Any hook or utility specific to the demo animation (e.g. useScanAnimation, useDemoRotation)

Files SAFE to modify:
- `web/app/page.tsx` (landing page — only sections OUTSIDE the demo panel)
- `web/tailwind.config.ts` (add new dark palette colors)
- `web/app/globals.css` (typography, utility classes)
- Any section component that is NOT the demo (Hero copy area, TrustBar, HowItWorks, Footer, etc.)

## Goal
Fix the jarring black/white transition and improve hero copy to match 2026 SaaS design principles. Keep the working demo animation intact.

---

## Part A: Refined All-Dark Tonal Palette

### Current problem
Site has pure black hero, then white "How it works" section — feels like two different websites.

### Solution: stay all-dark, use tonal variation

Add to `tailwind.config.ts` under `theme.extend.colors`:

```typescript
colors: {
  dark: {
    1: '#0a0e17',  // Hero background (darkest, most dramatic)
    2: '#0d1220',  // Section backgrounds (rhythm)
    3: '#111827',  // Card backgrounds (feel raised on dark-2)
    4: '#1a1f2e',  // Surfaces: inputs, secondary buttons
    5: '#252b3a',  // Borders (visible but not harsh)
    6: '#374150',  // Dividers and muted elements
  }
}
```

Also add safelist to prevent Tailwind from purging:
```typescript
safelist: [
  'bg-dark-1', 'bg-dark-2', 'bg-dark-3', 'bg-dark-4', 'bg-dark-5', 'bg-dark-6',
  'border-dark-1', 'border-dark-2', 'border-dark-3', 'border-dark-4', 'border-dark-5', 'border-dark-6',
  'text-dark-1', 'text-dark-2', 'text-dark-3', 'text-dark-4', 'text-dark-5', 'text-dark-6',
]
```

### Section backgrounds (replace all light sections)

Currently "How it works", "What we check", "Pricing", "FAQ" have white backgrounds. Change to:

| Section | Background | Reason |
|---------|-----------|--------|
| Hero | `bg-dark-1` | Darkest, dramatic entry |
| Trust bar | `bg-dark-2` | +1 step lighter |
| How it works | `bg-dark-1` | Back to darkest |
| What we check | `bg-dark-2` | +1 step lighter |
| Preview report | `bg-dark-1` | Terminal aesthetic |
| Pricing | `bg-dark-2` | Cards use `bg-dark-3` |
| FAQ | `bg-dark-1` | Readable on darkest |
| Final CTA | `bg-dark-2` | Repeat URL input |
| Footer | `bg-dark-1` | Grounds the page |

### Section transitions
Between sections, add a 40px gradient divider for smooth visual flow:
```jsx
<div className="h-10 bg-gradient-to-b from-dark-1 to-dark-2"></div>
```

### Card styling (all cards, all sections)
```jsx
<div className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 hover:-translate-y-0.5 transition-all duration-200">
```

### Text colors
- Headings: `text-white`
- Body: `text-slate-300` (soft, not harsh)
- Muted: `text-slate-400`
- Very muted: `text-slate-500`
- Accent teal: `text-teal-300` or `#63ffd1`
- Accent cyan: `text-cyan-400` or `#22d3ee`

---

## Part B: Hero Copy Fix

### Current (shorten)
```
Is your website invisible to AI?
Free scan. 30 seconds. Get a score out of 100 for how well 
ChatGPT, Claude, Perplexity and Gemini can find your site.
```

### New version (aligned with 2026 principles: 8-12 word headline, 12-18 word subhead)
```
Headline (10 words):
Is your website invisible to AI agents like ChatGPT?

Subhead (14 words):
Free scan in 30 seconds. Get a score out of 100 
for AI agent visibility.

CTA button text: "Scan free →"
Below input: "Press Enter to scan"
```

### Trust indicators under input (keep these)
```
✓ 1,247 sites scanned this week
✓ No signup required
✓ Results in 30 seconds
```

**REMOVE the duplicate stats bar** below the hero. Only show stats ONCE.
The three tick-marks above replace the need for a separate stats section.

---

## Part C: "How it Works" Section Copy Fix

Current cards have generic placeholder text. Replace with:

### Card 1
**Title**: Enter your URL
**Body**: Paste any website. We'll scan it live — no signup, 
no credit card, no waiting.

### Card 2  
**Title**: We check 5 categories
**Body**: Structured data, AI crawlability, content parseability, 
commerce protocols, and agent discovery.

### Card 3
**Title**: Get your score + fixes
**Body**: A score out of 100, plus the top 3 fixes ranked by impact. 
Most fixes take under 30 minutes.

---

## Part D: Remove Any Duplicate Content

Audit the page for:
- [ ] "1,247 sites scanned this week" — appears only ONCE (in hero trust list)
- [ ] Stats bar (1,247 / 30s / $0 / Free) — REMOVE entirely, redundant with trust list
- [ ] "Trusted by" fake logos (Shopify, Notion, Vercel, Stripe) — REMOVE entirely
- [ ] Any "innovative businesses" placeholder text — REMOVE

---

## Part E: Typography Polish

In `globals.css` or Tailwind config:

```css
h1 {
  font-size: 48px;
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-weight: 600;
}

@media (max-width: 768px) {
  h1 { font-size: 32px; }
}

h2 {
  font-size: 32px;
  line-height: 1.2;
  letter-spacing: -0.01em;
  font-weight: 600;
}

body {
  font-size: 16px;
  line-height: 1.6;
}
```

---

## Acceptance Criteria

### Palette
- [ ] No white/light backgrounds anywhere on the page
- [ ] All sections use dark-1 or dark-2 backgrounds
- [ ] Cards use dark-3 with dark-5 borders
- [ ] Gradient dividers between sections are subtle (barely visible)
- [ ] Text readable on all backgrounds (WCAG AA contrast)

### Hero copy
- [ ] New headline shows in full: "Is your website invisible to AI agents like ChatGPT?"
- [ ] Subhead matches spec
- [ ] Three trust tick-marks below input, nothing else
- [ ] No duplicate "1,247 sites scanned" elsewhere on page
- [ ] Stats bar (1,247/30s/$0/Free) is removed

### How it works
- [ ] 3 cards have real copy (not "Enter URL / We scan 5 categories / Get score + fixes")
- [ ] Card styling matches dark palette spec

### Demo panel (verify untouched)
- [ ] Demo animation still works after changes
- [ ] All 5 modules still animate sequentially  
- [ ] Gauge still animates
- [ ] Brand rotation still cycles
- [ ] No regression from current working state

### Visual QA
- [ ] Run `npm run dev` and visually verify
- [ ] Screenshot the result and save to `screenshots/task-014.png`
- [ ] Mobile responsive check at 375px width

---

## Build process

1. Checkout current branch (should still be feature/013-dark-refinement at commit 4afed4c)
2. Create new branch: `git checkout -b feature/014-design-polish`
3. Make changes
4. Test locally with `npm run dev`
5. Commit with clear message: "feat: dark palette + hero copy polish (Task 014)"
6. DO NOT merge yet — wait for human review

## Out of scope (do not do)
- Do not modify the demo animation
- Do not add new features
- Do not change the URL input behavior
- Do not touch backend code
- Do not modify pricing page
