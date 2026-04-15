from typing import List
"""
Module 4: Commerce Protocols Scanner (20% weight) ⭐ DIFFERENTIATOR
Analyzes e-commerce APIs, payment schemas, and shopping platform integrations
"""

import json
import re
from urllib.parse import urlparse

import httpx

from models import Check, ModuleResult
from scanner.fetcher import fetch_endpoint


async def scan(url: str, html: str, headers: dict) -> ModuleResult:
    """
    Scan for commerce protocol elements

    Args:
        url: Target URL
        html: Raw HTML content
        headers: HTTP response headers

    Returns:
        ModuleResult with commerce protocols analysis
    """
    checks = []
    base_url = _get_base_url(url)

    async with httpx.AsyncClient(timeout=5.0) as client:
        # Check WebMCP manifest
        await _check_webmcp_manifest(base_url, client, checks)

        # Check Shopify APIs
        await _check_shopify_apis(base_url, client, checks)

        # Check WooCommerce API
        await _check_woocommerce_api(base_url, client, checks)

    # Check JSON-LD for payment/commerce data
    _check_payment_schema(html, checks)

    # Check for Shopify platform indicators
    _check_shopify_platform(html, checks)

    # Check for other e-commerce platforms
    _check_ecommerce_platforms(html, checks)

    score = _calculate_score(checks)
    summary = _generate_summary(checks, score)

    return ModuleResult(
        module="commerce_protocols",
        score=score,
        weight=0.20,
        checks=checks,
        summary=summary
    )


def _get_base_url(url: str) -> str:
    """Extract base URL from full URL"""
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


async def _check_webmcp_manifest(base_url: str, client: httpx.AsyncClient, checks: List[Check]) -> None:
    """Check for WebMCP (Web Model Context Protocol) manifest"""
    try:
        mcp_content, status_code = await fetch_endpoint(
            base_url, ".well-known/mcp.json", client
        )

        if status_code == 200 and mcp_content:
            try:
                mcp_data = json.loads(mcp_content)
                if isinstance(mcp_data, dict) and ('tools' in mcp_data or 'resources' in mcp_data):
                    checks.append(Check(
                        name="WebMCP Manifest",
                        passed=True,
                        severity="info",
                        detail="Found WebMCP manifest with commerce tools/resources",
                        fix_hint=None
                    ))
                else:
                    checks.append(Check(
                        name="WebMCP Manifest",
                        passed=False,
                        severity="info",
                        detail="WebMCP manifest found but lacks commerce capabilities",
                        fix_hint="Configure WebMCP manifest with product/commerce tools for AI agent integration"
                    ))
            except json.JSONDecodeError:
                checks.append(Check(
                    name="WebMCP Manifest",
                    passed=False,
                    severity="info",
                    detail="WebMCP manifest found but contains invalid JSON",
                    fix_hint="Fix JSON syntax in .well-known/mcp.json file"
                ))
        else:
            checks.append(Check(
                name="WebMCP Manifest",
                passed=False,
                severity="info",
                detail="No WebMCP manifest found",
                fix_hint="Consider adding .well-known/mcp.json to enable direct AI agent commerce integration"
            ))

    except Exception:
        checks.append(Check(
            name="WebMCP Check",
            passed=False,
            severity="info",
            detail="Unable to check WebMCP manifest",
            fix_hint=None
        ))


async def _check_shopify_apis(base_url: str, client: httpx.AsyncClient, checks: List[Check]) -> None:
    """Check for Shopify API endpoints"""
    # Check products.json (Shopify product feed)
    try:
        products_content, status_code = await fetch_endpoint(base_url, "products.json", client)

        if status_code == 200 and products_content:
            try:
                products_data = json.loads(products_content)
                if isinstance(products_data, dict) and 'products' in products_data:
                    product_count = len(products_data.get('products', []))
                    checks.append(Check(
                        name="Shopify Products API",
                        passed=True,
                        severity="info",
                        detail=f"Found Shopify products API with {product_count} products",
                        fix_hint=None
                    ))
                else:
                    checks.append(Check(
                        name="Shopify Products API",
                        passed=False,
                        severity="info",
                        detail="products.json found but doesn't contain valid product data",
                        fix_hint="Ensure products.json contains valid Shopify product structure"
                    ))
            except json.JSONDecodeError:
                checks.append(Check(
                    name="Shopify Products API",
                    passed=False,
                    severity="info",
                    detail="products.json found but contains invalid JSON",
                    fix_hint="Fix JSON syntax in products.json"
                ))
        else:
            checks.append(Check(
                name="Shopify Products API",
                passed=False,
                severity="info",
                detail="No Shopify products.json API found",
                fix_hint="Enable Shopify products.json feed for AI agent product discovery"
            ))

    except Exception:
        checks.append(Check(
            name="Shopify Products Check",
            passed=False,
            severity="info",
            detail="Unable to check Shopify products API",
            fix_hint=None
        ))

    # Check cart/add.js (Shopify cart API)
    try:
        cart_content, status_code = await fetch_endpoint(base_url, "cart/add.js", client)

        if status_code in [200, 400, 422]:  # 400/422 expected without POST data
            checks.append(Check(
                name="Shopify Cart API",
                passed=True,
                severity="info",
                detail="Shopify cart API endpoint accessible",
                fix_hint=None
            ))
        else:
            checks.append(Check(
                name="Shopify Cart API",
                passed=False,
                severity="info",
                detail="Shopify cart API not accessible",
                fix_hint="Ensure Shopify cart API is enabled for programmatic purchases"
            ))

    except Exception:
        checks.append(Check(
            name="Shopify Cart Check",
            passed=False,
            severity="info",
            detail="Unable to check Shopify cart API",
            fix_hint=None
        ))


async def _check_woocommerce_api(base_url: str, client: httpx.AsyncClient, checks: List[Check]) -> None:
    """Check for WooCommerce REST API"""
    try:
        wc_content, status_code = await fetch_endpoint(
            base_url, "wp-json/wc/v3/products", client
        )

        if status_code in [200, 401]:  # 401 expected without authentication
            if status_code == 401:
                checks.append(Check(
                    name="WooCommerce API",
                    passed=True,
                    severity="info",
                    detail="WooCommerce REST API detected (authentication required)",
                    fix_hint=None
                ))
            else:
                try:
                    wc_data = json.loads(wc_content) if wc_content else []
                    product_count = len(wc_data) if isinstance(wc_data, list) else 0
                    checks.append(Check(
                        name="WooCommerce API",
                        passed=True,
                        severity="info",
                        detail=f"WooCommerce REST API accessible with {product_count} products",
                        fix_hint=None
                    ))
                except json.JSONDecodeError:
                    checks.append(Check(
                        name="WooCommerce API",
                        passed=True,
                        severity="info",
                        detail="WooCommerce REST API detected",
                        fix_hint=None
                    ))
        else:
            checks.append(Check(
                name="WooCommerce API",
                passed=False,
                severity="info",
                detail="No WooCommerce REST API found",
                fix_hint="Enable WooCommerce REST API for AI agent product access"
            ))

    except Exception:
        checks.append(Check(
            name="WooCommerce Check",
            passed=False,
            severity="info",
            detail="Unable to check WooCommerce API",
            fix_hint=None
        ))


def _check_payment_schema(html: str, checks: List[Check]) -> None:
    """Check JSON-LD for payment and commerce schema"""
    try:
        # Extract JSON-LD blocks
        json_ld_pattern = r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
        json_ld_matches = re.findall(json_ld_pattern, html, re.DOTALL | re.IGNORECASE)

        payment_methods_found = []
        offer_data_found = False

        for match in json_ld_matches:
            try:
                data = json.loads(match.strip())

                # Check for payment methods
                if _find_in_json_ld(data, 'paymentAccepted') or _find_in_json_ld(data, 'acceptedPaymentMethod'):
                    payment_methods_found.extend(_extract_payment_methods(data))

                # Check for offers
                if _find_in_json_ld(data, 'offers') or _find_in_json_ld(data, 'Offer'):
                    offer_data_found = True

            except json.JSONDecodeError:
                continue

        if payment_methods_found:
            unique_methods = list(set(payment_methods_found))
            checks.append(Check(
                name="Payment Schema",
                passed=True,
                severity="info",
                detail=f"Found payment method schema: {', '.join(unique_methods)}",
                fix_hint=None
            ))
        else:
            checks.append(Check(
                name="Payment Schema",
                passed=False,
                severity="info",
                detail="No payment method schema found",
                fix_hint="Add paymentAccepted or acceptedPaymentMethod schema for AI agent purchase understanding"
            ))

        if offer_data_found:
            checks.append(Check(
                name="Offer Schema",
                passed=True,
                severity="info",
                detail="Found product offer schema",
                fix_hint=None
            ))
        else:
            checks.append(Check(
                name="Offer Schema",
                passed=False,
                severity="info",
                detail="No product offer schema found",
                fix_hint="Add Offer schema with price and availability for AI agent purchase decisions"
            ))

    except Exception:
        checks.append(Check(
            name="Payment Schema Processing",
            passed=False,
            severity="warning",
            detail="Error processing payment schema",
            fix_hint="Check JSON-LD syntax for payment and offer data"
        ))


def _check_shopify_platform(html: str, checks: List[Check]) -> None:
    """Check for Shopify platform indicators"""
    try:
        # Check for Shopify-specific indicators
        shopify_indicators = [
            r'Shopify\.shop\s*=',
            r'window\.Shopify\s*=',
            r'/cdn\.shopify\.com/',
            r'shopify-section',
            r'Shopify\.theme',
        ]

        found_indicators = []
        for pattern in shopify_indicators:
            if re.search(pattern, html, re.IGNORECASE):
                found_indicators.append(pattern)

        if found_indicators:
            checks.append(Check(
                name="Shopify Platform",
                passed=True,
                severity="info",
                detail=f"Shopify platform detected ({len(found_indicators)} indicators)",
                fix_hint=None
            ))

            # Additional Shopify-specific advice
            checks.append(Check(
                name="Shopify Integration",
                passed=True,
                severity="info",
                detail="Shopify detected - ensure products.json and cart APIs are accessible",
                fix_hint="Consider enabling Shopify's JSON feeds and cart APIs for AI agent integration"
            ))
        else:
            checks.append(Check(
                name="Shopify Platform",
                passed=False,
                severity="info",
                detail="Shopify platform not detected",
                fix_hint=None
            ))

    except Exception:
        checks.append(Check(
            name="Shopify Detection",
            passed=False,
            severity="info",
            detail="Error detecting Shopify platform",
            fix_hint=None
        ))


def _check_ecommerce_platforms(html: str, checks: List[Check]) -> None:
    """Check for other e-commerce platform indicators"""
    platforms = {
        'WooCommerce': [r'woocommerce', r'wc-', r'/wc-api/', r'wp-content/plugins/woocommerce'],
        'Magento': [r'Mage\\.', r'/skin/frontend/', r'/js/mage/', r'var/Magento'],
        'BigCommerce': [r'bigcommerce', r'bc-sf-filter'],
        'Squarespace': [r'squarespace', r'sqs-'],
        'Wix': [r'wixstatic', r'_wixCIDX'],
    }

    detected_platforms = []

    try:
        for platform_name, patterns in platforms.items():
            for pattern in patterns:
                if re.search(pattern, html, re.IGNORECASE):
                    detected_platforms.append(platform_name)
                    break

        if detected_platforms:
            checks.append(Check(
                name="E-commerce Platform",
                passed=True,
                severity="info",
                detail=f"E-commerce platform detected: {', '.join(detected_platforms)}",
                fix_hint="Ensure platform APIs are accessible for AI agent integration"
            ))
        else:
            checks.append(Check(
                name="E-commerce Platform",
                passed=False,
                severity="info",
                detail="No major e-commerce platform detected",
                fix_hint="Consider implementing standard e-commerce APIs or schema for AI agent integration"
            ))

    except Exception:
        checks.append(Check(
            name="Platform Detection",
            passed=False,
            severity="info",
            detail="Error detecting e-commerce platforms",
            fix_hint=None
        ))


def _find_in_json_ld(obj, key: str) -> bool:
    """Recursively search for a key in JSON-LD data"""
    if isinstance(obj, dict):
        if key in obj:
            return True
        for value in obj.values():
            if _find_in_json_ld(value, key):
                return True
    elif isinstance(obj, list):
        for item in obj:
            if _find_in_json_ld(item, key):
                return True
    return False


def _extract_payment_methods(obj) -> List[str]:
    """Extract payment methods from JSON-LD data"""
    methods = []

    if isinstance(obj, dict):
        for key, value in obj.items():
            if key in ['paymentAccepted', 'acceptedPaymentMethod']:
                if isinstance(value, str):
                    methods.append(value)
                elif isinstance(value, list):
                    methods.extend(str(v) for v in value if isinstance(v, (str, dict)))
            else:
                methods.extend(_extract_payment_methods(value))
    elif isinstance(obj, list):
        for item in obj:
            methods.extend(_extract_payment_methods(item))

    return methods


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
    """Generate a summary of the commerce protocols analysis"""
    passed_checks = sum(1 for check in checks if check.passed)
    total_checks = len(checks)

    if score >= 75:
        return f"Excellent commerce integration ({passed_checks}/{total_checks} checks passed)"
    elif score >= 50:
        return f"Good e-commerce APIs available ({passed_checks}/{total_checks} checks passed)"
    elif score >= 25:
        return f"Basic commerce features detected ({passed_checks}/{total_checks} checks passed)"
    else:
        return f"Limited commerce capabilities ({passed_checks}/{total_checks} checks passed)"
