# Task 027: $29 PDF Report Generation + Email Delivery

## Status: TODO | Priority: P0 | Est: 3-4h

## Goal
When a user pays $29 via Stripe, generate a branded PDF report for the scanned URL and email it to them via Resend.

## User journey
1. User scans a site (e.g. stripe.com, score 76/100)
2. User clicks "Buy PDF Report — $29" on results page or pricing page
3. Stripe Checkout completes
4. Webhook fires → backend generates PDF → emails it to user
5. User receives branded PDF in inbox within 60 seconds
6. Purchase recorded in `purchases` table with pdf_url

## Prerequisites (already done)
- ✅ Scanner works and returns module scores
- ✅ Stripe checkout works ($29 product created)
- ✅ Webhook handler exists at /api/v1/webhooks/stripe
- ✅ `purchases` table exists in Supabase
- ✅ Resend API key in api/.env (from Task 010)
- ✅ Auth working (user email available)

---

## Files to CREATE

- `api/pdf_generator.py` — ReportLab PDF generation
- `api/email_service.py` — Resend email with PDF attachment

## Files to MODIFY

- `api/stripe_webhooks.py` — Trigger PDF generation in `handle_checkout_completed` for pdf_report purchases
- `api/main.py` — Add `reportlab` and `resend` to imports if not already there

## Files OFF LIMITS

- Do NOT modify ScanResultPanel
- Do NOT modify hero demo
- Do NOT modify scan animation
- Do NOT modify auth flow
- Do NOT modify pricing page layout (only add "Buy PDF" button to scan results page if not already there)

---

## Install dependencies

```bash
cd ~/projects/agentvisible/api
pip install reportlab resend --break-system-packages
```

---

## PDF design spec

### Page 1: Cover + Summary

```
┌──────────────────────────────────────────┐
│                                          │
│   AgentVisible.ai                        │
│   AI Agent Readiness Report              │
│                                          │
│   ─────────────────────────────────      │
│                                          │
│   Website: stripe.com                    │
│   Score: 76/100 — STRONG                 │
│   Generated: April 17, 2026             │
│                                          │
│          ╭───────────╮                   │
│          │           │                   │
│          │    76     │    (gauge graphic) │
│          │           │                   │
│          ╰───────────╯                   │
│                                          │
│   Top 3 fixes:                           │
│   1. Enable MCP endpoints (+18 pts)      │
│   2. Add /llms.txt (+12 pts)             │
│   3. Improve semantic HTML (+8 pts)      │
│                                          │
│   ─────────────────────────────────      │
│   agentvisible.ai · AI readiness scanner │
│                                          │
└──────────────────────────────────────────┘
```

### Page 2-6: One page per module (5 modules)

Each module page:

```
┌──────────────────────────────────────────┐
│                                          │
│   Module: Structured Data                │
│   Score: 92/100 ✓                        │
│                                          │
│   ─────────────────────────────────      │
│                                          │
│   What we checked:                       │
│   • JSON-LD structured data              │
│   • OpenGraph meta tags                  │
│   • Twitter Card meta tags               │
│   • Schema.org markup                    │
│                                          │
│   Results:                               │
│   ✓ JSON-LD found (Product schema)       │
│   ✓ OpenGraph tags present               │
│   ⚠ Twitter Card missing image           │
│   ✓ Schema.org Organization found        │
│                                          │
│   Recommendation:                        │
│   Add Twitter Card image meta tag.       │
│   Estimated effort: 10 minutes.          │
│   Impact: +4 points                      │
│                                          │
│   ─────────────────────────────────      │
│   Page 2 of 7 · agentvisible.ai         │
│                                          │
└──────────────────────────────────────────┘
```

### Page 7: Action plan

```
┌──────────────────────────────────────────┐
│                                          │
│   Your Action Plan                       │
│                                          │
│   Priority fixes ranked by impact:       │
│                                          │
│   #  Fix                    Impact  Time │
│   ── ─────────────────────  ──────  ──── │
│   1  Enable MCP endpoints   +18    30min │
│   2  Add /llms.txt           +12    5min │
│   3  Improve semantic HTML   +8     1hr  │
│   4  Add Twitter Card image  +4     10min│
│   5  Add ai-plugin.json      +3     15min│
│                                          │
│   Total potential improvement: +45 points│
│   Projected score: 76 → 100+            │
│                                          │
│   ─────────────────────────────────      │
│                                          │
│   Need help implementing these fixes?    │
│   Upgrade to Pro for ongoing monitoring  │
│   agentvisible.ai/pricing                │
│                                          │
│   ─────────────────────────────────      │
│   Page 7 of 7 · agentvisible.ai         │
│                                          │
└──────────────────────────────────────────┘
```

---

## PDF generator implementation

### `api/pdf_generator.py`

Use ReportLab with Platypus for structured layout:

```python
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, 
    TableStyle, PageBreak, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Circle, Wedge
from reportlab.graphics import renderPDF
from io import BytesIO
from datetime import datetime

# Brand colors
DARK_1 = HexColor('#0a0e17')
DARK_3 = HexColor('#111827')
DARK_5 = HexColor('#252b3a')
TEAL = HexColor('#63ffd1')
CYAN = HexColor('#22d3ee')
WHITE = HexColor('#ffffff')
SLATE_300 = HexColor('#cbd5e1')
SLATE_400 = HexColor('#94a3b8')
RED = HexColor('#ef4444')
AMBER = HexColor('#f59e0b')
GREEN = HexColor('#22c55e')


def generate_scan_report_pdf(scan_data: dict, url: str) -> bytes:
    """
    Generate a branded PDF report from scan results.
    
    Args:
        scan_data: Full scan result from the API (modules, score, fixes, etc.)
        url: The scanned URL
    
    Returns:
        PDF as bytes
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
    )
    
    # Custom styles
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        'BrandTitle',
        parent=styles['Title'],
        fontSize=28,
        textColor=WHITE,
        spaceAfter=6,
    ))
    
    styles.add(ParagraphStyle(
        'BrandSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=SLATE_400,
        spaceAfter=20,
    ))
    
    styles.add(ParagraphStyle(
        'ModuleTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=WHITE,
        spaceAfter=10,
    ))
    
    styles.add(ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=11,
        textColor=SLATE_300,
        leading=16,
    ))
    
    styles.add(ParagraphStyle(
        'CheckPass',
        parent=styles['Normal'],
        fontSize=10,
        textColor=GREEN,
        leftIndent=20,
    ))
    
    styles.add(ParagraphStyle(
        'CheckWarn',
        parent=styles['Normal'],
        fontSize=10,
        textColor=AMBER,
        leftIndent=20,
    ))
    
    styles.add(ParagraphStyle(
        'CheckFail',
        parent=styles['Normal'],
        fontSize=10,
        textColor=RED,
        leftIndent=20,
    ))
    
    story = []
    
    # Extract data
    score = scan_data.get('score', 0)
    modules = scan_data.get('modules', [])
    
    # Determine status label
    if score >= 90:
        status = 'EXCELLENT'
    elif score >= 75:
        status = 'STRONG'
    elif score >= 50:
        status = 'MODERATE'
    else:
        status = 'NEEDS IMPROVEMENT'
    
    # Get score color
    if score >= 75:
        score_color = GREEN
    elif score >= 50:
        score_color = AMBER
    else:
        score_color = RED
    
    # ═══════════════════════════════════
    # PAGE 1: Cover + Summary
    # ═══════════════════════════════════
    
    story.append(Spacer(1, 2*cm))
    story.append(Paragraph('AgentVisible.ai', styles['BrandTitle']))
    story.append(Paragraph('AI Agent Readiness Report', styles['BrandSubtitle']))
    story.append(Spacer(1, 1*cm))
    
    # URL and date
    story.append(Paragraph(f'Website: <b>{url}</b>', styles['BodyText']))
    story.append(Paragraph(f'Generated: {datetime.utcnow().strftime("%B %d, %Y")}', styles['BodyText']))
    story.append(Spacer(1, 1*cm))
    
    # Score display
    story.append(Paragraph(
        f'<font size="48" color="#{score_color.hexval()[2:]}">{score}</font>'
        f'<font size="20" color="#94a3b8">/100</font>',
        ParagraphStyle('Score', parent=styles['Normal'], alignment=TA_CENTER, spaceAfter=8)
    ))
    story.append(Paragraph(
        f'<font size="16" color="#{score_color.hexval()[2:]}">{status}</font>',
        ParagraphStyle('Status', parent=styles['Normal'], alignment=TA_CENTER, spaceAfter=30)
    ))
    
    # Module summary table
    module_data = [['Module', 'Score', 'Status']]
    module_names = {
        'structured_data': 'Structured Data',
        'ai_crawlability': 'AI Crawlability', 
        'content_parseability': 'Content Parseability',
        'commerce_protocols': 'Commerce Protocols',
        'agent_discovery': 'Agent Discovery',
    }
    
    for module in modules:
        name = module_names.get(module.get('module', ''), module.get('module', ''))
        mod_score = round(module.get('score', 0))
        if mod_score >= 75:
            icon = 'PASS'
        elif mod_score >= 50:
            icon = 'WARN'
        else:
            icon = 'FAIL'
        module_data.append([name, f'{mod_score}/100', icon])
    
    if len(module_data) > 1:
        table = Table(module_data, colWidths=[8*cm, 3*cm, 3*cm])
        table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, 0), SLATE_400),
            ('TEXTCOLOR', (0, 1), (-1, -1), SLATE_300),
            ('LINEBELOW', (0, 0), (-1, 0), 0.5, DARK_5),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(table)
    
    story.append(PageBreak())
    
    # ═══════════════════════════════════
    # PAGES 2-6: Module detail pages
    # ═══════════════════════════════════
    
    for i, module in enumerate(modules):
        name = module_names.get(module.get('module', ''), module.get('module', ''))
        mod_score = round(module.get('score', 0))
        checks = module.get('checks', [])
        summary = module.get('summary', '')
        
        story.append(Paragraph(f'{name}', styles['ModuleTitle']))
        
        # Score with color
        if mod_score >= 75:
            color_hex = GREEN.hexval()[2:]
        elif mod_score >= 50:
            color_hex = AMBER.hexval()[2:]
        else:
            color_hex = RED.hexval()[2:]
        
        story.append(Paragraph(
            f'Score: <font color="#{color_hex}"><b>{mod_score}/100</b></font>',
            styles['BodyText']
        ))
        story.append(Spacer(1, 0.5*cm))
        
        if summary:
            story.append(Paragraph(summary, styles['BodyText']))
            story.append(Spacer(1, 0.5*cm))
        
        # Individual checks
        if checks:
            story.append(Paragraph('<b>Checks:</b>', styles['BodyText']))
            story.append(Spacer(1, 0.3*cm))
            
            for check in checks:
                check_name = check.get('name', '')
                passed = check.get('passed', False)
                detail = check.get('detail', '')
                severity = check.get('severity', 'info')
                fix_hint = check.get('fix_hint', '')
                
                if passed:
                    style = styles['CheckPass']
                    prefix = 'PASS'
                elif severity == 'critical':
                    style = styles['CheckFail']
                    prefix = 'FAIL'
                else:
                    style = styles['CheckWarn']
                    prefix = 'WARN'
                
                story.append(Paragraph(f'{prefix}: {check_name}', style))
                if detail:
                    story.append(Paragraph(f'  {detail}', styles['BodyText']))
                if fix_hint and not passed:
                    story.append(Paragraph(
                        f'  Fix: {fix_hint}',
                        ParagraphStyle('FixHint', parent=styles['Normal'], fontSize=9, textColor=CYAN, leftIndent=20)
                    ))
                story.append(Spacer(1, 0.2*cm))
        
        if i < len(modules) - 1:
            story.append(PageBreak())
    
    # ═══════════════════════════════════
    # LAST PAGE: Action Plan + CTA
    # ═══════════════════════════════════
    
    story.append(PageBreak())
    story.append(Paragraph('Your Action Plan', styles['ModuleTitle']))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(
        'Priority fixes ranked by potential impact on your AI agent readiness score:',
        styles['BodyText']
    ))
    story.append(Spacer(1, 0.5*cm))
    
    # Extract fixes from all modules
    all_fixes = []
    for module in modules:
        for check in module.get('checks', []):
            if not check.get('passed', True) and check.get('fix_hint'):
                all_fixes.append({
                    'name': check['name'],
                    'fix': check['fix_hint'],
                    'severity': check.get('severity', 'info'),
                    'module': module_names.get(module.get('module', ''), ''),
                })
    
    # Sort: critical first, then warning, then info
    severity_order = {'critical': 0, 'warning': 1, 'info': 2}
    all_fixes.sort(key=lambda x: severity_order.get(x['severity'], 2))
    
    for idx, fix in enumerate(all_fixes[:10], 1):
        story.append(Paragraph(
            f'<b>{idx}. {fix["name"]}</b> ({fix["module"]})',
            styles['BodyText']
        ))
        story.append(Paragraph(f'   {fix["fix"]}', styles['BodyText']))
        story.append(Spacer(1, 0.3*cm))
    
    # CTA
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(
        'Need ongoing monitoring?',
        ParagraphStyle('CTA', parent=styles['Heading2'], fontSize=16, textColor=TEAL, alignment=TA_CENTER)
    ))
    story.append(Paragraph(
        'Upgrade to Pro for weekly automated re-scans, competitor tracking, and score drop alerts.',
        ParagraphStyle('CTABody', parent=styles['Normal'], fontSize=11, textColor=SLATE_400, alignment=TA_CENTER)
    ))
    story.append(Paragraph(
        'agentvisible.ai/pricing',
        ParagraphStyle('CTALink', parent=styles['Normal'], fontSize=12, textColor=CYAN, alignment=TA_CENTER)
    ))
    
    # Build PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes
```

---

## Email delivery

### `api/email_service.py`

```python
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
    
    filename = f'agentvisible-report-{url.replace(".", "-")}-{datetime.utcnow().strftime("%Y%m%d")}.pdf'
    
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
```

---

## Wire into webhook handler

In `api/stripe_webhooks.py`, update the `handle_checkout_completed` function for pdf_report purchases:

Replace the `# TODO: Trigger PDF generation + email delivery (Task 027)` line with:

```python
# Generate PDF and email it
try:
    from pdf_generator import generate_scan_report_pdf
    from email_service import send_pdf_report_email
    
    # Fetch the scan data for this URL
    scan_result = supabase.table('scans').select('*').eq('url', scan_url).order('created_at', desc=True).limit(1).execute()
    
    if scan_result.data:
        scan = scan_result.data[0]
        
        # Get user email from Supabase auth
        user_result = supabase.rpc('get_user_email', {'user_uuid': user_id}).execute()
        user_email = user_result.data if user_result.data else None
        
        # Fallback: get email from Stripe session
        if not user_email:
            user_email = session.get('customer_details', {}).get('email')
        
        if user_email and scan:
            # Generate PDF
            pdf_bytes = generate_scan_report_pdf(scan, scan_url)
            
            # Upload PDF to Supabase Storage (optional, for download link)
            pdf_filename = f'reports/{user_id}/{scan_url.replace(".", "-")}.pdf'
            
            # Email it
            send_pdf_report_email(
                to_email=user_email,
                url=scan_url,
                score=scan.get('score', 0),
                pdf_bytes=pdf_bytes,
            )
            
            # Update purchase with completion
            supabase.table('purchases').update({
                'status': 'completed',
                'pdf_url': pdf_filename,
            }).eq('stripe_checkout_session_id', session['id']).execute()

except Exception as e:
    print(f'PDF generation/email error: {e}')
    # Don't fail the webhook — log the error, retry later
```

---

## Add "Buy PDF Report" button to scan results page

In `web/app/scan/page.tsx`, after the scan completes and results are shown, add a button:

```tsx
{/* After scan results display */}
<div className="mt-8 p-6 bg-dark-3 border border-dark-5 rounded-xl text-center">
  <h3 className="text-lg font-medium text-white mb-2">
    Get the full report as PDF
  </h3>
  <p className="text-slate-400 text-sm mb-4">
    Detailed breakdown, fix instructions, and shareable format. Delivered to your email.
  </p>
  <button
    onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PDF!, scannedUrl)}
    className="bg-teal-400 text-dark-1 px-6 py-3 rounded-lg font-medium hover:bg-teal-300 transition"
  >
    Buy PDF Report — $29
  </button>
</div>
```

---

## Acceptance Criteria

### PDF generation
- [ ] `generate_scan_report_pdf()` produces valid PDF bytes
- [ ] PDF has cover page with score, status, module summary table
- [ ] PDF has 5 module detail pages with checks and fix hints
- [ ] PDF has action plan page with ranked fixes
- [ ] PDF has AgentVisible branding and Pro upsell CTA on last page
- [ ] PDF renders correctly when opened in a viewer (no broken text, no ReportLab errors)

### Email delivery
- [ ] Email sends via Resend with PDF attached
- [ ] Subject line includes URL and score
- [ ] Email body has score summary and Pro upsell
- [ ] PDF attachment has descriptive filename

### Checkout flow
- [ ] $29 Stripe checkout creates purchase record in DB
- [ ] Webhook triggers PDF generation automatically
- [ ] PDF generated and emailed within 60 seconds of payment
- [ ] Purchase record updated with status=completed and pdf_url
- [ ] Scan results page has "Buy PDF Report — $29" button

### No regressions
- [ ] Hero demo still works
- [ ] Scan flow unchanged
- [ ] Auth still works
- [ ] Pricing page unchanged
- [ ] Pro checkout unchanged

## Verification commands

```bash
cd ~/projects/agentvisible

# Files exist
test -f api/pdf_generator.py && echo "pdf gen ok" || echo "MISSING"
test -f api/email_service.py && echo "email ok" || echo "MISSING"

# Dependencies installed
python -c "import reportlab; print('reportlab ok')" 2>/dev/null || echo "MISSING reportlab"
python -c "import resend; print('resend ok')" 2>/dev/null || echo "MISSING resend"

# Webhook handler references PDF generation
grep -n "pdf_generator\|generate_scan_report" api/stripe_webhooks.py

# Scan page has Buy PDF button
grep -n "Buy PDF\|pdf_report\|PRICE_ID_PDF" web/app/scan/page.tsx

# Build passes
cd web && npm run build
```

## Commit
```
feat: $29 PDF report generation + email delivery via Resend (Task 027)
```

## Out of scope
- No PDF download from dashboard (Task 028)
- No Supabase Storage upload (just email for now)
- No retry queue for failed emails
- No custom fonts in PDF (use ReportLab defaults)
- No RPC function for get_user_email (use Stripe session email as primary source)
