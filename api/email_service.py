import os
import resend
import base64
from datetime import datetime

resend.api_key = os.environ.get('RESEND_API_KEY')

def send_pdf_report_email(to_email: str, url: str, score: int, pdf_bytes: bytes) -> bool:
    """Send the PDF report to the user's email."""

    if score >= 75:
        status = 'Strong'
    elif score >= 50:
        status = 'Moderate'
    else:
        status = 'Needs Improvement'

    # Clean URL for filename (remove protocol and special chars)
    clean_url = url.replace('https://', '').replace('http://', '').replace('www.', '')
    clean_url = clean_url.replace('/', '-').replace('.', '-')
    filename = f'agentvisible-report-{clean_url}-{datetime.utcnow().strftime("%Y%m%d")}.pdf'

    try:
        r = resend.Emails.send({
            'from': 'AgentVisible <reports@agentvisible.ai>',
            'to': [to_email],
            'subject': f'Your AI Readiness Report: {url} scored {score}/100',
            'html': f'''
                <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #cbd5e1;">
                    <h1 style="color: #ffffff; font-size: 24px;">Your AI Agent Readiness Report</h1>
                    <p>Hi,</p>
                    <p>Your scan of <strong style="color: #22d3ee;">{url}</strong> is complete.</p>
                    <div style="background: #111827; border: 1px solid #252b3a; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                        <div style="font-size: 48px; font-weight: bold; color: #63ffd1;">{score}</div>
                        <div style="font-size: 14px; color: #94a3b8;">out of 100 · {status}</div>
                    </div>
                    <p>Your detailed PDF report is attached. It includes:</p>
                    <ul style="color: #94a3b8;">
                        <li>Score breakdown across 5 categories</li>
                        <li>Individual check results with pass/fail</li>
                        <li>Prioritized action plan with fix instructions</li>
                    </ul>
                    <p style="margin-top: 24px;">
                        Want ongoing monitoring?
                        <a href="https://agentvisible.ai/pricing" style="color: #22d3ee;">Upgrade to Pro</a>
                        for weekly re-scans and competitor tracking.
                    </p>
                    <hr style="border-color: #252b3a; margin: 24px 0;" />
                    <p style="font-size: 12px; color: #64748b;">
                        AgentVisible.ai · AI Agent Readiness Scanner
                    </p>
                </div>
            ''',
            'attachments': [{
                'filename': filename,
                'content': base64.b64encode(pdf_bytes).decode('utf-8'),
                'type': 'application/pdf',
            }],
        })
        return True
    except Exception as e:
        print(f'Email send error: {e}')
        return False