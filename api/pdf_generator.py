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
        'BrandBodyText',
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
    score = scan_data.get('overall_score', scan_data.get('score', 0))
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
    story.append(Paragraph(f'Website: <b>{url}</b>', styles['BrandBodyText']))
    story.append(Paragraph(f'Generated: {datetime.utcnow().strftime("%B %d, %Y")}', styles['BrandBodyText']))
    story.append(Spacer(1, 1*cm))

    # Score display
    story.append(Paragraph(
        f'<font size="48" color="#{score_color.hexval()[2:]}">{int(score)}</font>'
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
            styles['BrandBodyText']
        ))
        story.append(Spacer(1, 0.5*cm))

        if summary:
            story.append(Paragraph(summary, styles['BrandBodyText']))
            story.append(Spacer(1, 0.5*cm))

        # Individual checks
        if checks:
            story.append(Paragraph('<b>Checks:</b>', styles['BrandBodyText']))
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
                    story.append(Paragraph(f'  {detail}', styles['BrandBodyText']))
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
        styles['BrandBodyText']
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
            styles['BrandBodyText']
        ))
        story.append(Paragraph(f'   {fix["fix"]}', styles['BrandBodyText']))
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