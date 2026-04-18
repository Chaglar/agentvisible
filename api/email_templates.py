"""
Email templates for AgentVisible transactional emails
All emails use consistent dark-themed branding via email_wrapper()
"""


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