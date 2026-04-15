from typing import List
"""
Module 5: Agent Discovery Scanner (15% weight)
Analyzes AI plugin manifests, RSS feeds, and agent-specific content markers
"""

import json
import re

import httpx

from models import Check, ModuleResult
from scanner.fetcher import fetch_endpoint


async def scan(url: str, html: str, headers: dict) -> ModuleResult:
    """
    Scan for agent discovery elements

    Args:
        url: Target URL
        html: Raw HTML content
        headers: HTTP response headers

    Returns:
        ModuleResult with agent discovery analysis
    """
    checks = []
    base_url = _get_base_url(url)

    async with httpx.AsyncClient(timeout=5.0) as client:
        # Check for ChatGPT plugin manifest
        await _check_ai_plugin_manifest(base_url, client, checks)

    # Check for RSS/Atom feeds
    _check_rss_feeds(html, checks)

    # Parse JSON-LD for reused data
    json_ld_data = _extract_json_ld(html)

    # Check for FAQ and HowTo schema
    _check_faq_howto_schema(json_ld_data, checks)

    # Check for organization social links
    _check_organization_same_as(json_ld_data, checks)

    # Check for AI-specific content markers
    _check_ai_content_markers(html, checks)

    score = _calculate_score(checks)
    summary = _generate_summary(checks, score)

    return ModuleResult(
        module="agent_discovery",
        score=score,
        weight=0.15,
        checks=checks,
        summary=summary
    )


def _get_base_url(url: str) -> str:
    """Extract base URL from full URL"""
    from urllib.parse import urlparse
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


async def _check_ai_plugin_manifest(base_url: str, client: httpx.AsyncClient, checks: List[Check]) -> None:
    """Check for ChatGPT/AI plugin manifest"""
    try:
        plugin_content, status_code = await fetch_endpoint(
            base_url, ".well-known/ai-plugin.json", client
        )

        if status_code == 200 and plugin_content:
            try:
                plugin_data = json.loads(plugin_content)
                if isinstance(plugin_data, dict) and 'schema_version' in plugin_data:
                    plugin_name = plugin_data.get('name_for_human', 'Unknown')
                    checks.append(Check(
                        name="AI Plugin Manifest",
                        passed=True,
                        severity="info",
                        detail=f"Found AI plugin manifest: {plugin_name}",
                        fix_hint=None
                    ))
                else:
                    checks.append(Check(
                        name="AI Plugin Manifest",
                        passed=False,
                        severity="info",
                        detail="AI plugin manifest found but lacks required schema_version",
                        fix_hint="Fix ai-plugin.json structure according to ChatGPT plugin specification"
                    ))
            except json.JSONDecodeError:
                checks.append(Check(
                    name="AI Plugin Manifest",
                    passed=False,
                    severity="info",
                    detail="AI plugin manifest found but contains invalid JSON",
                    fix_hint="Fix JSON syntax in .well-known/ai-plugin.json"
                ))
        else:
            checks.append(Check(
                name="AI Plugin Manifest",
                passed=False,
                severity="info",
                detail="No AI plugin manifest found",
                fix_hint="Consider adding .well-known/ai-plugin.json for ChatGPT plugin integration"
            ))

    except Exception:
        checks.append(Check(
            name="AI Plugin Check",
            passed=False,
            severity="info",
            detail="Unable to check AI plugin manifest",
            fix_hint=None
        ))


def _check_rss_feeds(html: str, checks: List[Check]) -> None:
    """Check for RSS/Atom feed discovery links"""
    try:
        # Look for RSS/Atom feed link tags
        feed_pattern = r'<link[^>]+type=["\']application/(rss|atom)\+xml["\'][^>]*>'
        feed_matches = re.findall(feed_pattern, html, re.IGNORECASE)

        if feed_matches:
            feed_types = []
            for match in feed_matches:
                if 'rss' in match.lower():
                    feed_types.append('RSS')
                elif 'atom' in match.lower():
                    feed_types.append('Atom')

            unique_types = list(set(feed_types))
            checks.append(Check(
                name="RSS/Atom Feeds",
                passed=True,
                severity="info",
                detail=f"Found {len(feed_matches)} feed(s): {', '.join(unique_types)}",
                fix_hint=None
            ))
        else:
            checks.append(Check(
                name="RSS/Atom Feeds",
                passed=False,
                severity="info",
                detail="No RSS/Atom feeds found",
                fix_hint="Add RSS/Atom feeds to help AI agents discover updated content"
            ))

    except Exception:
        checks.append(Check(
            name="RSS Feed Processing",
            passed=False,
            severity="info",
            detail="Error processing RSS feed discovery",
            fix_hint="Check RSS/Atom feed link tags in HTML head"
        ))


def _extract_json_ld(html: str) -> List[dict]:
    """Extract and parse JSON-LD script tags (reuse logic from structured_data module)"""
    json_ld_data = []

    try:
        pattern = r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
        matches = re.findall(pattern, html, re.DOTALL | re.IGNORECASE)

        for match in matches:
            try:
                data = json.loads(match.strip())
                json_ld_data.append(data)
            except json.JSONDecodeError:
                continue

    except Exception:
        pass

    return json_ld_data


def _check_faq_howto_schema(json_ld_data: List[dict], checks: List[Check]) -> None:
    """Check for FAQPage and HowTo schema types"""
    target_types = {'FAQPage', 'HowTo'}
    found_types = set()

    def extract_types(obj):
        if isinstance(obj, dict):
            if '@type' in obj:
                type_val = obj['@type']
                if isinstance(type_val, str):
                    if type_val in target_types:
                        found_types.add(type_val)
                elif isinstance(type_val, list):
                    for t in type_val:
                        if t in target_types:
                            found_types.add(t)

            for value in obj.values():
                extract_types(value)
        elif isinstance(obj, list):
            for item in obj:
                extract_types(item)

    for data in json_ld_data:
        extract_types(data)

    if found_types:
        checks.append(Check(
            name="FAQ/HowTo Schema",
            passed=True,
            severity="info",
            detail=f"Found instructional schema: {', '.join(sorted(found_types))}",
            fix_hint=None
        ))
    else:
        checks.append(Check(
            name="FAQ/HowTo Schema",
            passed=False,
            severity="info",
            detail="No FAQ or HowTo schema found",
            fix_hint="Add FAQPage or HowTo schema to help AI agents understand instructional content"
        ))


def _check_organization_same_as(json_ld_data: List[dict], checks: List[Check]) -> None:
    """Check for Organization.sameAs social media links"""
    same_as_links = []

    def extract_same_as(obj):
        if isinstance(obj, dict):
            # Check if this is an Organization with sameAs
            if obj.get('@type') == 'Organization' and 'sameAs' in obj:
                same_as_val = obj['sameAs']
                if isinstance(same_as_val, str):
                    same_as_links.append(same_as_val)
                elif isinstance(same_as_val, list):
                    same_as_links.extend([link for link in same_as_val if isinstance(link, str)])

            for value in obj.values():
                extract_same_as(value)
        elif isinstance(obj, list):
            for item in obj:
                extract_same_as(item)

    for data in json_ld_data:
        extract_same_as(data)

    if same_as_links:
        # Categorize social platforms
        social_platforms = []
        for link in same_as_links:
            link_lower = link.lower()
            if 'twitter.com' in link_lower or 'x.com' in link_lower:
                social_platforms.append('X/Twitter')
            elif 'facebook.com' in link_lower:
                social_platforms.append('Facebook')
            elif 'linkedin.com' in link_lower:
                social_platforms.append('LinkedIn')
            elif 'youtube.com' in link_lower:
                social_platforms.append('YouTube')
            elif 'instagram.com' in link_lower:
                social_platforms.append('Instagram')
            else:
                social_platforms.append('Other')

        unique_platforms = list(set(social_platforms))
        checks.append(Check(
            name="Organization Social Links",
            passed=True,
            severity="info",
            detail=f"Found {len(same_as_links)} social links: {', '.join(unique_platforms)}",
            fix_hint=None
        ))
    else:
        checks.append(Check(
            name="Organization Social Links",
            passed=False,
            severity="info",
            detail="No Organization.sameAs social links found",
            fix_hint="Add Organization schema with sameAs property for social media profiles"
        ))


def _check_ai_content_markers(html: str, checks: List[Check]) -> None:
    """Check for AI-specific content markers and metadata"""
    try:
        ai_markers = {
            'AI-generated content notice': [
                r'generated by ai',
                r'ai-generated',
                r'created with ai',
                r'ai assisted',
            ],
            'Machine-readable API hints': [
                r'api\.json',
                r'schema\.json',
                r'/api/',
                r'application/json',
            ],
            'Structured content indicators': [
                r'data-\w+',
                r'itemscope',
                r'itemtype',
                r'itemprop',
            ],
        }

        found_markers = {}

        for marker_type, patterns in ai_markers.items():
            count = 0
            for pattern in patterns:
                matches = re.findall(pattern, html, re.IGNORECASE)
                count += len(matches)
            if count > 0:
                found_markers[marker_type] = count

        if found_markers:
            marker_details = [f"{marker}: {count}" for marker, count in found_markers.items()]
            checks.append(Check(
                name="AI Content Markers",
                passed=True,
                severity="info",
                detail=f"Found AI-friendly markers: {', '.join(marker_details)}",
                fix_hint=None
            ))
        else:
            checks.append(Check(
                name="AI Content Markers",
                passed=False,
                severity="info",
                detail="No specific AI content markers detected",
                fix_hint="Consider adding structured data attributes and API indicators for better AI discoverability"
            ))

    except Exception:
        checks.append(Check(
            name="AI Markers Processing",
            passed=False,
            severity="info",
            detail="Error processing AI content markers",
            fix_hint=None
        ))


def _calculate_score(checks: List[Check]) -> float:
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


def _generate_summary(checks: List[Check], score: float) -> str:
    """Generate a summary of the agent discovery analysis"""
    passed_checks = sum(1 for check in checks if check.passed)
    total_checks = len(checks)

    if score >= 75:
        return f"Excellent AI agent discoverability ({passed_checks}/{total_checks} checks passed)"
    elif score >= 50:
        return f"Good agent discovery features ({passed_checks}/{total_checks} checks passed)"
    elif score >= 25:
        return f"Basic agent discoverability ({passed_checks}/{total_checks} checks passed)"
    else:
        return f"Limited agent discovery support ({passed_checks}/{total_checks} checks passed)"
