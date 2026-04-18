# Task 029: Pro Monitoring + Competitor Tracking

## Status: TODO | Priority: P0 | Est: 4-5h

## Goal
Pro users ($99/mo) can add their website + up to 2 competitors to a watchlist. System re-scans all watchlist URLs weekly. Users get email alerts when any score drops >5 points. Dashboard shows comparison view with score trends.

This is THE feature that justifies $99/mo recurring revenue.

## User journey
1. Pro user logs in → goes to /dashboard
2. Clicks "Add site to monitor" → enters their URL
3. Clicks "Add competitor" → enters competitor URL (max 2)
4. Next week: system auto-scans all 3 URLs
5. If any score drops >5 points → email alert sent
6. User visits dashboard → sees comparison chart showing all 3 side by side with trend

## Prerequisites
- ✅ Auth working (user_id available)
- ✅ Scanner working (can scan any URL)
- ✅ Stripe working (Pro subscription active)
- ✅ Dashboard page exists
- ✅ Resend configured for emails

---

## Database tables (run in Supabase SQL Editor)

```sql
-- Watchlist: URLs being monitored
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('self', 'competitor')),
  label TEXT, -- optional friendly name like "Our site" or "Main competitor"
  active BOOLEAN DEFAULT TRUE,
  last_scan_at TIMESTAMPTZ,
  last_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, url)
);

CREATE INDEX idx_watchlist_user ON watchlist(user_id) WHERE active = TRUE;

-- Score history: tracks scores over time for trending
CREATE TABLE IF NOT EXISTS score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES watchlist(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  modules JSONB NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_score_history_watchlist ON score_history(watchlist_id, scanned_at DESC);
```

---

## Files to CREATE

- `web/app/dashboard/monitoring/page.tsx` — Monitoring management page (add/remove URLs, view comparisons)
- `api/monitoring_routes.py` — CRUD for watchlist + trigger scan + comparison data
- `api/monitoring_cron.py` — Weekly scan logic (called by cron/scheduler)

## Files to MODIFY

- `web/app/dashboard/page.tsx` — Add "Monitoring" section with link to /dashboard/monitoring
- `api/main.py` — Import and mount monitoring_routes router

## ABSOLUTELY DO NOT MODIFY

- web/app/layout.tsx
- web/app/globals.css
- web/tailwind.config.ts
- web/app/page.tsx (home page)
- web/app/scan/page.tsx
- ScanResultPanel component
- Any auth files

---

## Backend: Monitoring API

### `api/monitoring_routes.py`

```python
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix='/api/v1/monitoring', tags=['monitoring'])

class AddWatchlistItem(BaseModel):
    url: str
    type: str  # 'self' or 'competitor'
    label: Optional[str] = None

class WatchlistResponse(BaseModel):
    id: str
    url: str
    type: str
    label: Optional[str]
    active: bool
    last_score: Optional[int]
    last_scan_at: Optional[str]

# GET /api/v1/monitoring/watchlist
@router.get('/watchlist')
async def get_watchlist(user_id: str = Depends(get_required_user_id)):
    """Get user's monitored URLs."""
    supabase = get_supabase_client()
    
    # Check user is Pro
    sub = supabase.table('subscriptions').select('tier').eq('user_id', user_id).eq('status', 'active').limit(1).execute()
    if not sub.data or sub.data[0].get('tier') != 'pro':
        raise HTTPException(status_code=403, detail='Pro subscription required for monitoring')
    
    result = supabase.table('watchlist').select('*').eq('user_id', user_id).eq('active', True).order('created_at').execute()
    return {'watchlist': result.data or []}

# POST /api/v1/monitoring/watchlist
@router.post('/watchlist')
async def add_to_watchlist(item: AddWatchlistItem, user_id: str = Depends(get_required_user_id)):
    """Add a URL to monitoring watchlist."""
    supabase = get_supabase_client()
    
    # Check Pro
    sub = supabase.table('subscriptions').select('tier').eq('user_id', user_id).eq('status', 'active').limit(1).execute()
    if not sub.data or sub.data[0].get('tier') != 'pro':
        raise HTTPException(status_code=403, detail='Pro subscription required')
    
    # Check limits: 1 self + 2 competitors = 3 max
    existing = supabase.table('watchlist').select('id, type').eq('user_id', user_id).eq('active', True).execute()
    current = existing.data or []
    
    self_count = sum(1 for w in current if w['type'] == 'self')
    competitor_count = sum(1 for w in current if w['type'] == 'competitor')
    
    if item.type == 'self' and self_count >= 1:
        raise HTTPException(status_code=400, detail='You can only monitor 1 of your own sites')
    if item.type == 'competitor' and competitor_count >= 2:
        raise HTTPException(status_code=400, detail='You can monitor up to 2 competitors')
    
    # Normalize URL
    url = item.url.strip().lower()
    if not url.startswith('http'):
        url = f'https://{url}'
    
    # Insert
    try:
        result = supabase.table('watchlist').insert({
            'user_id': user_id,
            'url': url,
            'type': item.type,
            'label': item.label or (url.replace('https://', '').split('/')[0]),
            'active': True,
        }).execute()
        
        return {'success': True, 'item': result.data[0] if result.data else None}
    except Exception as e:
        if 'duplicate' in str(e).lower() or 'unique' in str(e).lower():
            raise HTTPException(status_code=400, detail='This URL is already being monitored')
        raise HTTPException(status_code=500, detail=str(e))

# DELETE /api/v1/monitoring/watchlist/{item_id}
@router.delete('/watchlist/{item_id}')
async def remove_from_watchlist(item_id: str, user_id: str = Depends(get_required_user_id)):
    """Remove a URL from watchlist (soft delete)."""
    supabase = get_supabase_client()
    
    # Verify ownership
    item = supabase.table('watchlist').select('user_id').eq('id', item_id).single().execute()
    if not item.data or item.data['user_id'] != user_id:
        raise HTTPException(status_code=404, detail='Not found')
    
    supabase.table('watchlist').update({'active': False}).eq('id', item_id).execute()
    return {'success': True}

# GET /api/v1/monitoring/comparison
@router.get('/comparison')
async def get_comparison(user_id: str = Depends(get_required_user_id)):
    """Get comparison data for all monitored URLs."""
    supabase = get_supabase_client()
    
    # Get watchlist
    watchlist = supabase.table('watchlist').select('*').eq('user_id', user_id).eq('active', True).execute()
    items = watchlist.data or []
    
    comparison = []
    for item in items:
        # Get score history (last 12 entries = ~3 months of weekly scans)
        history = supabase.table('score_history').select('score, scanned_at').eq('watchlist_id', item['id']).order('scanned_at', desc=True).limit(12).execute()
        
        comparison.append({
            'id': item['id'],
            'url': item['url'],
            'type': item['type'],
            'label': item['label'],
            'current_score': item.get('last_score'),
            'last_scan_at': item.get('last_scan_at'),
            'history': list(reversed(history.data or [])),  # chronological order
        })
    
    return {'comparison': comparison}

# POST /api/v1/monitoring/scan-now
@router.post('/scan-now')
async def trigger_manual_scan(user_id: str = Depends(get_required_user_id)):
    """Manually trigger a scan of all watchlist URLs. Pro only."""
    supabase = get_supabase_client()
    
    # Check Pro
    sub = supabase.table('subscriptions').select('tier').eq('user_id', user_id).eq('status', 'active').limit(1).execute()
    if not sub.data or sub.data[0].get('tier') != 'pro':
        raise HTTPException(status_code=403, detail='Pro subscription required')
    
    watchlist = supabase.table('watchlist').select('*').eq('user_id', user_id).eq('active', True).execute()
    items = watchlist.data or []
    
    results = []
    for item in items:
        try:
            # Use existing scanner
            from scanner import scan_url
            scan_result = await scan_url(item['url'])
            score = scan_result.get('overall_score', scan_result.get('score', 0))
            
            # Save to score_history
            supabase.table('score_history').insert({
                'watchlist_id': item['id'],
                'score': round(score),
                'modules': scan_result.get('modules', {}),
            }).execute()
            
            # Update watchlist last_score and last_scan_at
            supabase.table('watchlist').update({
                'last_score': round(score),
                'last_scan_at': datetime.utcnow().isoformat(),
            }).eq('id', item['id']).execute()
            
            results.append({'url': item['url'], 'score': round(score), 'status': 'ok'})
        except Exception as e:
            results.append({'url': item['url'], 'score': None, 'status': f'error: {str(e)}'})
    
    return {'results': results}
```

### Mount in `api/main.py`

Add at the top with other imports:
```python
from monitoring_routes import router as monitoring_router
```

Add after other router includes:
```python
app.include_router(monitoring_router)
```

### Import dependencies

The monitoring_routes.py file needs access to `get_required_user_id` and `get_supabase_client`. Either:
- Import them from main.py: `from main import get_required_user_id, get_supabase_client`
- Or move them to a shared `api/deps.py` file

Choose whichever approach the existing codebase uses (check how stripe_routes.py imports these).

---

## Frontend: Monitoring page

### `web/app/dashboard/monitoring/page.tsx`

Full page with three sections:

**Section 1: Your Watchlist (add/remove URLs)**

```
┌──────────────────────────────────────────────┐
│  Monitoring                     [Scan now]   │
│                                              │
│  Your site                                   │
│  ┌────────────────────────────────────────┐  │
│  │ ooow.com.au     Score: 57    Apr 17   │  │
│  │                              [Remove] │  │
│  └────────────────────────────────────────┘  │
│  (or [+ Add your site] if none added)        │
│                                              │
│  Competitors                                 │
│  ┌────────────────────────────────────────┐  │
│  │ competitor1.com  Score: 72   Apr 17   │  │
│  │                              [Remove] │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ competitor2.com  Score: 65   Apr 17   │  │
│  │                              [Remove] │  │
│  └────────────────────────────────────────┘  │
│  [+ Add competitor] (if <2 competitors)      │
│                                              │
└──────────────────────────────────────────────┘
```

**Section 2: Score Comparison (side by side)**

```
┌──────────────────────────────────────────────┐
│  Score Comparison                            │
│                                              │
│  Site              Current   Change  Trend   │
│  ────────────────  ───────   ──────  ─────   │
│  ooow.com.au        57       -3     ↘        │
│  competitor1.com    72       +5     ↗        │
│  competitor2.com    65       +1     →        │
│                                              │
└──────────────────────────────────────────────┘
```

**Section 3: Score History Chart (simple line display)**

Show last 12 data points per URL. Use inline SVG or a simple bar/line display — no external charting library needed.

```
┌──────────────────────────────────────────────┐
│  Score History (last 12 weeks)               │
│                                              │
│  100│                                        │
│   80│  ──●──●──●──●──●                       │
│   60│──●──●──●──●──●──●──●                   │
│   40│                                        │
│   20│                                        │
│    0│──────────────────────                  │
│     └────────────────────────                │
│                                              │
│  ● ooow.com.au  ● competitor1  ● competitor2 │
│                                              │
└──────────────────────────────────────────────┘
```

For the chart: use inline SVG with `<polyline>` for each URL. Three colors: teal for self, cyan for competitor 1, amber for competitor 2. No external dependencies.

### Add URL modal / form

When clicking "+ Add your site" or "+ Add competitor", show a simple inline form (not a modal):

```tsx
<div className="mt-4 flex gap-2">
  <input
    type="text"
    placeholder="Enter website URL"
    value={newUrl}
    onChange={(e) => setNewUrl(e.target.value)}
    className="flex-1 bg-[#1a1f2e] border border-[#252b3a] rounded-lg px-4 py-2 text-white text-sm"
  />
  <button
    onClick={() => addToWatchlist(newUrl, type)}
    className="bg-teal-400 text-[#0a0e17] px-4 py-2 rounded-lg text-sm font-medium"
  >
    Add
  </button>
</div>
```

### Auth + Pro gate

At top of component:
- Check user is logged in (redirect to /auth/sign-in if not)
- Fetch watchlist data
- If user is not Pro, show upgrade message: "Monitoring requires a Pro subscription" with link to /pricing

### Styling

Use ONLY inline hex colors or existing Tailwind utilities:
- `bg-[#0a0e17]` — page background
- `bg-[#111827]` — card background
- `bg-[#1a1f2e]` — input background
- `border-[#252b3a]` — borders
- `text-white` — headings
- `text-slate-300` — body
- `text-slate-400` — muted
- `text-teal-400` — accents and "self" color
- `text-cyan-400` — competitor 1 color
- `text-amber-400` — competitor 2 color

---

## Update dashboard page

In `web/app/dashboard/page.tsx`, add a monitoring section for Pro users.

Find where the Pro subscription info is displayed. Add below it:

```tsx
{tier === 'pro' && (
  <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6 mt-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium text-white">Monitoring</h3>
      <a href="/dashboard/monitoring" className="text-teal-400 text-sm hover:underline">
        Manage watchlist →
      </a>
    </div>
    <p className="text-slate-400 text-sm">
      Track your site and up to 2 competitors. Weekly automated scans with email alerts.
    </p>
  </div>
)}
```

For free users, add below the upgrade CTA:

```tsx
{tier === 'free' && (
  <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6 mt-6 opacity-60">
    <h3 className="text-lg font-medium text-white mb-2">Monitoring</h3>
    <p className="text-slate-400 text-sm">
      Pro feature: Track your site + 2 competitors with weekly scans and score drop alerts.
    </p>
  </div>
)}
```

---

## Weekly cron scan logic

### `api/monitoring_cron.py`

This is the script that runs weekly to scan all active watchlist URLs:

```python
"""
Weekly monitoring scan — run via cron or Vercel cron.
Scans all active watchlist URLs and sends alerts on score drops.
"""
import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

async def run_weekly_scans():
    from database import get_supabase_client
    from scanner import scan_url
    
    supabase = get_supabase_client()
    
    # Get all active watchlist items
    result = supabase.table('watchlist').select('*, auth.users(email)').eq('active', True).execute()
    items = result.data or []
    
    print(f'Running weekly scan for {len(items)} watchlist items...')
    
    alerts = []  # Collect score drops for email alerts
    
    for item in items:
        try:
            # Scan the URL
            scan_result = await scan_url(item['url'])
            new_score = round(scan_result.get('overall_score', scan_result.get('score', 0)))
            old_score = item.get('last_score')
            
            # Save to score_history
            supabase.table('score_history').insert({
                'watchlist_id': item['id'],
                'score': new_score,
                'modules': scan_result.get('modules', {}),
            }).execute()
            
            # Update watchlist
            supabase.table('watchlist').update({
                'last_score': new_score,
                'last_scan_at': datetime.utcnow().isoformat(),
            }).eq('id', item['id']).execute()
            
            # Check for score drop > 5 points
            if old_score is not None and (old_score - new_score) > 5:
                alerts.append({
                    'user_id': item['user_id'],
                    'url': item['url'],
                    'old_score': old_score,
                    'new_score': new_score,
                    'drop': old_score - new_score,
                })
            
            print(f'  ✓ {item["url"]}: {new_score}/100 (was {old_score})')
            
        except Exception as e:
            print(f'  ✗ {item["url"]}: error - {e}')
    
    # Send alert emails for score drops
    if alerts:
        await send_drop_alerts(supabase, alerts)
    
    print(f'Weekly scan complete. {len(alerts)} alerts sent.')


async def send_drop_alerts(supabase, alerts):
    """Send email alerts for score drops."""
    import resend
    resend.api_key = os.environ.get('RESEND_API_KEY')
    
    # Group alerts by user
    user_alerts = {}
    for alert in alerts:
        uid = alert['user_id']
        if uid not in user_alerts:
            user_alerts[uid] = []
        user_alerts[uid].append(alert)
    
    for user_id, user_alert_list in user_alerts.items():
        # Get user email
        user = supabase.auth.admin.get_user_by_id(user_id)
        email = user.user.email if user and user.user else None
        
        if not email:
            continue
        
        # Build alert email
        alert_rows = ''
        for a in user_alert_list:
            alert_rows += f'<tr><td style="padding:8px;color:#cbd5e1;">{a["url"]}</td>'
            alert_rows += f'<td style="padding:8px;color:#ef4444;">{a["old_score"]} → {a["new_score"]} (↓{a["drop"]})</td></tr>'
        
        try:
            resend.Emails.send({
                'from': 'AgentVisible <alerts@agentvisible.ai>',
                'to': [email],
                'subject': f'Score drop alert: {len(user_alert_list)} site(s) decreased',
                'html': f'''
                    <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#cbd5e1;">
                        <h1 style="color:#ffffff;font-size:24px;">Score Drop Alert</h1>
                        <p>The following monitored sites had score decreases of more than 5 points:</p>
                        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                            <tr style="border-bottom:1px solid #252b3a;">
                                <th style="text-align:left;padding:8px;color:#94a3b8;">Site</th>
                                <th style="text-align:left;padding:8px;color:#94a3b8;">Score Change</th>
                            </tr>
                            {alert_rows}
                        </table>
                        <p style="margin-top:24px;">
                            <a href="https://agentvisible.ai/dashboard/monitoring" style="color:#22d3ee;">
                                View full comparison →
                            </a>
                        </p>
                        <hr style="border-color:#252b3a;margin:24px 0;"/>
                        <p style="font-size:12px;color:#64748b;">AgentVisible.ai · Pro Monitoring Alert</p>
                    </div>
                ''',
            })
            print(f'  Alert sent to {email}')
        except Exception as e:
            print(f'  Alert email failed for {email}: {e}')


if __name__ == '__main__':
    asyncio.run(run_weekly_scans())
```

### How to schedule (document for FG, do NOT implement scheduler)

**Option A: Manual for now**
```bash
cd ~/projects/agentvisible
python3 api/monitoring_cron.py
```

**Option B: Vercel Cron (post-deploy)**
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/weekly-scan",
    "schedule": "0 9 * * 1"
  }]
}
```
This runs every Monday at 9 AM UTC.

**Option C: System cron on Mac Mini**
```bash
crontab -e
# Add: 0 9 * * 1 cd ~/projects/agentvisible && python3 api/monitoring_cron.py
```

---

## Acceptance Criteria

### Watchlist CRUD
- [ ] POST /api/v1/monitoring/watchlist adds URL (Pro only)
- [ ] GET /api/v1/monitoring/watchlist returns user's monitored URLs
- [ ] DELETE /api/v1/monitoring/watchlist/{id} soft-deletes item
- [ ] Limit enforced: max 1 self + 2 competitors
- [ ] 403 returned for non-Pro users
- [ ] Duplicate URL detection works

### Comparison data
- [ ] GET /api/v1/monitoring/comparison returns all watchlist items with score history
- [ ] History ordered chronologically (oldest first)
- [ ] Up to 12 data points per URL

### Manual scan
- [ ] POST /api/v1/monitoring/scan-now triggers scan of all watchlist URLs
- [ ] Results saved to score_history table
- [ ] Watchlist last_score and last_scan_at updated

### Frontend
- [ ] /dashboard/monitoring page loads for Pro users
- [ ] Non-Pro users see upgrade message
- [ ] Can add self URL and up to 2 competitor URLs
- [ ] Can remove URLs from watchlist
- [ ] Comparison table shows all 3 sites with scores
- [ ] Score history displayed as simple chart (SVG polyline)
- [ ] "Scan now" button triggers manual scan and refreshes data
- [ ] Dashboard page links to /dashboard/monitoring for Pro users

### Cron script
- [ ] monitoring_cron.py runs successfully when called manually
- [ ] Scans all active watchlist items
- [ ] Saves results to score_history
- [ ] Detects score drops > 5 points
- [ ] Sends alert emails for drops via Resend

### No regressions
- [ ] Home page CSS fully intact
- [ ] Hero demo animation works
- [ ] Dashboard page still loads
- [ ] Scan flow unchanged
- [ ] Auth unchanged

## Verification commands

```bash
cd ~/projects/agentvisible

# Files exist
test -f api/monitoring_routes.py && echo "routes ok" || echo "MISSING"
test -f api/monitoring_cron.py && echo "cron ok" || echo "MISSING"
test -f web/app/dashboard/monitoring/page.tsx && echo "page ok" || echo "MISSING"

# Router mounted
grep -n "monitoring_routes\|monitoring_router" api/main.py

# Dashboard links to monitoring
grep -n "monitoring" web/app/dashboard/page.tsx

# Build passes
cd web && npm run build

# HOME PAGE STILL HAS STYLING — critical check
# If localhost:3000 shows raw HTML without CSS, you broke layout.tsx. Revert everything.

```

## Commit
```
feat: Pro monitoring with competitor tracking, comparison view, and score drop alerts (Task 029)
```

## Out of scope
- Do not implement the cron scheduler — just create the script
- Do not set up Vercel cron config — document it for later
- No webhook for real-time score updates
- No PDF export of comparison data
- No public sharing of comparison results
- No more than 3 URLs per user (1 self + 2 competitors)
- Do not modify layout.tsx, globals.css, tailwind.config.ts
- Do not use any external charting library (use inline SVG)
