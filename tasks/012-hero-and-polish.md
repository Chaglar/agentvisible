# Task 012: Live Demo Hero + Design Polish

## Status: TODO | Priority: P0 | Est: 4h

## Goal
Two improvements to the landing page:
1. Replace the current hero section with an animated live demo scan
2. Break up the all-dark theme with alternating light/dark sections

---

## Part A: Live Demo Hero Animation

### Hero layout (dark section, keep #0a0e17 background)
```
[pulse badge: ● live demo running]
Can AI agents find your business?
[subheadline: Get a score out of 100...]
[URL input] [Scan free button]
46% of websites score under 50

[DEMO PANEL — fake live scan running]
```

### Demo panel components
- Browser chrome: traffic light dots + URL bar showing `agentvisible.ai/scan/stripe.com`
- Live indicator (green pulsing dot + "LIVE")
- Terminal prompt: `$ agentvisible scan stripe.com_`
- 5 module rows that fill in sequentially:
  - Structured data: 92/100 (green, ✓)
  - AI crawlability: 88/100 (green, ✓)
  - Content parseability: 71/100 (amber, ⚠)
  - Commerce protocols: 47/100 (red, ✗)
  - Agent discovery: 85/100 (green, ✓)
- Score gauge on left (72px circular SVG) sweeps to final score
- Overall score: 76/100 STRONG
- Top fix teaser: "enable MCP endpoints (+18 points)"

### Animation timing
- 0s: Panel visible, terminal header showing
- 0.8s–5.6s: Modules fade in one at a time, bars fill (1.2s each, staggered)
- 6s: Gauge arc sweeps from 0 to 76/100
- 7s: Score number + rating + top fix fade in
- 12s: Loop restarts with NEXT demo URL

### Data rotation
Pull from Supabase — rotate through 5 pre-scanned brands:
1. stripe.com (76/100 — Strong)
2. shopify.com (82/100 — Strong)
3. notion.so (64/100 — Moderate)
4. vercel.com (91/100 — Strong)
5. ooow.com.au (58/100 — Moderate)

Each rotation: 12 seconds. Pick randomly or cycle in order.

### Pause on hover
When user hovers the demo panel, pause the animation. Resume when mouse leaves. Accessibility: respect `prefers-reduced-motion`.

### Fallback
If JS disabled: show static completed scan of stripe.com. No animation, same layout.

---

## Part B: Mixed Light/Dark Sections

Break up the wall of dark. New section flow:

### Landing page sections (top to bottom)
1. **Hero (DARK #0a0e17)** — headline + URL input + live demo animation
2. **Social proof bar (LIGHT #f8fafc)** — "Used to scan: [logos]. Scanned 1,247 sites this week."
3. **How it works (LIGHT)** — 3 steps with icons on white cards
4. **What we check (LIGHT)** — 5 module cards on light bg with subtle colored accents
5. **See a real report (DARK)** — embedded preview of a scan report (dark matches the report page style)
6. **Pricing (LIGHT)** — 3 tier cards on white bg, easier to compare
7. **FAQ (LIGHT)** — accordion on white, readable
8. **CTA repeat (DARK)** — final URL input with scan button
9. **Footer (DARK)**

### Color system per section type

**Dark sections:**
- Background: `#0a0e17`
- Secondary background: `#0d1220`
- Text primary: `#ffffff`
- Text secondary: `#94a3b8`
- Borders: `#1e2436`
- Accents: `#63ffd1` (teal), `#22d3ee` (cyan)

**Light sections:**
- Background: `#ffffff`
- Secondary background: `#f8fafc` (subtle grey)
- Text primary: `#0a0e17` (same dark navy for consistency)
- Text secondary: `#64748b`
- Borders: `#e2e8f0`
- Accents: `#0f6e56` (darker teal — readable on white), `#0891b2` (darker cyan)

### Smooth transitions between sections
- Use section-level background, not page-level
- No gradients — flat color blocks with sharp transitions
- Add 80-120px vertical padding between sections for breathing room
- Keep max-width: 1200px on content, full-width on backgrounds

---

## Part C: Other Polish Tweaks

### Typography refinements
- Headline: 48px on desktop, 32px on mobile (current is too small)
- Use `letter-spacing: -0.02em` on all large text (feels premium)
- Body text: 16px, line-height 1.6 (readable)

### Micro-interactions
- URL input: subtle glow on focus (teal border, NOT a shadow)
- Scan button: scale(0.98) on click (tactile feedback)
- Module cards: slight lift on hover (translateY(-2px))

### Remove
- Any emoji in section headings (looks cheap)
- The "46% of websites..." stat if it's currently huge — keep it small and subtle
- Any gradients (flat colors everywhere)

### Add
- Keyboard shortcut hint: "Press Enter to scan" next to the input
- Small "Trusted by" with 4-5 fake logos (or real ones from pre-scanned brands)
- Scroll indicator at bottom of hero (subtle animated chevron)

---

## Acceptance Criteria

### Hero animation
- [ ] Demo panel renders on page load
- [ ] 5 modules fade in sequentially with filling bars
- [ ] Gauge animates from 0 to score
- [ ] Loops through 5 different brands every 12s
- [ ] Pauses on hover
- [ ] Respects prefers-reduced-motion
- [ ] Fallback static state if JS disabled

### Design polish
- [ ] Landing page has alternating light/dark sections per spec
- [ ] Light sections use white bg with dark text (readable)
- [ ] Dark sections use #0a0e17 bg with white text
- [ ] No abrupt color clashes between sections
- [ ] Mobile responsive — sections stack cleanly
- [ ] Typography sizes match spec
- [ ] All hover/focus states work smoothly

### Performance
- [ ] Animation doesn't impact Lighthouse score (>90)
- [ ] No layout shift during animation
- [ ] First Contentful Paint < 1.5s
