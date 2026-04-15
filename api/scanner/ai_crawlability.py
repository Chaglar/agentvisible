from typing import List
"""
Module 2: AI Crawlability Scanner (20% weight)
Analyzes robots.txt, AI bot policies, sitemaps, and crawling directives
"""

import re
from urllib.parse import urlparse

import httpx

from models import Check, ModuleResult
from scanner.fetcher import fetch_endpoint


async def scan(url: str, html: str, headers: dict) -> ModuleResult:
    """
    Scan for AI crawlability elements

    Args:
        url: Target URL
        html: Raw HTML content
        headers: HTTP response headers

    Returns:
        ModuleResult with crawlability analysis
    """
    checks = []
    base_url = _get_base_url(url)

    async with httpx.AsyncClient(timeout=5.0) as client:
        # Check robots.txt
        await _check_robots_txt(base_url, client, checks)

        # Check AI-specific txt files
        await _check_llms_txt(base_url, client, checks)
        await _check_llms_full_txt(base_url, client, checks)

        # Check sitemap
        await _check_sitemap(base_url, client, checks)

    # Check HTML meta robots
    _check_html_robots_meta(html, checks)

    # Check response headers
    _check_robots_headers(headers, checks)

    score = _calculate_score(checks)
    summary = _generate_summary(checks, score)

    return ModuleResult(
        module="ai_crawlability",
        score=score,
        weight=0.20,
        checks=checks,
        summary=summary
    )


def _get_base_url(url: str) -> str:
    """Extract base URL from full URL"""
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


async def _check_robots_txt(base_url: str, client: httpx.AsyncClient, checks: List[Check]) -> None:
    """Check robots.txt for AI bot policies"""
    try:
        robots_content, status_code = await fetch_endpoint(base_url, "robots.txt", client)

        if status_code != 200 or not robots_content:
            checks.append(Check(
                name="robots.txt Accessibility",
                passed=False,
                severity="warning",
                detail=f"robots.txt not accessible (HTTP {status_code})",
                fix_hint="Create a robots.txt file to communicate crawling policies to AI agents"
            ))
            return

        # Check for AI bot user agents
        ai_bots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Bytespider', 'CCBot']
        found_bots = []
        allow_rules = []
        disallow_rules = []

        lines = robots_content.split('\n')
        current_user_agent = None

        for line in lines:
            line = line.strip()
            if line.startswith('User-agent:'):
                current_user_agent = line.split(':', 1)[1].strip()
            elif line.startswith('Allow:') and current_user_agent:
                allow_rules.append((current_user_agent, line.split(':', 1)[1].strip()))
            elif line.startswith('Disallow:') and current_user_agent:
                disallow_rules.append((current_user_agent, line.split(':', 1)[1].strip()))

        # Check for AI bot mentions
        for bot in ai_bots:
            if bot.lower() in robots_content.lower():
                found_bots.append(bot)

        if found_bots:
            checks.append(Check(
                name="AI Bot Policies",
                passed=True,
                severity="info",
                detail=f"Found policies for AI bots: {', '.join(found_bots)}",
                fix_hint=None
            ))
        else:
            checks.append(Check(
                name="AI Bot Policies",
                passed=False,
                severity="info",
                detail="No specific AI bot policies found in robots.txt",
                fix_hint="Consider adding specific User-agent rules for GPTBot, ClaudeBot, PerplexityBot"
            ))

        # Check for overly restrictive policies
        universal_disallow = any(
            ua == '*' and path == '/'
            for ua, path in disallow_rules
        )

        if universal_disallow:
            checks.append(Check(
                name="Crawl Accessibility",
                passed=False,
                severity="critical",
                detail="Universal disallow rule blocks all crawlers",
                fix_hint="Review robots.txt - universal 'Disallow: /' blocks AI agents from indexing your content"
            ))
        else:
            checks.append(Check(
                name="Crawl Accessibility",
                passed=True,
                severity="info",
                detail="No universal crawl blocking detected",
                fix_hint=None
            ))

    except Exception as e:
        checks.append(Check(
            name="robots.txt Processing",
            passed=False,
            severity="warning",
            detail=f"Error processing robots.txt: {str(e)}",
            fix_hint="Ensure robots.txt is accessible and properly formatted"
        ))


async def _check_llms_txt(base_url: str, client: httpx.AsyncClient, checks: List[Check]) -> None:
    """Check for llms.txt file (AI training data policy)"""
    try:
        llms_content, status_code = await fetch_endpoint(base_url, "llms.txt", client)

        if status_code == 200 and llms_content:
            checks.append(Check(
                name="llms.txt Present",
                passed=True,
                severity="info",
                detail="Found llms.txt file for AI training policies",
                fix_hint=None
            ))
        else:
            checks.append(Check(
                name="llms.txt Present",
                passed=False,
                severity="info",
                detail="No llms.txt file found",
                fix_hint="Consider adding llms.txt to specify your AI training data policies"
            ))

    except Exception:
        checks.append(Check(
            name="llms.txt Check",
            passed=False,
            severity="info",
            detail="Unable to check for llms.txt",
            fix_hint="Ensure llms.txt is accessible if you want to specify AI training policies"
        ))


async def _check_llms_full_txt(base_url: str, client: httpx.AsyncClient, checks: List[Check]) -> None:
    """Check for llms-full.txt file (extended AI policies)"""
    try:
        llms_full_content, status_code = await fetch_endpoint(base_url, "llms-full.txt", client)

        if status_code == 200 and llms_full_content:
            checks.append(Check(
                name="llms-full.txt Present",
                passed=True,
                severity="info",
                detail="Found llms-full.txt file for extended AI policies",
                fix_hint=None
            ))
        else:
            checks.append(Check(
                name="llms-full.txt Present",
                passed=False,
                severity="info",
                detail="No llms-full.txt file found",
                fix_hint="Consider adding llms-full.txt for detailed AI training and usage policies"
            ))

    except Exception:
        checks.append(Check(
            name="llms-full.txt Check",
            passed=False,
            severity="info",
            detail="Unable to check for llms-full.txt",
            fix_hint=None
        ))


async def _check_sitemap(base_url: str, client: httpx.AsyncClient, checks: List[Check]) -> None:
    """Check for XML sitemap accessibility"""
    try:
        sitemap_content, status_code = await fetch_endpoint(base_url, "sitemap.xml", client)

        if status_code != 200 or not sitemap_content:
            checks.append(Check(
                name="XML Sitemap",
                passed=False,
                severity="warning",
                detail=f"sitemap.xml not accessible (HTTP {status_code})",
                fix_hint="Create an XML sitemap to help AI agents discover your content structure"
            ))
            return

        # Check if content looks like a valid sitemap
        if '<urlset' in sitemap_content or '<sitemapindex' in sitemap_content:
            checks.append(Check(
                name="XML Sitemap",
                passed=True,
                severity="info",
                detail="Found accessible XML sitemap",
                fix_hint=None
            ))
        else:
            checks.append(Check(
                name="XML Sitemap Valid",
                passed=False,
                severity="warning",
                detail="sitemap.xml exists but doesn't appear to be valid XML sitemap",
                fix_hint="Ensure sitemap.xml contains valid XML sitemap structure"
            ))

    except Exception:
        checks.append(Check(
            name="Sitemap Check",
            passed=False,
            severity="warning",
            detail="Error checking sitemap accessibility",
            fix_hint="Ensure sitemap.xml is accessible and properly formatted"
        ))


def _check_html_robots_meta(html: str, checks: List[Check]) -> None:
    """Check HTML meta robots tags"""
    try:
        robots_pattern = r'<meta\s+name=["\']robots["\']\s+content=["\']([^"\']*)["\']'
        robots_match = re.search(robots_pattern, html, re.IGNORECASE)

        if robots_match:
            robots_content = robots_match.group(1).lower()

            # Check for restrictive directives
            restrictive_directives = ['noindex', 'noai', 'noimageai']
            found_restrictive = [directive for directive in restrictive_directives if directive in robots_content]

            if found_restrictive:
                checks.append(Check(
                    name="HTML Robots Meta",
                    passed=False,
                    severity="critical",
                    detail=f"Restrictive meta robots found: {', '.join(found_restrictive)}",
                    fix_hint="Review meta robots tag - current directives may block AI agent indexing"
                ))
            else:
                checks.append(Check(
                    name="HTML Robots Meta",
                    passed=True,
                    severity="info",
                    detail="Meta robots tag found with AI-friendly directives",
                    fix_hint=None
                ))
        else:
            # No robots meta tag is generally fine
            checks.append(Check(
                name="HTML Robots Meta",
                passed=True,
                severity="info",
                detail="No restrictive robots meta tag found",
                fix_hint=None
            ))

    except Exception:
        checks.append(Check(
            name="HTML Robots Processing",
            passed=False,
            severity="warning",
            detail="Error processing HTML robots meta tags",
            fix_hint="Check meta robots tag syntax in HTML head section"
        ))


def _check_robots_headers(headers: dict, checks: List[Check]) -> None:
    """Check X-Robots-Tag HTTP headers"""
    try:
        x_robots_tag = headers.get('X-Robots-Tag', '').lower()

        if x_robots_tag:
            # Check for restrictive directives
            restrictive_directives = ['noindex', 'noai', 'noimageai']
            found_restrictive = [directive for directive in restrictive_directives if directive in x_robots_tag]

            if found_restrictive:
                checks.append(Check(
                    name="X-Robots-Tag Header",
                    passed=False,
                    severity="critical",
                    detail=f"Restrictive X-Robots-Tag header: {', '.join(found_restrictive)}",
                    fix_hint="Review X-Robots-Tag header - current directives may block AI agent indexing"
                ))
            else:
                checks.append(Check(
                    name="X-Robots-Tag Header",
                    passed=True,
                    severity="info",
                    detail="X-Robots-Tag header found with AI-friendly directives",
                    fix_hint=None
                ))
        else:
            # No X-Robots-Tag header is generally fine
            checks.append(Check(
                name="X-Robots-Tag Header",
                passed=True,
                severity="info",
                detail="No restrictive X-Robots-Tag header found",
                fix_hint=None
            ))

    except Exception:
        checks.append(Check(
            name="Robots Header Processing",
            passed=False,
            severity="warning",
            detail="Error processing X-Robots-Tag headers",
            fix_hint="Check X-Robots-Tag header configuration"
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
    """Generate a summary of the crawlability analysis"""
    passed_checks = sum(1 for check in checks if check.passed)
    total_checks = len(checks)

    if score >= 75:
        return f"Excellent AI crawlability ({passed_checks}/{total_checks} checks passed)"
    elif score >= 50:
        return f"Good AI accessibility ({passed_checks}/{total_checks} checks passed)"
    elif score >= 25:
        return f"Basic crawling permissions ({passed_checks}/{total_checks} checks passed)"
    else:
        return f"Limited AI accessibility ({passed_checks}/{total_checks} checks passed)"
