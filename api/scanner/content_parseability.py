"""
Module 3: Content Parseability Scanner (15% weight)
Analyzes semantic HTML, heading structure, SSR detection, and content quality
"""

import re

from models import Check, ModuleResult


async def scan(url: str, html: str, headers: dict) -> ModuleResult:
    """
    Scan for content parseability elements

    Args:
        url: Target URL
        html: Raw HTML content
        headers: HTTP response headers

    Returns:
        ModuleResult with parseability analysis
    """
    checks = []

    # Check for server-side rendering
    _check_ssr_presence(html, checks)

    # Check semantic HTML elements
    _check_semantic_html(html, checks)

    # Check heading hierarchy
    _check_heading_structure(html, checks)

    # Check content-to-HTML ratio
    _check_content_ratio(html, checks)

    # Check image alt text coverage
    _check_alt_text(html, checks)

    score = _calculate_score(checks)
    summary = _generate_summary(checks, score)

    return ModuleResult(
        module="content_parseability",
        score=score,
        weight=0.15,
        checks=checks,
        summary=summary
    )


def _check_ssr_presence(html: str, checks: list[Check]) -> None:
    """Check if content is server-side rendered (not just client-side JS)"""
    try:
        # Strip HTML tags to get text content
        stripped_text = re.sub(r'<[^>]+>', '', html)
        # Remove excessive whitespace
        cleaned_text = ' '.join(stripped_text.split())

        if len(cleaned_text) > 500:
            checks.append(Check(
                name="Server-Side Rendering",
                passed=True,
                severity="warning",
                detail=f"Content detected in HTML ({len(cleaned_text)} characters)",
                fix_hint=None
            ))
        else:
            checks.append(Check(
                name="Server-Side Rendering",
                passed=False,
                severity="critical",
                detail=f"Limited content in HTML ({len(cleaned_text)} characters)",
                fix_hint="Implement server-side rendering to make content accessible to AI agents without JavaScript"
            ))

    except Exception:
        checks.append(Check(
            name="SSR Detection",
            passed=False,
            severity="warning",
            detail="Error analyzing content rendering",
            fix_hint="Ensure content is accessible without JavaScript execution"
        ))


def _check_semantic_html(html: str, checks: list[Check]) -> None:
    """Check for semantic HTML5 elements"""
    try:
        # Count semantic elements
        semantic_elements = {
            'article': len(re.findall(r'<article\b', html, re.IGNORECASE)),
            'main': len(re.findall(r'<main\b', html, re.IGNORECASE)),
            'nav': len(re.findall(r'<nav\b', html, re.IGNORECASE)),
            'section': len(re.findall(r'<section\b', html, re.IGNORECASE)),
            'header': len(re.findall(r'<header\b', html, re.IGNORECASE)),
            'footer': len(re.findall(r'<footer\b', html, re.IGNORECASE)),
        }

        found_elements = {element: count for element, count in semantic_elements.items() if count > 0}
        total_semantic_count = sum(found_elements.values())

        if total_semantic_count >= 3:
            checks.append(Check(
                name="Semantic HTML",
                passed=True,
                severity="info",
                detail=f"Found {total_semantic_count} semantic elements: {', '.join(found_elements.keys())}",
                fix_hint=None
            ))
        elif total_semantic_count > 0:
            checks.append(Check(
                name="Semantic HTML",
                passed=False,
                severity="warning",
                detail=f"Limited semantic elements ({total_semantic_count}): {', '.join(found_elements.keys())}",
                fix_hint="Add more semantic HTML5 elements (article, main, nav, section, header, footer) to improve content structure"
            ))
        else:
            checks.append(Check(
                name="Semantic HTML",
                passed=False,
                severity="warning",
                detail="No semantic HTML5 elements found",
                fix_hint="Use semantic HTML5 elements (article, main, nav, section) to help AI agents understand content structure"
            ))

    except Exception:
        checks.append(Check(
            name="Semantic HTML Processing",
            passed=False,
            severity="warning",
            detail="Error analyzing semantic HTML elements",
            fix_hint="Ensure HTML structure uses semantic elements"
        ))


def _check_heading_structure(html: str, checks: list[Check]) -> None:
    """Check heading hierarchy and structure"""
    try:
        # Count headings by level
        heading_counts = {}
        for level in range(1, 7):  # h1 through h6
            pattern = f'<h{level}\\b'
            count = len(re.findall(pattern, html, re.IGNORECASE))
            if count > 0:
                heading_counts[f'h{level}'] = count

        if not heading_counts:
            checks.append(Check(
                name="Heading Structure",
                passed=False,
                severity="warning",
                detail="No headings found",
                fix_hint="Add hierarchical headings (h1, h2, h3) to structure content for AI agents"
            ))
            return

        # Check for h1
        h1_count = heading_counts.get('h1', 0)
        if h1_count == 1:
            checks.append(Check(
                name="H1 Tag",
                passed=True,
                severity="warning",
                detail="Single H1 tag found (good practice)",
                fix_hint=None
            ))
        elif h1_count == 0:
            checks.append(Check(
                name="H1 Tag",
                passed=False,
                severity="warning",
                detail="No H1 tag found",
                fix_hint="Add a single H1 tag to identify the main page topic"
            ))
        else:
            checks.append(Check(
                name="H1 Tag",
                passed=False,
                severity="warning",
                detail=f"Multiple H1 tags found ({h1_count})",
                fix_hint="Use only one H1 tag per page for clear content hierarchy"
            ))

        # Check heading hierarchy (no level skipping)
        heading_levels = [int(h[1]) for h in heading_counts.keys()]
        heading_levels.sort()

        hierarchy_valid = True
        for i in range(1, len(heading_levels)):
            if heading_levels[i] - heading_levels[i-1] > 1:
                hierarchy_valid = False
                break

        if hierarchy_valid and len(heading_counts) > 1:
            checks.append(Check(
                name="Heading Hierarchy",
                passed=True,
                severity="info",
                detail=f"Valid heading hierarchy: {', '.join(heading_counts.keys())}",
                fix_hint=None
            ))
        elif not hierarchy_valid:
            checks.append(Check(
                name="Heading Hierarchy",
                passed=False,
                severity="info",
                detail="Heading level skipping detected",
                fix_hint="Use sequential heading levels (h1→h2→h3) without skipping for better content structure"
            ))

    except Exception:
        checks.append(Check(
            name="Heading Analysis",
            passed=False,
            severity="warning",
            detail="Error analyzing heading structure",
            fix_hint="Ensure headings are properly structured with h1-h6 tags"
        ))


def _check_content_ratio(html: str, checks: list[Check]) -> None:
    """Check content-to-HTML ratio"""
    try:
        # Calculate total HTML size
        html_size = len(html)

        # Extract text content
        text_content = re.sub(r'<[^>]+>', '', html)
        text_size = len(text_content.strip())

        if html_size == 0:
            ratio = 0.0
        else:
            ratio = text_size / html_size

        if ratio > 0.15:
            checks.append(Check(
                name="Content Ratio",
                passed=True,
                severity="info",
                detail=f"Good content-to-HTML ratio ({ratio:.1%})",
                fix_hint=None
            ))
        elif ratio > 0.05:
            checks.append(Check(
                name="Content Ratio",
                passed=False,
                severity="info",
                detail=f"Low content-to-HTML ratio ({ratio:.1%})",
                fix_hint="Increase text content or reduce HTML markup for better content density"
            ))
        else:
            checks.append(Check(
                name="Content Ratio",
                passed=False,
                severity="warning",
                detail=f"Very low content-to-HTML ratio ({ratio:.1%})",
                fix_hint="Page appears to be mostly markup - add more meaningful text content"
            ))

    except Exception:
        checks.append(Check(
            name="Content Ratio Analysis",
            passed=False,
            severity="warning",
            detail="Error analyzing content ratio",
            fix_hint="Ensure page has adequate text content"
        ))


def _check_alt_text(html: str, checks: list[Check]) -> None:
    """Check image alt text coverage"""
    try:
        # Find all img tags
        img_pattern = r'<img[^>]*>'
        img_tags = re.findall(img_pattern, html, re.IGNORECASE)

        if not img_tags:
            # No images is fine
            checks.append(Check(
                name="Image Alt Text",
                passed=True,
                severity="info",
                detail="No images found",
                fix_hint=None
            ))
            return

        # Check for alt attributes
        total_images = len(img_tags)
        images_with_alt = 0

        for img_tag in img_tags:
            alt_match = re.search(r'alt=["\']([^"\']*)["\']', img_tag, re.IGNORECASE)
            if alt_match and alt_match.group(1).strip():
                images_with_alt += 1

        alt_coverage = images_with_alt / total_images if total_images > 0 else 0

        if alt_coverage >= 0.8:
            checks.append(Check(
                name="Image Alt Text",
                passed=True,
                severity="info",
                detail=f"Good alt text coverage ({images_with_alt}/{total_images} images)",
                fix_hint=None
            ))
        elif alt_coverage >= 0.5:
            checks.append(Check(
                name="Image Alt Text",
                passed=False,
                severity="info",
                detail=f"Partial alt text coverage ({images_with_alt}/{total_images} images)",
                fix_hint=f"Add alt text to {total_images - images_with_alt} more images for better AI understanding"
            ))
        else:
            checks.append(Check(
                name="Image Alt Text",
                passed=False,
                severity="warning",
                detail=f"Poor alt text coverage ({images_with_alt}/{total_images} images)",
                fix_hint="Add descriptive alt text to images to help AI agents understand visual content"
            ))

    except Exception:
        checks.append(Check(
            name="Alt Text Analysis",
            passed=False,
            severity="warning",
            detail="Error analyzing image alt text",
            fix_hint="Ensure images have descriptive alt attributes"
        ))


def _calculate_score(checks: list[Check]) -> float:
    """Calculate module score based on passed checks"""
    if not checks:
        return 0.0

    # Weight checks by severity
    weights = {'critical': 3.0, 'warning': 2.0, 'info': 1.0}

    total_weight = 0.0
    passed_weight = 0.0

    for check in checks:
        weight = weights.get(check.severity, 1.0)
        total_weight += weight
        if check.passed:
            passed_weight += weight

    if total_weight == 0:
        return 0.0

    return min(100.0, (passed_weight / total_weight) * 100.0)


def _generate_summary(checks: list[Check], score: float) -> str:
    """Generate a summary of the parseability analysis"""
    passed_checks = sum(1 for check in checks if check.passed)
    total_checks = len(checks)

    if score >= 75:
        return f"Excellent content structure ({passed_checks}/{total_checks} checks passed)"
    elif score >= 50:
        return f"Good content parseability ({passed_checks}/{total_checks} checks passed)"
    elif score >= 25:
        return f"Basic content structure ({passed_checks}/{total_checks} checks passed)"
    else:
        return f"Poor content parseability ({passed_checks}/{total_checks} checks passed)"
