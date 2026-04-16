# Task 015: Demo Panel — Zero-to-Final Animation

## Status: TODO | Priority: P0 | Est: 1.5h

## Scope
ONLY modify the demo animation panel component. 
DO NOT touch page.tsx, tailwind.config.ts, or any other file.

Files to modify:
- The demo panel component (LiveDemoPanel.tsx or equivalent)

---

## Core principle: All elements ALWAYS visible from frame 1

The current problem: modules and gauge are hidden (opacity 0 or visibility hidden) until animation triggers. This causes the panel to look empty if animation fails.

**New approach:** Every element renders immediately on page load with full layout. Only the VALUES animate from 0 to final.

---

## Initial state (what shows immediately on page load)

```
┌──────────────────────────────────────┐
│ ● ● ●    ● LIVE                      │
│ agentvisible.ai/scan/stripe.com      │
├──────────────────────────────────────┤
│ $ agentvisible scan stripe.com_       │
│                                      │
│ Structured data    ░░░░░░░░░░   0/100│  <- row visible, bar empty, value 0
│ AI crawlability    ░░░░░░░░░░   0/100│
│ Content parseab... ░░░░░░░░░░   0/100│
│ Commerce proto...  ░░░░░░░░░░   0/100│
│ Agent discovery    ░░░░░░░░░░   0/100│
│                                      │
├──────────────────────────────────────┤
│   ╭─────╮   0/100                    │  <- gauge visible but empty
│   │  0  │   SCANNING...              │
│   ╰─────╯                            │
└──────────────────────────────────────┘
```

All rows present. All labels present. All progress bars visible but at 0% fill. Gauge circle outline visible but no progress arc drawn. Score shows "0". Status shows "SCANNING...".

---

## Animation sequence (after load)

### Timeline (total 8 seconds per cycle)

```
0.0s — Panel renders with all elements at zero state (above)
0.5s — Module 1 bar fills: 0 → 92 (count-up number + bar width), takes 1s
1.5s — Module 2 bar fills: 0 → 88, takes 1s
2.5s — Module 3 bar fills: 0 → 71, takes 1s
3.5s — Module 4 bar fills: 0 → 47, takes 1s
4.5s — Module 5 bar fills: 0 → 85, takes 1s
5.5s — Gauge arc draws: 0 → 76 degrees of circle, takes 1.5s
5.5s — Score number counts up: 0 → 76 over 1.5s
7.0s — Status flips from "SCANNING..." to "STRONG · top 25%"
7.5s — Top fix line fades in: "Top fix: enable MCP endpoints (+18 points)"
8.0s — Hold for 2 seconds
10.0s — Reset to zero state, rotate to next brand URL
```

### Implementation notes

For each module row:
- Label is always rendered (never fades in/out)
- Bar track always visible (`bg-dark-5`)
- Bar fill uses `width: ${currentValue}%` — animates from 0% to target%
- Number is a count-up that ticks from 0 to target
- Status icon (✓ ⚠ ✗) appears once value exceeds threshold:
  - 0-49: red ✗
  - 50-74: amber ⚠
  - 75-100: green ✓

For the gauge:
- SVG circle always rendered (border ring)
- Inner arc uses `stroke-dasharray` + animated `stroke-dashoffset` to draw from 0 to target
- Score text is a count-up 0 → final value
- Color of arc based on final score: red/amber/green

### Brand rotation data

Cycle through these every 10 seconds:
```js
const demos = [
  { url: 'stripe.com', modules: [92, 88, 71, 47, 85], score: 76, label: 'STRONG · top 25%' },
  { url: 'shopify.com', modules: [95, 84, 78, 89, 82], score: 85, label: 'STRONG · top 15%' },
  { url: 'notion.so', modules: [78, 65, 82, 42, 71], score: 67, label: 'MODERATE · top 50%' },
  { url: 'vercel.com', modules: [94, 91, 88, 85, 97], score: 91, label: 'EXCELLENT · top 5%' },
];
```

---

## Technical implementation hints (React)

### Count-up number animation
```jsx
const [currentValue, setCurrentValue] = useState(0);

useEffect(() => {
  if (!isAnimating) return;
  const duration = 1000;
  const steps = 30;
  const increment = targetValue / steps;
  let step = 0;
  
  const interval = setInterval(() => {
    step++;
    setCurrentValue(Math.min(Math.round(increment * step), targetValue));
    if (step >= steps) clearInterval(interval);
  }, duration / steps);
  
  return () => clearInterval(interval);
}, [isAnimating, targetValue]);
```

### Bar fill (CSS transition)
```jsx
<div 
  className="h-1.5 bg-teal-400 transition-all duration-1000 ease-out"
  style={{ width: `${currentValue}%` }}
/>
```

### Gauge arc (SVG with stroke-dashoffset)
```jsx
const circumference = 2 * Math.PI * 40;
const offset = circumference - (currentScore / 100) * circumference;

<circle
  cx="50" cy="50" r="40"
  fill="none"
  stroke="#63ffd1"
  strokeWidth="6"
  strokeDasharray={circumference}
  strokeDashoffset={offset}
  style={{ 
    transition: 'stroke-dashoffset 1500ms ease-out',
    transform: 'rotate(-90deg)',
    transformOrigin: 'center'
  }}
/>
```

---

## Acceptance Criteria

### Zero-state rendering
- [ ] On page load, ALL demo panel elements are visible (header, terminal, 5 rows, gauge, score area)
- [ ] Progress bars render at 0% fill
- [ ] All module values show "0/100"
- [ ] Gauge arc shows empty (outline only, no fill)
- [ ] Score shows "0/100"
- [ ] Status shows "SCANNING..."

### Animation
- [ ] Bars fill smoothly from 0% to target % over 1 second each
- [ ] Numbers count up from 0 to target (not instant snap)
- [ ] Module animations stagger (one after another, not all at once)
- [ ] Gauge arc draws smoothly from 0 to target position
- [ ] Status icons (✓⚠✗) appear based on threshold crossings
- [ ] Final status label appears after gauge finishes

### Rotation
- [ ] After 10 seconds total, panel resets to zero state
- [ ] Next brand URL loads (stripe → shopify → notion → vercel → loop)
- [ ] Terminal line updates to show new URL being scanned
- [ ] Animation plays again from zero

### Visual consistency
- [ ] Panel layout NEVER changes size during animation (fixed 480px height)
- [ ] No content jumps or shifts as values update
- [ ] Smooth 60fps animation (no janky updates)
- [ ] Respects `prefers-reduced-motion` (show final state instantly if user has reduced motion)

### Edge cases
- [ ] If JS fails to load, panel shows first brand's FINAL state (not empty)
- [ ] Works on mobile (reduce panel height to 400px below 768px)
- [ ] No console errors

---

## Out of scope (do not do)
- Do not modify page.tsx
- Do not modify tailwind.config.ts  
- Do not add new sections or features
- Do not change the trust bar or How it works sections
- Do not modify the URL input or Scan button

## Build process
1. Stay on current branch (feature/014-design-polish or main)
2. Create: `git checkout -b feature/015-demo-animation`
3. Modify ONLY the demo panel component
4. Test with `npm run dev` — watch the full 10-second cycle at least twice
5. Screenshot the zero state and the final state, save to `screenshots/`
6. Commit: "feat: zero-to-final demo animation (Task 015)"
