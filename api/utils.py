"""
Utility functions for UX improvements
AI summary generation, badge creation, and other helpers
"""

import asyncio
import json
import re
from typing import Dict, List, Optional
from urllib.parse import urlparse

import httpx

from config import ANTHROPIC_API_KEY, INDUSTRY_BENCHMARKS, MODULE_EXPLANATIONS, CHECK_EXPLANATIONS
from models import Check, ModuleResult, ScanResult


async def generate_ai_summary(scan_result: ScanResult) -> str:
    """
    Generate plain English summary using Anthropic Claude Haiku

    Args:
        scan_result: Complete scan result object

    Returns:
        2-3 sentence human-readable summary
    """
    if not ANTHROPIC_API_KEY:
        return f"{scan_result.url} scored {scan_result.overall_score:.0f}/100 for AI agent readiness. See detailed breakdown above for specific improvements."

    try:
        # Prepare summary data for AI
        domain = urlparse(scan_result.url).hostname.replace("www.", "") if urlparse(scan_result.url).hostname else scan_result.url

        # Get top 3 issues
        failed_checks = []
        for module in scan_result.modules:
            for check in module.checks:
                if not check.passed and check.fix_hint:
                    failed_checks.append(f"{check.name}: {check.fix_hint}")

        top_issues = failed_checks[:3]

        # Find strongest module
        best_module = max(scan_result.modules, key=lambda m: m.score)
        best_module_name = MODULE_EXPLANATIONS.get(best_module.module, best_module.module)

        # Create prompt for AI
        prompt = f"""Generate a friendly, human-readable summary for a website AI readiness scan. Be encouraging and specific.

Website: {domain}
Overall Score: {scan_result.overall_score:.0f}/100 ({scan_result.rating})
Strongest Area: {best_module.module} ({best_module.score:.0f}/100)
Top Issues to Fix: {'; '.join(top_issues) if top_issues else 'None identified'}

Write 2-3 sentences that:
1. State the score and rating in plain English
2. Highlight what they're doing well (strongest area)
3. Suggest the most impactful fix with effort estimate

Use encouraging tone. Avoid jargon. Be specific about benefits."""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 150,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=10.0
            )

            if response.status_code == 200:
                result = response.json()
                return result["content"][0]["text"].strip()

    except Exception as e:
        print(f"AI summary generation failed: {e}")

    # Fallback summary
    if scan_result.overall_score >= 75:
        return f"{domain} scored {scan_result.overall_score:.0f}/100 — Strong AI agent readiness! Your site is well-optimized for AI discovery. Consider the recommendations above to reach perfection."
    elif scan_result.overall_score >= 50:
        return f"{domain} scored {scan_result.overall_score:.0f}/100 — Moderate AI agent readiness. You have a solid foundation. Focus on the top priority fixes above for the biggest impact."
    else:
        return f"{domain} scored {scan_result.overall_score:.0f}/100 — This is an opportunity to get ahead of competitors. The fixes above will dramatically improve your AI agent visibility."


def get_industry_benchmark(url: str) -> Dict[str, int]:
    """
    Determine industry category and return benchmark scores

    Args:
        url: Website URL to analyze

    Returns:
        Dict with average and top10 scores for the industry
    """
    domain = urlparse(url).hostname.lower() if urlparse(url).hostname else ""

    # Simple keyword matching for industry detection
    if any(keyword in domain for keyword in ["shop", "store", "buy", "cart", "ecommerce", "commerce"]):
        return INDUSTRY_BENCHMARKS["ecommerce"]
    elif any(keyword in domain for keyword in ["app", "saas", "software", "platform", "api"]):
        return INDUSTRY_BENCHMARKS["saas"]
    elif any(keyword in domain for keyword in ["news", "blog", "media", "magazine", "journal"]):
        return INDUSTRY_BENCHMARKS["media"]
    elif any(keyword in domain for keyword in ["agency", "marketing", "design", "creative"]):
        return INDUSTRY_BENCHMARKS["agency"]
    else:
        return INDUSTRY_BENCHMARKS["default"]


def get_effort_estimate(check: Check) -> str:
    """
    Estimate effort required to fix a failed check

    Args:
        check: Failed check to estimate effort for

    Returns:
        Effort estimate string (⚡ 5 min, 🔧 30 min, 🏗️ 2+ hours)
    """
    check_name = check.name.lower()

    # Quick wins (5 minutes)
    quick_fixes = [
        "llms.txt", "robots.txt", "sitemap", "meta description",
        "title tag", "canonical url", "noindex", "nofollow"
    ]

    # Medium effort (30 minutes)
    medium_fixes = [
        "json-ld", "schema", "opengraph", "twitter card", "rss feed",
        "structured data", "microdata", "semantic html"
    ]

    # Major changes (2+ hours)
    major_fixes = [
        "server-side rendering", "ssr", "javascript", "spa", "framework",
        "api integration", "commerce platform", "headless"
    ]

    if any(keyword in check_name for keyword in quick_fixes):
        return "⚡ 5 min"
    elif any(keyword in check_name for keyword in medium_fixes):
        return "🔧 30 min"
    elif any(keyword in check_name for keyword in major_fixes):
        return "🏗️ 2+ hours"
    else:
        return "🔧 30 min"  # Default to medium effort


def generate_badge_svg(score: float, rating: str) -> str:
    """
    Generate SVG badge for embedding on websites

    Args:
        score: Overall score (0-100)
        rating: Rating string (Strong, Moderate, etc.)

    Returns:
        SVG content as string
    """
    # Determine badge color based on score
    if score >= 75:
        color = "#10b981"  # green
    elif score >= 50:
        color = "#f59e0b"  # yellow
    elif score >= 25:
        color = "#f97316"  # orange
    else:
        color = "#ef4444"  # red

    score_text = f"{score:.0f}/100"

    # Calculate text width for proper badge sizing
    score_width = len(score_text) * 7 + 10
    rating_width = len(rating) * 7 + 10
    total_width = 95 + score_width + rating_width

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{total_width}" height="20">
    <defs>
        <linearGradient id="gradient" x2="0" y2="100%">
            <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
            <stop offset="1" stop-opacity=".1"/>
        </linearGradient>
    </defs>
    <g>
        <rect width="95" height="20" fill="#555"/>
        <rect x="95" width="{score_width}" height="20" fill="{color}"/>
        <rect x="{95 + score_width}" width="{rating_width}" height="20" fill="#555"/>
        <rect width="{total_width}" height="20" fill="url(#gradient)"/>
    </g>
    <g fill="#fff" text-anchor="start" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
        <text x="6" y="15" fill="#fff">AgentVisible</text>
        <text x="99" y="15" fill="#000">{score_text}</text>
        <text x="{99 + score_width}" y="15" fill="#fff">{rating}</text>
    </g>
</svg>'''

    return svg_content


def get_social_share_text(scan_result: ScanResult, platform: str) -> str:
    """
    Generate pre-filled social media share text

    Args:
        scan_result: Complete scan result
        platform: 'twitter' or 'linkedin'

    Returns:
        Pre-filled share text
    """
    domain = urlparse(scan_result.url).hostname.replace("www.", "") if urlparse(scan_result.url).hostname else scan_result.url
    score = scan_result.overall_score
    rating = scan_result.rating

    if platform == "twitter":
        return f"🤖 {domain} scored {score:.0f}/100 for AI agent readiness ({rating} rating)! Check your website's AI readiness for free → https://agentvisible.ai"

    elif platform == "linkedin":
        return f"Just analyzed {domain} for AI agent readiness and scored {score:.0f}/100 ({rating} rating). With AI agents becoming the new search engines, it's crucial to optimize for machine readability. Check your website for free at https://agentvisible.ai and see how ready you are for the AI future."

    else:
        return f"{domain} scored {score:.0f}/100 for AI agent readiness. Check yours free at https://agentvisible.ai"


def detect_competitor_suggestions(url: str) -> List[str]:
    """
    Suggest competitor URLs to scan based on the current URL

    Args:
        url: Current website URL

    Returns:
        List of suggested competitor URLs
    """
    domain = urlparse(url).hostname.lower() if urlparse(url).hostname else ""

    # Common competitors by industry/domain patterns
    competitors = {
        "shopify": ["bigcommerce.com", "squarespace.com", "woocommerce.com"],
        "wordpress": ["squarespace.com", "wix.com", "webflow.com"],
        "amazon": ["ebay.com", "etsy.com", "walmart.com"],
        "apple": ["samsung.com", "google.com", "microsoft.com"],
        "tesla": ["bmw.com", "mercedes-benz.com", "volkswagen.com"],
        "netflix": ["hulu.com", "disney.com", "hbo.com"],
    }

    # Check for direct matches
    for key, comps in competitors.items():
        if key in domain:
            return comps[:3]

    # Generic suggestions for e-commerce
    if any(keyword in domain for keyword in ["shop", "store", "buy", "cart"]):
        return ["amazon.com", "etsy.com", "shopify.com"]

    # Generic suggestions for SaaS
    if any(keyword in domain for keyword in ["app", "saas", "software"]):
        return ["salesforce.com", "hubspot.com", "slack.com"]

    # Default suggestions
    return ["apple.com", "microsoft.com", "google.com"]