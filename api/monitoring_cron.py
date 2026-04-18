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

    # Group alerts by user
    user_alerts = {}
    for alert in alerts:
        uid = alert['user_id']
        if uid not in user_alerts:
            user_alerts[uid] = []
        user_alerts[uid].append(alert)

    for user_id, user_alert_list in user_alerts.items():
        # Get user email
        try:
            user = supabase.auth.admin.get_user_by_id(user_id)
            email = user.user.email if user and user.user else None
        except:
            email = None

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