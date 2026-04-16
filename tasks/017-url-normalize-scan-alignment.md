# Task 017: URL Normalization + Scan Page Alignment + Final Polish

## Status: TODO | Priority: P0 | Est: 1.5h

## Scope (three connected fixes before deploy)

1. Normalize URL input so `ooow.com.au`, `www.ooow.com.au`, `https://ooow.com.au`, etc. all work
2. Make the scan results page visually match the hero demo animation
3. Remove duplicate live badges and fold orphaned stat into trust list (from deferred Task 016)

---

## Fix 1: URL Input Normalization

### Current problem
User types `ooow.com.au` or `www.ooow.com.au` and the scan fails or waits. Users expect to type a domain without the protocol. The form should accept any reasonable input and normalize it.

### Required behavior
Accept ALL of these as valid inputs for the same site:
- `ooow.com.au`
- `www.ooow.com.au`
- `http://ooow.com.au`
- `https://ooow.com.au`
- `https://www.ooow.com.au`
- `https://ooow.com.au/` (trailing slash)
- `https://ooow.com.au/collections/sculptures` (path — strip it)
- `ooow.com.au ` (whitespace — trim)
- `OOOW.COM.AU` (uppercase — lowercase it)

All should normalize to a single canonical form: `https://ooow.com.au`

### Implementation (Next.js frontend + FastAPI backend)

**Frontend (web/lib/normalizeUrl.ts — new file):**

```typescript
export function normalizeUrl(input: string): string | null {
  if (!input) return null;
  
  let url = input.trim().toLowerCase();
  
  if (!url) return null;
  
  // Strip any protocol, add https
  url = url.replace(/^https?:\/\//, '');
  
  // Strip trailing slash and any path
  const slashIndex = url.indexOf('/');
  if (slashIndex > 0) {
    url = url.substring(0, slashIndex);
  }
  
  // Strip any query string or fragment
  url = url.split('?')[0].split('#')[0];
  
  // Basic validation: must have at least one dot and no spaces
  if (!url.includes('.') || url.includes(' ')) return null;
  
  // Must be a valid-looking domain (letters, numbers, hyphens, dots only)
  if (!/^[a-z0-9.-]+$/.test(url)) return null;
  
  return `https://${url}`;
}
```

**Hook into the Scan button:**

```typescript
const handleScan = () => {
  const normalized = normalizeUrl(inputValue);
  if (!normalized) {
    setError('Please enter a valid website');
    return;
  }
  router.push(`/scan/${encodeURIComponent(normalized.replace('https://', ''))}`);
};
```

**Input placeholder update:**
Change placeholder from `https://yourwebsite.com` to just `yourwebsite.com` — no protocol shown. The `https://` prefix inside the input (the faded grey text to the left) should be REMOVED since it's misleading (users think they need to type after it).

Alternative: keep the grey `https://` prefix inside the input but make it clear it's a display-only element. Either way, the placeholder should just be `yourwebsite.com` or `ooow.com.au`.

**Backend (FastAPI):**

Already-running scanner should also normalize on its end as a safety net. Add to the scan endpoint:

```python
from urllib.parse import urlparse

def normalize_url(raw: str) -> str:
    """Accept any form, return https://domain.tld"""
    raw = raw.strip().lower()
    if not raw:
        raise ValueError("Empty URL")
    
    # Add protocol if missing
    if not raw.startswith(('http://', 'https://')):
        raw = f'https://{raw}'
    
    # Parse and reconstruct cleanly
    parsed = urlparse(raw)
    if not parsed.netloc:
        raise ValueError("Invalid URL")
    
    # Strip www. for consistency? (optional — some sites require it)
    # Leave www. intact if present to avoid redirect loops
    
    return f'https://{parsed.netloc}'
```

### Acceptance for Fix 1
- [ ] Typing `ooow.com.au` and hitting Enter works and scans https://ooow.com.au
- [ ] Typing `www.ooow.com.au` works
- [ ] Typing `https://ooow.com.au/collections/sculptures` scans https://ooow.com.au (path stripped)
- [ ] Typing whitespace or pressing Enter on empty input shows a gentle error, not a silent failure
- [ ] Invalid input (e.g. `not a url`) shows "Please enter a valid website"
- [ ] Placeholder is `yourwebsite.com` (no https:// prefix expectation)

---

## Fix 2: Scan Results Page Matches Demo Animation

### Current problem
The hero demo shows a polished animation with 5 module rows, gauge, score, and status label. But when a real scan runs at `/scan/[slug]`, the results page looks completely different. User expected THE demo and got something else. Breaks trust.

### Required behavior
The real scan results page should visually match the demo panel layout. Same components, same animations, same visual language — just with real data instead of hardcoded demo data.

### Implementation approach

**Extract the demo panel into a reusable component:**

The demo panel component (currently used on the hero) contains:
- Terminal-style header with LIVE indicator
- Terminal line showing `$ agentvisible scan {url}_`
- 5 module rows with bars and scores
- Gauge with score and status label
- Top fix line

This EXACT component should be used on both:
1. The hero (with hardcoded rotating demo data — current behavior)
2. The scan results page (with real data from the API)

**Refactor plan:**

1. Rename the demo panel component to `ScanResultPanel.tsx` (more accurate name)
2. Accept props for all data:

```typescript
interface ScanResultPanelProps {
  url: string;
  modules: {
    structured_data: number;
    ai_crawlability: number;
    content_parseability: number;
    commerce_protocols: number;
    agent_discovery: number;
  };
  score: number;
  status: string; // "STRONG · top 25%" | "MODERATE · top 50%" | etc
  topFix: string; // "Top fix: enable MCP endpoints (+18 points)"
  animate?: boolean; // true for hero demo (loops), false for real results (plays once)
  isLive?: boolean; // true shows "● LIVE" indicator (hero only)
}
```

3. Hero uses this component with `animate={true}` and rotating data
4. Scan page uses this component with `animate={false}` (plays animation once on load, then holds final state) and real data from the API

### Scan page layout

```
/scan/[slug] page:

[navbar with logo + "← Scan another site"]

[ScanResultPanel — big, centered, max-width 720px]
  Same visual as hero demo, but with real data
  Plays animation once on page load (zero to final)
  Holds final state (no looping)

[Section below: Top 3 fixes ranked by impact]
  Card for each fix with:
  - Current score impact (e.g. "+18 points if fixed")
  - Effort estimate (e.g. "~30 minutes")
  - Specific action (e.g. "Add /.well-known/mcp.json endpoint")

[Section: Full breakdown — expandable per module]
  Click a module name to see WHY it scored what it did

[CTA: Get a free monthly re-scan (email capture)]
[CTA: Share this report (share buttons)]
```

### Acceptance for Fix 2
- [ ] Scan result panel uses the SAME component as the hero demo
- [ ] Real scan at /scan/ooow.com.au shows the familiar animated layout
- [ ] Animation plays once on page load (not looping)
- [ ] Final state holds (user can read the scores)
- [ ] Real data is displayed (not hardcoded demo data)
- [ ] Top 3 fixes section below the panel
- [ ] Visual consistency between hero preview and real results

---

## Fix 3: Remove Duplicate Badges + Fold Stat into Trust List

### Remove

**"● live demo running" badge above the hero headline** — delete entirely.
**"● live demo running" text at the bottom of the demo panel** — delete entirely.

Only the "● LIVE" indicator in the demo panel header (top right, next to traffic lights) should remain.

### Merge

Delete the standalone "46% of websites score under 50" line (blue/cyan text, sitting orphaned below trust ticks).

Add as a fourth tick-mark to the trust list:
```
✓ 1,247 sites scanned this week
✓ No signup required
✓ Results in 30 seconds
✓ 46% of sites score under 50 — where will you land?
```

### Acceptance for Fix 3
- [ ] No badge above hero headline
- [ ] No "live demo running" text at bottom of demo panel
- [ ] Only ONE "LIVE" signal on page (in panel header)
- [ ] Trust list has 4 tick-marks, all same styling
- [ ] No orphaned stat line

---

## Build Process

1. Create branch: `git checkout -b feature/017-url-normalize-scan-alignment`
2. Implement all three fixes
3. Test scenarios manually:
   - Type `ooow.com.au` → scan runs
   - Type `www.ooow.com.au` → scan runs
   - Type `https://ooow.com.au/collections/sculptures` → scans https://ooow.com.au
   - Open the scan result page → looks like the hero demo
   - Hero has no duplicate badges
4. Screenshot before/after for both hero and scan results page
5. Commit: "feat: URL normalization + scan page alignment + badge cleanup (Task 017)"

---

## Out of scope
- Do not change scanner logic (it works)
- Do not modify "How it works" section
- Do not change palette
- Do not add new features (email capture section stays as-is if it exists)
