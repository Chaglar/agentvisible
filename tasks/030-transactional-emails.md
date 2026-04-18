# Task 030: Transactional Emails via Resend

## Status: TODO | Priority: P0 | Est: 2-3h

## Goal
Send branded transactional emails for key user events. Resend is already configured and domain verified (agentvisible.ai).

## Emails to build

1. **Welcome email** — sent on first signup
2. **$99 Pro subscription receipt** — sent after successful Pro checkout
3. **Score drop alert** — sent by monitoring cron when score drops >5 points (template exists in monitoring_cron.py but needs branding)
4. **Weekly Pro digest** — summary of monitored sites for Pro users

Note: $29 PDF receipt + attachment already works from Task 027. Don't modify it.

## Prerequisites
- ✅ Resend API key configured in api/.env
- ✅ Domain verified: agentvisible.ai
- ✅ Email sending works (tested with PDF report)
- ✅ Auth working (user email available)
- ✅ Stripe webhooks exist

---

## Files to CREATE

- `api/email_templates.py` — All email HTML templates as functions

## Files to MODIFY

- `api/stripe_webhooks.py` — Send Pro receipt on subscription checkout
- `api/monitoring_cron.py` — Use branded template for score drop alerts
- `api/main.py` — Add webhook or listener for new user signup (welcome email)

## ABSOLUTELY DO NOT MODIFY

- web/app/layout.tsx
- web/app/globals.css
- web/tailwind.config.ts
- web/app/page.tsx
- Any frontend scan files
- ScanResultPanel

---

## Email templates

### `api/email_templates.py`

All templates share a common wrapper:

```python
def email_wrapper(content: str) -> str:
    """Wrap email content in branded AgentVisible template."""
    return f'''
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#0a0e17;color:#cbd5e1;padding:32px;">
        <div style="margin-bottom:24px;">
            <span style="color:#63ffd1;font-size:18px;font-weight:600;">AgentVisible</span>
            <span style="color:#64748b;font-size:14px;margin-left:4px;">.ai</span>
        </div>
        {content}
        <hr style="border:none;border-top:1px solid #252b3a;margin:32px 0 16px;"/>
        <div style="font-size:11px;color:#64748b;">
            <p>AgentVisible.ai · AI Agent Readiness Scanner</p>
            <p><a href="https://agentvisible.ai/terms" style="color:#64748b;">Terms</a> · 
               <a href="https://agentvisible.ai/privacy" style="color:#64748b;">Privacy</a> · 
               <a href="https://agentvisible.ai/refunds" style="color:#64748b;">Refunds</a></p>
        </div>
    </div>
    '''
```

### Email 1: Welcome

```python
def welcome_email(user_email: str) -> dict:
    """Welcome email for new signups."""
    content = '''
        <h1 style="color:#ffffff;font-size:24px;margin:0 0 16px;">Welcome to AgentVisible</h1>
        <p>You now have a free account. Here is what you can do:</p>
        <ul style="color:#94a3b8;padding-left:20px;line-height:1.8;">
            <li>Scan up to 10 websites per hour</li>
            <li>Get a score out of 100 for AI agent readiness</li>
            <li>See the top 3 fixes for each site</li>
        </ul>
        <div style="margin:24px 0;">
            <a href="https://agentvisible.ai" 
               style="background:#63ffd1;color:#0a0e17;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                Scan your first site
            </a>
        </div>
        <p style="color:#64748b;font-size:13px;">
            Want unlimited scans and competitor tracking? 
            <a href="https://agentvisible.ai/pricing" style="color:#22d3ee;">View Pro plans</a>
        </p>
    '''
    return {
        'from': 'AgentVisible <hello@agentvisible.ai>',
        'to': [user_email],
        'subject': 'Welcome to AgentVisible — scan your first site',
        'html': email_wrapper(content),
    }
```

### Email 2: Pro subscription receipt

```python
def pro_receipt_email(user_email: str, amount: str = '$99.00', period_end: str = '') -> dict:
    """Receipt email for Pro subscription payment."""
    content = f'''
        <h1 style="color:#ffffff;font-size:24px;margin:0 0 16px;">Payment confirmed</h1>
        <div style="background:#111827;border:1px solid #252b3a;border-radius:12px;padding:20px;margin:16px 0;">
            <table style="width:100%;font-size:14px;">
                <tr>
                    <td style="color:#94a3b8;padding:6px 0;">Plan</td>
                    <td style="color:#ffffff;text-align:right;padding:6px 0;">AgentVisible Pro</td>
                </tr>
                <tr>
                    <td style="color:#94a3b8;padding:6px 0;">Amount</td>
                    <td style="color:#ffffff;text-align:right;padding:6px 0;">{amount} USD</td>
                </tr>
                <tr>
                    <td style="color:#94a3b8;padding:6px 0;">Billing period</td>
                    <td style="color:#ffffff;text-align:right;padding:6px 0;">Monthly</td>
                </tr>
                {f'<tr><td style="color:#94a3b8;padding:6px 0;">Next renewal</td><td style="color:#ffffff;text-align:right;padding:6px 0;">{period_end}</td></tr>' if period_end else ''}
            </table>
        </div>
        <p>Your Pro features are now active:</p>
        <ul style="color:#94a3b8;padding-left:20px;line-height:1.8;">
            <li>Unlimited scans</li>
            <li>Monitor your site + 2 competitors weekly</li>
            <li>Email alerts on score drops</li>
            <li>Score history and trends</li>
        </ul>
        <div style="margin:24px 0;">
            <a href="https://agentvisible.ai/dashboard/monitoring" 
               style="background:#63ffd1;color:#0a0e17;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                Set up monitoring
            </a>
        </div>
        <p style="color:#64748b;font-size:13px;">
            Manage your subscription anytime from your 
            <a href="https://agentvisible.ai/dashboard" style="color:#22d3ee;">dashboard</a>.
        </p>
    '''
    return {
        'from': 'AgentVisible <billing@agentvisible.ai>',
        'to': [user_email],
        'subject': 'Your AgentVisible Pro subscription is active',
        'html': email_wrapper(content),
    }
```

### Email 3: Score drop alert (branded version)

```python
def score_drop_alert_email(user_email: str, alerts: list) -> dict:
    """Alert email when monitored sites drop >5 points."""
    alert_rows = ''
    for a in alerts:
        color = '#ef4444'
        alert_rows += f'''
            <tr>
                <td style="padding:10px;color:#cbd5e1;border-bottom:1px solid #252b3a;">{a["url"]}</td>
                <td style="padding:10px;color:{color};border-bottom:1px solid #252b3a;text-align:center;">{a["old_score"]}</td>
                <td style="padding:10px;color:{color};border-bottom:1px solid #252b3a;text-align:center;">{a["new_score"]}</td>
                <td style="padding:10px;color:{color};border-bottom:1px solid #252b3a;text-align:center;">-{a["drop"]}</td>
            </tr>
        '''
    
    content = f'''
        <h1 style="color:#ffffff;font-size:24px;margin:0 0 8px;">Score drop detected</h1>
        <p style="color:#94a3b8;margin:0 0 20px;">{len(alerts)} monitored site(s) had score decreases of more than 5 points.</p>
        <div style="background:#111827;border:1px solid #252b3a;border-radius:12px;overflow:hidden;margin:16px 0;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <tr style="background:#1a1f2e;">
                    <th style="text-align:left;padding:10px;color:#64748b;">Site</th>
                    <th style="text-align:center;padding:10px;color:#64748b;">Was</th>
                    <th style="text-align:center;padding:10px;color:#64748b;">Now</th>
                    <th style="text-align:center;padding:10px;color:#64748b;">Drop</th>
                </tr>
                {alert_rows}
            </table>
        </div>
        <p style="color:#94a3b8;font-size:13px;">Score drops can happen when a site changes its metadata, removes structured data, or modifies its robots.txt configuration.</p>
        <div style="margin:24px 0;">
            <a href="https://agentvisible.ai/dashboard/monitoring" 
               style="background:#63ffd1;color:#0a0e17;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                View full comparison
            </a>
        </div>
    '''
    return {
        'from': 'AgentVisible <alerts@agentvisible.ai>',
        'to': [user_email],
        'subject': f'Score drop alert: {len(alerts)} site(s) decreased',
        'html': email_wrapper(content),
    }
```

### Email 4: Weekly Pro digest

```python
def weekly_digest_email(user_email: str, sites: list) -> dict:
    """Weekly summary for Pro users showing all monitored sites."""
    site_rows = ''
    for s in sites:
        score = s.get('score', 0)
        if score >= 75:
            color = '#22c55e'
        elif score >= 50:
            color = '#f59e0b'
        else:
            color = '#ef4444'
        
        change = s.get('change', 0)
        change_str = f'+{change}' if change > 0 else str(change)
        change_color = '#22c55e' if change > 0 else '#ef4444' if change < 0 else '#64748b'
        
        site_rows += f'''
            <tr>
                <td style="padding:10px;color:#cbd5e1;border-bottom:1px solid #252b3a;">{s["url"]}</td>
                <td style="padding:10px;color:{color};border-bottom:1px solid #252b3a;text-align:center;font-weight:600;">{score}</td>
                <td style="padding:10px;color:{change_color};border-bottom:1px solid #252b3a;text-align:center;">{change_str}</td>
            </tr>
        '''
    
    content = f'''
        <h1 style="color:#ffffff;font-size:24px;margin:0 0 8px;">Your weekly AI readiness report</h1>
        <p style="color:#94a3b8;margin:0 0 20px;">Here is how your monitored sites performed this week.</p>
        <div style="background:#111827;border:1px solid #252b3a;border-radius:12px;overflow:hidden;margin:16px 0;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <tr style="background:#1a1f2e;">
                    <th style="text-align:left;padding:10px;color:#64748b;">Site</th>
                    <th style="text-align:center;padding:10px;color:#64748b;">Score</th>
                    <th style="text-align:center;padding:10px;color:#64748b;">Change</th>
                </tr>
                {site_rows}
            </table>
        </div>
        <div style="margin:24px 0;">
            <a href="https://agentvisible.ai/dashboard/monitoring" 
               style="background:#63ffd1;color:#0a0e17;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                View trends and details
            </a>
        </div>
        <p style="color:#64748b;font-size:12px;">You receive this email because you have an active Pro subscription. 
            <a href="https://agentvisible.ai/dashboard" style="color:#64748b;">Manage preferences</a>
        </p>
    '''
    return {
        'from': 'AgentVisible <reports@agentvisible.ai>',
        'to': [user_email],
        'subject': 'Weekly AI readiness report — your sites this week',
        'html': email_wrapper(content),
    }
```

---

## Wiring: When each email sends

### Welcome email — on Supabase auth signup

Add to `api/main.py` a new endpoint that Supabase webhook calls on user creation. OR simpler: trigger welcome email on first login detection.

Simplest approach — add to the scan endpoint or dashboard endpoint:

```python
# In the dashboard endpoint, check if this is the user's first ever request
# If no scans and no previous welcome email sent, send welcome
# Use a simple flag in the user metadata or a separate table

# SIMPLEST: Add a /api/v1/auth/welcome endpoint the frontend calls once after first signup
@app.post('/api/v1/auth/welcome')
async def send_welcome(user_id: str = Depends(get_required_user_id)):
    supabase = get_supabase_client()
    
    # Check if already welcomed (prevent duplicates)
    existing = supabase.table('scans').select('id').eq('user_id', user_id).limit(1).execute()
    if existing.data:
        return {'status': 'already_welcomed'}
    
    # Get user email
    user = supabase.auth.admin.get_user_by_id(user_id)
    email = user.user.email if user and user.user else None
    
    if email:
        import resend
        resend.api_key = os.environ.get('RESEND_API_KEY')
        from email_templates import welcome_email
        resend.Emails.send(welcome_email(email))
    
    return {'status': 'sent'}
```

Frontend calls this once after first signup redirect:
```tsx
// In auth callback or dashboard, on first load after signup
await fetch('/api/v1/auth/welcome', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
})
```

### Pro receipt — in stripe_webhooks.py

In the existing `handle_checkout_completed` function, for `pro_monthly` purchases, add after the subscription is created:

```python
if product == 'pro_monthly':
    # ... existing subscription creation code ...
    
    # Send Pro receipt email
    try:
        import resend
        resend.api_key = os.environ.get('RESEND_API_KEY')
        from email_templates import pro_receipt_email
        
        customer_email = session.get('customer_details', {}).get('email')
        if customer_email:
            period_end = ''
            if subscription_id:
                sub = stripe.Subscription.retrieve(subscription_id)
                from datetime import datetime
                period_end = datetime.fromtimestamp(sub['current_period_end']).strftime('%B %d, %Y')
            
            resend.Emails.send(pro_receipt_email(customer_email, '$99.00', period_end))
    except Exception as e:
        print(f'Pro receipt email error: {e}')
```

### Score drop alert — in monitoring_cron.py

Replace the existing `send_drop_alerts` function's inline HTML with the branded template:

```python
async def send_drop_alerts(supabase, alerts):
    import resend
    resend.api_key = os.environ.get('RESEND_API_KEY')
    from email_templates import score_drop_alert_email
    
    # Group by user
    user_alerts = {}
    for alert in alerts:
        uid = alert['user_id']
        if uid not in user_alerts:
            user_alerts[uid] = []
        user_alerts[uid].append(alert)
    
    for user_id, user_alert_list in user_alerts.items():
        user = supabase.auth.admin.get_user_by_id(user_id)
        email = user.user.email if user and user.user else None
        
        if email:
            try:
                resend.Emails.send(score_drop_alert_email(email, user_alert_list))
                print(f'  Alert sent to {email}')
            except Exception as e:
                print(f'  Alert email failed: {e}')
```

### Weekly digest — add to monitoring_cron.py

Add a new function at the bottom:

```python
async def send_weekly_digests():
    """Send weekly digest to all Pro users with active watchlists."""
    from database import get_supabase_client
    import resend
    resend.api_key = os.environ.get('RESEND_API_KEY')
    from email_templates import weekly_digest_email
    
    supabase = get_supabase_client()
    
    # Get all active Pro subscriptions
    subs = supabase.table('subscriptions').select('user_id').eq('status', 'active').eq('tier', 'pro').execute()
    
    for sub in (subs.data or []):
        user_id = sub['user_id']
        
        # Get their watchlist with latest scores
        watchlist = supabase.table('watchlist').select('url, last_score').eq('user_id', user_id).eq('active', True).execute()
        
        if not watchlist.data:
            continue
        
        # Get previous scores for change calculation
        sites = []
        for item in watchlist.data:
            history = supabase.table('score_history').select('score').eq('watchlist_id', item['id']).order('scanned_at', desc=True).limit(2).execute()
            
            current = item.get('last_score', 0)
            previous = history.data[1]['score'] if len(history.data or []) > 1 else current
            
            sites.append({
                'url': item['url'],
                'score': current,
                'change': current - previous,
            })
        
        # Get user email and send
        user = supabase.auth.admin.get_user_by_id(user_id)
        email = user.user.email if user and user.user else None
        
        if email and sites:
            try:
                resend.Emails.send(weekly_digest_email(email, sites))
                print(f'  Digest sent to {email}')
            except Exception as e:
                print(f'  Digest email failed: {e}')
```

Update the `__main__` block:

```python
if __name__ == '__main__':
    asyncio.run(run_weekly_scans())
    asyncio.run(send_weekly_digests())
```

---

## Acceptance Criteria

### Templates
- [ ] api/email_templates.py exists with 4 email functions
- [ ] All emails use consistent dark-themed branding
- [ ] All emails have footer with Terms/Privacy/Refunds links
- [ ] All emails have AgentVisible logo text in header

### Welcome email
- [ ] Sent on first signup (via /api/v1/auth/welcome endpoint)
- [ ] Not sent on subsequent logins (duplicate prevention)
- [ ] Contains 3 feature bullets + CTA to scan

### Pro receipt
- [ ] Sent after successful Pro subscription checkout
- [ ] Shows amount, plan name, next renewal date
- [ ] Contains CTA to set up monitoring

### Score drop alert
- [ ] Uses branded template (not inline HTML)
- [ ] Shows table of affected sites with old/new scores
- [ ] Contains CTA to view comparison

### Weekly digest
- [ ] Sent to all Pro users with active watchlists
- [ ] Shows all monitored sites with scores and week-over-week change
- [ ] Green for positive change, red for negative
- [ ] Contains CTA to view trends

### No regressions
- [ ] Home page CSS intact
- [ ] Existing PDF email (Task 027) unchanged
- [ ] Auth flow unchanged
- [ ] Scan flow unchanged

## Verification commands

```bash
cd ~/projects/agentvisible

# Template file exists
test -f api/email_templates.py && echo "ok" || echo "MISSING"

# Templates importable
python3 -c "from api.email_templates import welcome_email, pro_receipt_email, score_drop_alert_email, weekly_digest_email; print('all 4 templates ok')"

# Welcome endpoint exists
grep -n "auth/welcome" api/main.py

# Pro receipt wired into webhook
grep -n "pro_receipt_email" api/stripe_webhooks.py

# Branded alert in cron
grep -n "score_drop_alert_email" api/monitoring_cron.py

# Build passes
cd web && npm run build
```

## Commit
```
feat: branded transactional emails — welcome, Pro receipt, score alert, weekly digest (Task 030)
```

## Out of scope
- No email preferences / unsubscribe management (later)
- No HTML email testing tool (Litmus, Email on Acid)
- No plain text fallback versions (HTML only for now)
- No email queueing / retry logic
- Do not modify the existing PDF report email from Task 027
- Do not modify layout.tsx or any frontend styling files
