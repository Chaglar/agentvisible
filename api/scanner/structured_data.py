"""
Module 1: Structured Data Scanner (30% weight)
Analyzes JSON-LD, Open Graph, Twitter Cards, and schema markup
"""

import json
import re

from models import Check, ModuleResult


async def scan(url: str, html: str, headers: dict) -> ModuleResult:
    """
    Scan for structured data elements that help AI agents understand content

    Args:
        url: Target URL
        html: Raw HTML content
        headers: HTTP response headers

    Returns:
        ModuleResult with structured data analysis
    """
    checks = []

    # Parse JSON-LD blocks
    json_ld_data = _extract_json_ld(html, checks)

    # Check Open Graph tags
    _check_open_graph(html, checks)

    # Check Twitter Cards
    _check_twitter_cards(html, checks)

    # Check for specific schema.org types in JSON-LD
    _check_schema_types(json_ld_data, checks)

    # Check for review schema
    _check_review_schema(json_ld_data, checks)

    # Check for breadcrumbs
    _check_breadcrumbs(json_ld_data, checks)

    score = _calculate_score(checks)
    summary = _generate_summary(checks, score)

    return ModuleResult(
        module="structured_data",
        score=score,
        weight=0.30,
        checks=checks,
        summary=summary
    )


def _extract_json_ld(html: str, checks: list[Check]) -> list[dict]:
    """Extract and parse JSON-LD script tags"""
    json_ld_data = []

    try:
        # Find all JSON-LD script tags
        pattern = r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
        matches = re.findall(pattern, html, re.DOTALL | re.IGNORECASE)

        if not matches:
            checks.append(Check(
                name="JSON-LD Present",
                passed=False,
                severity="critical",
                detail="No JSON-LD structured data found",
                fix_hint="Add JSON-LD script tags with schema.org markup to help AI agents understand your content"
            ))
            return json_ld_data

        valid_blocks = 0
        for match in matches:
            try:
                # Parse JSON, allowing for malformed data
                data = json.loads(match.strip())
                json_ld_data.append(data)
                valid_blocks += 1
            except json.JSONDecodeError:
                continue

        if valid_blocks > 0:
            checks.append(Check(
                name="JSON-LD Present",
                passed=True,
                severity="info",
                detail=f"Found {valid_blocks} valid JSON-LD block{'s' if valid_blocks != 1 else ''}",
                fix_hint=None
            ))
        else:
            checks.append(Check(
                name="JSON-LD Valid",
                passed=False,
                severity="critical",
                detail="JSON-LD blocks found but all contain invalid JSON",
                fix_hint="Fix JSON syntax errors in your JSON-LD structured data"
            ))

    except Exception:
        checks.append(Check(
            name="JSON-LD Processing",
            passed=False,
            severity="warning",
            detail="Error processing JSON-LD data",
            fix_hint="Check JSON-LD syntax and ensure proper HTML structure"
        ))

    return json_ld_data


def _check_open_graph(html: str, checks: list[Check]) -> None:
    """Check for Open Graph meta tags"""
    try:
        og_pattern = r'<meta\s+property=["\']og:(\w+)["\']\s+content=["\']([^"\']*)["\']'
        og_matches = re.findall(og_pattern, html, re.IGNORECASE)

        og_tags = {tag: value for tag, value in og_matches}

        # Check for essential OG tags
        essential_tags = ['title', 'description', 'url', 'type']
        found_essential = [tag for tag in essential_tags if tag in og_tags and og_tags[tag].strip()]

        if len(found_essential) >= 3:
            checks.append(Check(
                name="Open Graph Tags",
                passed=True,
                severity="info",
                detail=f"Found {len(found_essential)}/{len(essential_tags)} essential OG tags: {', '.join(found_essential)}",
                fix_hint=None
            ))
        else:
            missing = [tag for tag in essential_tags if tag not in og_tags or not og_tags[tag].strip()]
            checks.append(Check(
                name="Open Graph Tags",
                passed=False,
                severity="warning",
                detail=f"Missing essential OG tags: {', '.join(missing)}",
                fix_hint=f"Add missing Open Graph tags: {', '.join(missing)}"
            ))

    except Exception:
        checks.append(Check(
            name="Open Graph Processing",
            passed=False,
            severity="warning",
            detail="Error processing Open Graph tags",
            fix_hint="Check Open Graph tag syntax in HTML head section"
        ))


def _check_twitter_cards(html: str, checks: list[Check]) -> None:
    """Check for Twitter Card meta tags"""
    try:
        twitter_pattern = r'<meta\s+name=["\']twitter:(\w+)["\']\s+content=["\']([^"\']*)["\']'
        twitter_matches = re.findall(twitter_pattern, html, re.IGNORECASE)

        twitter_tags = {tag: value for tag, value in twitter_matches}

        if 'card' in twitter_tags and twitter_tags['card'].strip():
            checks.append(Check(
                name="Twitter Cards",
                passed=True,
                severity="info",
                detail=f"Found Twitter Card type: {twitter_tags['card']}",
                fix_hint=None
            ))
        else:
            checks.append(Check(
                name="Twitter Cards",
                passed=False,
                severity="info",
                detail="No Twitter Card meta tags found",
                fix_hint="Add Twitter Card meta tags to improve social media AI understanding"
            ))

    except Exception:
        checks.append(Check(
            name="Twitter Cards Processing",
            passed=False,
            severity="warning",
            detail="Error processing Twitter Card tags",
            fix_hint="Check Twitter Card tag syntax in HTML head section"
        ))


def _check_schema_types(json_ld_data: list[dict], checks: list[Check]) -> None:
    """Check for specific schema.org types in JSON-LD"""
    target_types = {
        'Product', 'Organization', 'LocalBusiness', 'BreadcrumbList',
        'FAQPage', 'Review', 'AggregateRating', 'Offer'
    }

    found_types = set()

    def extract_types(obj):
        if isinstance(obj, dict):
            if '@type' in obj:
                type_val = obj['@type']
                if isinstance(type_val, str):
                    found_types.add(type_val)
                elif isinstance(type_val, list):
                    found_types.update(type_val)

            for value in obj.values():
                extract_types(value)
        elif isinstance(obj, list):
            for item in obj:
                extract_types(item)

    for data in json_ld_data:
        extract_types(data)

    found_target_types = found_types.intersection(target_types)

    if found_target_types:
        checks.append(Check(
            name="Schema.org Types",
            passed=True,
            severity="info",
            detail=f"Found schema types: {', '.join(sorted(found_target_types))}",
            fix_hint=None
        ))
    else:
        checks.append(Check(
            name="Schema.org Types",
            passed=False,
            severity="warning",
            detail="No recognized schema.org types found",
            fix_hint="Add schema.org types (Product, Organization, LocalBusiness) to help AI agents classify your content"
        ))


def _check_review_schema(json_ld_data: list[dict], checks: list[Check]) -> None:
    """Check for review and rating schema in JSON-LD"""
    has_reviews = False
    has_aggregate_rating = False

    def check_reviews(obj):
        nonlocal has_reviews, has_aggregate_rating

        if isinstance(obj, dict):
            if obj.get('@type') in ['Review', 'AggregateRating']:
                if obj.get('@type') == 'Review':
                    has_reviews = True
                elif obj.get('@type') == 'AggregateRating':
                    has_aggregate_rating = True

            for value in obj.values():
                check_reviews(value)
        elif isinstance(obj, list):
            for item in obj:
                check_reviews(item)

    for data in json_ld_data:
        check_reviews(data)

    if has_reviews or has_aggregate_rating:
        rating_types = []
        if has_reviews:
            rating_types.append("Reviews")
        if has_aggregate_rating:
            rating_types.append("Aggregate Ratings")

        checks.append(Check(
            name="Review Schema",
            passed=True,
            severity="info",
            detail=f"Found review schema: {', '.join(rating_types)}",
            fix_hint=None
        ))
    else:
        checks.append(Check(
            name="Review Schema",
            passed=False,
            severity="info",
            detail="No review or rating schema found",
            fix_hint="Add Review or AggregateRating schema to help AI agents understand product/service quality"
        ))


def _check_breadcrumbs(json_ld_data: list[dict], checks: list[Check]) -> None:
    """Check for BreadcrumbList schema in JSON-LD"""
    has_breadcrumbs = False

    def check_breadcrumb_list(obj):
        nonlocal has_breadcrumbs

        if isinstance(obj, dict):
            if obj.get('@type') == 'BreadcrumbList':
                has_breadcrumbs = True

            for value in obj.values():
                check_breadcrumb_list(value)
        elif isinstance(obj, list):
            for item in obj:
                check_breadcrumb_list(item)

    for data in json_ld_data:
        check_breadcrumb_list(data)

    if has_breadcrumbs:
        checks.append(Check(
            name="Breadcrumb Schema",
            passed=True,
            severity="info",
            detail="Found BreadcrumbList schema",
            fix_hint=None
        ))
    else:
        checks.append(Check(
            name="Breadcrumb Schema",
            passed=False,
            severity="info",
            detail="No BreadcrumbList schema found",
            fix_hint="Add BreadcrumbList schema to help AI agents understand site navigation structure"
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
    """Generate a summary of the structured data analysis"""
    passed_checks = sum(1 for check in checks if check.passed)
    total_checks = len(checks)

    if score >= 75:
        return f"Excellent structured data coverage ({passed_checks}/{total_checks} checks passed)"
    elif score >= 50:
        return f"Good structured data foundation ({passed_checks}/{total_checks} checks passed)"
    elif score >= 25:
        return f"Basic structured data present ({passed_checks}/{total_checks} checks passed)"
    else:
        return f"Limited structured data ({passed_checks}/{total_checks} checks passed)"
