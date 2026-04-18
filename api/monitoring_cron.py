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
    from scanner.engine import run_scan

    supabase = get_supabase_client()

    # Get all active watchlist items
    result = supabase.table('watchlist').select('*').eq('active', True).execute()
    items = result.data or []

    print(f'Running weekly scan for {len(items)} watchlist items...')

    alerts = []  # Collect score drops for email alerts

    for item in items:
        try:
            # Scan the URL
            scan_result = await run_scan(item['url'])
            new_score = round(scan_result.overall_score)
            old_score = item.get('last_score')

            # Save to score_history
            supabase.table('score_history').insert({
                'watchlist_id': item['id'],
                'score': new_score,
                'modules': [module.dict() for module in scan_result.modules],
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


async def send_weekly_digests():
    """Send weekly digest to all Pro users with active watchlists."""
    from database import get_supabase_client
    import resend
    resend.api_key = os.environ.get('RESEND_API_KEY')
    from email_templates import weekly_digest_email

    supabase = get_supabase_client()

    # Get all active Pro subscriptions
    subs = supabase.table('subscriptions').select('user_id').eq('status', 'active').eq('tier', 'pro').execute()

    print(f'Sending weekly digests to {len(subs.data or [])} Pro users...')

    for sub in (subs.data or []):
        user_id = sub['user_id']

        # Get their watchlist with latest scores
        watchlist = supabase.table('watchlist').select('id, url, last_score').eq('user_id', user_id).eq('active', True).execute()

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

    print('Weekly digests complete.')


if __name__ == '__main__':
    asyncio.run(run_weekly_scans())
    asyncio.run(send_weekly_digests())