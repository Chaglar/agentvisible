"""
Supabase database integration for scan result storage and retrieval
Handles persistence and querying of website scan data
"""

import json
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse

from supabase import Client, create_client

from config import SUPABASE_KEY, SUPABASE_URL


def get_supabase_client() -> Client:
    """Get a Supabase client instance"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


class Database:
    """Async Supabase client for scan data operations"""

    def __init__(self):
        """Initialize Supabase client"""
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    async def save_scan(self, result) -> None:
        """
        Save scan result to database (upsert by domain to keep latest)

        Args:
            result: ScanResult to save
        """
        try:
            # Extract domain from URL
            domain = self._extract_domain(result.url)

            # Prepare data for database
            scan_data = {
                "url": result.url,
                "domain": domain,
                "slug": result.report_slug,
                "overall_score": result.overall_score,
                "rating": result.rating,
                "modules": json.dumps([module.dict() for module in result.modules]),
                "top_fixes": json.dumps([fix.dict() for fix in result.top_fixes]),
                "created_at": result.scanned_at.isoformat(),
            }

            # Upsert scan data (update if domain exists, insert if new)
            response = (
                self.client.table("scans")
                .upsert(scan_data, on_conflict="domain")
                .execute()
            )

            if not response.data:
                raise Exception("Failed to save scan result to database")

        except Exception as e:
            raise Exception(f"Database save error: {str(e)}")

    async def get_report(self, slug: str):
        """
        Retrieve scan result by report slug

        Args:
            slug: Report slug identifier

        Returns:
            ScanResult if found, None otherwise
        """
        try:
            # Query database for scan by slug
            response = (
                self.client.table("scans")
                .select("*")
                .eq("slug", slug)
                .execute()
            )

            if not response.data or len(response.data) == 0:
                return None

            # Convert database record back to ScanResult
            record = response.data[0]
            return self._record_to_scan_result(record)

        except Exception as e:
            print(f"Database query error: {str(e)}")
            return None

    async def get_domain_scans(self, domain: str, limit: int = 10):
        """
        Get recent scans for a domain

        Args:
            domain: Domain to search for
            limit: Maximum number of results

        Returns:
            List of ScanResult objects
        """
        try:
            response = (
                self.client.table("scans")
                .select("*")
                .eq("domain", domain)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )

            if not response.data:
                return []

            return [self._record_to_scan_result(record) for record in response.data]

        except Exception as e:
            print(f"Database query error: {str(e)}")
            return []

    def _extract_domain(self, url: str) -> str:
        """
        Extract domain from URL for grouping scans

        Args:
            url: Full URL

        Returns:
            Domain name (e.g., "example.com")
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc or url

            # Clean domain
            domain = domain.lower()
            if domain.startswith("www."):
                domain = domain[4:]

            return domain

        except Exception:
            # Fallback for malformed URLs
            return url.replace("https://", "").replace("http://", "").split("/")[0]

    def _record_to_scan_result(self, record: dict):
        """
        Convert database record to ScanResult object

        Args:
            record: Database record dictionary

        Returns:
            ScanResult object
        """
        from models import Check, ModuleResult, ScanResult

        # Parse JSON fields
        modules_data = json.loads(record["modules"])
        top_fixes_data = json.loads(record["top_fixes"])

        # Reconstruct module results
        modules = []
        for module_data in modules_data:
            # Reconstruct checks
            checks = [
                Check(
                    name=check["name"],
                    passed=check["passed"],
                    severity=check["severity"],
                    detail=check["detail"],
                    fix_hint=check.get("fix_hint"),
                )
                for check in module_data["checks"]
            ]

            module_result = ModuleResult(
                module=module_data["module"],
                score=module_data["score"],
                weight=module_data["weight"],
                checks=checks,
                summary=module_data["summary"],
            )
            modules.append(module_result)

        # Reconstruct top fixes
        top_fixes = [
            Check(
                name=fix["name"],
                passed=fix["passed"],
                severity=fix["severity"],
                detail=fix["detail"],
                fix_hint=fix.get("fix_hint"),
            )
            for fix in top_fixes_data
        ]

        # Parse timestamp
        scanned_at = datetime.fromisoformat(record["created_at"].replace("Z", "+00:00"))

        return ScanResult(
            url=record["url"],
            overall_score=record["overall_score"],
            rating=record["rating"],
            modules=modules,
            top_fixes=top_fixes,
            scanned_at=scanned_at,
            report_slug=record["slug"],
        )


# Global database instance (initialized lazily)
db = None


def get_db():
    """Get or create database instance"""
    global db
    if db is None:
        try:
            db = Database()
        except ValueError as e:
            print(f"Warning: Database not available - {e}")
            db = None
    return db


# Convenience functions for use in main.py
async def save_scan(result) -> None:
    """Save scan result to database"""
    database = get_db()
    if database is None:
        print("Warning: Database not available, scan not saved")
        return
    await database.save_scan(result)


async def get_report(slug: str):
    """Get scan result by slug"""
    database = get_db()
    if database is None:
        print("Warning: Database not available")
        return None
    return await database.get_report(slug)