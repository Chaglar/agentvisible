"""
Scanner Engine - Orchestrates all scanner modules
Runs all 5 scanner modules and calculates overall score
"""

import asyncio
import hashlib
import re
from datetime import datetime
from typing import List
from urllib.parse import urlparse

import httpx

from config import MODULE_WEIGHTS, SCAN_TIMEOUT, SCORE_RATINGS
from models import Check, ModuleResult, ScanResult
from scanner import (
    agent_discovery,
    ai_crawlability,
    commerce_protocols,
    content_parseability,
    structured_data,
)
from scanner.fetcher import fetch_url


async def run_scan(url: str) -> ScanResult:
    """
    Main entry point for scanning a URL
    Orchestrates all 5 modules concurrently for optimal performance

    Args:
        url: URL to scan for AI agent readiness

    Returns:
        Complete ScanResult with analysis from all modules
    """
    # Fetch URL content once and share with all modules
    async with httpx.AsyncClient(timeout=SCAN_TIMEOUT) as client:
        html_content, response_headers, status_code = await fetch_url(url, client)

    if status_code == 0 or html_content is None:
        return _create_error_result(url, "Failed to fetch URL content")

    if status_code != 200:
        return _create_error_result(url, f"HTTP {status_code} - URL not accessible")

    headers = response_headers or {}

    # Run all 5 modules concurrently using asyncio.gather
    try:
        results = await asyncio.gather(
            structured_data.scan(url, html_content, headers),
            ai_crawlability.scan(url, html_content, headers),
            content_parseability.scan(url, html_content, headers),
            commerce_protocols.scan(url, html_content, headers),
            agent_discovery.scan(url, html_content, headers),
        )
    except Exception as e:
        return _create_error_result(url, f"Scanner error: {str(e)}")

    # Calculate overall weighted score
    overall_score = sum(result.score * result.weight for result in results)

    # Determine rating based on overall score
    rating = (
        "Strong" if overall_score >= 75
        else "Moderate" if overall_score >= 50
        else "Weak" if overall_score >= 25
        else "Critical"
    )

    # Pick top 3 fixes by severity then weight
    top_fixes = _pick_top_fixes(results, n=3)

    # Generate URL slug for report
    slug = _make_slug(url)

    return ScanResult(
        url=url,
        overall_score=overall_score,
        rating=rating,
        modules=results,
        top_fixes=top_fixes,
        scanned_at=datetime.utcnow(),
        report_slug=slug
    )


def _pick_top_fixes(results: List[ModuleResult], n: int = 3) -> List[Check]:
    """
    Pick top N fixes by severity then module weight

    Args:
        results: List of ModuleResult objects
        n: Number of top fixes to return

    Returns:
        List of top priority failed checks
    """
    failed_checks = []

    for result in results:
        module_weight = MODULE_WEIGHTS.get(result.module, 0.0)

        for check in result.checks:
            if not check.passed:
                # Priority by severity first, then module weight
                severity_weights = {'critical': 3.0, 'warning': 2.0, 'info': 1.0}
                severity_weight = severity_weights.get(check.severity, 1.0)
                priority_score = severity_weight * 1000 + module_weight  # Severity dominates

                failed_checks.append((priority_score, check))

    # Sort by priority score (descending) and take top N
    failed_checks.sort(key=lambda x: x[0], reverse=True)
    return [check for _, check in failed_checks[:n]]


def _make_slug(url: str) -> str:
    """
    Generate a URL slug for report identification

    Args:
        url: Original URL to convert to slug

    Returns:
        URL slug like "ooow-com-au"
    """
    # Parse URL and extract domain
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or url

        # Clean domain for slug
        slug = domain.lower()
        slug = re.sub(r'^www\.', '', slug)  # Remove www prefix
        slug = re.sub(r'[^a-z0-9\-\.]', '', slug)  # Keep only alphanumeric, hyphens, dots
        slug = re.sub(r'\.', '-', slug)  # Replace dots with hyphens
        slug = re.sub(r'-+', '-', slug)  # Collapse multiple hyphens
        slug = slug.strip('-')  # Remove leading/trailing hyphens

        # Add timestamp for uniqueness
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"{slug}-{timestamp}"

    except Exception:
        # Fallback slug
        clean_url = re.sub(r'[^a-zA-Z0-9]', '', url.replace('https://', '').replace('http://', ''))
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"scan-{clean_url[:20]}-{timestamp}"


def _create_error_result(url: str, error_message: str) -> ScanResult:
    """Create a ScanResult for error cases"""
    error_check = Check(
        name="URL Access",
        passed=False,
        severity="critical",
        detail=error_message,
        fix_hint="Ensure the URL is accessible and returns valid HTML content"
    )

    # Create empty module results with error
    empty_modules = []
    for module_name, weight in MODULE_WEIGHTS.items():
        empty_module = ModuleResult(
            module=module_name,
            score=0.0,
            weight=weight,
            checks=[error_check],
            summary="Could not analyze due to URL access error"
        )
        empty_modules.append(empty_module)

    return ScanResult(
        url=url,
        overall_score=0.0,
        rating="Critical",
        modules=empty_modules,
        top_fixes=[error_check],
        scanned_at=datetime.utcnow(),
        report_slug=_make_slug(url)
    )


class ScanEngine:
    """
    Orchestrates all scanner modules to produce a complete scan result
    """

    async def scan_url(self, url: str) -> ScanResult:
        """
        Scan a URL for AI agent readiness

        Args:
            url: URL to scan

        Returns:
            Complete ScanResult with analysis from all modules
        """
        # Fetch URL content
        async with httpx.AsyncClient(timeout=SCAN_TIMEOUT) as client:
            html_content, response_headers, status_code = await fetch_url(url, client)

        if status_code == 0 or html_content is None:
            # Handle fetch failure
            return self._create_error_result(url, "Failed to fetch URL content")

        if status_code != 200:
            # Handle non-200 status codes
            return self._create_error_result(url, f"HTTP {status_code} - URL not accessible")

        # Run all scanner modules in parallel
        modules_results = []

        try:
            # Module 1: Structured Data (30%)
            structured_result = await structured_data.scan(url, html_content, response_headers or {})
            modules_results.append(structured_result)

            # Module 2: AI Crawlability (20%)
            crawlability_result = await ai_crawlability.scan(url, html_content, response_headers or {})
            modules_results.append(crawlability_result)

            # Module 3: Content Parseability (15%)
            parseability_result = await content_parseability.scan(url, html_content, response_headers or {})
            modules_results.append(parseability_result)

            # Module 4: Commerce Protocols (20%)
            commerce_result = await commerce_protocols.scan(url, html_content, response_headers or {})
            modules_results.append(commerce_result)

            # Module 5: Agent Discovery (15%)
            discovery_result = await agent_discovery.scan(url, html_content, response_headers or {})
            modules_results.append(discovery_result)

        except Exception as e:
            return self._create_error_result(url, f"Scanner error: {str(e)}")

        # Calculate overall score
        overall_score = self._calculate_overall_score(modules_results)

        # Determine rating
        rating = self._get_rating(overall_score)

        # Get top fixes (highest priority failed checks)
        top_fixes = self._get_top_fixes(modules_results)

        # Generate report slug
        report_slug = self._generate_report_slug(url)

        return ScanResult(
            url=url,
            overall_score=overall_score,
            rating=rating,
            modules=modules_results,
            top_fixes=top_fixes,
            scanned_at=datetime.utcnow(),
            report_slug=report_slug
        )

    def _calculate_overall_score(self, modules_results: List[ModuleResult]) -> float:
        """Calculate weighted overall score from module results"""
        total_weighted_score = 0.0

        for module_result in modules_results:
            module_name = module_result.module
            module_weight = MODULE_WEIGHTS.get(module_name, 0.0)
            weighted_score = module_result.score * module_weight
            total_weighted_score += weighted_score

        return min(100.0, total_weighted_score)

    def _get_rating(self, score: float) -> str:
        """Convert numeric score to rating label"""
        for rating, (min_score, max_score) in SCORE_RATINGS.items():
            if min_score <= score <= max_score:
                return rating
        return "Unknown"

    def _get_top_fixes(self, modules_results: List[ModuleResult], max_fixes: int = 3) -> List[Check]:
        """Get the top priority failed checks across all modules"""
        failed_checks = []

        for module_result in modules_results:
            module_weight = MODULE_WEIGHTS.get(module_result.module, 0.0)

            for check in module_result.checks:
                if not check.passed:
                    # Weight failed checks by severity and module importance
                    severity_weights = {'critical': 3.0, 'warning': 2.0, 'info': 1.0}
                    severity_weight = severity_weights.get(check.severity, 1.0)
                    priority_score = severity_weight * module_weight

                    failed_checks.append((priority_score, check))

        # Sort by priority score (descending) and take top N
        failed_checks.sort(key=lambda x: x[0], reverse=True)
        return [check for _, check in failed_checks[:max_fixes]]

    def _generate_report_slug(self, url: str) -> str:
        """Generate a unique slug for the scan report"""
        # Clean URL for slug generation
        clean_url = re.sub(r'[^a-zA-Z0-9\-\.]', '', url.replace('https://', '').replace('http://', ''))

        # Create hash from URL + timestamp for uniqueness
        timestamp = datetime.utcnow().isoformat()
        hash_input = f"{url}_{timestamp}".encode()
        hash_suffix = hashlib.md5(hash_input).hexdigest()[:8]

        return f"{clean_url[:30]}_{hash_suffix}"

    def _create_error_result(self, url: str, error_message: str) -> ScanResult:
        """Create a ScanResult for error cases"""
        error_check = Check(
            name="URL Access",
            passed=False,
            severity="critical",
            detail=error_message,
            fix_hint="Ensure the URL is accessible and returns valid HTML content"
        )

        # Create empty module results with error
        empty_modules = []
        for module_name, weight in MODULE_WEIGHTS.items():
            empty_module = ModuleResult(
                module=module_name,
                score=0.0,
                weight=weight,
                checks=[error_check],
                summary="Could not analyze due to URL access error"
            )
            empty_modules.append(empty_module)

        return ScanResult(
            url=url,
            overall_score=0.0,
            rating="Critical",
            modules=empty_modules,
            top_fixes=[error_check],
            scanned_at=datetime.utcnow(),
            report_slug=self._generate_report_slug(url)
        )
